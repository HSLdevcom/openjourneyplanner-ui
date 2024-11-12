import isString from 'lodash/isString';
import without from 'lodash/without';
import { getCustomizedSettings } from '../store/localStorage';
import { addAnalyticsEvent } from './analyticsUtils';
import { networkIsActive } from './modeUtils';
import { getIdWithoutFeed } from './feedScopedIdUtils';
import { isAndroid, isIOS } from './browser';

export const BIKEAVL_UNKNOWN = 'No availability';
export const BIKEAVL_BIKES = 'Bikes on station';
export const BIKEAVL_WITHMAX = 'Bikes and capacity';

/**
 * RentalNetworkType depicts different types of citybike networks.
 */
export const RentalNetworkType = {
  /** The network uses bikes. */
  CityBike: 'citybike',
  /** The network uses scooters. */
  Scooter: 'scooter',
};

export const defaultNetworkConfig = {
  icon: 'citybike',
  name: {},
  type: RentalNetworkType.CityBike,
};

export const getRentalNetworkName = (
  networkConfig = defaultNetworkConfig,
  language = 'en',
) => (networkConfig.name && networkConfig.name[language]) || undefined;

export const getRentalNetworkIcon = (
  networkConfig = defaultNetworkConfig,
  disabled = false,
) => `icon-icon_${networkConfig.icon || 'citybike'}${disabled ? '_off' : ''}`;

export const getRentalNetworkId = networks => {
  if (isString(networks) && networks.length > 0) {
    return networks;
  }
  if (!Array.isArray(networks) || networks.length === 0) {
    return undefined;
  }
  return networks[0];
};

export const getRentalNetworkConfig = (networkId, config) => {
  if (!networkId || !networkId.toLowerCase) {
    return defaultNetworkConfig;
  }
  const id = networkId.toLowerCase();
  if (
    config.vehicleRental?.networks?.[id] &&
    Object.keys(config.vehicleRental.networks[id]).length > 0
  ) {
    return config.vehicleRental.networks[id];
  }
  return defaultNetworkConfig;
};

export const getDefaultNetworks = config => {
  const mappedNetworks = [];
  Object.entries(config.vehicleRental.networks).forEach(n => {
    if (
      networkIsActive(n[1]) &&
      n[1]?.type !== RentalNetworkType.Scooter // scooter networks are never on by default
    ) {
      mappedNetworks.push(n[0]);
    }
  });
  return mappedNetworks;
};

export const getAllNetworksOfType = (config, type) => {
  const mappedNetworks = [];
  Object.entries(config.vehicleRental.networks).forEach(n => {
    if (n[1].type.toLowerCase() === type.toLowerCase()) {
      mappedNetworks.push(n[0]);
    }
  });
  return mappedNetworks;
};

export const mapDefaultNetworkProperties = config => {
  const mappedNetworks = [];
  Object.keys(config.vehicleRental.networks).forEach(key => {
    if (networkIsActive(config.vehicleRental.networks[key])) {
      mappedNetworks.push({
        networkName: key,
        ...config.vehicleRental.networks[key],
      });
    }
  });
  return mappedNetworks;
};

export const getVehicleCapacity = (config, network = undefined) => {
  return (
    config.vehicleRental?.networks[network]?.capacity ||
    config.vehicleRental.capacity
  );
};
/**
 * Retrieves all chosen citybike networks from the
 * localstorage
 *
 * @param {*} config The configuration for the software installation
 */

export const getCitybikeNetworks = () => {
  const { allowedBikeRentalNetworks } = getCustomizedSettings();
  return allowedBikeRentalNetworks || [];
};

export const getScooterNetworks = () => {
  const { scooterNetworks } = getCustomizedSettings();
  return scooterNetworks || [];
};

const addAnalytics = (action, name) => {
  addAnalyticsEvent({
    category: 'ItinerarySettings',
    action,
    name,
  });
};

/** *
 * Updates the list of allowed networks either by removing or adding.
 * Note: legacy settings had network names always in uppercase letters.
 *
 * @param networks the previously selected networks
 * @param networkName the network to be added/removed
 * @param type the type of the network
 * @returns the updated citybike networks
 */

export const updateVehicleNetworks = (networks, networkName, type) => {
  let updatedNetworks;
  let toggleAction;

  if (networks.find(o => o.toLowerCase() === networkName.toLowerCase())) {
    updatedNetworks = without(networks, networkName, networkName.toUpperCase());
    toggleAction = 'Disable';
  } else {
    updatedNetworks = networks.concat([networkName]);
    toggleAction = 'Enable';
  }

  const action = `Settings${toggleAction}${
    type === 'citybike' ? 'CityBikeNetwork' : 'ScooterNetwork'
  }`;
  addAnalytics(action, networkName);

  return updatedNetworks;
};

export const getVehicleMinZoomOnStopsNearYou = (config, override) => {
  if (override && config.vehicleRental.minZoomStopsNearYou) {
    return config.vehicleRental.minZoomStopsNearYou;
  }
  return config.vehicleRental.cityBikeMinZoom;
};

/** *
 * Checks if rentalId (station or vehicle) is a number. We don't want to display random hashes or names.
 *
 * @param rentalId id of a rental station or rental vehicle from OTP
 */
export const hasVehicleRentalCode = rentalId => {
  const id = rentalId?.split(':')[1];
  return (
    id &&
    // eslint-disable-next-line no-restricted-globals
    !isNaN(id) &&
    // eslint-disable-next-line no-restricted-globals
    !isNaN(parseFloat(id))
  );
};

export const mapVehicleRentalFromStore = vehicleRentalStation => {
  const originalId = vehicleRentalStation.stationId;
  const network =
    vehicleRentalStation.networks?.[0] || originalId.split(':')[0];
  const stationId = originalId.startsWith(network)
    ? originalId
    : `${network}:${originalId}`;

  const newStation = {
    ...vehicleRentalStation,
    network,
    stationId,
  };
  delete newStation.networks;
  return newStation;
};

export const mapVehicleRentalToStore = vehicleRentalStation => {
  const { network } = vehicleRentalStation;
  const newStation = {
    ...vehicleRentalStation,
    networks: [network],
    stationId: getIdWithoutFeed(vehicleRentalStation.stationId),
  };
  delete newStation.network;
  return newStation;
};

export const getRentalVehicleLink = (rentalVehicle, networkConfig) => {
  if (!networkConfig || !rentalVehicle) {
    return null;
  }

  const { ios, android, web } = rentalVehicle.rentalUris || {};
  const networkName = getRentalNetworkName(networkConfig).toLowerCase();

  if (isIOS && ios?.startsWith(`${networkName}://`)) {
    return ios;
  }

  if (isAndroid && android?.startsWith(`${networkName}://`)) {
    return android;
  }

  if (web?.includes(networkName)) {
    return web;
  }

  if (rentalVehicle.rentalNetwork?.url?.includes(networkName)) {
    return rentalVehicle.rentalNetwork.url;
  }

  return null;
};

export const useDeepLink = (deepLink, fallBackAddress) => {
  window.location.href = deepLink;
  setTimeout(() => {
    if (!document.hidden && document.hasFocus()) {
      // If the document is still visible and has focus, the deep link must have failed
      window.location.href = fallBackAddress;
    }
  }, 500);
};
