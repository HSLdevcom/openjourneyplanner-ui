import PropTypes from 'prop-types';
import React from 'react';
import LeafletMap from 'react-leaflet/es/Map';
import TileLayer from 'react-leaflet/es/TileLayer';
import AttributionControl from 'react-leaflet/es/AttributionControl';
import ScaleControl from 'react-leaflet/es/ScaleControl';
import ZoomControl from 'react-leaflet/es/ZoomControl';
import { intlShape } from 'react-intl';
import L from 'leaflet';
import get from 'lodash/get';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import { configShape } from '../../util/shapes';
// Webpack handles this by bundling it with the other css files
import 'leaflet/dist/leaflet.css';
import VehicleMarkerContainer from './VehicleMarkerContainer';
import {
  startRealTimeClient,
  stopRealTimeClient,
} from '../../action/realTimeClientAction';
import PositionMarker from './PositionMarker';
import VectorTileLayerContainer from './tile-layer/VectorTileLayerContainer';
import { boundWithMinimumArea } from '../../util/geo-utils';
import events from '../../util/events';
import { getLayerBaseUrl } from '../../util/mapLayerUtils';
import GeoJSON from './GeoJSON';
import { mapLayerShape } from '../../store/MapLayerStore';

const zoomOutText = `<svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-icon_minus"/></svg>`;
const zoomInText = `<svg class="icon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-icon_plus"/></svg>`;
const EXTRA_PADDING = 100;
/* foo-eslint-disable react/sort-comp */

const startClient = context => {
  const { realTime } = context.config;
  let feedId;
  /* handle multiple feedid case */
  context.config.feedIds.forEach(f => {
    if (!feedId && realTime[f]) {
      feedId = f;
    }
  });
  const source = feedId && realTime[feedId];
  if (source && source.active) {
    const config = {
      ...source,
      feedId,
      options: context.config.feedIds
        .filter(f => realTime[f]?.active)
        .map(f => ({ feedId: f })),
    };
    context.executeAction(startRealTimeClient, config);
  }
};

const onPopupopen = () => events.emit('popupOpened');

export default class Map extends React.Component {
  static propTypes = {
    animate: PropTypes.bool,
    lat: PropTypes.number,
    lon: PropTypes.number,
    zoom: PropTypes.number,
    bounds: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    hilightedStops: PropTypes.arrayOf(PropTypes.string),
    stopsToShow: PropTypes.arrayOf(PropTypes.string),
    objectsToHide: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
    lang: PropTypes.string.isRequired,
    // eslint-disable-next-line
    leafletEvents: PropTypes.object,
    leafletObjs: PropTypes.arrayOf(PropTypes.node),
    mergeStops: PropTypes.bool,
    leafletMapRef: PropTypes.func,
    mapRef: PropTypes.func,
    mapLayerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    locationPopup: PropTypes.string,
    onSelectLocation: PropTypes.func,
    bottomPadding: PropTypes.number,
    bottomButtons: PropTypes.node,
    topButtons: PropTypes.node,
    // eslint-disable-next-line
    geoJson: PropTypes.object,
    mapLayers: mapLayerShape,
    breakpoint: PropTypes.string,
  };

  static defaultProps = {
    animate: true,
    mapRef: null,
    mapLayerRef: null,
    leafletMapRef: null,
    lat: undefined,
    lon: undefined,
    zoom: undefined,
    bounds: undefined,
    locationPopup: 'reversegeocoding',
    bottomPadding: undefined,
    bottomButtons: null,
    topButtons: null,
    mergeStops: true,
    mapLayers: { geoJson: {} },
    hilightedStops: undefined,
    stopsToShow: undefined,
    onSelectLocation: undefined,
    geoJson: undefined,
    leafletEvents: undefined,
    leafletObjs: undefined,
    objectsToHide: { vehicleRentalStations: [] },
    breakpoint: undefined,
  };

  static contextTypes = {
    executeAction: PropTypes.func.isRequired,
    getStore: PropTypes.func,
    config: configShape.isRequired,
    intl: intlShape.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { zoom: 14 };
    if (props.mapRef) {
      props.mapRef(this);
    }
    if (this.props.breakpoint !== 'large') {
      this.boundsOptions = {
        paddingTopLeft: [0, EXTRA_PADDING],
        paddingBottomRight: [0, (window.innerHeight - 64) / 2],
      };
    }
  }

  updateZoom = () => {
    // eslint-disable-next-line no-underscore-dangle
    const zoom = this.map?.leafletElement?._zoom || this.props.zoom || 16;
    if (zoom !== this.state.zoom) {
      this.setState({ zoom });
    }
  };

  componentDidMount() {
    if (this.props.mapLayers.vehicles) {
      startClient(this.context);
    }
    this.updateZoom();
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(newProps) {
    this.updateZoom();
    if (newProps.mapLayers.vehicles) {
      if (!this.props.mapLayers.vehicles) {
        startClient(this.context);
      }
    } else if (this.props.mapLayers.vehicles) {
      const { client } = this.context.getStore('RealTimeInformationStore');
      if (client) {
        this.context.executeAction(stopRealTimeClient, client);
      }
    }
  }

  componentDidUpdate() {
    // move leaflet attribution control elements according to given padding
    // leaflet api doesn't allow controlling element position so have to use this hack
    if (this.props.bottomPadding !== undefined) {
      const bottomControls = document.getElementsByClassName('leaflet-bottom');
      Array.prototype.forEach.call(bottomControls, elem => {
        // eslint-disable-next-line no-param-reassign
        elem.style.transform = `translate(0, -${this.props.bottomPadding}px)`;
      });
    }
  }

  componentWillUnmount() {
    const { client } = this.context.getStore('RealTimeInformationStore');
    if (client) {
      this.context.executeAction(stopRealTimeClient, client);
    }
  }

  zoomEnd = () => {
    this.props.leafletEvents?.onZoomend?.(); // pass event to parent
    this.updateZoom();
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  setBottomPadding = padding => {
    if (this.boundsOptions) {
      this.boundsOptions.paddingBottomRight = [
        0,
        Math.max(
          Math.min(padding, window.innerHeight - 2 * EXTRA_PADDING),
          EXTRA_PADDING,
        ),
      ];
    }
  };

  render() {
    const {
      zoom,
      lat,
      lon,
      locationPopup,
      onSelectLocation,
      leafletObjs,
      geoJson,
      mapLayers,
      bottomPadding,
      mapLayerRef,
    } = this.props;
    const { config } = this.context;

    const naviProps = {}; // these define map center and zoom
    if (bottomPadding !== undefined && this.boundsOptions) {
      this.boundsOptions.paddingBottomRight = [
        0,
        Math.min(bottomPadding + EXTRA_PADDING, window.innerHeight - 60),
      ];
    }
    if (this.props.bounds) {
      // bounds overrule center & zoom
      naviProps.bounds = boundWithMinimumArea(this.props.bounds); // validate
    } else if (lat && lon) {
      if (this.boundsOptions?.paddingBottomRight !== undefined) {
        // bounds fitting can take account the wanted padding, so convert to bounds
        naviProps.bounds = boundWithMinimumArea([[lat, lon]], zoom);
      } else {
        naviProps.center = [lat, lon];
        if (zoom) {
          naviProps.zoom = zoom;
        }
      }
    }

    // When this option is set, the map restricts the view to the given geographical bounds,
    // bouncing the user back if the user tries to pan outside the view.
    const mapAreaBounds = L.latLngBounds(
      L.latLng(
        config.map.areaBounds.corner1[0],
        config.map.areaBounds.corner1[1],
      ),
      L.latLng(
        config.map.areaBounds.corner2[0],
        config.map.areaBounds.corner2[1],
      ),
    );
    naviProps.maxBounds = mapAreaBounds;

    if (naviProps.bounds || (naviProps.center && naviProps.zoom)) {
      this.ready = true;
    }

    if (!this.ready) {
      return null;
    }

    const mapBaseUrl = getLayerBaseUrl(config.URL.MAP, this.props.lang);
    const mapUrl = config.hasAPISubscriptionQueryParameter
      ? `${mapBaseUrl}{z}/{x}/{y}{size}.png?${config.API_SUBSCRIPTION_QUERY_PARAMETER_NAME}=${config.API_SUBSCRIPTION_TOKEN}`
      : `${mapBaseUrl}{z}/{x}/{y}{size}.png`;

    const leafletObjNew = leafletObjs.concat([
      <VectorTileLayerContainer
        key="vectorTileLayerContainer"
        hilightedStops={this.props.hilightedStops}
        mergeStops={this.props.mergeStops}
        stopsToShow={this.props.stopsToShow}
        objectsToHide={this.props.objectsToHide}
        locationPopup={locationPopup}
        onSelectLocation={onSelectLocation}
        mapLayers={this.props.mapLayers}
      />,
    ]);

    if (this.props.mapLayers.vehicles) {
      const useLargeIcon = this.state.zoom >= config.stopsMinZoom;
      leafletObjNew.push(
        <VehicleMarkerContainer key="vehicles" useLargeIcon={useLargeIcon} />,
      );
    }

    let attribution = get(config, 'map.attribution');
    if (!isString(attribution) || isEmpty(attribution)) {
      attribution = false;
    }

    if (geoJson) {
      Object.keys(geoJson)
        .filter(
          key =>
            mapLayers.geoJson[key] !== false &&
            (mapLayers.geoJson[key] === true ||
              geoJson[key].isOffByDefault !== true),
        )
        .forEach((key, i) => {
          leafletObjNew.push(
            <GeoJSON
              key={key.concat(i)}
              data={geoJson[key].data}
              geoJsonZoomLevel={this.state.zoom}
              locationPopup={locationPopup}
              onSelectLocation={onSelectLocation}
            />,
          );
        });
    }

    const leafletEvents = {
      ...this.props.leafletEvents,
      onZoomend: this.zoomEnd,
    };

    return (
      <div ref={mapLayerRef}>
        <span>{this.props.topButtons}</span>
        <span
          className="overlay-mover"
          style={{
            transform: `translate(0, -${this.props.bottomPadding}px)`,
          }}
        >
          {this.props.bottomButtons}
        </span>
        <div aria-hidden="true">
          <LeafletMap
            {...naviProps}
            className={`z${this.state.zoom}`}
            keyboard={false}
            ref={el => {
              this.map = el;
              if (this.props.leafletMapRef) {
                this.props.leafletMapRef(el);
              }
            }}
            minZoom={config.map.minZoom}
            maxZoom={config.map.maxZoom}
            zoomControl={false}
            attributionControl={false}
            animate={this.props.animate}
            boundsOptions={this.boundsOptions}
            {...leafletEvents}
            onPopupopen={onPopupopen}
            closePopupOnClick={false}
          >
            <TileLayer
              url={mapUrl}
              tileSize={config.map.tileSize || 256}
              zoomOffset={config.map.zoomOffset || 0}
              updateWhenIdle={false}
              size={config.map.useRetinaTiles && L.Browser.retina ? '@2x' : ''}
              minZoom={config.map.minZoom}
              maxZoom={config.map.maxZoom}
              attribution={attribution}
            />
            {attribution && (
              <AttributionControl
                position={
                  this.props.breakpoint === 'large'
                    ? 'bottomright'
                    : 'bottomleft'
                }
                prefix=""
              />
            )}
            {config.map.showScaleBar && (
              <ScaleControl
                imperial={false}
                position={config.map.controls.scale.position}
              />
            )}
            {this.props.breakpoint === 'large' &&
              config.map.showZoomControl && (
                <ZoomControl
                  position={config.map.controls.zoom.position}
                  zoomInText={zoomInText}
                  zoomOutText={zoomOutText}
                  zoomInTitle={this.context.intl.formatMessage({
                    id: 'map-zoom-in-button',
                  })}
                  zoomOutTitle={this.context.intl.formatMessage({
                    id: 'map-zoom-out-button',
                  })}
                />
              )}
            {leafletObjNew}
            <PositionMarker key="position" />
          </LeafletMap>
        </div>
      </div>
    );
  }
}
