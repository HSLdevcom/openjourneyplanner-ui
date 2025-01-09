import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { routerShape } from 'found';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { legTime } from '../../../util/legUtils';
import { legShape, relayShape } from '../../../util/shapes';
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
  { getStore, router },
) {
  const hasPosition = useRef(false);

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
  getStore: PropTypes.func.isRequired,
  router: routerShape.isRequired,
};

NaviContainer.defaultProps = {
  mapRef: undefined,
  isNavigatorIntroDismissed: false,
};

export default NaviContainer;
