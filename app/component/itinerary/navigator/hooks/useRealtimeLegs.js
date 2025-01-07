import polyUtil from 'polyline-encoded';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchQuery } from 'react-relay';
import { GeodeticToEcef, GeodeticToEnu } from '../../../../util/geo-utils';
import {
  isAnyLegPropertyIdentical,
  legTime,
  LegMode,
} from '../../../../util/legUtils';
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
    leg.start.scheduledTime = epochToIso(base + k * (s - base));
    leg.end.scheduledTime = epochToIso(base + k * (e - base));
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

function getLegsOfInterest(
  realTimeLegs,
  time,
  previousFinishedLeg,
  itineraryStarted,
) {
  if (!realTimeLegs?.length) {
    return {
      firstLeg: undefined,
      lastLeg: undefined,
      currentLeg: undefined,
      nextLeg: undefined,
    };
  }
  const legs = realTimeLegs.reduce((acc, curr, i, arr) => {
    acc.push(curr);
    const next = arr[i + 1];

    // A wait leg is added, if next leg exists but it does not start when current ends
    if (next && legTime(curr.end) !== legTime(next.start)) {
      acc.push({
        id: null,
        legGeometry: { points: null },
        mode: LegMode.Wait,
        start: curr.end,
        end: next.start,
      });
    }

    return acc;
  }, []);

  let currentLeg = legs.find(
    ({ start, end }) => legTime(start) <= time && legTime(end) >= time,
  );
  let previousLeg = legs.findLast(({ end }) => legTime(end) < time);
  const nextLeg = legs.find(({ start }) => legTime(start) > time);

  // Indices are shifted by one if a previously completed leg reappears as current.
  if (
    isAnyLegPropertyIdentical(currentLeg, previousFinishedLeg, [
      'legId',
      'legGeometry.points',
    ]) &&
    itineraryStarted // prev and current are both undefined before itinerary starts
  ) {
    previousLeg = currentLeg;
    currentLeg = nextLeg;
  }
  const nextStart = currentLeg ? legTime(currentLeg.end) : time;
  return {
    firstLeg: legs[0],
    lastLeg: legs[legs.length - 1],
    previousLeg,
    currentLeg,
    nextLeg: realTimeLegs.find(({ start }) => legTime(start) >= nextStart),
  };
}

const useRealtimeLegs = (relayEnvironment, initialLegs = []) => {
  const [realTimeLegs, setRealTimeLegs] = useState();
  const [time, setTime] = useState(Date.now());
  const previousFinishedLeg = useRef(undefined);
  const itineraryStarted = useRef(false);

  const origin = useMemo(
    () => GeodeticToEcef(initialLegs[0].from.lat, initialLegs[0].from.lon),
    [initialLegs[0]],
  );

  const planarLegs = useMemo(() => {
    return initialLegs.map(leg => {
      const geometry = polyUtil.decode(leg.legGeometry.points);
      return {
        ...leg,
        geometry: geometry.map(p => GeodeticToEnu(p[0], p[1], origin)),
      };
    });
  }, [initialLegs]);

  const queryAndMapRealtimeLegs = useCallback(
    async legs => {
      if (!legs.length) {
        return {};
      }

      const legQueries = legs
        .filter(leg => leg.transitLeg && legTime(leg.end) > time)
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
    if (
      !initialLegs?.length ||
      time >= legTime(initialLegs[initialLegs.length - 1].end)
    ) {
      return;
    }

    const rtLegMap = await queryAndMapRealtimeLegs(planarLegs).catch(err =>
      // eslint-disable-next-line no-console
      console.error('Failed to query and map real time legs', err),
    );

    const rtLegs = planarLegs.map(l => {
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
      // copy leg times so that modification will not change original times
      return { ...l, start: { ...l.start }, end: { ...l.end } };
    });
    // shift non-transit-legs to match possibly changed transit legs
    matchLegEnds(rtLegs);
    setRealTimeLegs(rtLegs);
  }, [planarLegs, queryAndMapRealtimeLegs]);

  useEffect(() => {
    fetchAndSetRealtimeLegs();

    const interval = setInterval(() => {
      fetchAndSetRealtimeLegs();
      setTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchAndSetRealtimeLegs]);

  const { firstLeg, lastLeg, currentLeg, nextLeg, previousLeg } =
    getLegsOfInterest(
      realTimeLegs,
      time,
      previousFinishedLeg.current,
      itineraryStarted.current,
    );

  previousFinishedLeg.current = previousLeg;
  if (currentLeg) {
    itineraryStarted.current = true;
  }
  // return wait legs as undefined as they are not a global concept
  return {
    realTimeLegs,
    time,
    origin,
    firstLeg,
    lastLeg,
    previousLeg: previousLeg?.mode === LegMode.Wait ? undefined : previousLeg,
    currentLeg: currentLeg?.mode === LegMode.Wait ? undefined : currentLeg,
    nextLeg: nextLeg?.mode === LegMode.Wait ? undefined : nextLeg,
  };
};

export { useRealtimeLegs };
