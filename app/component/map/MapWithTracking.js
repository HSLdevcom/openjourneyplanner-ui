import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import connectToStores from 'fluxible-addons-react/connectToStores';
import onlyUpdateForKeys from 'recompose/onlyUpdateForKeys';
import getContext from 'recompose/getContext';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import { intlShape } from 'react-intl';
import { mapLayerOptionsShape, configShape } from '../../util/shapes';
import { startLocationWatch } from '../../action/PositionActions';
import MapContainer from './MapContainer';
import ToggleMapTracking from '../ToggleMapTracking';
import { isBrowser } from '../../util/browser';
import PositionStore from '../../store/PositionStore';
import { mapLayerShape } from '../../store/MapLayerStore';
import BubbleDialog from '../BubbleDialog';
import PreferencesStore from '../../store/PreferencesStore';
import MapLayersDialogContent from '../MapLayersDialogContent';
import MenuDrawer from '../MenuDrawer';
import withBreakpoint from '../../util/withBreakpoint';

const onlyUpdateCoordChanges = onlyUpdateForKeys([
  'lat',
  'lon',
  'zoom',
  'bounds',
  'mapTracking',
  'mapLayers',
  'children',
  'leafletObjs',
  'bottomButtons',
  'topButtons',
]);

const MapCont = onlyUpdateCoordChanges(MapContainer);

const getForcedLayersFromMapLayerOptions = mapLayerOptions => {
  const forcedLayers = {};
  Object.keys(mapLayerOptions).forEach(key => {
    const layer = mapLayerOptions[key];
    if (layer?.isLocked === undefined) {
      Object.keys(layer).forEach(subKey => {
        if (layer[subKey].isLocked) {
          if (!forcedLayers[key]) {
            forcedLayers[key] = {};
          }
          forcedLayers[key][subKey] = layer[subKey].isSelected;
        }
      });
    } else if (layer?.isLocked) {
      forcedLayers[key] = layer.isSelected;
    }
  });
  return forcedLayers;
};

class MapWithTrackingStateHandler extends React.Component {
  static propTypes = {
    lat: PropTypes.number,
    lon: PropTypes.number,
    zoom: PropTypes.number,
    position: PropTypes.shape({
      hasLocation: PropTypes.bool.isRequired,
      locationingFailed: PropTypes.bool,
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
    }).isRequired,
    bounds: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    children: PropTypes.arrayOf(PropTypes.node),
    leafletObjs: PropTypes.arrayOf(PropTypes.node),
    renderCustomButtons: PropTypes.func,
    mapLayers: mapLayerShape.isRequired,
    mapLayerOptions: mapLayerOptionsShape,
    mapTracking: PropTypes.bool,
    locationPopup: PropTypes.string,
    onSelectLocation: PropTypes.func,
    onStartNavigation: PropTypes.func,
    onEndNavigation: PropTypes.func,
    onMapTracking: PropTypes.func,
    setMWTRef: PropTypes.func,
    mapRef: PropTypes.func,
    // eslint-disable-next-line
    leafletEvents: PropTypes.object,
    breakpoint: PropTypes.string.isRequired,
    lang: PropTypes.string.isRequired,
    topButtons: PropTypes.node,
    bottomPadding: PropTypes.number,
  };

  static defaultProps = {
    lat: undefined,
    lon: undefined,
    zoom: undefined,
    bounds: undefined,
    setMWTRef: undefined,
    mapRef: undefined,
    children: undefined,
    leafletObjs: undefined,
    mapTracking: undefined,
    onStartNavigation: undefined,
    onEndNavigation: undefined,
    onMapTracking: undefined,
    renderCustomButtons: undefined,
    locationPopup: 'reversegeocoding',
    onSelectLocation: () => null,
    leafletEvents: {},
    mapLayerOptions: null,
    topButtons: null,
    bottomPadding: undefined,
  };

  constructor(props) {
    super(props);
    this.state = {
      mapTracking: props.mapTracking,
      settingsOpen: false,
    };
    this.naviProps = {};
  }

  async componentDidMount() {
    if (!isBrowser) {
      return;
    }
    if (this.props.setMWTRef) {
      this.props.setMWTRef(this);
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(newProps) {
    if (
      newProps.mapTracking !== undefined &&
      newProps.mapTracking !== this.state.mapTracking
    ) {
      this.setState({ mapTracking: newProps.mapTracking });
    }
  }

  setMapElementRef = element => {
    if (element && this.mapElement !== element) {
      this.mapElement = element;
      if (this.props.mapRef) {
        this.props.mapRef(element);
      }
    }
  };

  setMap = map => {
    this.map = map;
  };

  enableMapTracking = () => {
    if (!this.props.position.hasLocation) {
      this.context.executeAction(startLocationWatch);
    }
    if (!this.state.mapTracking) {
      // enabling tracking will trigger same navigation events as user navigation
      // this hack prevents those events from clearing tracking
      this.ignoreNavigation = true;
      setTimeout(() => {
        this.ignoreNavigation = false;
      }, 500);
      this.setState({ mapTracking: true });
    }
    if (this.props.onMapTracking) {
      this.props.onMapTracking();
    }
  };

  disableMapTracking = () => {
    this.setState({
      mapTracking: false,
    });
  };

  // this is used outside of this component
  // eslint-disable-next-line react/no-unused-class-component-methods
  forceRefresh = () => {
    this.refresh = true;
  };

  startNavigation = e => {
    if (this.props.onStartNavigation) {
      this.props.onStartNavigation(this.mapElement, e);
    }
    if (this.state.mapTracking && !this.ignoreNavigation) {
      this.disableMapTracking();
    }
  };

  endNavigation = e => {
    if (this.props.onEndNavigation) {
      this.props.onEndNavigation(this.mapElement, e);
    }
    this.navigated = true;
  };

  setSettingsOpen = value => {
    this.setState({ settingsOpen: value });
  };

  getMapLayers = () => {
    let forcedLayers;
    if (this.props.mapLayerOptions) {
      forcedLayers = getForcedLayersFromMapLayerOptions(
        this.props.mapLayerOptions,
      );
    }
    if (isEmpty(forcedLayers)) {
      return this.props.mapLayers;
    }
    const merged = {
      ...this.props.mapLayers,
      ...forcedLayers,
      vehicles: !this.props.mapLayerOptions
        ? this.props.mapLayers.vehicles
        : false,
    };
    if (isEmpty(forcedLayers.stop)) {
      return merged;
    }
    return {
      ...merged,
      stop: {
        ...this.props.mapLayers.stop,
        ...forcedLayers.stop,
      },
    };
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  setBottomPadding = padding => {
    this.map?.setBottomPadding(padding);
    this.setState({ bottomPadding: padding });
  };

  render() {
    const {
      lat,
      lon,
      zoom,
      position,
      children,
      renderCustomButtons,
      mapLayerOptions,
      bounds,
      leafletEvents,
      topButtons,
      ...rest
    } = this.props;
    const { config } = this.context;

    let btnClassName = 'map-with-tracking-buttons';
    if (config.map.showZoomControl) {
      btnClassName = cx(btnClassName, 'roomForZoomControl');
    }
    // eslint-disable-next-line no-underscore-dangle
    const currentZoom = this.mapElement?.leafletElement?._zoom || zoom || 16;

    if (this.state.mapTracking && position.hasLocation) {
      this.naviProps.lat = position.lat;
      this.naviProps.lon = position.lon;
      if (zoom) {
        this.naviProps.zoom = zoom;
      } else if (!this.naviProps.zoom) {
        this.naviProps.zoom = currentZoom;
      }
      if (this.navigated) {
        // force map update by changing the coordinate slightly. looks crazy but is the easiest way
        this.naviProps.lat += 0.000001 * Math.random();
        this.navigated = false;
      }
      delete this.naviProps.bounds;
    } else if (
      this.props.bounds &&
      (!isEqual(this.oldBounds, this.props.bounds) || this.refresh)
    ) {
      this.naviProps.bounds = cloneDeep(this.props.bounds);
      delete this.naviProps.zoom;
      if (this.refresh) {
        // bounds is defined by [min, max] point pair. Substract min lat a bit
        this.naviProps.bounds[0][0] -= 0.000001 * Math.random();
      }
      this.oldBounds = cloneDeep(this.props.bounds);
    } else if (
      lat &&
      lon &&
      ((lat !== this.oldLat && lon !== this.oldLon) || this.refresh)
    ) {
      this.naviProps.lat = lat;
      if (this.refresh) {
        this.naviProps.lat += 0.000001 * Math.random();
      }
      this.naviProps.lon = lon;
      this.oldLat = lat;
      this.oldLon = lon;
      if (zoom) {
        this.naviProps.zoom = zoom;
      }
      delete this.naviProps.bounds;
    }
    this.refresh = false;

    // eslint-disable-next-line no-nested-ternary
    const img = position.locationingFailed
      ? 'icon-tracking-off-v2'
      : this.state.mapTracking
        ? 'icon-tracking-on-v2'
        : 'icon-tracking-offline-v2';
    // eslint-disable-next-line no-nested-ternary
    const ariaLabel = position.locationingFailed
      ? this.context.intl.formatMessage({ id: 'tracking-button-offline' })
      : this.state.mapTracking
        ? this.context.intl.formatMessage({ id: 'tracking-button-on' })
        : this.context.intl.formatMessage({ id: 'tracking-button-off' });

    const mergedMapLayers = this.getMapLayers();
    return (
      <>
        <MapCont
          className="flex-grow"
          locationPopup={this.props.locationPopup}
          onSelectLocation={this.props.onSelectLocation}
          leafletEvents={{
            ...this.props.leafletEvents,
            onDragstart: this.startNavigation,
            onZoomstart: this.startNavigation,
            onZoomend: this.endNavigation,
            onDragend: this.endNavigation,
          }}
          {...this.naviProps}
          {...rest}
          leafletMapRef={this.setMapElementRef}
          mapRef={this.setMap}
          breakpoint={this.props.breakpoint}
          bottomButtons={
            <div className={btnClassName}>
              {config.map.showLayerSelector && (
                <BubbleDialog
                  contentClassName="select-map-layers-dialog-content"
                  header="select-map-layers-header"
                  icon="map-layers"
                  id="mapLayerSelectorV2"
                  isFullscreenOnMobile
                  isOpen={this.state.settingsOpen}
                  tooltip={
                    config.mapLayers &&
                    config.mapLayers.tooltip &&
                    config.mapLayers.tooltip[this.props.lang]
                  }
                  setOpen={this.setSettingsOpen}
                />
              )}
              {renderCustomButtons && renderCustomButtons()}
              <ToggleMapTracking
                key="toggleMapTracking"
                img={img}
                ariaLabel={ariaLabel}
                handleClick={() => {
                  if (this.state.mapTracking) {
                    this.disableMapTracking();
                  } else {
                    this.enableMapTracking();
                  }
                }}
                className="icon-mapMarker-toggle-positioning"
              />
            </div>
          }
          bottomPadding={this.state.bottomPadding}
          topButtons={topButtons}
          mapLayers={mergedMapLayers}
        >
          {children}
        </MapCont>
        {config.map.showLayerSelector && (
          <MenuDrawer
            open={this.state.settingsOpen}
            onRequestChange={() => this.setSettingsOpen(false)}
            className="offcanvas-layers"
            breakpoint={this.props.breakpoint}
          >
            <MapLayersDialogContent
              open={this.state.settingsOpen}
              setOpen={this.setSettingsOpen}
              mapLayerOptions={mapLayerOptions}
              mapLayers={mergedMapLayers}
            />
            <button
              type="button"
              className="desktop-button"
              onClick={() => this.setSettingsOpen(false)}
            >
              {this.context.intl.formatMessage({
                id: 'close',
                defaultMessage: 'Close',
              })}
            </button>
          </MenuDrawer>
        )}
      </>
    );
  }
}

MapWithTrackingStateHandler.contextTypes = {
  executeAction: PropTypes.func,
  getStore: PropTypes.func,
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

const MapWithTrackingStateHandlerapWithBreakpoint = withBreakpoint(
  MapWithTrackingStateHandler,
);

const MapWithTracking = connectToStores(
  getContext({ config: configShape })(
    MapWithTrackingStateHandlerapWithBreakpoint,
  ),
  [PositionStore, PreferencesStore],
  ({ getStore }) => ({
    position: getStore(PositionStore).getLocationState(),
    lang: getStore(PreferencesStore).getLanguage(),
  }),
);

export { MapWithTracking as default, MapWithTrackingStateHandler as Component };
