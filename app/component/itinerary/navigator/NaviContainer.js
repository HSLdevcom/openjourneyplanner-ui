import PropTypes from 'prop-types';
import React from 'react';
import { legTime } from '../../../util/legUtils';
import { itineraryShape, relayShape } from '../../../util/shapes';
import NaviBottom from './NaviBottom';
import NaviCardContainer from './NaviCardContainer';
import { useRealtimeLegs } from './hooks/useRealtimeLegs';

function NaviContainer(
  { itinerary, focusToLeg, relayEnvironment, setNavigation, mapRef },
  { getStore },
) {
  const { legs } = itinerary;
  const position = getStore('PositionStore').getLocationState();

  const { realTimeLegs, time, isPositioningAllowed } = useRealtimeLegs(
    legs,
    mapRef,
    relayEnvironment,
  );

  // recompute estimated arrival
  let lastTransitLeg;
  let arrivalChange = 0;

  legs.forEach(leg => {
    if (leg.transitLeg) {
      lastTransitLeg = leg;
    }
  });

  if (lastTransitLeg) {
    const rtLeg = realTimeLegs.find(leg => {
      return leg.legId === lastTransitLeg.legId;
    });
    arrivalChange = legTime(rtLeg.end) - legTime(lastTransitLeg.end);
  }

  const arrivalTime = legTime(legs[legs.length - 1].end) + arrivalChange;

  return (
    <>
      <NaviCardContainer
        itinerary={itinerary}
        realTimeLegs={realTimeLegs}
        focusToLeg={
          mapRef?.state.mapTracking || isPositioningAllowed ? null : focusToLeg
        }
        time={time}
        position={position}
      />
      <NaviBottom setNavigation={setNavigation} arrival={arrivalTime} />
    </>
  );
}

NaviContainer.propTypes = {
  itinerary: itineraryShape.isRequired,
  focusToLeg: PropTypes.func.isRequired,
  relayEnvironment: relayShape.isRequired,
  setNavigation: PropTypes.func.isRequired,
  // eslint-disable-next-line
  mapRef: PropTypes.object,
};

NaviContainer.contextTypes = {
  getStore: PropTypes.func.isRequired,
};

NaviContainer.defaultProps = { mapRef: undefined };

export default NaviContainer;
