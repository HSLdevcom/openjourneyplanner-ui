import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { routerShape } from 'found';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { checkPositioningPermission } from '../../../action/PositionActions';
import { legTime } from '../../../util/legUtils';
import { legShape, relayShape } from '../../../util/shapes';
import NaviBottom from './NaviBottom';
import NaviCardContainer from './NaviCardContainer';
import { useRealtimeLegs } from './hooks/useRealtimeLegs';
import NavigatorOutroModal from './navigatoroutro/NavigatorOutroModal';
import { DESTINATION_RADIUS } from './NaviUtils';

const ADDITIONAL_ARRIVAL_TIME = 60000; // 60 seconds in ms

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
  const [isPositioningAllowed, setPositioningAllowed] = useState(false);

  let position = getStore('PositionStore').getLocationState();
  if (!position.hasLocation) {
    position = null;
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
    if (position) {
      mapRef?.enableMapTracking();
      setPositioningAllowed(true);
    } else {
      checkPositioningPermission().then(permission => {
        if (permission.state === 'granted') {
          mapRef?.enableMapTracking();
          setPositioningAllowed(true);
        }
      });
    }
  }, [mapRef]);

  if (!realTimeLegs?.length) {
    return null;
  }

  const arrivalTime = legTime(lastLeg.end);

  const isDestinationReached =
    position && lastLeg && distance(position, lastLeg.to) <= DESTINATION_RADIUS;

  const isPastExpectedArrival = time > arrivalTime + ADDITIONAL_ARRIVAL_TIME;

  const isJourneyCompleted = isDestinationReached || isPastExpectedArrival;

  return (
    <>
      <NaviCardContainer
        legs={realTimeLegs}
        focusToLeg={
          mapRef?.state.mapTracking || isPositioningAllowed ? null : focusToLeg
        }
        time={time}
        position={position}
        mapLayerRef={mapLayerRef}
        origin={origin}
        currentLeg={time > arrivalTime ? previousLeg : currentLeg}
        nextLeg={nextLeg}
        firstLeg={firstLeg}
        lastLeg={lastLeg}
        isJourneyCompleted={isJourneyCompleted}
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
