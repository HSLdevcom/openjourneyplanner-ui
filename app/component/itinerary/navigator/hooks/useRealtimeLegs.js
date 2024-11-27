import { useCallback, useEffect, useState } from 'react';
import { fetchQuery } from 'react-relay';
import { checkPositioningPermission } from '../../../../action/PositionActions';
import { legQuery } from '../../queries/LegQuery';
import { legTime } from '../../../../util/legUtils';
import { epochToIso } from '../../../../util/timeUtils';

function nextTransitIndex(legs, i) {
  for (let j = i; j < legs.length; j++) {
    if (legs[j].transitLeg) {
      return j;
    }
  }
  // negative indicates not found
  return -1;
}

function getLegGap(legs, index) {
  return legTime(legs[index + 1].start) - legTime(legs[index].end);
}

// change non-transit legs' scheduled times
function shiftLegs(legs, i1, i2, gap) {
  for (let j = i1; j <= i2; j++) {
    const leg = legs[j];
    leg.start.scheduledTime = epochToIso(legTime(leg.start) + gap);
    leg.end.scheduledTime = epochToIso(legTime(leg.end) + gap);
  }
}

// scale non-transit legs' scheduled times
function scaleLegs(legs, i1, i2, k) {
  const base = legTime(legs[i1].start);
  for (let j = i1; j <= i2; j++) {
    const leg = legs[j];
    const s = legTime(leg.start);
    const e = legTime(leg.end);
    leg.start.scheduledTime = epochToIso(s + k * (s - base));
    leg.end.scheduledTime = epochToIso(e + k * (e - base));
  }
}

function matchLegEnds(legs) {
  if (legs.length < 2) {
    return;
  }
  let transit;
  let gap;

  // shift first legs to match transit start
  transit = nextTransitIndex(legs, 0);
  if (transit > 0) {
    gap = getLegGap(legs, transit - 1);
    if (gap) {
      shiftLegs(legs, 0, transit - 1, gap);
    }
  }

  // shift transfers and legs after transit end
  while (transit > 0) {
    const walk = transit + 1; // first leg after transit
    const nextTransit = nextTransitIndex(legs, walk);
    const shiftEnd = nextTransit > 0 ? nextTransit - 1 : legs.length - 1;
    if (shiftEnd > transit) {
      gap = getLegGap(legs, transit);
      if (gap) {
        shiftLegs(legs, walk, shiftEnd, -gap);
      }
    }
    if (nextTransit > walk) {
      // check if transfer needs scaling
      gap = getLegGap(legs, nextTransit - 1);
      if (gap < 0) {
        // transfer overlaps next transit leg, so we must make it shorter
        const transferDuration =
          legTime(legs[shiftEnd].end) - legTime(legs[walk].start);
        scaleLegs(
          legs,
          walk,
          shiftEnd,
          (transferDuration + gap) / transferDuration,
        );
      }
    }
    transit = nextTransit;
  }
}

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
      return { ...l, start: { ...l.start }, end: { ...l.end } };
    });
    // shift non-transit-legs to match possibly changed transit legs
    matchLegEnds(rtLegs);
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
