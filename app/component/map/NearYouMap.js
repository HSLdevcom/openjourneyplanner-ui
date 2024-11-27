import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { matchShape } from 'found';
import { fetchQuery } from 'react-relay';
import uniqBy from 'lodash/uniqBy';
import compact from 'lodash/compact';
import isEqual from 'lodash/isEqual';
import polyline from 'polyline-encoded';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import BackButton from '../BackButton';
import VehicleMarkerContainer from './VehicleMarkerContainer';
import Line from './Line';
import MapWithTracking from './MapWithTracking';
import { getSettings } from '../../util/planParamUtil';
import {
  startRealTimeClient,
  stopRealTimeClient,
  changeRealTimeClientTopics,
} from '../../action/realTimeClientAction';
import {
  sortNearbyRentalStations,
  sortNearbyStops,
} from '../../util/sortUtils';
import ItineraryLine from './ItineraryLine';
import {
  locationShape,
  relayShape,
  configShape,
  stopShape,
} from '../../util/shapes';
import Loading from '../Loading';
import LazilyLoad, { importLazy } from '../LazilyLoad';
import { getDefaultNetworks } from '../../util/vehicleRentalUtils';
import { getRouteMode } from '../../util/modeUtils';
import CookieSettingsButton from '../CookieSettingsButton';
import { walkQuery } from './WalkQuery';

const locationMarkerModules = {
  LocationMarker: () =>
    importLazy(import(/* webpackChunkName: "map" */ './LocationMarker')),
};
const handleStopsAndStations = edges => {
  const stopsAndStations = edges.map(({ node }) => {
    const stop = { ...node.place, distance: node.distance };
    return stop;
  });
  return compact(stopsAndStations);
};

const getRealTimeSettings = (routes, context) => {
  const { realTime } = context.config;

  /* handle multiple feedid case by taking most popular feedid */
  const feeds = {};
  routes.forEach(r => {
    if (realTime[r.feedId]) {
      feeds[r.feedId] = feeds[r.feedId] ? feeds[r.feedId] + 1 : 1;
    }
  });
  let best = 0;
  let feedId;
  Object.keys(feeds).forEach(key => {
    const value = feeds[key];
    if (value > best) {
      best = value;
      feedId = key;
    }
  });

  const source = feedId && realTime[feedId];
  if (source && source.active) {
    return {
      ...source,
      feedId,
      options: routes,
    };
  }
  return null;
};

const startClient = (context, routes) => {
  const config = getRealTimeSettings(routes, context);
  if (config) {
    context.executeAction(startRealTimeClient, config);
  }
};
const stopClient = context => {
  const { client } = context.getStore('RealTimeInformationStore');
  if (client) {
    context.executeAction(stopRealTimeClient, client);
  }
};
const updateClient = (context, topics) => {
  const { client } = context.getStore('RealTimeInformationStore');
  const config = getRealTimeSettings(topics, context);
  if (config) {
    config.client = client;
    if (client) {
      context.executeAction(changeRealTimeClientTopics, config, client);
    }
  }
};

const handleBounds = (location, edges) => {
  if (edges.length === 0) {
    // No stops anywhere near
    return [
      [location.lat, location.lon],
      [location.lat, location.lon],
    ];
  }
  const nearestStop = edges[0].node.place;
  const bounds = [
    [nearestStop.lat, nearestStop.lon],
    [
      location.lat + location.lat - nearestStop.lat,
      location.lon + location.lon - nearestStop.lon,
    ],
  ];
  return bounds;
};

const getLocationMarker = location => {
  return (
    <LazilyLoad modules={locationMarkerModules} key="from">
      {({ LocationMarker }) => (
        <LocationMarker position={location} type="from" />
      )}
    </LazilyLoad>
  );
};

function NearYouMap(
  {
    breakpoint,
    stopsNearYou,
    match,
    loading,
    favouriteIds,
    relay,
    position,
    showWalkRoute,
    prioritizedStopsNearYou,
    setMWTRef,
    ...rest
  },
  { ...context },
) {
  const [sortedStopEdges, setSortedStopEdges] = useState([]);
  const [uniqueRealtimeTopics, setUniqueRealtimeTopics] = useState([]);
  const [routeLines, setRouteLines] = useState([]);
  const [bounds, setBounds] = useState([]);
  const [clientOn, setClientOn] = useState(false);
  const [walk, setWalk] = useState({ itinerary: null, stop: null });
  const prevPlace = useRef();
  const prevMode = useRef();
  const mwtRef = useRef();
  const { mode } = match.params;
  const isTransitMode = mode !== 'CITYBIKE';
  const walkRoutingThreshold =
    mode === 'RAIL' || mode === 'SUBWAY' || mode === 'FERRY' ? 3000 : 1500;
  const { environment } = relay;

  const fetchPlan = stop => {
    if (stop.distance < walkRoutingThreshold) {
      const settings = getSettings(context.config);
      const variables = {
        origin: {
          location: {
            coordinate: { latitude: position.lat, longitude: position.lon },
          },
        },
        destination: {
          location: {
            coordinate: { latitude: stop.lat, longitude: stop.lon },
          },
        },
        walkSpeed: settings.walkSpeed,
        wheelchair: !!settings.accessibilityOption,
      };
      fetchQuery(environment, walkQuery, variables)
        .toPromise()
        .then(result => {
          setWalk({
            itinerary: result.plan.edges.length
              ? result.plan.edges?.[0].node
              : null,
            stop,
          });
        });
    } else {
      setWalk({ itinerary: null, stop });
    }
  };

  const handleWalkRoutes = stopsAndStations => {
    if (showWalkRoute) {
      if (stopsAndStations.length > 0) {
        const firstStop = stopsAndStations[0];
        const shouldFetch =
          (mode !== 'BUS' && mode !== 'TRAM') ||
          favouriteIds.has(firstStop.gtfsId);
        if (shouldFetch && !isEqual(firstStop, walk.stop)) {
          fetchPlan(firstStop);
        } else if (!shouldFetch) {
          setWalk({ itinerary: null, stop: null });
        }
      }
    } else {
      setWalk({ itinerary: null, stop: null });
    }
  };

  // get ref to MapWithTracking.js
  const setMWTRefNearYou = ref => {
    mwtRef.current = ref;
    if (setMWTRef) {
      // forward to parent component
      setMWTRef(ref);
    }
  };

  useEffect(() => {
    prevPlace.current = match.params.place;
    prevMode.current = match.params.mode;
    return function cleanup() {
      stopClient(context);
    };
  }, []);

  useEffect(() => {
    const newBounds = handleBounds(position, sortedStopEdges);
    if (newBounds.length > 0) {
      setBounds(newBounds);
      setTimeout(() => mwtRef.current?.map.updateZoom(), 1);
    }
  }, [position, sortedStopEdges]);

  const updateRoutes = sortedRoutes => {
    let patterns = [];
    const realtimeTopics = [];
    sortedRoutes.forEach(item => {
      const { place } = item.node;
      // eslint-disable-next-line no-unused-expressions
      place.patterns &&
        place.patterns.forEach(pattern => {
          const feedId = pattern.route.gtfsId.split(':')[0];
          realtimeTopics.push({
            feedId,
            route: pattern.route.gtfsId.split(':')[1],
            shortName: pattern.route.shortName,
            type: pattern.route.type,
          });
          patterns.push(pattern);
        });
      // eslint-disable-next-line no-unused-expressions
      place.stops &&
        place.stops.forEach(stop => {
          stop.patterns.forEach(pattern => {
            const feedId = pattern.route.gtfsId.split(':')[0];
            realtimeTopics.push({
              feedId,
              route: pattern.route.gtfsId.split(':')[1],
              shortName: pattern.route.shortName,
              type: pattern.route.type,
            });
            patterns.push(pattern);
          });
        });
    });
    patterns = uniqBy(patterns, p => p.patternGeometry?.points || '');
    const lines = patterns
      .filter(p => p.patternGeometry)
      .map(p => (
        <Line
          key={`${p.code}`}
          opaque
          geometry={polyline.decode(p.patternGeometry.points)}
          mode={getRouteMode(p.route)}
        />
      ));
    setRouteLines(lines);
    setUniqueRealtimeTopics(uniqBy(realtimeTopics, route => route.route));
  };

  useEffect(() => {
    if (uniqueRealtimeTopics.length > 0) {
      if (!clientOn) {
        startClient(context, uniqueRealtimeTopics);
        setClientOn(true);
      } else if (
        match.params.place !== prevPlace.current ||
        match.params.mode !== prevMode.current
      ) {
        updateClient(context, uniqueRealtimeTopics);
        prevPlace.current = match.params.place;
        prevMode.current = match.params.mode;
      }
    }
  }, [uniqueRealtimeTopics]);

  useEffect(() => {
    if (stopsNearYou?.nearest?.edges) {
      const active = stopsNearYou.nearest.edges
        .slice()
        .filter(
          stop =>
            stop.node.place.stoptimesWithoutPatterns &&
            stop.node.place.stoptimesWithoutPatterns.length,
        );
      if (isTransitMode && !active.length && relay.hasMore()) {
        relay.loadMore(5);
        return;
      }
      let sortedEdges;
      if (!isTransitMode) {
        const withNetworks = stopsNearYou.nearest.edges.filter(edge => {
          return !!edge.node.place?.rentalNetwork?.networkId;
        });
        const filteredCityBikeEdges = withNetworks.filter(pattern => {
          return getDefaultNetworks(context.config).includes(
            pattern.node.place?.rentalNetwork.networkId,
          );
        });
        sortedEdges = filteredCityBikeEdges
          .slice()
          .sort(sortNearbyRentalStations(favouriteIds));
      } else {
        sortedEdges = active
          .slice()
          .sort(sortNearbyStops(favouriteIds, walkRoutingThreshold));
      }

      sortedEdges.unshift(
        ...prioritizedStopsNearYou.map(stop => {
          return {
            node: {
              distance: distance(position, stop),
              place: {
                ...stop,
              },
            },
          };
        }),
      );
      const stopsAndStations = handleStopsAndStations(sortedEdges);
      handleWalkRoutes(stopsAndStations);
      setSortedStopEdges(sortedEdges);
      updateRoutes(sortedEdges);
    }
    if (mode === 'FAVORITE') {
      handleWalkRoutes(handleStopsAndStations(stopsNearYou));
      setSortedStopEdges(stopsNearYou);
      updateRoutes(stopsNearYou);
    }
  }, [stopsNearYou, favouriteIds]);

  if (loading) {
    return <Loading />;
  }

  const leafletObjs =
    isTransitMode && Array.isArray(routeLines) ? [...routeLines] : [];
  if (uniqueRealtimeTopics.length > 0) {
    leafletObjs.push(
      <VehicleMarkerContainer
        key="vehicles"
        useLargeIcon
        mode={mode}
        topics={uniqueRealtimeTopics}
      />,
    );
  }
  if (walk.itinerary) {
    leafletObjs.push(
      <ItineraryLine
        key="itinerary"
        legs={walk.itinerary.legs}
        passive={false}
        showIntermediateStops={false}
        streetMode="walk"
      />,
    );
  }

  const hilightedStops = () => {
    const stopsAndStations = handleStopsAndStations(sortedStopEdges);
    if (Array.isArray(stopsAndStations) && stopsAndStations.length > 0) {
      return [
        stopsAndStations[0]?.gtfsId ||
          stopsAndStations[0]?.stationId ||
          stopsAndStations[0].node.place.gtfsId,
      ];
    }
    return [''];
  };

  // Marker for the search point.
  if (position.type !== 'CurrentLocation' && showWalkRoute) {
    leafletObjs.push(getLocationMarker(position));
  }

  const mapProps = {
    stopsToShow: mode === 'FAVORITE' ? Array.from(favouriteIds) : undefined,
    hilightedStops: hilightedStops(),
    mergeStops: false,
    bounds,
    leafletObjs,
    breakpoint,
    setMWTRef: setMWTRefNearYou,
    ...rest,
  };

  if (breakpoint === 'large') {
    return (
      <>
        {context.config.useCookiesPrompt && <CookieSettingsButton />}
        <MapWithTracking {...mapProps} />
      </>
    );
  }
  return (
    <>
      <BackButton
        icon="icon-icon_arrow-collapse--left"
        iconClassName="arrow-icon"
        color={context.config.colors.primary}
        fallback="back"
      />
      <MapWithTracking {...mapProps} />
    </>
  );
}

NearYouMap.propTypes = {
  stopsNearYou: PropTypes.shape({
    nearest: PropTypes.shape({
      // eslint-disable-next-line
      edges: PropTypes.arrayOf(PropTypes.object).isRequired,
    }).isRequired,
  }),
  prioritizedStopsNearYou: PropTypes.arrayOf(stopShape),
  // eslint-disable-next-line
  favouriteIds: PropTypes.object,
  position: locationShape.isRequired,
  match: matchShape.isRequired,
  breakpoint: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  relay: relayShape.isRequired,
  loading: PropTypes.bool,
  showWalkRoute: PropTypes.bool,
  setMWTRef: PropTypes.func,
};

NearYouMap.defaultProps = {
  stopsNearYou: null,
  showWalkRoute: false,
  loading: false,
  favouriteIds: undefined,
  setMWTRef: undefined,
  prioritizedStopsNearYou: [],
};

NearYouMap.contextTypes = {
  config: configShape,
  executeAction: PropTypes.func,
  getStore: PropTypes.func,
};

export default NearYouMap;
