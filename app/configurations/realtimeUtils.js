/* eslint-disable prefer-template */
function defaultRouteSelector(routePageProps) {
  const route = routePageProps.route.gtfsId.split(':');
  return route[1];
}
function defaulVehicleNumberParser(vehicleNumber) {
  return vehicleNumber;
}
function walttiTopicResolver(
  route,
  direction,
  tripStartTime,
  headsign,
  feedId,
  tripId,
  geoHash,
) {
  return (
    '/gtfsrt/vp/' +
    feedId +
    '/+/+/+/' +
    route +
    '/' +
    direction +
    '/' +
    headsign +
    '/' +
    tripId +
    '/+/' +
    tripStartTime +
    '/+/' +
    geoHash[0] +
    '/' +
    geoHash[1] +
    '/' +
    geoHash[2] +
    '/' +
    geoHash[3] +
    '/#'
  );
}
function elyTopicResolver(
  route,
  direction,
  tripStartTime,
  headsign,
  feedId,
  tripId,
  geoHash,
) {
  return (
    '/gtfsrt/vp/' +
    feedId +
    '/+/+/+/' +
    route +
    '/+/+/' +
    tripId +
    '/+/' +
    tripStartTime +
    '/+/' +
    geoHash[0] +
    '/' +
    geoHash[1] +
    '/' +
    geoHash[2] +
    '/' +
    geoHash[3] +
    '/#'
  );
}
const mqttAddress =
  process.env.RUN_ENV === 'development' || process.env.NODE_ENV !== 'production'
    ? 'wss://dev-mqtt.digitransit.fi'
    : 'wss://mqtt.digitransit.fi';

const walttiMqtt = {
  mqttTopicResolver: walttiTopicResolver,
  mqtt: mqttAddress,
  gtfsrt: true,
  routeSelector: defaultRouteSelector,
  active: true,
  vehicleNumberParser: defaulVehicleNumberParser,
};

function elyMqtt(ignoreHeadsign) {
  return {
    mqttTopicResolver: elyTopicResolver,
    mqtt: mqttAddress,
    gtfsrt: true,
    routeSelector: defaultRouteSelector,
    active: true,
    vehicleNumberParser: defaulVehicleNumberParser,
    ignoreHeadsign,
  };
}

export default {
  HSL: {
    mqttTopicResolver: function mqttTopicResolver(
      route,
      hslDirection,
      tripStartTime,
      headsign, // eslint-disable-line no-unused-vars
      feedId, // eslint-disable-line no-unused-vars
      tripId, // eslint-disable-line no-unused-vars
      geoHash, // eslint-disable-line no-unused-vars
    ) {
      let direction = hslDirection;
      if (Number.isInteger(direction)) {
        direction += 1;
      }
      return (
        '/hfp/v2/journey/ongoing/+/+/+/+/' +
        route +
        '/' +
        direction +
        '/+/' +
        tripStartTime +
        '/#'
      );
    },
    mqtt: 'wss://mqtt.hsl.fi',
    gtfsrt: false,
    routeSelector: defaultRouteSelector,
    active: true,
    useFuzzyTripMatching: true,
    vehicleNumberParser: defaulVehicleNumberParser,
  },
  tampere: walttiMqtt,
  LINKKI: walttiMqtt,
  Lappeenranta: walttiMqtt,
  Joensuu: walttiMqtt,
  Kuopio: walttiMqtt,
  OULU: walttiMqtt,
  Hameenlinna: walttiMqtt,
  Lahti: walttiMqtt,
  Vaasa: walttiMqtt,
  Mikkeli: walttiMqtt,
  Salo: walttiMqtt,
  Kouvola: walttiMqtt,
  Kotka: walttiMqtt,
  Rovaniemi: walttiMqtt,
  Kajaani: walttiMqtt,
  Rauma: walttiMqtt,
  Pori: walttiMqtt,
  VARELY: walttiMqtt,
  WalttiTest: walttiMqtt,
  PohjolanMatka: elyMqtt(true),
  Harma: elyMqtt(false),
  Korsisaari: walttiMqtt,
  FOLI: {
    mqttTopicResolver: function mqttTopicResolver(
      route,
      direction,
      tripStartTime,
      headsign, // eslint-disable-line no-unused-vars
      feedId,
      tripId,
      geoHash,
    ) {
      return (
        '/gtfsrt/vp/' +
        feedId +
        '/+/+/+/' +
        route +
        '/' +
        direction +
        '/+/' +
        tripId +
        '/+/' +
        tripStartTime +
        '/+/' +
        geoHash[0] +
        '/' +
        geoHash[1] +
        '/' +
        geoHash[2] +
        '/' +
        geoHash[3] +
        '/#'
      );
    },
    mqtt: mqttAddress,
    gtfsrt: true,
    routeSelector: defaultRouteSelector,
    active: true,
    vehicleNumberParser: defaulVehicleNumberParser,
  },
  digitraffic: {
    mqttTopicResolver: function mqttTopicResolver(
      route,
      direction,
      tripStartTime,
      headsign,
      feedId,
      tripId,
      geoHash,
    ) {
      return (
        '/gtfsrt/vp/' +
        feedId +
        '/+/+/+/' +
        route +
        '/+/+/' +
        tripId +
        '/+/+/+/' +
        geoHash[0] +
        '/' +
        geoHash[1] +
        '/' +
        geoHash[2] +
        '/' +
        geoHash[3] +
        '/#'
      );
    },
    mqtt: mqttAddress,
    gtfsrt: true,
    routeSelector: defaultRouteSelector,
    active: true,
    vehicleNumberParser: function vehicleNumberParser(vehicleNumber) {
      return vehicleNumber.indexOf(' ') !== -1
        ? vehicleNumber.split(' ')[1]
        : vehicleNumber;
    },
  },
};
