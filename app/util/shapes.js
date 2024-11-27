import PropTypes from 'prop-types';
import { PlannerMessageType } from '../constants';

export const agencyShape = PropTypes.shape({
  name: PropTypes.string,
  fareUrl: PropTypes.string,
});

export const alertShape = PropTypes.shape({
  alertDescriptionText: PropTypes.string,
  effectiveEndDate: PropTypes.number,
  effectiveStartDate: PropTypes.number,
  alertHash: PropTypes.number,
  alertHeaderText: PropTypes.string,
  alertSeverityLevel: PropTypes.string,
  alertUrl: PropTypes.string,
  id: PropTypes.string,
  entities: PropTypes.arrayOf(
    PropTypes.shape({
      __typename: PropTypes.string.isRequired,
    }),
  ),
});

export const childrenShape = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.node),
  PropTypes.node,
]);

export const configShape = PropTypes.shape({
  CONFIG: PropTypes.string.isRequired,
});

export const errorShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({ message: PropTypes.string }),
]);

export const fareShape = PropTypes.shape({
  agency: agencyShape,
  fareId: PropTypes.string,
  cents: PropTypes.number,
  isUnknown: PropTypes.bool,
  routeName: PropTypes.string,
  ticketName: PropTypes.string,
});

export const favouriteShape = PropTypes.shape({
  type: PropTypes.string,
  favouriteId: PropTypes.string,
});

export const geoJsonFeatureShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  geometry: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.arrayOf(
          PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.number),
            PropTypes.number,
          ]),
        ),
      ]),
    ).isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  // eslint-disable-next-line
  properties: PropTypes.object,
});

export const popupColorShape = PropTypes.shape({
  accessiblePrimary: PropTypes.string,
  hover: PropTypes.string,
  primary: PropTypes.string,
  iconColors: PropTypes.objectOf(PropTypes.string),
});

export const parkShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  lat: PropTypes.number,
  lon: PropTypes.number,
  availability: PropTypes.shape({
    bicycleSpaces: PropTypes.number,
    carSpaces: PropTypes.number,
  }),
  capacity: PropTypes.shape({ carSpaces: PropTypes.number }),
  tags: PropTypes.arrayOf(PropTypes.string),
  realtime: PropTypes.bool,
});

export const vehicleRentalStationShape = PropTypes.shape({
  availableVehicles: PropTypes.shape({ total: PropTypes.number }),
  availableSpaces: PropTypes.shape({ total: PropTypes.number }),
  rentalNetwork: PropTypes.shape({
    networkId: PropTypes.string,
  }),
  capacity: PropTypes.number,
  operative: PropTypes.bool,
});

export const rentalVehicleShape = PropTypes.shape({
  id: PropTypes.string,
  vehicleId: PropTypes.string,
  name: PropTypes.string,
  lat: PropTypes.number,
  lon: PropTypes.number,
  rentalUris: PropTypes.shape({
    android: PropTypes.string,
    ios: PropTypes.string,
    web: PropTypes.string,
  }),
  rentalNetwork: PropTypes.shape({
    url: PropTypes.string,
    networkId: PropTypes.string,
  }),
});

export const routeShape = PropTypes.shape({
  gtfsId: PropTypes.string,
  mode: PropTypes.string,
  shortName: PropTypes.string,
  longName: PropTypes.string,
  color: PropTypes.string,
  type: PropTypes.number,
  alerts: PropTypes.arrayOf(alertShape),
});

export const patternShape = PropTypes.shape({
  code: PropTypes.string,
  route: PropTypes.shape({
    mode: PropTypes.string,
    color: PropTypes.string,
  }),
  stops: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number,
      lon: PropTypes.number,
      code: PropTypes.string,
    }),
  ),
  geometry: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
    }).isRequired,
  ),
});

export const tripShape = PropTypes.shape({
  gtfsId: PropTypes.string,
  pattern: patternShape,
  tripHeadsign: PropTypes.string,
  stoptimesForDate: PropTypes.arrayOf(
    PropTypes.shape({
      headsign: PropTypes.string,
      stop: PropTypes.shape({
        gtfsId: PropTypes.string.isRequired,
      }),
    }),
  ),
});

export const stopTimeShape = PropTypes.shape({
  headsign: PropTypes.string,
  realtimeState: PropTypes.string,
  scheduledDeparture: PropTypes.number,
  serviceDay: PropTypes.number,
  trip: tripShape,
  dropoffType: PropTypes.string,
  pickupType: PropTypes.string,
});

export const stopShape = PropTypes.shape({
  gtfsId: PropTypes.string,
  name: PropTypes.string,
  code: PropTypes.string,
  desc: PropTypes.string,
  platformCode: PropTypes.string,
  lat: PropTypes.number,
  lon: PropTypes.number,
  zoneId: PropTypes.string,
  alerts: PropTypes.arrayOf(alertShape),
  routes: PropTypes.arrayOf(routeShape),
  stoptimes: PropTypes.arrayOf(stopTimeShape),
});

export const stationShape = PropTypes.shape({
  gtfsId: PropTypes.string,
  locationType: PropTypes.string,
  alerts: PropTypes.arrayOf(alertShape),
  stops: PropTypes.arrayOf(stopShape),
  stoptimes: PropTypes.arrayOf(stopTimeShape),
});

export const departureShape = PropTypes.shape({
  trip: tripShape,
  headsign: PropTypes.string,
  realtime: PropTypes.bool,
  stop: stopShape,
});

export const legTimeShape = PropTypes.shape({
  scheduledTime: PropTypes.string,
  estimated: PropTypes.shape({ time: PropTypes.string }),
});

export const legShape = PropTypes.shape({
  start: legTimeShape,
  end: legTimeShape,
  duration: PropTypes.number,
  distance: PropTypes.number,
  mode: PropTypes.string,
  realtimeState: PropTypes.string,
  realTime: PropTypes.bool,
  route: routeShape,
  trip: tripShape,
  agency: agencyShape,
  fare: fareShape,
  from: PropTypes.shape({
    name: PropTypes.string,
    stop: stopShape,
    vehicleRentalStation: vehicleRentalStationShape,
    rentalVehicle: rentalVehicleShape,
  }),
  to: PropTypes.shape({
    name: PropTypes.string,
    stop: stopShape,
    vehicleRentalStation: vehicleRentalStationShape,

    bikePark: parkShape,
    carPark: parkShape,
  }),
  rentedBike: PropTypes.bool,
  departureDelay: PropTypes.number,
  intermediatePlaces: PropTypes.arrayOf(
    PropTypes.shape({
      arrival: legTimeShape,
    }),
  ),
  interlineWithPreviousLeg: PropTypes.bool,
  // eslint-disable-next-line
  nextLegs: PropTypes.arrayOf(PropTypes.object),
});

export const itineraryShape = PropTypes.shape({
  start: PropTypes.string,
  end: PropTypes.string,
  duration: PropTypes.number,
  walkDistance: PropTypes.number,
  legs: PropTypes.arrayOf(legShape),
  emissionsPerPerson: PropTypes.shape({
    co2: PropTypes.number,
  }),
});

export const planEdgeShape = PropTypes.shape({
  node: itineraryShape.isRequired,
});

export const locationShape = PropTypes.shape({
  lat: PropTypes.number,
  lon: PropTypes.number,
  address: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string,
});

const StatusPropType = PropTypes.oneOf([
  'no-location',
  'searching-location',
  'prompt',
  'found-location',
  'found-address',
  'geolocation-denied',
  'geolocation-timeout',
  'geolocation-watch-timeout',
  'geolocation-not-supported',
  'reverse-geocoding-ready',
  'reverse-geocoding-in-progress',
]);

export const locationStateShape = PropTypes.shape({
  type: PropTypes.string.isRequired,
  lat: PropTypes.number,
  lon: PropTypes.number,
  address: PropTypes.string,
  gid: PropTypes.string,
  name: PropTypes.string,
  layer: PropTypes.string,
  status: StatusPropType,
  hasLocation: PropTypes.bool,
  isLocationingInProgress: PropTypes.bool,
  isReverseGeocodingInProgress: PropTypes.bool,
  locationingFailed: PropTypes.bool,
});

const MapLayerOptionShape = PropTypes.shape({
  isLocked: PropTypes.bool,
  isSelected: PropTypes.bool,
});

const MapLayerOptionStopOrTerminalShape = PropTypes.shape({
  bus: PropTypes.shape(MapLayerOptionShape),
  rail: PropTypes.shape(MapLayerOptionShape),
  tram: PropTypes.shape(MapLayerOptionShape),
  subway: PropTypes.shape(MapLayerOptionShape),
  ferry: PropTypes.shape(MapLayerOptionShape),
  funicular: PropTypes.shape(MapLayerOptionShape),
});

export const mapLayerOptionsShape = PropTypes.shape({
  parkAndRide: PropTypes.oneOfType([
    PropTypes.shape(MapLayerOptionShape),
    // eslint-disable-next-line
    PropTypes.any,
  ]),
  stop: PropTypes.oneOfType([
    PropTypes.shape(MapLayerOptionStopOrTerminalShape),
    // eslint-disable-next-line
    PropTypes.any,
  ]),
  terminal: PropTypes.oneOfType([
    PropTypes.shape(MapLayerOptionStopOrTerminalShape),
    // eslint-disable-next-line
    PropTypes.any,
  ]),
  vehicles: PropTypes.oneOfType([
    PropTypes.shape(MapLayerOptionShape),
    // eslint-disable-next-line
    PropTypes.any,
  ]),
  citybike: PropTypes.oneOfType([
    PropTypes.shape(MapLayerOptionShape),
    // eslint-disable-next-line
    PropTypes.any,
  ]),
});

export const planShape = PropTypes.shape({
  edges: PropTypes.arrayOf(planEdgeShape),
  searchDateTime: PropTypes.string,
});

export const plannerMessageShape = PropTypes.oneOf(
  Object.values(PlannerMessageType),
);

export const refShape = PropTypes.oneOfType([
  PropTypes.func,
  // eslint-disable-next-line
  PropTypes.shape({ current: PropTypes.any }),
]);

export const relayShape = PropTypes.shape({
  refetchConnection: PropTypes.func,
  refetch: PropTypes.func,
  hasMore: PropTypes.func,
  loadMore: PropTypes.func,
  // eslint-disable-next-line
  environment: PropTypes.object,
});

const ROUTER_ERROR_CODES = Object.values(PlannerMessageType);

export const RoutingerrorShape = PropTypes.shape({
  code: PropTypes.oneOf(ROUTER_ERROR_CODES),
  inputField: PropTypes.oneOf(['DATE_TIME', 'TO', 'FROM']),
});

export const settingsShape = PropTypes.shape({
  walkSpeed: PropTypes.number,
  walkReluctance: PropTypes.number,
  modes: PropTypes.arrayOf(PropTypes.string),
  bikeSpeed: PropTypes.number,
  transferPenalty: PropTypes.number,
});

export const userShape = PropTypes.shape({
  given_name: PropTypes.string,
  family_name: PropTypes.string,
  sub: PropTypes.string,
  notLogged: PropTypes.bool,
});

export const vehicleShape = PropTypes.shape({
  id: PropTypes.string,
  route: PropTypes.string,
  direction: PropTypes.number,
  tripStartTime: PropTypes.string,
  operatingDay: PropTypes.string,
  mode: PropTypes.string,
  next_stop: PropTypes.string,
  timestamp: PropTypes.number,
  lat: PropTypes.number,
  lon: PropTypes.number,
  shortName: PropTypes.string,
  color: PropTypes.string,
  heading: PropTypes.number,
  headsign: PropTypes.string,
});

export const minTransferTimeShape = PropTypes.arrayOf(
  PropTypes.shape({
    title: PropTypes.string,
    value: PropTypes.number,
  }),
);
