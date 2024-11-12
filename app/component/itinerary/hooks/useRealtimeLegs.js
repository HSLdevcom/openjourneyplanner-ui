import { useCallback, useEffect, useState } from 'react';
import { fetchQuery } from 'react-relay';
import { checkPositioningPermission } from '../../../action/PositionActions';
import { legQuery } from '../queries/LegQuery';

const useRealtimeLegs = (initialLegs, mapRef, relayEnvironment) => {
  const [isPositioningAllowed, setPositioningAllowed] = useState(false);
  const [realTimeLegs, setRealTimeLegs] = useState(initialLegs);
  const [time, setTime] = useState(Date.now());

  const enableMapTracking = useCallback(async () => {
    const permission = await checkPositioningPermission();
    const isPermissionGranted = permission.state === 'granted';
    if (isPermissionGranted) {
      mapRef?.enableMapTracking();
    }
    setPositioningAllowed(isPermissionGranted);
  }, [mapRef]);

  const queryAndMapRealtimeLegs = useCallback(
    async legs => {
      if (!legs.length) {
        return {};
      }

      const legQueries = legs
        .filter(leg => leg.transitLeg)
        .map(leg =>
          fetchQuery(
            relayEnvironment,
            legQuery,
            { id: leg.legId },
            { force: true },
          ).toPromise(),
        );
      const responses = await Promise.all(legQueries);
      return responses.reduce(
        (map, response) => ({ ...map, [response.leg.legId]: response.leg }),
        {},
      );
    },
    [relayEnvironment],
  );

  const fetchAndSetRealtimeLegs = useCallback(async () => {
    const rtLegMap = await queryAndMapRealtimeLegs(initialLegs).catch(err =>
      // eslint-disable-next-line no-console
      console.error('Failed to query and map real time legs', err),
    );

    const rtLegs = initialLegs.map(l => {
      const rtLeg = l.legId ? rtLegMap[l.legId] : null;
      if (rtLeg) {
        return {
          ...l,
          ...rtLeg,
          to: {
            ...l.to,
            vehicleRentalStation: rtLeg.to.vehicleRentalStation,
          },
        };
      }
      return { ...l };
    });
    setRealTimeLegs(rtLegs);
  }, [initialLegs, queryAndMapRealtimeLegs]);

  useEffect(() => {
    enableMapTracking();
    fetchAndSetRealtimeLegs();
    const interval = setInterval(() => {
      fetchAndSetRealtimeLegs();
      setTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, [enableMapTracking, fetchAndSetRealtimeLegs]);

  return { realTimeLegs, time, isPositioningAllowed };
};

export { useRealtimeLegs };
