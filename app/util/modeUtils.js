import isString from 'lodash/isString';
import sortedUniq from 'lodash/sortedUniq';
import xor from 'lodash/xor';
import inside from 'point-in-polygon';
import { getCustomizedSettings } from '../store/localStorage';
import { isInBoundingBox } from './geo-utils';
import { addAnalyticsEvent } from './analyticsUtils';
import { ExtendedRouteTypes, TransportMode } from '../constants';
import { isDevelopmentEnvironment } from './envUtils';
import { getFeedWithoutId, isExternalFeed } from './feedScopedIdUtils';

function seasonMs(ddmmyyyy) {
  const parts = ddmmyyyy.split('.');
  const year = parts.length > 2 ? parts[2] : new Date().getFullYear();
  return new Date(year, parts[1] - 1, parts[0]).valueOf();
}

const dayMs = 24 * 60 * 60 * 1000;

export function isCitybikeSeasonActive(season) {
  if (!season) {
    return false;
  }
  if (season.alwaysOn) {
    return true;
  }
  const now = Date.now();
  return now <= seasonMs(season.end) + dayMs && now >= seasonMs(season.start);
}

export function isCitybikePreSeasonActive(season) {
  if (!season.start || !season.preSeasonStart) {
    return false;
  }
  const now = Date.now();
  return (
    now <= seasonMs(season.start) + dayMs &&
    now >= seasonMs(season.preSeasonStart)
  );
}

export function showCitybikeNetwork(networkConfig, config) {
  return (
    networkConfig?.enabled &&
    networkConfig.type === 'citybike' &&
    (isCitybikeSeasonActive(networkConfig?.season) ||
      isCitybikePreSeasonActive(networkConfig?.season) ||
      isDevelopmentEnvironment(config))
  );
}

export function networkIsActive(network) {
  return network?.enabled && isCitybikeSeasonActive(network?.season);
}

export function useCitybikes(networks, config) {
  if (!networks) {
    return false;
  }
  return Object.values(networks).some(
    network =>
      network.type === TransportMode.Citybike.toLowerCase() &&
      networkIsActive(network, config),
  );
}

export function useScooters(networks) {
  if (!networks) {
    return false;
  }
  return Object.values(networks).some(
    network =>
      network.type === TransportMode.Scooter.toLowerCase() && network.enabled,
  );
}

export function showRentalVehiclesOfType(networks, config, type) {
  if (!networks) {
    return false;
  }
  return Object.values(networks).some(
    network =>
      network.type === type.toLowerCase() &&
      network.enabled &&
      (network.showRentalVehicles || showCitybikeNetwork(network, config)),
  );
}

export function getNearYouModes(config) {
  if (!config.vehicleRental?.networks) {
    return config.nearYouModes;
  }
  if (!useCitybikes(config.vehicleRental.networks, config)) {
    return config.nearYouModes.filter(mode => mode !== 'citybike');
  }
  return config.nearYouModes;
}

export function getTransportModes(config) {
  let citybikeConfig = {};
  let scooterConfig = {};
  if (config.vehicleRental?.networks) {
    if (!useCitybikes(config.vehicleRental.networks, config)) {
      citybikeConfig = { citybike: { availableForSelection: false } };
    }
    if (!useScooters(config.vehicleRental.networks)) {
      scooterConfig = { scooter: { availableForSelection: false } };
    }
  }
  return {
    ...config.transportModes,
    ...citybikeConfig,
    ...scooterConfig,
  };
}

export function getRouteMode(route, config) {
  switch (route.type) {
    case ExtendedRouteTypes.BusExpress:
      return 'bus-express';
    case ExtendedRouteTypes.BusLocal:
      return 'bus-local';
    case ExtendedRouteTypes.SpeedTram:
      return 'speedtram';
    default:
      return isExternalFeed(getFeedWithoutId(route?.gtfsId), config)
        ? `${route.mode?.toLowerCase()}-external`
        : route.mode?.toLowerCase();
  }
}

/**
 * Retrieves all transport modes that have specified "availableForSelection": true.
 * The full configuration will be returned.
 *
 * @param {*} config The configuration for the software installation
 */
export function getAvailableTransportModeConfigs(config) {
  const transportModes = getTransportModes(config);
  return transportModes
    ? Object.keys(transportModes)
        .filter(tm => transportModes[tm].availableForSelection)
        .map(tm => ({ ...transportModes[tm], name: tm.toUpperCase() }))
    : [];
}

export function getTransitModes(config) {
  return getAvailableTransportModeConfigs(config)
    .filter(
      tm => tm.defaultValue && tm.name !== 'scooter' && tm.name !== 'citybike',
    )
    .map(tm => tm.name)
    .sort();
}

/**
 * Retrieves all transport modes that have specified "availableForSelection": true.
 * Only the name of each transport mode will be returned.
 *
 * @param {*} config The configuration for the software installation
 */
export function getAvailableTransportModes(config) {
  return getAvailableTransportModeConfigs(config).map(tm => tm.name);
}

/**
 * Checks if the given transport mode has been configured as availableForSelection.
 *
 * @param {*} config The configuration for the software installation
 * @param {String} mode The mode to check
 */
export function isTransportModeAvailable(config, mode) {
  return getAvailableTransportModes(config).includes(mode.toUpperCase());
}

/**
 * Checks if mode does not exist in config's modePolygons or
 * at least one of the given coordinates is inside any of the polygons defined for a mode
 *
 * @param {*} config The configuration for the software installation
 * @param {String} mode The mode to check
 * @param {*} places
 */
export function isModeAvailableInsidePolygons(config, mode, places) {
  if (mode in config.modePolygons && places.length > 0) {
    for (let i = 0; i < places.length; i++) {
      const { lat, lon } = places[i];
      for (let j = 0; j < config.modeBoundingBoxes[mode].length; j++) {
        const boundingBox = config.modeBoundingBoxes[mode][j];
        if (
          isInBoundingBox(boundingBox, lat, lon) &&
          inside([lon, lat], config.modePolygons[mode][j])
        ) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
}

/**
 * Maps the given modes (either a string array or a comma-separated string of values)
 * to their OTP counterparts. Any modes with no counterpart available will be dropped
 * from the output.
 *
 * @param {*} config The configuration for the software installation
 * @param {String[]|String} modes The modes to filter
 * @returns The filtered modes, or an empty string
 */
export function filterModes(config, modes, from, to, intermediatePlaces) {
  if (!modes) {
    return [];
  }
  const modesStr = modes instanceof Array ? modes.join(',') : modes;
  if (!isString(modesStr)) {
    return [];
  }
  return sortedUniq(
    modesStr
      .split(',')
      .filter(mode => isTransportModeAvailable(config, mode))
      .filter(mode =>
        isModeAvailableInsidePolygons(config, mode, [
          from,
          to,
          ...intermediatePlaces,
        ]),
      )
      .filter(mode => !!mode)
      .sort(),
  );
}

/**
 * Giving user an option to change mode settings when there are no
 * alternative options does not make sense. This function checks
 * if there are at least two available transport modes
 *
 * @param {*} config
 * @returns {Boolean} True if mode settings should be shown to users
 */
export function showModeSettings(config) {
  return getAvailableTransportModes(config).length > 1;
}

/**
 * Retrieves all transit modes and returns the currently available
 * If user has no ability to change mode settings, always use default modes.
 *
 * @param {*} config The configuration for the software
 * @returns {String[]} returns user set modes or default modes
 */
export function getModes(config) {
  const { modes } = getCustomizedSettings();
  if (showModeSettings(config) && Array.isArray(modes)) {
    const transportModes = modes.filter(mode =>
      isTransportModeAvailable(config, mode),
    );
    return transportModes;
  }
  return getTransitModes(config);
}

/**
 * Updates the localStorage to reflect the selected transport mode.
 *
 * @param {*} transportMode The transport mode to select
 * @param {*} config The configuration for the software installation
 * @returns {String[]} an array of currently selected modes
 */
export function toggleTransportMode(transportMode, config) {
  let actionName;
  if (getModes(config).includes(transportMode.toUpperCase())) {
    actionName = 'SettingsDisableTransportMode';
  } else {
    actionName = 'SettingsEnableTransportMode';
  }
  addAnalyticsEvent({
    action: actionName,
    category: 'ItinerarySettings',
    name: transportMode,
  });
  const modes = xor(getModes(config), [transportMode.toUpperCase()]);
  return modes;
}
