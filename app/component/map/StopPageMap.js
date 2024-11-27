import PropTypes from 'prop-types';
import React, { useEffect, useContext, useState } from 'react';
import { matchShape, routerShape } from 'found';
import { connectToStores } from 'fluxible-addons-react';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { fetchQuery } from 'react-relay';
import ReactRelayContext from 'react-relay/lib/ReactRelayContext';
import {
  configShape,
  locationShape,
  mapLayerOptionsShape,
} from '../../util/shapes';
import { getSettings } from '../../util/planParamUtil';
import PositionStore from '../../store/PositionStore';
import MapLayerStore, { mapLayerShape } from '../../store/MapLayerStore';
import MapWithTracking from './MapWithTracking';
import SelectedStopPopup from './popups/SelectedStopPopup';
import SelectedStopPopupContent from '../SelectedStopPopupContent';
import withBreakpoint from '../../util/withBreakpoint';
import VehicleMarkerContainer from './VehicleMarkerContainer';
import BackButton from '../BackButton';
import ItineraryLine from './ItineraryLine';
import Loading from '../Loading';
import { getMapLayerOptions } from '../../util/mapLayerUtils';
import MapRoutingButton from '../MapRoutingButton';
import CookieSettingsButton from '../CookieSettingsButton';
import { PREFIX_CARPARK, PREFIX_BIKEPARK } from '../../util/path';
import { walkQuery } from './WalkQuery';

const getModeFromProps = props => {
  if (props.citybike) {
    return 'citybike';
  }
  if (props.parkType === PREFIX_BIKEPARK) {
    return 'parkAndRideForBikes';
  }
  if (props.parkType === PREFIX_CARPARK) {
    return 'parkAndRide';
  }
  if (props.stop.vehicleMode) {
    return props.stop.vehicleMode.toLowerCase();
  }
  if (props.scooter) {
    return 'scooter';
  }
  return 'stop';
};

function StopPageMap(
  { stop, breakpoint, locationState, mapLayers, mapLayerOptions, stopName },
  { config, match },
) {
  if (!stop) {
    return false;
  }

  const maxShowRouteDistance = breakpoint === 'large' ? 900 : 470;
  const { environment } = useContext(ReactRelayContext);
  const [walk, setWalk] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchWalk = async targetStop => {
      if (locationState.hasLocation && locationState.address) {
        if (distance(locationState, stop) < maxShowRouteDistance) {
          const settings = getSettings(config);
          const variables = {
            origin: {
              location: {
                coordinate: {
                  latitude: locationState.lat,
                  longitude: locationState.lon,
                },
              },
            },
            destination: {
              location: {
                coordinate: {
                  latitude: targetStop.lat,
                  longitude: targetStop.lon,
                },
              },
            },
            walkSpeed: settings.walkSpeed,
            wheelchair: !!settings.accessibilityOption,
          };
          fetchQuery(environment, walkQuery, variables)
            .toPromise()
            .then(result => {
              if (isMounted) {
                setWalk(
                  result.plan.edges.length ? result.plan.edges?.[0].node : null,
                );
              }
            });
        }
      }
    };
    if (stop && locationState.hasLocation) {
      fetchWalk(stop);
    }
    return () => {
      isMounted = false;
    };
  }, [locationState.status]);
  if (locationState.loadingPosition) {
    return <Loading />;
  }

  const leafletObjs = [];
  const children = [];
  if (config.showVehiclesOnStopPage) {
    leafletObjs.push(<VehicleMarkerContainer key="vehicles" useLargeIcon />);
  }

  if (breakpoint === 'large') {
    leafletObjs.push(
      <SelectedStopPopup lat={stop.lat} lon={stop.lon} key="SelectedStopPopup">
        <SelectedStopPopupContent stop={stop} name={stopName} />
      </SelectedStopPopup>,
    );
    if (config.useCookiesPrompt) {
      children.push(<CookieSettingsButton key="cookiesettings" />);
    }
  } else {
    children.push(
      <BackButton
        icon="icon-icon_arrow-collapse--left"
        iconClassName="arrow-icon"
        key="stop-page-back-button"
      />,
    );
  }

  if (walk) {
    leafletObjs.push(
      <ItineraryLine
        key="walk"
        legs={walk.legs}
        passive={false}
        showIntermediateStops={false}
        streetMode="walk"
      />,
    );
  }
  const id = match.params.stopId || match.params.terminalId || match.params.id;

  const mwtProps = {};
  if (
    locationState &&
    locationState.lat &&
    locationState.lon &&
    stop.lat &&
    stop.lon &&
    distance(locationState, stop) < maxShowRouteDistance
  ) {
    mwtProps.bounds = [
      [locationState.lat, locationState.lon],
      [
        stop.lat + (stop.lat - locationState.lat),
        stop.lon + (stop.lon - locationState.lon),
      ],
    ];
  } else {
    mwtProps.lat = stop.lat;
    mwtProps.lon = stop.lon;
    mwtProps.zoom = !match.params.stopId || stop.platformCode ? 18 : 16;
  }

  return (
    <MapWithTracking
      className="flex-grow"
      hilightedStops={[id]}
      leafletObjs={leafletObjs}
      {...mwtProps}
      mapLayers={mapLayers}
      mapLayerOptions={mapLayerOptions}
      topButtons={<MapRoutingButton stop={stop} />}
    >
      {children}
    </MapWithTracking>
  );
}

StopPageMap.contextTypes = {
  config: configShape.isRequired,
  match: matchShape.isRequired,
  router: routerShape.isRequired,
  getStore: PropTypes.func.isRequired,
};

StopPageMap.propTypes = {
  stop: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    platformCode: PropTypes.string,
  }),
  breakpoint: PropTypes.string.isRequired,
  locationState: locationShape.isRequired,
  mapLayers: mapLayerShape.isRequired,
  mapLayerOptions: mapLayerOptionsShape.isRequired,
  parkType: PropTypes.string,
  stopName: PropTypes.node,
};

StopPageMap.defaultProps = {
  stop: undefined,
  parkType: undefined,
  stopName: undefined,
};

const componentWithBreakpoint = withBreakpoint(StopPageMap);

const StopPageMapWithStores = connectToStores(
  componentWithBreakpoint,
  [PositionStore, MapLayerStore],
  ({ config, getStore }, props) => {
    const locationState = getStore(PositionStore).getLocationState();
    const ml = config.showVehiclesOnStopPage ? { notThese: ['vehicles'] } : {};
    if (props.citybike) {
      ml.force = ['citybike']; // show always
    } else if (props.scooter) {
      ml.force = ['scooter']; // show always
    } else {
      ml.force = ['terminal'];
    }
    const mapLayers = getStore(MapLayerStore).getMapLayers(ml);
    const mode = getModeFromProps(props);
    const mapLayerOptions = getMapLayerOptions({
      lockedMapLayers: ['vehicles', mode],
      selectedMapLayers: ['vehicles', mode],
    });
    return {
      locationState,
      mapLayers,
      mapLayerOptions,
    };
  },
  {
    config: configShape,
  },
);

export {
  StopPageMapWithStores as default,
  componentWithBreakpoint as Component,
};
