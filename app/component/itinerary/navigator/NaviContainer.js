import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { routerShape } from 'found';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { legTime } from '../../../util/legUtils';
import { legShape, relayShape } from '../../../util/shapes';
import {
  startLocationWatch,
  stopLocationWatch,
} from '../../../action/PositionActions';
import NaviBottom from './NaviBottom';
import NaviCardContainer from './NaviCardContainer';
import { useRealtimeLegs } from './hooks/useRealtimeLegs';
import NavigatorOutroModal from './navigatoroutro/NavigatorOutroModal';
import { DESTINATION_RADIUS, summaryString } from './NaviUtils';

const ADDITIONAL_ARRIVAL_TIME = 60000; // 60 seconds in ms
const LEGLOG = true;

function NaviContainer(
  {
    legs,
    focusToLeg,
    relayEnvironment,
    setNavigation,
    isNavigatorIntroDismissed,
    mapRef,
    mapLayerRef,
  },
  { executeAction, getStore, router },
) {
  const hasPosition = useRef(false);
  const prevPos = useRef(undefined);
  const posFrozen = useRef(0);

  let position = getStore('PositionStore').getLocationState();
  if (!position.hasLocation) {
    position = null;
  } else {
    hasPosition.current = true;
  }

  const {
    realTimeLegs,
    time,
    origin,
    firstLeg,
    lastLeg,
    previousLeg,
    currentLeg,
    nextLeg,
  } = useRealtimeLegs(relayEnvironment, legs);

  useEffect(() => {
    mapRef?.enableMapTracking(); // try always, shows annoying notifier
  }, [mapRef, hasPosition.current]);

  useEffect(() => {
    if (position && prevPos.current) {
      if (
        prevPos.current.lat === position.lat &&
        prevPos.current.lon === position.lon
      ) {
        posFrozen.current += 1;
        if (posFrozen.current === 3) {
          // window.alert('Restarting geolocation watch');
          executeAction(stopLocationWatch);
          setTimeout(() => executeAction(startLocationWatch), 10);
        }
      } else {
        posFrozen.current = 0;
      }
    }
    prevPos.current = position;
  }, [time]);

  if (!realTimeLegs?.length) {
    return null;
  }

  const arrivalTime = legTime(lastLeg.end);

  const isDestinationReached =
    position && distance(position, lastLeg.to) <= DESTINATION_RADIUS;

  const isPastExpectedArrival = time > arrivalTime + ADDITIONAL_ARRIVAL_TIME;

  const isJourneyCompleted = isDestinationReached || isPastExpectedArrival;

  if (LEGLOG) {
    // eslint-disable-next-line
    console.log(...summaryString(realTimeLegs, time, previousLeg, currentLeg, nextLeg));
  }

  return (
    <>
      <NaviCardContainer
        legs={realTimeLegs}
        focusToLeg={position ? null : focusToLeg}
        time={time}
        position={position}
        mapLayerRef={mapLayerRef}
        origin={origin}
        currentLeg={time > arrivalTime ? previousLeg : currentLeg}
        nextLeg={nextLeg}
        firstLeg={firstLeg}
        lastLeg={lastLeg}
        isJourneyCompleted={isJourneyCompleted}
        previousLeg={previousLeg}
      />
      {isJourneyCompleted && isNavigatorIntroDismissed && (
        <NavigatorOutroModal
          destination={lastLeg.to.name}
          onClose={() => router.push('/')}
        />
      )}
      <NaviBottom
        setNavigation={setNavigation}
        arrival={arrivalTime}
        time={time}
      />
    </>
  );
}

NaviContainer.propTypes = {
  legs: PropTypes.arrayOf(legShape).isRequired,
  focusToLeg: PropTypes.func.isRequired,
  relayEnvironment: relayShape.isRequired,
  setNavigation: PropTypes.func.isRequired,
  isNavigatorIntroDismissed: PropTypes.bool,
  // eslint-disable-next-line
  mapRef: PropTypes.object,
  mapLayerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    .isRequired,
};

NaviContainer.contextTypes = {
  executeAction: PropTypes.func,
  getStore: PropTypes.func.isRequired,
  router: routerShape.isRequired,
};

NaviContainer.defaultProps = {
  mapRef: undefined,
  isNavigatorIntroDismissed: false,
};

export default NaviContainer;
