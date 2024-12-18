import connectToStores from 'fluxible-addons-react/connectToStores';
import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { ReactRelayContext } from 'react-relay';
import GridLayer from 'react-leaflet/es/GridLayer';
import SphericalMercator from '@mapbox/sphericalmercator';
import lodashFilter from 'lodash/filter';
import isEqual from 'lodash/isEqual';
import Popup from 'react-leaflet/es/Popup';
import { withLeaflet } from 'react-leaflet/es/context';
import { matchShape, routerShape } from 'found';
import { relayShape, configShape, vehicleShape } from '../../../util/shapes';
import { mapLayerShape } from '../../../store/MapLayerStore';
import MarkerSelectPopup from './MarkerSelectPopup';
import LocationPopup from '../popups/LocationPopup';
import TileContainer from './TileContainer';
import { isFeatureLayerEnabled } from '../../../util/mapLayerUtils';
import RealTimeInformationStore from '../../../store/RealTimeInformationStore';
import PreferencesStore from '../../../store/PreferencesStore';
import { addAnalyticsEvent } from '../../../util/analyticsUtils';
import { getClientBreakpoint } from '../../../util/withBreakpoint';
import {
  PREFIX_BIKESTATIONS,
  PREFIX_STOPS,
  PREFIX_TERMINALS,
  PREFIX_CARPARK,
  PREFIX_BIKEPARK,
  PREFIX_RENTALVEHICLES,
} from '../../../util/path';
import SelectVehicleContainer from './SelectVehicleContainer';

const initialState = {
  selectableTargets: undefined,
  coords: undefined,
  showSpinner: true,
  zoom: undefined,
};

// TODO eslint doesn't know that TileLayerContainer is a react component,
//      because it doesn't inherit it directly. This will force the detection
/** @extends React.Component */
class TileLayerContainer extends GridLayer {
  static propTypes = {
    tileSize: PropTypes.number.isRequired,
    zoomOffset: PropTypes.number.isRequired,
    locationPopup: PropTypes.string, // all, none, reversegeocoding, origindestination
    allowViaPoint: PropTypes.bool, // temporary, until OTP2 handles arbitrary via points
    onSelectLocation: PropTypes.func,
    mergeStops: PropTypes.bool,
    mapLayers: mapLayerShape.isRequired,
    leaflet: PropTypes.shape({
      map: PropTypes.shape({
        addLayer: PropTypes.func.isRequired,
        addEventParent: PropTypes.func.isRequired,
        closePopup: PropTypes.func.isRequired,
        removeEventParent: PropTypes.func.isRequired,
        _popup: PropTypes.shape({
          isOpen: PropTypes.func,
        }),
      }).isRequired,
    }).isRequired,
    relayEnvironment: relayShape.isRequired,
    hilightedStops: PropTypes.arrayOf(PropTypes.string),
    stopsToShow: PropTypes.arrayOf(PropTypes.string),
    objectsToHide: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    vehicles: PropTypes.objectOf(vehicleShape),
    lang: PropTypes.string.isRequired,
  };

  static defaultProps = {
    onSelectLocation: undefined,
    locationPopup: undefined,
    allowViaPoint: false,
    objectsToHide: { vehicleRentalStations: [] },
    hilightedStops: undefined,
    stopsToShow: undefined,
    vehicles: undefined,
    mergeStops: false,
  };

  static contextTypes = {
    getStore: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    config: configShape.isRequired,
    match: matchShape.isRequired,
    router: routerShape.isRequired,
  };

  PopupOptions = {
    offset: [0, 0],
    autoPanPaddingTopLeft: [5, 125],
    className: 'popup',
    ref: 'popup',
    onClose: () => this.setState({ ...initialState }),
    autoPan: false,
    onOpen: () => this.sendAnalytics(),
    relayEnvironment: relayShape.isRequired,
  };

  merc = new SphericalMercator({
    size: this.props.tileSize || 256,
  });

  constructor(props, context) {
    super(props, context);
    // Required as it is not passed upwards through the whole inherittance chain
    this.context = context;
    this.state = {
      ...initialState,
    };
    this.leafletElement.createTile = this.createTile;
  }

  componentDidMount() {
    super.componentDidMount();
    this.context.getStore('TimeStore').addChangeListener(this.onTimeChange);
    this.props.leaflet.map.addEventParent(this.leafletElement);
    this.leafletElement.on('click contextmenu', this.onClick);
  }

  componentDidUpdate(prevProps) {
    if (this.context.popupContainer != null) {
      this.context.popupContainer.openPopup();
    }
    if (!isEqual(prevProps.mapLayers, this.props.mapLayers)) {
      this.leafletElement.redraw();
    }
    if (!isEqual(prevProps.hilightedStops, this.props.hilightedStops)) {
      this.leafletElement.redraw();
    }
  }

  componentWillUnmount() {
    this.context.getStore('TimeStore').removeChangeListener(this.onTimeChange);
    this.leafletElement.off('click contextmenu', this.onClick);
  }

  onTimeChange = e => {
    let activeTiles;

    if (e.currentTime) {
      /* eslint-disable no-underscore-dangle */
      activeTiles = lodashFilter(
        this.leafletElement._tiles,
        tile => tile.active,
      );
      /* eslint-enable no-underscore-dangle */
      activeTiles.forEach(
        tile =>
          tile.el.layers &&
          tile.el.layers.forEach(layer => {
            if (layer.onTimeChange) {
              layer.onTimeChange(this.props.lang);
            }
          }),
      );
    }
  };

  onClick = e => {
    /* eslint-disable no-underscore-dangle */
    Object.keys(this.leafletElement._tiles)
      .filter(key => this.leafletElement._tiles[key].active)
      .filter(key => this.leafletElement._keyToBounds(key).contains(e.latlng))
      .forEach(key =>
        this.leafletElement._tiles[key].el.onMapClick(
          e,
          this.merc.px(
            [e.latlng.lng, e.latlng.lat],
            Number(key.split(':')[2]) + this.props.zoomOffset,
          ),
        ),
      );
    /* eslint-enable no-underscore-dangle */
  };

  createTile = (tileCoords, done) => {
    const tile = new TileContainer(
      tileCoords,
      done,
      this.props,
      this.context.config,
      this.props.mergeStops,
      this.props.relayEnvironment,
      this.props.hilightedStops,
      this.props.vehicles,
      this.props.stopsToShow,
      this.props.objectsToHide,
      this.props.lang,
    );
    tile.onSelectableTargetClicked = (
      selectableTargets,
      coords,
      forceOpen = false,
    ) => {
      const {
        leaflet: { map },
        mapLayers,
      } = this.props;
      const { coords: prevCoords } = this.state;
      const popup = map._popup; // eslint-disable-line no-underscore-dangle
      // navigate to citybike stop page if single stop is clicked
      if (
        selectableTargets.length === 1 &&
        selectableTargets[0].layer === 'citybike'
      ) {
        this.context.router.push(
          `/${PREFIX_BIKESTATIONS}/${encodeURIComponent(
            selectableTargets[0].feature.properties.id,
          )}`,
        );
        return;
      }
      if (
        (selectableTargets.length === 1 &&
          selectableTargets[0].layer === 'scooter') ||
        (selectableTargets.length > 1 &&
          selectableTargets.every(target => target.layer === 'scooter'))
        // scooters are not shown in the selection popup as there can be too many.
        // Instead, the user is directed to the scooter cluster view or the first one in a group of singles.
      ) {
        const cluster = selectableTargets.find(
          target => target.feature.properties.cluster,
        );
        const networks = cluster ? cluster.feature.properties.networks : '';
        const id = cluster
          ? cluster.feature.properties.scooterId
          : selectableTargets[0].feature.properties.id;
        // adding networks directs to scooter cluster view
        this.context.router.push(
          `/${PREFIX_RENTALVEHICLES}/${encodeURIComponent(id)}/${[
            ...networks,
          ]}`,
        );
        return;
      }
      // ... Or to stop page
      if (
        selectableTargets.length === 1 &&
        selectableTargets[0].layer === 'stop'
      ) {
        const prefix = selectableTargets[0].feature.properties.stops
          ? PREFIX_TERMINALS
          : PREFIX_STOPS;
        this.context.router.push(
          `/${prefix}/${encodeURIComponent(
            selectableTargets[0].feature.properties.gtfsId,
          )}`,
        );
        return;
      }

      if (
        selectableTargets.length === 1 &&
        (selectableTargets[0].layer === 'parkAndRide' ||
          selectableTargets[0].layer === 'parkAndRideForBikes')
      ) {
        const { layer } = selectableTargets[0];
        let parkingId;
        // hubs have nested vehicleParking
        if (selectableTargets[0].feature.properties?.vehicleParking) {
          const parksInHub =
            selectableTargets[0].feature.properties?.vehicleParking?.filter(
              parking =>
                layer === 'parkAndRide'
                  ? parking.carPlaces
                  : parking.bicyclePlaces,
            );
          if (parksInHub.length === 1) {
            parkingId = parksInHub[0].id;
          }
        } else {
          parkingId = selectableTargets[0].feature.properties?.id;
        }
        if (parkingId) {
          this.context.router.push(
            `/${
              layer === 'parkAndRide' ? PREFIX_CARPARK : PREFIX_BIKEPARK
            }/${encodeURIComponent(parkingId)}`,
          );
          return;
        }
      }

      if (
        popup &&
        popup.isOpen() &&
        (!forceOpen || (coords && coords.equals(prevCoords)))
      ) {
        map.closePopup();
        return;
      }

      this.setState({
        selectableTargets: selectableTargets.filter(
          target =>
            target.layer === 'realTimeVehicle' ||
            isFeatureLayerEnabled(target.feature, target.layer, mapLayers),
        ),
        coords,
        zoom: tile.coords.z,
      });
    };

    return tile.el;
  };

  selectRow = option => this.setState({ selectableTargets: [option] });

  /**
   * Send an analytics event on opening popup
   */
  sendAnalytics() {
    let name = null;
    let type = null;
    if (this.state.selectableTargets.length === 0) {
      return;
      // event for clicking somewhere else on the map will be handled in LocationPopup
    }
    if (this.state.selectableTargets.length === 1) {
      const target = this.state.selectableTargets[0];
      const { properties } = target.feature;
      name = target.layer;
      switch (name) {
        case 'stop':
          ({ type } = properties);
          if (properties.stops) {
            type += '_TERMINAL';
          }
          break;
        default:
          break;
      }
    } else {
      name = 'multiple';
    }
    const pathPrefixMatch = window.location.pathname.match(/^\/([a-z]{2,})\//);
    const context =
      pathPrefixMatch && pathPrefixMatch[1] !== this.context.config.indexPath
        ? pathPrefixMatch[1]
        : 'index';
    addAnalyticsEvent({
      action: 'SelectMapPoint',
      category: 'Map',
      name,
      type,
      source: context,
    });
  }

  render() {
    let popup = null;
    let latlng = this.state.coords;
    let contents;
    const breakpoint = getClientBreakpoint();
    let showPopup = true;
    const locationPopup =
      this.props.allowViaPoint || this.props.locationPopup !== 'all'
        ? this.props.locationPopup
        : 'origindestination';

    if (typeof this.state.selectableTargets !== 'undefined') {
      if (this.state.selectableTargets.length === 1) {
        let id;
        if (
          (this.state.selectableTargets[0].layer === 'parkAndRide' &&
            this.state.selectableTargets[0].feature.properties.vehicleParking?.filter(
              parking => parking.carPlaces,
            ).length > 1) ||
          (this.state.selectableTargets[0].layer === 'parkAndRideForBikes' &&
            this.state.selectableTargets[0].feature.properties.vehicleParking?.filter(
              parking => parking.bicyclePlaces,
            ).length > 1)
        ) {
          id = `parkAndRide_${this.state.selectableTargets[0].feature.properties.vehicleParking[0].id}`;
          contents = (
            <MarkerSelectPopup
              selectRow={this.selectRow}
              options={this.state.selectableTargets}
              colors={this.context.config.colors}
            />
          );
        } else if (
          this.state.selectableTargets[0].layer === 'realTimeVehicle'
        ) {
          const { vehicle } = this.state.selectableTargets[0].feature;
          const realTimeInfoVehicle = this.props.vehicles[vehicle.id];
          if (realTimeInfoVehicle) {
            latlng = {
              lat: realTimeInfoVehicle.lat,
              lng: realTimeInfoVehicle.long,
            };
          }
          this.PopupOptions.className = 'vehicle-popup';

          contents = <SelectVehicleContainer vehicle={vehicle} />;
        }
        popup = (
          <Popup
            {...this.PopupOptions}
            key={id}
            position={latlng}
            className={`${this.PopupOptions.className} ${
              this.PopupOptions.className === 'vehicle-popup'
                ? 'single-popup'
                : 'choice-popup'
            }`}
          >
            {contents}
          </Popup>
        );
      } else if (this.state.selectableTargets.length > 1) {
        if (
          !this.context.config.map.showStopMarkerPopupOnMobile &&
          breakpoint === 'small'
        ) {
          showPopup = false;
        }
        popup = (
          <Popup
            key={this.state.coords.toString()}
            {...this.PopupOptions}
            position={this.state.coords}
            maxWidth="300px"
            className={`${this.PopupOptions.className} choice-popup`}
          >
            <MarkerSelectPopup
              selectRow={this.selectRow}
              options={this.state.selectableTargets}
              colors={this.context.config.colors}
              zoom={this.state.zoom}
            />
          </Popup>
        );
      } else if (this.state.selectableTargets.length === 0) {
        if (
          !this.context.config.map.showStopMarkerPopupOnMobile &&
          breakpoint === 'small'
        ) {
          showPopup = false;
        }
        popup = locationPopup !== 'none' && (
          <Popup
            key={this.state.coords.toString()}
            {...this.PopupOptions}
            maxHeight={220}
            maxWidth="auto"
            position={this.state.coords}
            className={`${this.PopupOptions.className} ${
              locationPopup === 'all' ? 'single-popup' : 'narrow-popup'
            }`}
          >
            <LocationPopup
              lat={this.state.coords.lat}
              lon={this.state.coords.lng}
              onSelectLocation={this.props.onSelectLocation}
              locationPopup={locationPopup}
            />
          </Popup>
        );
      }
    }

    return showPopup ? popup : null;
  }
}

const connectedComponent = withLeaflet(
  connectToStores(
    props => (
      <ReactRelayContext.Consumer>
        {({ environment }) => (
          <TileLayerContainer {...props} relayEnvironment={environment} />
        )}
      </ReactRelayContext.Consumer>
    ),
    [RealTimeInformationStore, PreferencesStore],
    context => ({
      vehicles: context.getStore(RealTimeInformationStore).vehicles,
      lang: context.getStore(PreferencesStore).getLanguage(),
    }),
  ),
);

export { connectedComponent as default, TileLayerContainer as Component };
