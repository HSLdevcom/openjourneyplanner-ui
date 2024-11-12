import { isBrowser } from '../util/browser';

function handleSecurityError(error, logMessage) {
  if (error.name === 'SecurityError') {
    if (logMessage) {
      console.log(logMessage); // eslint-disable-line no-console
    }
  } else {
    throw error;
  }
}

export const getLocalStorage = (
  runningInBrowser,
  errorHandler = handleSecurityError,
) => {
  if (runningInBrowser) {
    try {
      return window.localStorage;
    } catch (error) {
      errorHandler(error);
      return null;
    }
  } else {
    return global.localStorage;
  }
};

function setItem(key, value) {
  const localStorage = getLocalStorage(isBrowser);
  if (localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // eslint-disable-next-line no-console
        console.log(
          '[localStorage]' + // eslint-disable-line no-console
            ' Unable to save state; localStorage is not available in Safari private mode',
        );
      } else {
        handleSecurityError(
          error,
          '[localStorage]' +
            ' Unable to save state; access to localStorage denied by browser settings',
        );
      }
    }
  }
}

function getItem(key) {
  const localStorage = getLocalStorage(isBrowser);
  if (localStorage) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      handleSecurityError(error);
    }
  }
  return null;
}

function getItemAsJson(key, defaultValue) {
  let item = getItem(key);

  if (item == null) {
    item = defaultValue || '[]';
  }

  return JSON.parse(item);
}

export function removeItem(k) {
  const localStorage = getLocalStorage(isBrowser);
  if (localStorage) {
    try {
      localStorage.removeItem(k);
    } catch (error) {
      handleSecurityError(error);
    }
  }
}

export function getCustomizedSettings() {
  const settings = getItemAsJson('customizedSettings', '{}');
  // remove outdated settings
  if (settings.modes) {
    settings.modes = settings.modes.filter(
      mode => mode !== 'CITYBIKE' && mode !== 'SCOOTER',
    );
  }
  return settings;
}

const getNumberValueOrDefault = (value, defaultValue) =>
  value !== undefined && value !== null ? Number(value) : defaultValue;

const getValueOrDefault = (value, defaultValue) =>
  value !== undefined ? value : defaultValue;

export function setCustomizedSettings(data) {
  // Get old settings and test if set values have changed
  const oldSettings = getCustomizedSettings();

  const newSettings = {
    accessibilityOption: getNumberValueOrDefault(
      data.accessibilityOption,
      oldSettings.accessibilityOption,
    ),
    bikeSpeed: getNumberValueOrDefault(data.bikeSpeed, oldSettings.bikeSpeed),
    modes: getValueOrDefault(data.modes, oldSettings.modes),
    ticketTypes: getValueOrDefault(data.ticketTypes, oldSettings.ticketTypes),
    walkBoardCost: getNumberValueOrDefault(
      data.walkBoardCost,
      oldSettings.walkBoardCost,
    ),
    transferPenalty: getNumberValueOrDefault(
      data.transferPenalty,
      oldSettings.transferPenalty,
    ),
    walkReluctance: getNumberValueOrDefault(
      data.walkReluctance,
      oldSettings.walkReluctance,
    ),
    walkSpeed: getNumberValueOrDefault(data.walkSpeed, oldSettings.walkSpeed),
    allowedBikeRentalNetworks: getValueOrDefault(
      data.allowedBikeRentalNetworks,
      oldSettings.allowedBikeRentalNetworks,
    ),
    scooterNetworks: getValueOrDefault(
      data.scooterNetworks,
      oldSettings.scooterNetworks,
    ),
    includeBikeSuggestions: getValueOrDefault(
      data.includeBikeSuggestions,
      oldSettings.includeBikeSuggestions,
    ),
    includeCarSuggestions: getValueOrDefault(
      data.includeCarSuggestions,
      oldSettings.includeCarSuggestions,
    ),
    includeParkAndRideSuggestions: getValueOrDefault(
      data.includeParkAndRideSuggestions,
      oldSettings.includeParkAndRideSuggestions,
    ),
    showBikeAndParkItineraries: getValueOrDefault(
      data.showBikeAndParkItineraries,
      oldSettings.showBikeAndParkItineraries,
    ),
  };
  if (newSettings.modes) {
    // cleanup
    newSettings.modes = newSettings.modes.filter(
      mode => mode !== 'CITYBIKE' && mode !== 'SCOOTER',
    );
  }
  setItem('customizedSettings', newSettings);
}

export function clearFavouriteStorage() {
  return setItem('favouriteStore', []);
}

export function getFavouriteStorage() {
  return getItemAsJson('favouriteStore');
}

export function setFavouriteStorage(data) {
  setItem('favouriteStore-updated-at', Math.round(Date.now() / 1000));
  return setItem('favouriteStore', data);
}

export function getFavouriteLocationsStorage() {
  return getItemAsJson('favouriteLocations');
}

export function getFavouriteStopsStorage() {
  return getItemAsJson('favouriteStops');
}

export function setReadMessageIds(data) {
  setItem('readMessages', data);
}

export function getReadMessageIds() {
  /* Migrate old data */
  const oldMessages = getItemAsJson('messages', '[]');
  if (oldMessages.length !== 0) {
    const readMessageIds = oldMessages
      .filter(message => message[1].read)
      .map(message => message[0]);
    setReadMessageIds(readMessageIds);
    removeItem('messages');
  }

  return getItemAsJson('readMessages', '[]');
}

export function getFavouriteRoutesStorage() {
  return getItemAsJson('favouriteRoutes');
}

export function getOldSearchesStorage() {
  const storage = getItemAsJson('saved-searches', '{"items": []}');
  return {
    ...storage,
    items: storage.items.filter(
      search => search.item.address !== 'SelectFromMap',
    ),
  };
}

export function setOldSearchesStorage(data) {
  setItem('saved-searches-updated-at', Math.round(Date.now() / 1000));
  setItem('saved-searches', data);
}

export function getSearchSettingsStorage() {
  return getItemAsJson('customizedSettings', '{}');
}

export function setSearchSettingsStorage(data) {
  setItem('customizedSettings', data);
}

export function setGeolocationState(state) {
  setItem('geolocationPermission', { state });
}

export function getGeolocationState() {
  return getItemAsJson('geolocationPermission', '{ "state": "unknown" }').state;
}

export const setMapLayerSettings = settings => {
  setItem('map-layers', settings);
};

export const setCountries = countries => {
  setItem('countries', countries);
};

export const getMapLayerSettings = () => getItemAsJson('map-layers', '{}');

export const getCountries = () => getItemAsJson('countries', '{}');

/**
 * Sets the seen state of the given dialog.
 *
 * @param {string} dialogId The identifier of the dialog. Will be ignored if falsey.
 * @param {boolean} seen Whether the dialog has been seen. Defaults to true.
 */
export const setDialogState = (dialogId, seen = true) => {
  if (!dialogId) {
    return;
  }
  const dialogStates = getItemAsJson('dialogState', '{}');
  dialogStates[`${dialogId}`] = seen;
  setItem('dialogState', dialogStates);
};

/**
 * Checks if the given dialog has been seen by the user.
 *
 * @param {string} dialogId The identifier of the dialog.
 */
export const getDialogState = dialogId =>
  getItemAsJson('dialogState', '{}')[`${dialogId}`] === true;

export function getFutureRoutesStorage() {
  return getItemAsJson('futureRoutes', '[]');
}

export function setFutureRoutesStorage(data) {
  setItem('futureRoutes', data);
}

export function getSavedGeolocationPermission() {
  return getItemAsJson('geolocationPermission', '{}');
}

export function setSavedGeolocationPermission(key, value) {
  const geolocationPermissions = getSavedGeolocationPermission();
  setItem('geolocationPermission', {
    ...geolocationPermissions,
    [key]: value,
  });
}

export const setLatestNavigatorItinerary = value => {
  setItem('latestNavigatorItinerary', value);
};

export const getLatestNavigatorItinerary = () => {
  return getItemAsJson('latestNavigatorItinerary', '{}');
};

export const clearLatestNavigatorItinerary = () => {
  setItem('latestNavigatorItinerary', {});
};
