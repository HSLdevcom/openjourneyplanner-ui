import moment from 'moment';
import isEqual from 'lodash/isEqual';
import { getTransitModes, isTransportModeAvailable } from './modeUtils';
import { otpToLocation, getIntermediatePlaces } from './otpStrings';
import { getAllNetworksOfType, getDefaultNetworks } from './vehicleRentalUtils';
import { getCustomizedSettings } from '../store/localStorage';
import { estimateItineraryDistance } from './geo-utils';
import { TransportMode } from '../constants';

export const PLANTYPE = {
  WALK: 'WALK',
  BIKE: 'BICYCLE',
  CAR: 'CAR',
  CARTRANSIT: 'CARTRANSIT',
  TRANSIT: 'TRANSIT',
  BIKEPARK: 'BIKEPARK',
  BIKETRANSIT: 'BIKETRANSIT',
  PARKANDRIDE: 'PARKANDRIDE',
  SCOOTERTRANSIT: 'SCOOTERTRANSIT',
};

const directModes = [PLANTYPE.WALK, PLANTYPE.BIKE, PLANTYPE.CAR];
const SHORT_TRIP_METERS = 2000;

/**
 * Find an option nearest to the value
 *
 * @param value a number
 * @param options array of numbers
 * @returns on option from options that is closest to the provided value
 */
export function findNearestOption(value, options) {
  let currNearest = options[0];
  let diff = Math.abs(value - currNearest);
  for (let i = 0; i < options.length; i++) {
    const newdiff = Math.abs(value - options[i]);
    if (newdiff < diff) {
      diff = newdiff;
      currNearest = options[i];
    }
  }
  return currNearest;
}

/**
 * Retrieves the default settings from the configuration.
 *
 * @param {*} config UI configuration
 */
export function getDefaultSettings(config) {
  if (!config) {
    return {};
  }

  return {
    ...config.defaultSettings,
    modes: getTransitModes(config),
    allowedBikeRentalNetworks: config.transportModes?.citybike?.defaultValue
      ? getDefaultNetworks(config)
      : [],
    scooterNetworks: [],
  };
}

/**
 * Retrieves the current (customized) settings kept in local store
 * Missing setting gets a default value
 * @param {*} config the configuration for the software installation
 */
export function getSettings(config) {
  const defaultSettings = getDefaultSettings(config);
  const userSettings = getCustomizedSettings();
  const allNetworks = getDefaultNetworks(config);
  const allScooterNetworks = getAllNetworksOfType(
    config,
    TransportMode.Scooter,
  );

  // const allScooterNetworks = getAllScooterNetworks(config);
  const settings = {
    ...defaultSettings,
    ...userSettings,
    modes: userSettings?.modes // filter modes to configured allowed values
      ? [
          ...userSettings.modes.filter(mode =>
            isTransportModeAvailable(config, mode),
          ),
        ].sort()
      : defaultSettings.modes,
    // filter networks to configured allowed values
    allowedBikeRentalNetworks:
      userSettings.allowedBikeRentalNetworks?.length > 0
        ? userSettings.allowedBikeRentalNetworks.filter(network =>
            allNetworks.includes(network),
          )
        : defaultSettings.allowedBikeRentalNetworks,
    scooterNetworks:
      userSettings.scooterNetworks?.length > 0
        ? userSettings.scooterNetworks.filter(network =>
            allScooterNetworks.includes(network),
          )
        : defaultSettings.scooterNetworks,
  };
  const { defaultOptions } = config;
  return {
    ...settings,
    walkSpeed: findNearestOption(settings.walkSpeed, defaultOptions.walkSpeed),
    bikeSpeed: findNearestOption(settings.bikeSpeed, defaultOptions.bikeSpeed),
  };
}

function filterTransitModes(modes, planType, config) {
  if (planType === PLANTYPE.BIKETRANSIT) {
    if (config.bikeBoardingModes) {
      return modes.filter(m => config.bikeBoardingModes[m]);
    }
    return [];
  }
  if (planType === PLANTYPE.CARTRANSIT) {
    if (config.carBoardingModes) {
      return modes.filter(m => config.carBoardingModes[m]);
    }
    return [];
  }
  return modes;
}

export function planQueryNeeded(
  config,
  {
    params: { from, to },
    location: {
      query: { intermediatePlaces, arriveBy, time },
    },
  },
  planType,
  relaxSettings,
) {
  if (!from || !to || from === '-' || to === '-') {
    return false;
  }
  const fromLocation = otpToLocation(from);
  const toLocation = otpToLocation(to);
  const intermediateLocations = getIntermediatePlaces({
    intermediatePlaces,
  });

  // not needed if origin is destination an no via points
  if (isEqual(fromLocation, toLocation) && !intermediateLocations.length) {
    return false;
  }

  const defaultSettings = getDefaultSettings(config);
  const settings = getSettings(config);
  const transitModes = filterTransitModes(
    relaxSettings ? defaultSettings.modes : settings.modes,
    planType,
    config,
  );
  const wheelchair = !!settings.accessibilityOption;
  const distance = estimateItineraryDistance(
    fromLocation,
    toLocation,
    intermediateLocations,
  );

  switch (planType) {
    case PLANTYPE.WALK:
      return (
        !wheelchair &&
        distance < config.suggestWalkMaxDistance &&
        !config.hideWalkOption
      );

    case PLANTYPE.BIKE:
      return (
        !wheelchair &&
        distance < config.suggestBikeMaxDistance &&
        settings.includeBikeSuggestions
      );

    case PLANTYPE.CAR:
      return (
        config.showCO2InItinerarySummary ||
        (distance > config.suggestCarMinDistance &&
          settings.includeCarSuggestions)
      );

    case PLANTYPE.BIKEPARK:
      return (
        transitModes.length > 0 &&
        !wheelchair &&
        config.showBikeAndParkItineraries &&
        (config.includePublicWithBikePlan
          ? settings.includeBikeSuggestions
          : settings.showBikeAndParkItineraries)
      );

    case PLANTYPE.BIKETRANSIT:
      return (
        transitModes.length > 0 &&
        !wheelchair &&
        settings.includeBikeSuggestions
      );

    case PLANTYPE.CARTRANSIT:
      return transitModes.length > 0 && settings.includeCarSuggestions;

    case PLANTYPE.SCOOTERTRANSIT:
      /* special logic: relaxed scooter query is made only if no networks allowed */
      /* special logic: scooter queries are not made if the search is n minutes or more into the future or if arrival time is too late */
      return (
        config.transportModes.scooter.availableForSelection &&
        transitModes.length > 0 &&
        !wheelchair &&
        (relaxSettings
          ? settings.scooterNetworks.length === 0
          : settings.scooterNetworks.length > 0) &&
        ((!arriveBy &&
          (time - Date.now() / 1000) / 60 <
            config.vehicleRental.maxMinutesToRentalJourneyStart) ||
          (arriveBy &&
            (time - Date.now() / 1000) / 60 <
              config.vehicleRental.maxMinutesToRentalJourneyEnd))
      );
    case PLANTYPE.PARKANDRIDE:
      return (
        transitModes.length > 0 &&
        distance > config.suggestCarMinDistance &&
        settings.includeParkAndRideSuggestions
      );

    case PLANTYPE.TRANSIT:
    default:
      return true;
  }
}

function getLocation(str) {
  const loc = otpToLocation(str);
  if (loc.gtfsId) {
    return {
      location: {
        stopLocation: { stopLocationId: loc.gtfsId },
      },
    };
  }
  return {
    location: {
      coordinate: {
        latitude: loc.lat,
        longitude: loc.lon,
      },
    },
    label: loc.address,
  };
}

export function getPlanParams(
  config,
  {
    params: { from, to },
    location: {
      query: { arriveBy, time, intermediatePlaces },
    },
  },
  planType,
  relaxSettings,
  // forceScooters = false,
) {
  const fromPlace = getLocation(from);
  const toPlace = getLocation(to);
  const useLatestArrival = arriveBy === 'true';
  // estimate distance for search iteration heuristics
  const fromLocation = otpToLocation(from);
  const toLocation = otpToLocation(to);
  const intermediateLocations = getIntermediatePlaces({
    intermediatePlaces,
  });
  const via = intermediateLocations.map(loc => ({
    passThrough: {
      stopLocationIds: [loc.gtfsId],
    },
  }));
  const distance = estimateItineraryDistance(
    fromLocation,
    toLocation,
    intermediateLocations,
  );
  const shortTrip = distance < SHORT_TRIP_METERS;

  const defaultSettings = getDefaultSettings(config);
  const settings = getSettings(config);

  if (settings.allowedBikeRentalNetworks.length === 0) {
    settings.allowedBikeRentalNetworks = null;
  }

  const transitModes = filterTransitModes(
    relaxSettings ? defaultSettings.modes : settings.modes,
    planType,
    config,
  );

  let otpModes = transitModes.map(mode => {
    return { mode };
  });
  if (config.customWeights) {
    otpModes.forEach(m => {
      if (config.customWeights[m.mode]) {
        // eslint-disable-next-line
        m.cost = { reluctance: config.customWeights[m.mode] };
      }
    });
  }
  const directOnly = directModes.includes(planType) || otpModes.length === 0;
  let transitOnly = !!relaxSettings;
  const wheelchair = !!settings.accessibilityOption;
  const cityBike =
    !wheelchair && settings.allowedBikeRentalNetworks?.length > 0;
  // set defaults
  let access = cityBike ? ['WALK', 'BICYCLE_RENTAL'] : ['WALK'];
  let egress = access;
  let transfer = ['WALK'];
  let direct = null;

  let noIterationsForShortTrips = false;

  switch (planType) {
    case PLANTYPE.BIKEPARK:
      access = ['BICYCLE_PARKING'];
      transitOnly = true;
      noIterationsForShortTrips = shortTrip;
      break;
    case PLANTYPE.BIKETRANSIT:
      access = ['BICYCLE'];
      egress = ['BICYCLE'];
      transfer = ['BICYCLE'];
      transitOnly = true;
      noIterationsForShortTrips = shortTrip;
      break;
    case PLANTYPE.CARTRANSIT:
      access = ['CAR'];
      egress = ['CAR'];
      transfer = ['CAR'];
      transitOnly = true;
      // This is done to enable more cache hits. New cache entries are generated for different speeds otherwise.
      settings.walkSpeed = null;
      settings.bikeSpeed = null;
      settings.walkReluctance = null;
      settings.bikeReluctance = null;
      break;
    case PLANTYPE.PARKANDRIDE:
      access = ['CAR_PARKING'];
      transitOnly = true;
      break;
    case PLANTYPE.TRANSIT:
      direct = access;
      break;
    case PLANTYPE.SCOOTERTRANSIT:
      access = ['WALK', 'SCOOTER_RENTAL'];
      egress = access;
      direct = access;
      break;
    default: // direct modes
      direct = [planType];
      break;
  }
  // reset unused arrays
  if (directOnly) {
    access = null;
    egress = null;
    transfer = null;
    otpModes = [];
  }
  if (!access?.includes('BICYCLE_RENTAL')) {
    settings.allowedBikeRentalNetworks = null;
  }
  if (!access?.includes('SCOOTER_RENTAL')) {
    settings.scooterNetworks = null;
  }

  const modes = {
    directOnly,
    transitOnly,
    direct,
    transit: {
      access,
      transfer,
      egress,
      transit: otpModes.length === 0 ? null : otpModes,
    },
  };

  const walkReluctance = relaxSettings
    ? defaultSettings.walkReluctance
    : settings.walkReluctance;
  const walkBoardCost = relaxSettings
    ? defaultSettings.walkBoardCost
    : settings.walkBoardCost;
  const transferPenalty = relaxSettings
    ? defaultSettings.transferPenalty
    : settings.transferPenalty;

  const timeStr = (time ? moment(time * 1000) : moment()).format();
  const datetime = useLatestArrival
    ? { latestArrival: timeStr }
    : { earliestDeparture: timeStr };
  const numItineraries = directOnly ? 1 : 5;

  return {
    ...settings,
    allowedRentalNetworks:
      planType === PLANTYPE.SCOOTERTRANSIT
        ? settings.scooterNetworks
        : settings.allowedBikeRentalNetworks,
    fromPlace,
    toPlace,
    datetime,
    minTransferTime: `PT${settings.minTransferTime}S`,
    first: numItineraries, // used in actual query
    numItineraries, // backup original value for convenient paging
    wheelchair,
    walkReluctance,
    walkBoardCost,
    transferPenalty,
    modes,
    planType,
    noIterationsForShortTrips,
    via,
  };
}
