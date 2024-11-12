import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import pick from 'lodash/pick';

import Supercluster from 'supercluster';
import { isBrowser } from '../../../util/browser';
import {
  getMapIconScale,
  drawScooterIcon,
  drawSmallVehicleRentalMarker,
} from '../../../util/mapIconUtils';

import {
  getRentalNetworkConfig,
  getRentalNetworkIcon,
} from '../../../util/vehicleRentalUtils';
import { fetchWithLanguageAndSubscription } from '../../../util/fetchUtils';
import { getLayerBaseUrl } from '../../../util/mapLayerUtils';
import { TransportMode } from '../../../constants';
import { getSettings } from '../../../util/planParamUtil';

class RentalVehicles {
  constructor(tile, config, mapLayers, relayEnvironment) {
    this.tile = tile;
    this.config = config;
    this.relayEnvironment = relayEnvironment;
    this.scaleratio = (isBrowser && window.devicePixelRatio) || 1;
    this.citybikeImageSize =
      20 * this.scaleratio * getMapIconScale(this.tile.coords.z);
    this.availabilityImageSize =
      14 * this.scaleratio * getMapIconScale(this.tile.coords.z);
    this.timeOfLastFetch = undefined;
    this.canHaveStationUpdates = true;
  }

  getPromise = lang => this.fetchAndDraw(lang);

  fetchAndDraw = lang => {
    const zoomedIn =
      this.tile.coords.z > this.config.vehicleRental.cityBikeSmallIconZoom;
    const baseUrl = getLayerBaseUrl(
      this.config.URL.REALTIME_RENTAL_VEHICLE_MAP,
      lang,
    );
    const tileUrl = `${baseUrl}${
      this.tile.coords.z + (this.tile.props.zoomOffset || 0)
    }/${this.tile.coords.x}/${this.tile.coords.y}.pbf`;
    return fetchWithLanguageAndSubscription(tileUrl, this.config, lang)
      .then(res => {
        this.timeOfLastFetch = new Date().getTime();
        if (res.status !== 200) {
          return undefined;
        }

        return res.arrayBuffer().then(
          buf => {
            const vt = new VectorTile(new Protobuf(buf));

            this.features = [];
            const layer = vt.layers.realtimeRentalVehicles;
            const settings = getSettings(this.config);
            const { scooterNetworks } = settings;
            const scooterIconPrefix = `icon-icon_scooter`;
            const showAllNetworks =
              !this.config.transportModes.scooter.showIfSelectedForRouting;
            if (layer) {
              for (let i = 0, ref = layer.length - 1; i <= ref; i++) {
                const feature = layer.feature(i);
                [[feature.geom]] = feature.loadGeometry();
                // Filter out vehicles that are not in the scooterNetworks (selected by a user) to avoid including unwanted vehicles in clusters
                // Also Filter out vehicles that should not be shown to avoid user accidentally clicking on invisible objects on the map
                if (
                  (showAllNetworks ||
                    scooterNetworks.includes(feature.properties.network)) &&
                  this.shouldShowRentalVehicle(
                    feature.properties.id,
                    feature.properties.network,
                    feature.properties.pickupAllowed,
                    feature.properties.formFactor,
                  )
                ) {
                  this.features.push(pick(feature, ['geom', 'properties']));
                }
              }
            }

            if (this.features.length === 0) {
              this.canHaveStationUpdates = false;
            } else {
              // if zoomed out and there is a highlighted station,
              // this value will be later reset to true
              this.canHaveStationUpdates = zoomedIn;

              if (this.tile.coords.z >= 13 && this.tile.coords.z < 18) {
                this.clusterAndDraw(zoomedIn, scooterIconPrefix);
              } else {
                this.features.forEach(feature => this.draw(feature, zoomedIn));
              }
            }
          },
          err => console.log(err), // eslint-disable-line no-console
        );
      })
      .catch(err => {
        this.timeOfLastFetch = new Date().getTime();
        console.log(err); // eslint-disable-line no-console
      });
  };

  clusterAndDraw = (zoomedIn, iconPrefix) => {
    const index = new Supercluster({
      radius: 40, // in pixels
      maxZoom: 17,
      minPoints: 2,
      extent: 512, // tile size (512)
      minZoom: 13,
      map: featureProps => ({
        networks: [featureProps.network],
        scooterId: featureProps.id, // an id of a vehicle to zoom into when a cluster is clicked
      }),
      reduce: (accumulated, featureProps) => {
        if (
          featureProps.network &&
          !accumulated.networks.includes(featureProps.network)
        ) {
          accumulated.networks.push(featureProps.network);
        }
        return accumulated;
      },
    });

    index.load(this.pointsInSuperclusterFormat());
    const bbox = [-180, -85, 180, 85]; // Bounding box covers the entire world
    const clusters = index.getClusters(bbox, this.tile.coords.z);
    const clusteredFeatures = [];

    clusters.forEach(clusterFeature => {
      const newFeature = this.featureWithGeom(clusterFeature);
      clusteredFeatures.push(newFeature);
      this.draw(newFeature, zoomedIn, iconPrefix);
    });
    this.features = clusteredFeatures;
  };

  draw = (feature, zoomedIn, iconPrefix) => {
    const { id, network } = feature.properties;
    const { geom } = feature;
    const iconName =
      iconPrefix ||
      getRentalNetworkIcon(getRentalNetworkConfig(network, this.config));
    const isHilighted = this.tile.hilightedStops?.includes(id);
    if (zoomedIn || isHilighted) {
      drawScooterIcon(this.tile, geom, iconName, isHilighted);
    } else {
      this.drawSmallScooterMarker(geom);
    }
  };

  drawSmallScooterMarker = geom => {
    const iconColor = this.config.colors.iconColors['mode-scooter'];
    drawSmallVehicleRentalMarker(
      this.tile,
      geom,
      iconColor,
      TransportMode.Scooter,
    );
  };

  shouldShowRentalVehicle = (id, network, pickupAllowed, formFactor) =>
    (!this.tile.stopsToShow || this.tile.stopsToShow.includes(id)) &&
    (!network ||
      (this.config.vehicleRental.networks[network] &&
        this.config.vehicleRental.networks[network].enabled &&
        this.config.vehicleRental.networks[network].showRentalVehicles &&
        this.config.vehicleRental.networks[network].type ===
          formFactor.toLowerCase())) &&
    pickupAllowed;

  static getName = () => 'scooter';

  pointsInSuperclusterFormat = () => {
    return this.features.map(feature => {
      // Convert the feature's x/y to lat/lon for clustering
      const latLon = this.tile.project({
        x: feature.geom.x,
        y: feature.geom.y,
      });
      return {
        type: 'Feature',
        properties: { ...feature.properties },
        geom: { ...feature.geom },
        geometry: {
          type: 'Point',
          coordinates: [latLon.lat, latLon.lon],
        },
      };
    });
  };

  featureWithGeom = clusterFeature => {
    // Convert the cluster's lat/lon to x/y
    const point = this.tile.latLngToPoint(
      clusterFeature.geometry.coordinates[0],
      clusterFeature.geometry.coordinates[1],
    );
    return {
      ...clusterFeature,
      geom: {
        x: point.x,
        y: point.y,
      },
    };
  };
}

export default RentalVehicles;
