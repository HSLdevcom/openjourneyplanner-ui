import Store from 'fluxible/addons/BaseStore';
import { getGeolocationState, setGeolocationState } from './localStorage';

export default class PositionStore extends Store {
  static storeName = 'PositionStore';

  static STATUS_NO_LOCATION = 'no-location';

  static STATUS_SEARCHING_LOCATION = 'searching-location';

  static STATUS_GEOLOCATION_PROMPT = 'prompt';

  static STATUS_FOUND_LOCATION = 'found-location';

  static STATUS_FOUND_ADDRESS = 'found-address';

  static STATUS_GEOLOCATION_DENIED = 'geolocation-denied';

  static STATUS_GEOLOCATION_TIMEOUT = 'geolocation-timeout';

  static STATUS_GEOLOCATION_WATCH_TIMEOUT = 'geolocation-watch-timeout';

  static STATUS_GEOLOCATION_NOT_SUPPORTED = 'geolocation-not-supported';

  static REVERSE_GEOCODING_STATUS_READY = 'reverse-geocoding-ready';

  static REVERSE_GEOCODING_STATUS_IN_PROGRESS = 'reverse-geocoding-in-progress';

  constructor(dispatcher) {
    super(dispatcher);
    this.lat = 0;
    this.lon = 0;
    this.heading = null;
    this.address = undefined;
    this.gid = undefined;
    this.name = undefined;
    this.layer = undefined;
    this.status = PositionStore.STATUS_NO_LOCATION;
    this.savedState = getGeolocationState();
    this.locationCount = 0;
    this.emitChange();
  }

  saveGeolocationState(state) {
    this.savedState = state;
    setGeolocationState(state);
  }

  geolocationSearch() {
    this.status = PositionStore.STATUS_SEARCHING_LOCATION;
    this.address = undefined;
    this.emitChange();
  }

  geolocationNotSupported() {
    this.status = PositionStore.STATUS_GEOLOCATION_NOT_SUPPORTED;
    this.saveGeolocationState('failed');
    this.emitChange();
  }

  geolocationDenied() {
    this.status = PositionStore.STATUS_GEOLOCATION_DENIED;
    this.saveGeolocationState('denied');
    this.emitChange();
  }

  geolocationTimeout() {
    this.status = PositionStore.STATUS_GEOLOCATION_TIMEOUT;
    this.saveGeolocationState('timeout');
    this.emitChange();
  }

  geolocationWatchTimeout() {
    this.status = PositionStore.STATUS_GEOLOCATION_WATCH_TIMEOUT;
    this.saveGeolocationState('timeout');
    this.emitChange();
  }

  geolocationPrompt() {
    this.status = PositionStore.STATUS_GEOLOCATION_PROMPT;
    this.saveGeolocationState('prompt');
    this.emitChange();
  }

  storeLocation(location) {
    if (this.savedState !== 'granted') {
      this.saveGeolocationState('granted');
    }
    if (
      location &&
      location.disableFiltering !== true &&
      Math.abs(this.lat - location.lat) < 0.001 &&
      Math.abs(this.lon - location.lon) < 0.001
    ) {
      this.lat = (this.lat + location.lat) / 2;
      this.lon = (this.lon + location.lon) / 2;
    } else {
      this.lat = location.lat;
      this.lon = location.lon;
    }
    this.heading = location.heading ? location.heading : this.heading;
    this.status = PositionStore.STATUS_FOUND_LOCATION;
    this.locationCount += 1;
    this.emitChange();
  }

  storeAddress(location) {
    if (location.address) {
      if (location.city) {
        this.address = `${location.address}, ${location.city}`;
      } else {
        this.address = location.address;
      }
    } else if (location.city) {
      this.address = location.city;
    } else {
      this.address = '';
    }
    this.gid = location.gid;
    this.name = location.name;
    this.layer = location.layer;
    this.reverseGeocodingStatus = PositionStore.REVERSE_GEOCODING_STATUS_READY;
    this.status = PositionStore.STATUS_FOUND_ADDRESS;
    this.emitChange();
  }

  getLocationState() {
    return {
      type: 'CurrentLocation',
      lat: this.lat,
      lon: this.lon,
      address: this.address,
      gid: this.gid,
      name: this.name,
      layer: this.layer,
      status: this.status,
      locationCount: this.locationCount,
      watchId: this.watchId,
      hasLocation:
        (this.status === PositionStore.STATUS_FOUND_ADDRESS ||
          this.status === PositionStore.STATUS_FOUND_LOCATION) &&
        (this.lat !== 0 || this.lon !== 0),
      // Locationing is in progress when browser is:
      //   searching address or
      //   reverse geocoding is in progress
      isLocationingInProgress:
        this.status === PositionStore.STATUS_SEARCHING_LOCATION,
      isReverseGeocodingInProgress:
        this.reverseGeocodingStatus ===
        PositionStore.REVERSE_GEOCODING_STATUS_IN_PROGRESS,
      locationingFailed:
        this.status === PositionStore.STATUS_GEOLOCATION_DENIED ||
        this.status === PositionStore.STATUS_GEOLOCATION_TIMEOUT ||
        this.status === PositionStore.STATUS_GEOLOCATION_WATCH_TIMEOUT ||
        this.status === PositionStore.STATUS_GEOLOCATION_NOT_SUPPORTED,
    };
  }

  storeWatchId(watchId) {
    this.watchId = watchId;
  }

  clearWatchId() {
    this.watchId = undefined;
  }

  getWatchId = () => this.watchId;

  startReverseGeocoding() {
    this.reverseGeocodingStatus =
      PositionStore.REVERSE_GEOCODING_STATUS_IN_PROGRESS;
    this.emitChange();
  }

  static handlers = {
    GeolocationSearch: 'geolocationSearch',
    GeolocationFound: 'storeLocation',
    GeolocationNotSupported: 'geolocationNotSupported',
    GeolocationDenied: 'geolocationDenied',
    GeolocationTimeout: 'geolocationTimeout',
    GeolocationWatchTimeout: 'geolocationWatchTimeout',
    GeolocationPrompt: 'geolocationPrompt',
    AddressFound: 'storeAddress',
    GeolocationWatchStarted: 'storeWatchId',
    GeolocationWatchStopped: 'clearWatchId',
    StartReverseGeocoding: 'startReverseGeocoding',
    storeWatchId: 'storeWatchId',
  };
}
