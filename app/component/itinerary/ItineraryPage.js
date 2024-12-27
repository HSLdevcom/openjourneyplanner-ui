/* eslint-disable react/no-array-index-key */
/* eslint-disable no-nested-ternary */
import { matchShape, routerShape } from 'found';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import polyline from 'polyline-encoded';
import PropTypes from 'prop-types';
import React, { cloneElement, useEffect, useRef, useState } from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { fetchQuery } from 'react-relay';
import { saveFutureRoute } from '../../action/FutureRoutesActions';
import { saveSearch } from '../../action/SearchActions';
import { TransportMode } from '../../constants';
import { mapLayerShape } from '../../store/MapLayerStore';
import {
  clearLatestNavigatorItinerary,
  getDialogState,
  getLatestNavigatorItinerary,
  setDialogState,
  setLatestNavigatorItinerary,
} from '../../store/localStorage';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import { getWeatherData } from '../../util/apiUtils';
import { isIOS } from '../../util/browser';
import { boundWithMinimumArea } from '../../util/geo-utils';
import {
  getIntermediatePlaces,
  otpToLocation,
  parseLatLon,
} from '../../util/otpStrings';
import { getItineraryPagePath, streetHash } from '../../util/path';
import {
  PLANTYPE,
  getPlanParams,
  getSettings,
  planQueryNeeded,
} from '../../util/planParamUtil';
import {
  configShape,
  mapLayerOptionsShape,
  relayShape,
} from '../../util/shapes';
import { epochToTime } from '../../util/timeUtils';
import { getAllNetworksOfType } from '../../util/vehicleRentalUtils';
import DesktopView from '../DesktopView';
import Loading from '../Loading';
import MobileView from '../MobileView';
import ItineraryPageMap from '../map/ItineraryPageMap';
import AlternativeItineraryBar from './AlternativeItineraryBar';
import CustomizeSearch from './CustomizeSearch';
import { spinnerPosition } from './ItineraryList';
import ItineraryListContainer from './ItineraryListContainer';
import ItineraryPageControls from './ItineraryPageControls';
import {
  addBikeStationMapForRentalVehicleItineraries,
  addFeedbackly,
  checkDayNight,
  filterItinerariesByFeedId,
  filterWalk,
  getBounds,
  getRentalStationsToHideOnMap,
  getSelectedItineraryIndex,
  getTopics,
  isEqualItineraries,
  isStoredItineraryRelevant,
  mergeBikeTransitPlans,
  mergeCarDirectAndTransitPlans,
  mergeScooterTransitPlan,
  quitIteration,
  reportError,
  scooterEdges,
  setCurrentTimeToURL,
  settingsLimitRouting,
  stopClient,
  updateClient,
} from './ItineraryPageUtils';
import ItineraryTabs from './ItineraryTabs';
import planConnection from './PlanConnection';
import NaviContainer from './navigator/NaviContainer';
import NavigatorIntroModal from './navigator/navigatorintro/NavigatorIntroModal';

const MAX_QUERY_COUNT = 4; // number of attempts to collect enough itineraries

const streetHashes = [
  streetHash.walk,
  streetHash.bike,
  streetHash.bikeAndVehicle,
  streetHash.car,
  streetHash.carAndVehicle,
  streetHash.parkAndRide,
];
const altTransitHash = [
  streetHash.bikeAndVehicle,
  streetHash.carAndVehicle,
  streetHash.parkAndRide,
];
const noTransitHash = [streetHash.walk, streetHash.bike, streetHash.car];

const LOADSTATE = {
  UNSET: 'unset',
  LOADING: 'loading',
  DONE: 'done',
};

const showVehiclesThresholdMinutes = 720;

const emptyState = {
  earlierEdges: [],
  laterEdges: [],
  plan: {},
  separatorPosition: undefined,
  routingFeedbackPosition: undefined,
  error: undefined,
  topNote: undefined,
  bottomNote: undefined,
  loading: LOADSTATE.DONE,
  startCursor: undefined,
  endCursor: undefined,
};

const emptyPlan = { plan: {}, loading: LOADSTATE.DONE };
const unset = { plan: {}, loading: LOADSTATE.UNSET };

const noFocus = { center: undefined, zoom: undefined, bounds: undefined };

export default function ItineraryPage(props, context) {
  const headerRef = useRef(null);
  const mwtRef = useRef();
  const mobileRef = useRef();
  const ariaRef = useRef('summary-page.title');
  const mapLayerRef = useRef();
  const [state, setState] = useState({
    ...emptyState,
    loading: LOADSTATE.UNSET,
  });
  const [relaxState, setRelaxState] = useState(emptyPlan);
  const [relaxScooterState, setRelaxScooterState] = useState(emptyPlan);
  const [scooterState, setScooterState] = useState(unset);
  const [combinedState, setCombinedState] = useState(emptyPlan);
  const [isNavigatorIntroDismissed, setNavigatorIntroDismissed] = useState(
    getDialogState('navi-intro'),
  );

  const altStates = {
    [PLANTYPE.WALK]: useState(unset),
    [PLANTYPE.BIKE]: useState(unset),
    [PLANTYPE.CAR]: useState(unset),
    [PLANTYPE.BIKEPARK]: useState(unset),
    [PLANTYPE.BIKETRANSIT]: useState(unset),
    [PLANTYPE.PARKANDRIDE]: useState(unset),
    [PLANTYPE.CARTRANSIT]: useState(unset),
  };
  // combination of bikePark and bikeTransit
  const [bikePublicState, setBikePublicState] = useState({ plan: {} });
  // combination of direct car routing and cars with transit
  const [carPublicState, setCarPublicState] = useState({ plan: {} });

  const [settingsState, setSettingsState] = useState({
    settingsOpen: false,
    settingsChanged: 0,
  });
  const [weatherState, setWeatherState] = useState({ loading: false });
  const [topicsState, setTopicsState] = useState(null);
  const [mapState, setMapState] = useState({});
  const [naviMode, setNaviMode] = useState(false);
  const [storedItinerary, setStoredItinerary] = useState(
    getLatestNavigatorItinerary(),
  );

  const { config, router } = context;
  const { match, breakpoint } = props;
  const { params, location } = match;
  const { hash, secondHash } = params;
  const { query } = location;
  const detailView = altTransitHash.includes(hash) ? secondHash : hash;

  function altLoading() {
    return Object.values(altStates).some(
      st => st[0].loading === LOADSTATE.LOADING,
    );
  }

  function altLoadingDone() {
    return Object.values(altStates).every(
      st => st[0].loading === LOADSTATE.DONE,
    );
  }

  function stopClientAndUpdateTopics() {
    stopClient(context);
    setTopicsState(null);
  }

  const selectStreetMode = newStreetMode => {
    addAnalyticsEvent({
      category: 'Itinerary',
      action: 'OpenItineraryDetailsWithMode',
      name: newStreetMode,
    });
    const newLocationState = {
      ...location,
      state: { selectedItineraryIndex: 0 },
    };
    const basePath = getItineraryPagePath(params.from, params.to);
    let pagePath = basePath;
    if (newStreetMode) {
      pagePath = `${pagePath}/${newStreetMode}`;
    }
    newLocationState.pathname = basePath;
    router.replace(newLocationState);
    newLocationState.pathname = pagePath;
    router.push(newLocationState);
  };

  const resetItineraryPageSelection = () => {
    if (location.state?.selectedItineraryIndex) {
      router.replace({
        ...location,
        state: {
          ...location.state,
          selectedItineraryIndex: 0,
        },
      });
    }
  };

  function mapHashToPlan() {
    switch (hash) {
      case streetHash.walk:
        return altStates[PLANTYPE.WALK][0].plan;
      case streetHash.bike:
        return altStates[PLANTYPE.BIKE][0].plan;
      case streetHash.car:
        return altStates[PLANTYPE.CAR][0].plan;
      case streetHash.bikeAndVehicle:
        return bikePublicState.plan;
      case streetHash.carAndVehicle:
        return carPublicState.plan;
      case streetHash.parkAndRide:
        return altStates[PLANTYPE.PARKANDRIDE][0].plan;
      default:
        if (
          !filterWalk(combinedState.plan?.edges).length &&
          !settingsState.settingsChanged
        ) {
          // Note: plan and scooter plan are merged, but relaxed ones are not
          // Is this intended behavior ?
          if (relaxState.plan?.edges?.length > 0) {
            return relaxState.plan;
          }
          if (relaxScooterState.plan?.edges?.length > 0) {
            return relaxScooterState.plan;
          }
        }
        return combinedState.plan;
    }
  }

  function makeWeatherQuery() {
    const from = otpToLocation(params.from);
    const time = query.time ? query.time * 1000 : Date.now();
    setWeatherState({ ...weatherState, loading: true });
    const newState = { loading: false, weatherData: undefined };
    getWeatherData(config.URL.WEATHER_DATA, time, from.lat, from.lon)
      .then(res => {
        if (Array.isArray(res) && res.length === 3) {
          const temperature = Number(res[0].ParameterValue);
          const windSpeed = Number(res[1].ParameterValue);
          const iconIndex = parseInt(res[2].ParameterValue, 10);
          if (
            !Number.isNaN(temperature) &&
            !Number.isNaN(windSpeed) &&
            !Number.isNaN(iconIndex)
          ) {
            newState.weatherData = {
              temperature,
              windSpeed,
              // Icon spec: www.ilmatieteenlaitos.fi/latauspalvelun-pikaohje -> Sääsymbolien selitykset ennusteissa
              iconId: checkDayNight(iconIndex, time, from.lat, from.lon),
              time: epochToTime(time, config),
            };
          }
        }
        setWeatherState(newState);
      })
      .catch(() => {
        setWeatherState(newState);
      });
  }

  async function iterateQuery(planParams, reps) {
    let plan;
    const trials = reps || (planParams.modes.directOnly ? 1 : MAX_QUERY_COUNT);
    const arriveBy = !!planParams.datetime.latestArrival;
    const startTime = Date.now();
    for (let i = 0; i < trials; i++) {
      // eslint-disable-next-line no-await-in-loop
      const result = await fetchQuery(
        props.relayEnvironment,
        planConnection,
        planParams,
        {
          force: true,
        },
      ).toPromise();
      if (!plan) {
        plan = result.plan;
      } else if (arriveBy) {
        plan = {
          ...plan,
          pageInfo: {
            ...plan.pageInfo,
            startCursor: result.plan.pageInfo.startCursor,
          },
          edges: plan.edges.concat(result.plan.edges),
        };
      } else {
        plan = {
          ...plan,
          pageInfo: {
            ...plan.pageInfo,
            endCursor: result.plan.pageInfo.endCursor,
          },
          edges: plan.edges.concat(result.plan.edges),
        };
      }
      if (quitIteration(plan, result.plan, planParams, startTime)) {
        break;
      }
      if (arriveBy) {
        if (!plan.pageInfo.startCursor) {
          break;
        }
        planParams.before = plan.pageInfo.startCursor; // eslint-disable-line no-param-reassign
        planParams.last = planParams.numItineraries - plan.edges.length; // eslint-disable-line no-param-reassign
      } else {
        if (!plan.pageInfo.endCursor) {
          break;
        }
        planParams.after = plan.pageInfo.endCursor; // eslint-disable-line no-param-reassign
        planParams.first = planParams.numItineraries - plan.edges.length; // eslint-disable-line no-param-reassign
      }
    }
    return plan;
  }

  async function makeAltQuery(planType) {
    const altState = altStates[planType];
    if (!planQueryNeeded(config, match, planType)) {
      altState[1]({ plan: {}, loading: LOADSTATE.DONE });
      return;
    }
    altState[1]({ loading: LOADSTATE.LOADING });
    const planParams = getPlanParams(config, match, planType);
    try {
      const plan = await iterateQuery(planParams);
      altState[1]({ plan, loading: LOADSTATE.DONE });
    } catch (error) {
      altState[1]({ plan: {}, loading: LOADSTATE.DONE });
    }
  }

  async function makeRelaxedQuery() {
    if (!planQueryNeeded(config, match, PLANTYPE.TRANSIT, true)) {
      setRelaxState(emptyPlan);
      return;
    }
    setRelaxState({ loading: LOADSTATE.LOADING });
    const planParams = getPlanParams(config, match, PLANTYPE.TRANSIT, true);
    try {
      const plan = await iterateQuery(planParams);
      setRelaxState({ plan, loading: LOADSTATE.DONE });
    } catch (error) {
      setRelaxState(emptyPlan);
    }
  }

  async function makeMainQuery() {
    if (!planQueryNeeded(config, match, PLANTYPE.TRANSIT)) {
      setState(emptyState);
      return;
    }
    ariaRef.current = 'itinerary-page.loading-itineraries';
    setState({ ...emptyState, loading: LOADSTATE.LOADING });
    const planParams = getPlanParams(config, match, PLANTYPE.TRANSIT);
    try {
      const plan = await iterateQuery(planParams);
      setState({ ...emptyState, plan, loading: LOADSTATE.DONE });
      ariaRef.current = 'itinerary-page.itineraries-loaded';
    } catch (error) {
      reportError(error);
      setState(emptyPlan);
    }
  }

  async function makeScooterQuery() {
    if (!planQueryNeeded(config, match, PLANTYPE.SCOOTERTRANSIT)) {
      setScooterState(emptyPlan);
      return;
    }
    setScooterState({ loading: LOADSTATE.LOADING });

    const planParams = getPlanParams(
      config,
      match,
      PLANTYPE.SCOOTERTRANSIT,
      false, // no relaxed settings
    );

    try {
      const plan = await iterateQuery(planParams);
      setScooterState({ plan, loading: LOADSTATE.DONE });
    } catch (error) {
      reportError(error);
      setScooterState(emptyPlan);
    }
  }

  async function makeRelaxedScooterQuery() {
    if (!planQueryNeeded(config, match, PLANTYPE.SCOOTERTRANSIT, true)) {
      setRelaxScooterState(emptyPlan);
      return;
    }

    setRelaxScooterState({ loading: LOADSTATE.LOADING });
    const allScooterNetworks = getAllNetworksOfType(
      context.config,
      TransportMode.Scooter,
    );

    const planParams = getPlanParams(
      config,
      match,
      PLANTYPE.SCOOTERTRANSIT,
      true, // force relaxed settings
    );

    const tunedParams = {
      ...planParams,
      allowedRentalNetworks: allScooterNetworks,
    };
    try {
      const plan = await iterateQuery(tunedParams);
      const scooterPlan = { edges: scooterEdges(plan.edges) };
      setRelaxScooterState({ plan: scooterPlan, loading: LOADSTATE.DONE });
    } catch (error) {
      setRelaxScooterState(emptyPlan);
    }
  }

  const onLater = async () => {
    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'Itinerary',
      action: 'ShowLaterItineraries',
      name: null,
    });

    const relaxed =
      filterWalk(state.plan?.edges).length === 0 &&
      relaxState.plan?.edges?.length > 0;
    const origPlan = relaxed ? relaxState.plan : state.plan;

    const planParams = getPlanParams(config, match, PLANTYPE.TRANSIT, relaxed);
    const arriveBy = !!planParams.datetime.latestArrival;

    planParams.after = state.endCursor || origPlan.pageInfo.endCursor;
    if (!planParams.after) {
      const newState = arriveBy
        ? { topNote: 'no-more-route-msg' }
        : { bottomNote: 'no-more-route-msg' };
      setState({ ...state, ...newState, loadingMore: undefined });
      return;
    }
    planParams.transitOnly = true;

    setState({
      ...state,
      loadingMore: arriveBy ? spinnerPosition.top : spinnerPosition.bottom,
    });
    ariaRef.current = 'itinerary-page.loading-itineraries';

    let plan;
    try {
      plan = await iterateQuery(planParams, 1);
    } catch (error) {
      setState({ ...state, loadingMore: undefined });
      return;
    }
    const { edges } = plan;
    if (edges.length === 0) {
      const newState = arriveBy
        ? { topNote: 'no-more-route-msg' }
        : { bottomNote: 'no-more-route-msg' };
      setState({ ...state, ...newState, loadingMore: undefined });
      return;
    }
    ariaRef.current = 'itinerary-page.itineraries-loaded';

    const newState = {
      ...state,
      loadingMore: undefined,
      endCursor: plan.pageInfo.endCursor,
    };
    // place separators. First click sets feedback button to place
    // where user clicked before/after button. Further clicks above the itinerary list
    // set a separator line there and clicks below the list move feedback button down
    if (arriveBy) {
      // user clicked button above itinerary list
      const separators = state.routingFeedbackPosition
        ? {
            separatorPosition: edges.length,
            routingFeedbackPosition:
              state.routingFeedbackPosition + edges.length,
          }
        : { routingFeedbackPosition: edges.length };
      setState({
        ...newState,
        ...separators,
        earlierEdges: [...edges, ...state.earlierEdges],
      });
    } else {
      // user clicked button below itinerary list
      setState({
        ...newState,
        routingFeedbackPosition:
          origPlan.edges.length +
          state.earlierEdges.length +
          state.laterEdges.length,
        laterEdges: [...state.laterEdges, ...edges],
      });
    }
    if (arriveBy) {
      resetItineraryPageSelection();
    }
  };

  const onEarlier = async () => {
    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'Itinerary',
      action: 'ShowLaterItineraries',
      name: null,
    });

    const relaxed =
      filterWalk(state.plan?.edges).length === 0 &&
      relaxState.plan?.edges?.length > 0;
    const origPlan = relaxed ? relaxState.plan : state.plan;

    const planParams = getPlanParams(config, match, PLANTYPE.TRANSIT, relaxed);
    const arriveBy = !!planParams.datetime.latestArrival;

    planParams.before = state.startCursor || origPlan.pageInfo.startCursor;
    if (!planParams.before) {
      const newState = arriveBy
        ? { bottomNote: 'no-more-route-msg' }
        : { topNote: 'no-more-route-msg' };
      setState({ ...state, ...newState, loadingMore: undefined });
      return;
    }
    planParams.last = planParams.numItineraries;
    planParams.transitOnly = true;

    setState({
      ...state,
      loadingMore: arriveBy ? spinnerPosition.bottom : spinnerPosition.top,
    });
    ariaRef.current = 'itinerary-page.loading-itineraries';

    let plan;
    try {
      plan = await iterateQuery(planParams, 1);
    } catch (error) {
      setState({ ...state, loadingMore: undefined });
      return;
    }
    const { edges } = plan;
    if (edges.length === 0) {
      const newState = arriveBy
        ? { bottomNote: 'no-more-route-msg' }
        : { topNote: 'no-more-route-msg' };
      setState({ ...state, ...newState, loadingMore: undefined });
      return;
    }
    ariaRef.current = 'itinerary-page.itineraries-loaded';
    const newState = {
      ...state,
      loadingMore: undefined,
      startCursor: plan.pageInfo.startCursor,
    };
    if (arriveBy) {
      // user clicked button below itinerary list
      setState({
        ...newState,
        routingFeedbackPosition:
          origPlan.edges.length +
          state.earlierEdges.length +
          state.laterEdges.length,
        laterEdges: [...state.laterEdges, ...edges],
      });
    } else {
      // user clicked button above itinerary list
      const separators = state.routingFeedbackPosition
        ? {
            separatorPosition: edges.length,
            routingFeedbackPosition:
              state.routingFeedbackPosition + edges.length,
          }
        : { routingFeedbackPosition: edges.length };
      setState({
        ...newState,
        ...separators,
        earlierEdges: [...edges, ...state.earlierEdges],
      });
    }
    if (!arriveBy) {
      resetItineraryPageSelection();
    }
  };

  // make the map to obey external navigation
  function navigateMap() {
    // map sticks to user location if tracking is on, so set it off
    if (mwtRef.current?.disableMapTracking) {
      mwtRef.current.disableMapTracking();
    }
    // map will not react to location props unless they change or update is forced
    if (mwtRef.current?.forceRefresh) {
      mwtRef.current.forceRefresh();
    }
  }

  const getCombinedPlanEdges = () => {
    return [
      ...(state.earlierEdges || []),
      ...(mapHashToPlan()?.edges || []),
      ...(state.laterEdges || []),
    ];
  };

  const getItinerarySelection = () => {
    const hasNoTransitItineraries = filterWalk(state.plan?.edges).length === 0;
    const plan = mapHashToPlan();
    let combinedEdges;
    // Remove old itineraries if new query cannot find a route
    if (state.error) {
      combinedEdges = [];
    } else if (streetHashes.includes(hash)) {
      combinedEdges = plan?.edges || [];
    } else {
      combinedEdges = getCombinedPlanEdges();
      if (!hasNoTransitItineraries) {
        // don't show plain walking in transit itinerary list
        combinedEdges = filterWalk(combinedEdges);
      }
    }
    const selectedIndex = getSelectedItineraryIndex(location, combinedEdges);

    return { plan, combinedEdges, selectedIndex, hasNoTransitItineraries };
  };

  const setNavigation = isEnabled => {
    if (mobileRef.current) {
      mobileRef.current.setBottomSheet(isEnabled ? 'bottom' : 'middle');
    }
    if (!isEnabled) {
      setMapState(noFocus);
      navigateMap();
      clearLatestNavigatorItinerary();
    }
    setNaviMode(isEnabled);
  };

  const storeItineraryAndStartNavigation = itinerary => {
    setNavigation(true);
    const itineraryWithParams = {
      itinerary,
      params: {
        from: params.from,
        to: params.to,
        arriveBy: query.arriveBy,
        time: query.time,
        hash,
        secondHash,
      },
    };
    setLatestNavigatorItinerary(itineraryWithParams);
    setStoredItinerary(itineraryWithParams);
  };

  // save url-defined location to old searches
  function saveUrlSearch(endpoint) {
    const parts = endpoint.split('::'); // label::lat,lon
    if (parts.length !== 2) {
      return;
    }
    const label = parts[0];
    const ll = parseLatLon(parts[1]);
    const names = label.split(','); // addr or name, city
    if (names.length < 2 || Number.isNaN(ll.lat) || Number.isNaN(ll.lon)) {
      return;
    }
    const layer =
      /\d/.test(names[0]) && names[0].indexOf(' ') >= 0 ? 'address' : 'venue';

    context.executeAction(saveSearch, {
      item: {
        geometry: { coordinates: [ll.lon, ll.lat] },
        properties: {
          name: names[0],
          id: label,
          gid: label,
          layer,
          label,
          localadmin: names[names.length - 1],
        },
        type: 'Feature',
      },
      type: 'endpoint',
    });
  }

  function updateLocalStorage(saveEndpoints) {
    const pathArray = decodeURIComponent(location.pathname)
      .substring(1)
      .split('/');
    // endpoints to oldSearches store
    if (saveEndpoints && isIOS && query.save) {
      if (query.save === '1' || query.save === '2') {
        saveUrlSearch(pathArray[1]); // origin
      }
      if (query.save === '1' || query.save === '3') {
        saveUrlSearch(pathArray[2]); // destination
      }
      const newLocation = { ...location };
      delete newLocation.query.save;
      router.replace(newLocation);
    }
    // update future routes, too
    const originArray = pathArray[1].split('::');
    const destinationArray = pathArray[2].split('::');
    // make sure endpoints are valid locations and time is defined
    if (!query.time || originArray.length < 2 || destinationArray.length < 2) {
      return;
    }
    const itinerarySearch = {
      origin: {
        address: originArray[0],
        ...parseLatLon(originArray[1]),
      },
      destination: {
        address: destinationArray[0],
        ...parseLatLon(destinationArray[1]),
      },
      query,
    };
    context.executeAction(saveFutureRoute, itinerarySearch);
  }

  function showVehicles() {
    const now = Date.now() / 1000;
    const startTime = query.time;
    const diff = Math.abs((now - startTime) / 60);

    // Vehicles are typically not shown if they are not in transit. But for some quirk in mqtt, if you
    // search for a route for example tomorrow, real time vehicle would be shown.
    const inRange = diff <= showVehiclesThresholdMinutes;

    return !!(
      inRange &&
      config.showVehiclesOnItineraryPage &&
      !noTransitHash.includes(hash) &&
      (breakpoint === 'large' || hash)
    );
  }

  useEffect(() => {
    setCurrentTimeToURL(config, match);
    updateLocalStorage(true);
    addFeedbackly(context);

    if (isStoredItineraryRelevant(storedItinerary, match)) {
      setNavigation(true);
    } else {
      clearLatestNavigatorItinerary();
    }

    return () => {
      if (showVehicles()) {
        stopClient(context);
      }
    };
  }, []);

  useEffect(() => {
    setCombinedState({ ...emptyState, loading: LOADSTATE.LOADING });
    makeScooterQuery();
    makeMainQuery();
    Object.keys(altStates).forEach(key => makeAltQuery(key));

    // note: relaxed scooter query is not made unless some modes are disabled
    // so, if no itineraries are found with standard settings, scooter is not suggested
    // maybe it should be?
    if (settingsLimitRouting(config) && !settingsState.settingsChanged) {
      makeRelaxedQuery();
      makeRelaxedScooterQuery();
    }
  }, [
    settingsState.settingsChanged,
    params.from,
    params.to,
    query.time,
    query.arriveBy,
    query.intermediatePlaces,
  ]);

  useEffect(() => {
    navigateMap();
    setMapState(noFocus);

    if (detailView) {
      // If itinerary is not found in detail view, go back to summary view
      if (altLoadingDone() && !mapHashToPlan()?.edges?.length) {
        selectStreetMode(); // back to root view
      }
    } else if (naviMode) {
      // turn off tracking when user navigates away from tracking view
      setNavigation(false);
    }
    setTimeout(() => mwtRef.current?.map?.updateZoom(), 1);
  }, [hash, secondHash]);

  useEffect(() => {
    // update stored future searches
    updateLocalStorage(false);
  }, [location.pathname, query]);

  useEffect(() => {
    // vehicles on map
    if (showVehicles()) {
      const { combinedEdges, selectedIndex } = getItinerarySelection();
      const selected = combinedEdges.length
        ? combinedEdges[selectedIndex]
        : null;

      const itineraryTopics = getTopics(selected?.node.legs, config);
      const { client } = context.getStore('RealTimeInformationStore');
      // Client may not be initialized yet if there was an client before ComponentDidMount
      if (!naviMode && (!isEqual(itineraryTopics, topicsState) || !client)) {
        updateClient(itineraryTopics, context);
      }
      if (!isEqual(itineraryTopics, topicsState) && !naviMode) {
        // eslint-disable-next-line react/no-did-update-set-state
        setTopicsState(itineraryTopics);
      }
    } else if (!isEmpty(topicsState)) {
      stopClientAndUpdateTopics();
    }
  }, [
    hash,
    combinedState.plan,
    relaxState.plan,
    bikePublicState.plan,
    carPublicState.plan,
    altStates[PLANTYPE.PARKANDRIDE][0].plan,
    location.state?.selectedItineraryIndex,
    relaxScooterState.plan,
    naviMode,
  ]);

  useEffect(() => {
    if (config.showWeatherInformation) {
      makeWeatherQuery();
    }
  }, [params.from, query.time]);

  // merge two separate bike + transit plans into one
  useEffect(() => {
    if (
      altStates[PLANTYPE.BIKEPARK][0].loading === LOADSTATE.DONE &&
      altStates[PLANTYPE.BIKETRANSIT][0].loading === LOADSTATE.DONE
    ) {
      const plan = mergeBikeTransitPlans(
        altStates[PLANTYPE.BIKEPARK][0].plan,
        altStates[PLANTYPE.BIKETRANSIT][0].plan,
      );
      setBikePublicState({ plan });
    }
  }, [
    altStates[PLANTYPE.BIKEPARK][0].plan,
    altStates[PLANTYPE.BIKETRANSIT][0].plan,
  ]);

  // merge direct car and car transit plans into one
  useEffect(() => {
    const settings = getSettings(config);
    if (
      altStates[PLANTYPE.CAR][0].loading === LOADSTATE.DONE &&
      altStates[PLANTYPE.CARTRANSIT][0].loading === LOADSTATE.DONE &&
      settings.includeCarSuggestions &&
      config.carBoardingModes !== undefined
    ) {
      const plan = mergeCarDirectAndTransitPlans(
        altStates[PLANTYPE.CAR][0].plan,
        altStates[PLANTYPE.CARTRANSIT][0].plan,
      );
      setCarPublicState({ plan });
    }
  }, [altStates[PLANTYPE.CAR][0].plan, altStates[PLANTYPE.CARTRANSIT][0].plan]);

  // merge the main plan and the scooter plan into one
  useEffect(() => {
    if (
      state.loading === LOADSTATE.DONE &&
      scooterState.loading === LOADSTATE.DONE
    ) {
      const plan = mergeScooterTransitPlan(
        scooterState.plan,
        state.plan,
        config.vehicleRental.allowDirectScooterJourneys,
      );
      setCombinedState({ plan, loading: LOADSTATE.DONE });
      resetItineraryPageSelection();
    }
  }, [scooterState.plan, state.plan]);

  const setMWTRef = ref => {
    mwtRef.current = ref;
  };

  const focusToPoint = (lat, lon) => {
    if (mobileRef.current) {
      mobileRef.current.setBottomSheet('bottom');
    }
    navigateMap();
    setMapState({ center: { lat, lon }, zoom: 18, bounds: null });
  };

  const focusToLeg = leg => {
    if (mobileRef.current) {
      mobileRef.current.setBottomSheet('bottom');
    }
    navigateMap();
    const bounds = boundWithMinimumArea(
      []
        .concat(
          [
            [leg.from.lat, leg.from.lon],
            [leg.to.lat, leg.to.lon],
          ],
          polyline.decode(leg.legGeometry.points),
        )
        .filter(a => a[0] && a[1]),
    );
    setMapState({ bounds, center: undefined, zoom: undefined });
    setTimeout(() => mwtRef.current?.map?.updateZoom(), 1);
  };

  const changeHash = index => {
    const subPath = altTransitHash.includes(hash) ? `/${hash}` : '';

    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'Itinerary',
      action: 'OpenItineraryDetails',
      name: index,
    });

    const newLocationState = {
      ...location,
      state: { selectedItineraryIndex: index },
    };
    const pagePath = `${getItineraryPagePath(
      params.from,
      params.to,
    )}${subPath}/${index}`;

    newLocationState.pathname = pagePath;
    router.replace(newLocationState);
  };

  const showSettingsPanel = (open, changeScooterSettings) => {
    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'ItinerarySettings',
      action: 'ExtraSettingsPanelClick',
      name: open ? 'ExtraSettingsPanelOpen' : 'ExtraSettingsPanelClose',
    });

    if (open) {
      setSettingsState({
        ...settingsState,
        settingsOpen: true,
        settingsOnOpen: getSettings(config),
        changeScooterSettings,
      });
      if (breakpoint !== 'large') {
        router.push({
          ...location,
          state: {
            ...location.state,
            itinerarySettingsOpen: true,
          },
        });
      }
      return;
    }
    if (
      settingsState.changeScooterSettings &&
      settingsState.settingsOnOpen.scooterNetworks.length <
        getSettings(config).scooterNetworks.length
    ) {
      addAnalyticsEvent({
        category: 'ItinerarySettings',
        action: 'SettingsEnableScooterNetwork',
        name: 'AfterOnlyScooterRoutesFound',
      });
    }

    const settingsChanged = !isEqual(
      settingsState.settingsOnOpen,
      getSettings(config),
    )
      ? settingsState.settingsChanged + 1
      : settingsState.settingsChanged;
    setSettingsState({
      ...settingsState,
      settingsOpen: false,
      settingsChanged,
      changeScooterSettings: false,
    });

    if (settingsChanged && detailView) {
      // Ensures returning to the list view after changing the settings in detail view.
      selectStreetMode();
    }

    if (breakpoint !== 'large') {
      router.go(-1);
    }
  };

  const toggleSettings = () => {
    showSettingsPanel(!settingsState.settingsOpen);
  };

  const focusToHeader = () => {
    setTimeout(() => {
      if (headerRef.current) {
        headerRef.current.focus();
      }
    }, 500);
  };

  function renderMap(from, to, viaPoints, planEdges, activeIndex) {
    const mwtProps = {};
    if (mapState.bounds) {
      mwtProps.bounds = mapState.bounds;
    } else if (mapState.center) {
      mwtProps.lat = mapState.center.lat;
      mwtProps.lon = mapState.center.lon;
      mwtProps.zoom = mapState.zoom;
    } else {
      mwtProps.bounds = getBounds(planEdges, from, to, viaPoints);
    }

    const itineraryContainsDepartureFromVehicleRentalStation = planEdges?.[
      activeIndex
    ]?.node.legs.some(leg => leg.from.vehicleRentalStation);

    const mapLayerOptions = itineraryContainsDepartureFromVehicleRentalStation
      ? addBikeStationMapForRentalVehicleItineraries(planEdges)
      : props.mapLayerOptions;

    const objectsToHide = getRentalStationsToHideOnMap(
      itineraryContainsDepartureFromVehicleRentalStation,
      planEdges?.[activeIndex]?.node,
    );

    const explicitItinerary =
      !!detailView && naviMode && !!storedItinerary.itinerary
        ? storedItinerary.itinerary
        : undefined;

    return (
      <ItineraryPageMap
        {...mwtProps}
        from={from}
        to={to}
        viaPoints={viaPoints}
        mapLayers={props.mapLayers}
        mapLayerOptions={mapLayerOptions}
        setMWTRef={setMWTRef}
        mapLayerRef={mapLayerRef}
        breakpoint={breakpoint}
        planEdges={planEdges}
        topics={topicsState}
        active={activeIndex}
        showActiveOnly={!!detailView}
        showVehicles={showVehicles()}
        showDurationBubble={planEdges?.[0]?.node.legs?.length === 1}
        objectsToHide={objectsToHide}
        itinerary={explicitItinerary}
        showBackButton={!naviMode}
        isLocationPopupEnabled={!naviMode}
      />
    );
  }

  const itinerarySelection = getItinerarySelection();
  const { combinedEdges, selectedIndex, hasNoTransitItineraries } =
    itinerarySelection;
  let { plan } = itinerarySelection;

  const toggleNavigatorIntro = () => {
    setDialogState('navi-intro');
    setNavigatorIntroDismissed(true);
  };

  const cancelNavigatorUsage = () => {
    setNavigation(false);
  };

  const walkPlan = altStates[PLANTYPE.WALK][0].plan;
  const bikePlan = altStates[PLANTYPE.BIKE][0].plan;
  const carPlan = altStates[PLANTYPE.CAR][0].plan;
  const parkRidePlan = altStates[PLANTYPE.PARKANDRIDE][0].plan;
  const bikePublicPlan = bikePublicState.plan;
  const carPublicPlan = carPublicState.plan;

  const settings = getSettings(config);

  const showRelaxedPlanNotifier = plan === relaxState.plan;
  const showRentalVehicleNotifier = plan === relaxScooterState.plan;
  /* NOTE: as a temporary solution, do filtering by feedId in UI */
  if (config.feedIdFiltering && plan) {
    plan = filterItinerariesByFeedId(plan, config);
  }

  const from = otpToLocation(params.from);
  const to = otpToLocation(params.to);
  const viaPoints = getIntermediatePlaces(query);

  const hasItineraries = combinedEdges.length > 0;
  if (hasItineraries && match.routes.some(route => route.printPage)) {
    return cloneElement(props.content, {
      itinerary: combinedEdges[selectedIndex],
      focusToPoint,
      from,
      to,
    });
  }

  const searchTime = plan?.searchDateTime
    ? Date.parse(plan.searchDateTime)
    : query.time
      ? query.time * 1000
      : Date.now();

  // no map on mobile summary view
  const map =
    !detailView && breakpoint !== 'large'
      ? null
      : renderMap(
          from,
          to,
          viaPoints,
          combinedEdges,
          selectedIndex,
          detailView,
        );

  const desktop = breakpoint === 'large';
  // must wait alternatives to render correct notifier
  const loadingAlt = altLoading();
  const waitAlternatives = hasNoTransitItineraries && loadingAlt;
  const loading =
    combinedState.loading === LOADSTATE.LOADING ||
    (relaxState.loading === LOADSTATE.LOADING && hasNoTransitItineraries) ||
    (relaxScooterState.loading === LOADSTATE.LOADING &&
      hasNoTransitItineraries) ||
    waitAlternatives ||
    (streetHashes.includes(hash) && loadingAlt); // viewing unfinished alt plan

  const settingsDrawer = settingsState.settingsOpen ? (
    <div className={desktop ? 'offcanvas' : 'offcanvas-mobile'}>
      <CustomizeSearch onToggleClick={toggleSettings} mobile={!desktop} />
    </div>
  ) : null;

  // in mobile, settings drawer hides other content
  const panelHidden = !desktop && settingsDrawer !== null;
  let content; // bottom content of itinerary panel

  if (panelHidden) {
    content = null;
  } else if (loading) {
    content = (
      <div style={{ position: 'relative', height: 200 }}>
        <Loading />
      </div>
    );
  } else if (detailView) {
    if (naviMode) {
      const itineraryForNavigator =
        storedItinerary.itinerary || combinedEdges[selectedIndex]?.node;

      content = (
        <>
          {!isNavigatorIntroDismissed && (
            <NavigatorIntroModal
              isOpen
              onPrimaryClick={toggleNavigatorIntro}
              onClose={cancelNavigatorUsage}
            />
          )}
          <NaviContainer
            legs={itineraryForNavigator.legs}
            focusToLeg={focusToLeg}
            relayEnvironment={props.relayEnvironment}
            setNavigation={setNavigation}
            mapRef={mwtRef.current}
            mapLayerRef={mapLayerRef}
            isNavigatorIntroDismissed={isNavigatorIntroDismissed}
          />
        </>
      );
    } else {
      let carEmissions = carPlan?.edges?.[0]?.node.emissionsPerPerson?.co2;
      const pastSearch =
        Date.parse(combinedEdges[selectedIndex]?.node.end) < Date.now();
      const navigateHook =
        !desktop && config.experimental?.navigation && !pastSearch
          ? () =>
              storeItineraryAndStartNavigation(
                combinedEdges[selectedIndex]?.node,
              )
          : undefined;
      carEmissions = carEmissions ? Math.round(carEmissions) : undefined;
      content = (
        <ItineraryTabs
          isMobile={!desktop}
          tabIndex={selectedIndex}
          changeHash={changeHash}
          plan={plan}
          planEdges={combinedEdges}
          focusToPoint={focusToPoint}
          focusToLeg={focusToLeg}
          carEmissions={carEmissions}
          bikePublicItineraryCount={bikePublicPlan.bikePublicItineraryCount}
          carPublicItineraryCount={carPublicPlan.carPublicItineraryCount}
          openSettings={showSettingsPanel}
          relayEnvironment={props.relayEnvironment}
          startNavigation={navigateHook}
        />
      );
    }
  } else {
    if (state.loading === LOADSTATE.UNSET) {
      return null; // do not render 'no itineraries' before searches
    }
    const settingsNotification =
      !showRelaxedPlanNotifier && // show only on notifier about limitations
      settingsLimitRouting(config) &&
      !isEqualItineraries(state.plan?.edges, relaxState.plan?.edges) &&
      relaxState.plan?.edges?.length > 0 &&
      !settingsState.settingsChanged &&
      !hash; // no notifier on p&r or bike&public lists

    content = (
      <ItineraryListContainer
        activeIndex={selectedIndex}
        planEdges={combinedEdges}
        params={params}
        bikeParkItineraryCount={bikePublicPlan.bikeParkItineraryCount}
        carDirectItineraryCount={carPublicPlan.carDirectItineraryCount}
        showRelaxedPlanNotifier={showRelaxedPlanNotifier}
        showRentalVehicleNotifier={showRentalVehicleNotifier}
        separatorPosition={hash ? undefined : state.separatorPosition}
        onLater={onLater}
        onEarlier={onEarlier}
        focusToHeader={focusToHeader}
        loading={loading}
        loadingMore={state.loadingMore}
        settingsNotification={settingsNotification}
        routingFeedbackPosition={
          hash ? undefined : state.routingFeedbackPosition
        }
        topNote={state.topNote}
        bottomNote={state.bottomNote}
        searchTime={searchTime}
        routingErrors={plan?.routingErrors}
        from={from}
        to={to}
        error={state.error}
        walking={walkPlan?.edges?.length > 0}
        biking={bikePlan?.edges?.length > 0 || !!bikePublicPlan?.edges?.length}
        driving={
          (settings.includeCarSuggestions && carPlan?.edges?.length > 0) ||
          !!carPublicPlan?.edges?.length ||
          !!parkRidePlan?.edges?.length
        }
      />
    );
  }

  const showCarPublicPlan = carPublicPlan.carPublicItineraryCount > 0;

  const showAltBar =
    !detailView &&
    !panelHidden &&
    !streetHashes.includes(hash) &&
    (loadingAlt || // show shimmer
      walkPlan?.edges?.length ||
      bikePlan?.edges?.length ||
      bikePublicPlan?.edges?.length ||
      parkRidePlan?.edges?.length ||
      (settings.includeCarSuggestions && carPlan?.edges?.length) ||
      carPublicPlan?.edges?.length);

  const alternativeItineraryBar = showAltBar ? (
    <AlternativeItineraryBar
      selectStreetMode={selectStreetMode}
      weatherData={weatherState.weatherData}
      walkPlan={walkPlan}
      bikePlan={bikePlan}
      bikePublicPlan={bikePublicPlan}
      parkRidePlan={parkRidePlan}
      carPlan={
        settings.includeCarSuggestions && !showCarPublicPlan
          ? carPlan
          : undefined
      }
      carPublicPlan={showCarPublicPlan ? carPublicPlan : undefined}
      loading={loading || loadingAlt || weatherState.loading}
    />
  ) : null;

  const header = !detailView && !panelHidden && (
    <>
      <div role="status" className="sr-only" id="status" aria-live="polite">
        <FormattedMessage id={ariaRef.current} />
      </div>
      <ItineraryPageControls params={params} toggleSettings={toggleSettings} />
      {alternativeItineraryBar}
    </>
  );

  if (desktop) {
    const title = (
      <span ref={headerRef} tabIndex={-1}>
        <FormattedMessage
          id={detailView ? 'itinerary-page.title' : 'summary-page.title'}
          defaultMessage="Itinerary suggestions"
        />
      </span>
    );
    // in detail view or parkride and bike+public, back button should pop out last path segment
    const bckBtnFallback =
      detailView || altTransitHash.includes(hash) ? 'pop' : undefined;

    return (
      <DesktopView
        title={title}
        header={header}
        bckBtnFallback={bckBtnFallback}
        content={content}
        settingsDrawer={settingsDrawer}
        map={map}
        scrollable
      />
    );
  }

  return (
    <MobileView
      header={header}
      content={content}
      settingsDrawer={settingsDrawer}
      map={map}
      mapRef={mwtRef.current}
      ref={mobileRef}
      match={match}
    />
  );
}

ItineraryPage.contextTypes = {
  config: configShape,
  executeAction: PropTypes.func.isRequired,
  headers: PropTypes.objectOf(PropTypes.string),
  getStore: PropTypes.func,
  router: routerShape.isRequired,
  match: matchShape.isRequired,
  intl: intlShape.isRequired,
};

ItineraryPage.propTypes = {
  match: matchShape.isRequired,
  content: PropTypes.node,
  map: PropTypes.shape({ type: PropTypes.func.isRequired }),
  breakpoint: PropTypes.string.isRequired,
  relayEnvironment: relayShape.isRequired,
  mapLayers: mapLayerShape.isRequired,
  mapLayerOptions: mapLayerOptionsShape.isRequired,
};

ItineraryPage.defaultProps = {
  content: undefined,
  map: undefined,
};
