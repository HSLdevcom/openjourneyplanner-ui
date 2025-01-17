/* eslint-disable no-param-reassign */
import cloneDeep from 'lodash/cloneDeep';
import polyUtil from 'polyline-encoded';
import { useCallback, useEffect, useState } from 'react';
import { fetchQuery } from 'react-relay';
import { GeodeticToEcef, GeodeticToEnu } from '../../../../util/geo-utils';
import { legTime } from '../../../../util/legUtils';
import { epochToIso } from '../../../../util/timeUtils';
import { legQuery } from '../../queries/LegQuery';

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
    if (!leg.freezeStart) {
      leg.start.scheduledTime = epochToIso(legTime(leg.start) + gap);
    }
    if (!leg.freezeEnd) {
      leg.end.scheduledTime = epochToIso(legTime(leg.end) + gap);
    }
  }
}

// scale non-transit legs' scheduled times
function scaleLegs(legs, i1, i2, k) {
  const base = legTime(legs[i1].start);
  for (let j = i1; j <= i2; j++) {
    const leg = legs[j];
    const s = legTime(leg.start);
    const e = legTime(leg.end);
    if (!leg.freezeStart) {
      leg.start.scheduledTime = epochToIso(base + k * (s - base));
    }
    if (!leg.freezeEnd) {
      leg.end.scheduledTime = epochToIso(base + k * (e - base));
    }
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

function getLegsOfInterest(legs, now) {
  if (!legs?.length) {
    return {
      firstLeg: undefined,
      lastLeg: undefined,
      currentLeg: undefined,
      nextLeg: undefined,
    };
  }

  const currentLeg = legs.find(
    ({ start, end }) => legTime(start) <= now && legTime(end) >= now,
  );
  const previousLeg = legs.findLast(({ end }) => legTime(end) < now);
  const nextStart = currentLeg ? legTime(currentLeg.end) : now;

  return {
    firstLeg: legs[0],
    lastLeg: legs[legs.length - 1],
    previousLeg,
    currentLeg,
    nextLeg: legs.find(({ start }) => legTime(start) >= nextStart),
  };
}

function getInitialState(legs) {
  const time = Date.now();
  if (legs.length) {
    const origin = GeodeticToEcef(legs[0].from.lat, legs[0].from.lon);
    return {
      origin,
      time,
      realTimeLegs: legs.map(leg => {
        const geometry = polyUtil.decode(leg.legGeometry.points);
        const clonedLeg = cloneDeep(leg);
        clonedLeg.geometry = geometry.map(p =>
          GeodeticToEnu(p[0], p[1], origin),
        );
        clonedLeg.freezeStart = legTime(clonedLeg.start) <= time;
        clonedLeg.freezeEnd = legTime(clonedLeg.end) <= time;
        return clonedLeg;
      }),
    };
  }
  return {
    time,
    realTimeLegs: [],
  };
}

const useRealtimeLegs = (relayEnvironment, initialLegs) => {
  const [{ origin, time, realTimeLegs }, setTimeAndRealTimeLegs] = useState(
    () => getInitialState(initialLegs),
  );

  const queryAndMapRealtimeLegs = useCallback(
    async (legs, now) => {
      if (!legs.length) {
        return {};
      }

      const legQueries = legs
        .filter(leg => leg.transitLeg && legTime(leg.end) > now)
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
    const now = Date.now();
    const rtLegMap = await queryAndMapRealtimeLegs(realTimeLegs, now).catch(
      err =>
        // eslint-disable-next-line no-console
        console.error('Failed to query and map real time legs', err),
    );

    setTimeAndRealTimeLegs(prev => {
      // Maps previous legs with fresh real time transit legs. If transit leg start or end time is in the past according
      // to previous state, the time is marked as frozen to stabilize the current navigation state.
      // rtLegMap does not contain legs that have ended in the past as they've been filtered before updates are queried
      const rtLegs = prev.realTimeLegs.map(l => {
        const rtLeg =
          l.legId && rtLegMap[l.legId] ? { ...rtLegMap[l.legId] } : null;
        if (rtLeg) {
          // If start is frozen, the property is deleted to prevent it from affecting any views
          if (l.freezeStart) {
            delete rtLeg.start;
          }

          return {
            ...l,
            ...rtLeg, // delete above prevent this from overwriting a previous, frozen state
            to: {
              ...l.to,
              vehicleRentalStation: rtLeg.to.vehicleRentalStation,
            },
          };
        }
        // Non-transit legs are kept unfrozen for now to allow them to be scaled or shifted
        return l;
      });

      // Shift unfrozen, non-transit-legs to match possibly changed transit legs
      matchLegEnds(rtLegs, now);

      // Freezes any leg.start|end in the past
      rtLegs.forEach(l => {
        l.freezeStart = legTime(l.start) <= now;
        l.freezeEnd = legTime(l.end) <= now;
      });

      return { ...prev, time: now, realTimeLegs: rtLegs };
    });
  }, [queryAndMapRealtimeLegs]);

  useEffect(() => {
    fetchAndSetRealtimeLegs();

    const interval = setInterval(() => {
      fetchAndSetRealtimeLegs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const { firstLeg, lastLeg, currentLeg, nextLeg, previousLeg } =
    getLegsOfInterest(realTimeLegs, time);

  return {
    realTimeLegs,
    time,
    origin,
    firstLeg,
    lastLeg,
    previousLeg,
    currentLeg,
    nextLeg,
  };
};

export { useRealtimeLegs };
