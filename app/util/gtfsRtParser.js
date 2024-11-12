import ceil from 'lodash/ceil';
import Pbf from 'pbf';

export const parseFeedMQTT = (feedParser, data, topic) => {
  const pbf = new Pbf(data);
  const feed = feedParser(pbf);

  // /gtfsrt/vp/<feed_Id>/<agency_id>/<agency_name>/<mode>/<route_id>/<direction_id>/<trip_headsign>/<trip_id>/<next_stop>/<start_time>/<vehicle_id>/<geo_hash>/<short_name>/<color>/
  const [
    ,
    ,
    ,
    feedId,
    ,
    ,
    mode,
    routeId,
    directionId,
    headsign,
    tripId,
    stopId,
    startTime,
    vehicleId,
    geoHashDeg1,
    geoHashDeg2,
    geoHashDeg3,
    geoHashDeg4,
    shortName,
    color,
  ] = topic.split('/');
  const messages = [];
  feed.entity.forEach(entity => {
    const vehiclePos = entity.vehicle;
    if (vehiclePos) {
      const { trip, position } = vehiclePos;
      if (trip && position) {
        const message = {
          id: `${feedId}:${vehicleId}`,
          route: `${feedId}:${routeId}`,
          direction:
            directionId === '' ? undefined : parseInt(directionId, 10) || 0,
          tripStartTime:
            startTime === '' ? undefined : startTime.replace(/:/g, ''),
          operatingDay: trip.start_date,
          mode: mode === '' ? 'bus' : mode.toLowerCase(),
          next_stop: stopId === '' ? undefined : `${feedId}:${stopId}`,
          timestamp: vehiclePos.timestamp || feed.header.timestamp,
          lat: ceil(position.latitude, 5),
          long: ceil(position.longitude, 5),
          heading: position.bearing ? Math.floor(position.bearing) : undefined,
          headsign: headsign === '' ? undefined : headsign,
          tripId: tripId === '' ? undefined : `${feedId}:${tripId}`,
          geoHash: [geoHashDeg1, geoHashDeg2, geoHashDeg3, geoHashDeg4],
          shortName: shortName === '' ? undefined : shortName,
          color: color === '' ? undefined : color,
        };
        messages.push(message);
      }
    }
  });
  return messages.length > 0 ? messages : null;
};
