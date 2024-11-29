import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { matchShape, routerShape } from 'found';
import { legShape, configShape } from '../../../util/shapes';
import { legTime, legTimeStr } from '../../../util/legUtils';
import NaviCard from './NaviCard';
import NaviStack from './NaviStack';
import {
  getItineraryAlerts,
  getTransitLegState,
  getAdditionalMessages,
  getFirstLastLegs,
  LEGTYPE,
} from './NaviUtils';

const DESTINATION_RADIUS = 20; // meters
const TIME_AT_DESTINATION = 3; // * 10 seconds

function getNextLeg(legs, time) {
  return legs.find(leg => legTime(leg.start) > time);
}

function addMessages(incominMessages, newMessages) {
  newMessages.forEach(m => {
    incominMessages.set(m.id, m);
  });
}
function NaviCardContainer(
  { focusToLeg, time, legs, position },
  { intl, config, match, router },
) {
  const [currentLeg, setCurrentLeg] = useState(null);
  const [cardExpanded, setCardExpanded] = useState(false);
  // All notifications including those user has dismissed.
  const [messages, setMessages] = useState(new Map());
  // notifications that are shown to the user.
  const [activeMessages, setActiveMessages] = useState([]);
  const focusRef = useRef(false);
  // Destination counter. How long user has been at the destination. * 10 seconds
  const destCountRef = useRef(0);
  const [topPosition, setTopPosition] = useState(0);
  const cardRef = useRef(null);

  const handleRemove = index => {
    setActiveMessages(activeMessages.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    setCardExpanded(!cardExpanded);
  };
  useEffect(() => {
    if (cardRef.current) {
      const contentHeight = cardRef.current.clientHeight;

      // Navistack top position depending on main card height.
      setTopPosition(contentHeight + 86);
    }
  }, [currentLeg, cardExpanded]);

  useEffect(() => {
    const newLeg = legs.find(leg => {
      return legTime(leg.start) <= time && time <= legTime(leg.end);
    });

    setCurrentLeg(newLeg);
    const incomingMessages = new Map();

    // Alerts for NaviStack
    addMessages(
      incomingMessages,
      getItineraryAlerts(legs, intl, messages, match.params, router),
    );

    const legChanged = newLeg?.legId
      ? newLeg.legId !== currentLeg?.legId
      : currentLeg?.mode !== newLeg?.mode;
    const l = currentLeg || newLeg;

    if (l) {
      const nextLeg = getNextLeg(legs, legTime(l.start));

      if (nextLeg?.transitLeg) {
        // Messages for NaviStack.
        addMessages(incomingMessages, [
          ...getTransitLegState(nextLeg, intl, messages, time),
          ...getAdditionalMessages(nextLeg, time, intl, config, messages),
        ]);
      }
      if (newLeg && legChanged) {
        focusToLeg?.(newLeg);
      }
      if (legChanged) {
        setCardExpanded(false);
      }
    }
    if (incomingMessages.size || legChanged) {
      // Handle messages when new messages arrives or leg is changed.

      // Current active messages. Filter away legChange messages when leg changes.
      const previousValidMessages = legChanged
        ? activeMessages.filter(m => m.expiresOn !== 'legChange')
        : activeMessages;

      // handle messages that are updated.
      const updatedMessages = previousValidMessages.map(msg => {
        const incoming = incomingMessages.get(msg.id);
        if (incoming) {
          incomingMessages.delete(msg.id);
          return incoming;
        }
        return msg;
      });
      const newMessages = Array.from(incomingMessages.values());
      setActiveMessages([...updatedMessages, ...newMessages]);
      setMessages(new Map([...messages, ...incomingMessages]));
    }

    if (!focusRef.current && focusToLeg) {
      // handle initial focus when not tracking
      if (newLeg) {
        focusToLeg(newLeg);
        destCountRef.current = 0;
      } else {
        const { first, last } = getFirstLastLegs(legs);
        if (time < legTime(first.start)) {
          focusToLeg(first);
        } else {
          focusToLeg(last);
        }
      }
      focusRef.current = true;
    }

    // User position and distance from currentleg endpoint.
    if (
      position &&
      currentLeg &&
      distance(position, currentLeg.to) <= DESTINATION_RADIUS
    ) {
      destCountRef.current += 1;
    } else {
      // Todo: this works in transit legs, but do we need additional logic for bikes / scooters?
      destCountRef.current = 0;
    }
  }, [time]);

  const { first, last } = getFirstLastLegs(legs);
  let legType;
  const t = currentLeg ? legTime(currentLeg.start) : time;
  const nextLeg = getNextLeg(legs, t);

  if (time < legTime(first.start)) {
    legType = LEGTYPE.PENDING;
  } else if (currentLeg) {
    if (!currentLeg.transitLeg) {
      if (destCountRef.current >= TIME_AT_DESTINATION) {
        legType = LEGTYPE.WAIT;
      } else {
        legType = LEGTYPE.MOVE;
      }
    } else {
      legType = LEGTYPE.TRANSIT;
    }
  } else if (time > legTime(last.end)) {
    legType = LEGTYPE.END;
  } else {
    legType = LEGTYPE.WAIT;
  }

  return (
    <>
      <button
        type="button"
        className={`navitop ${cardExpanded ? 'expanded' : ''}`}
        onClick={handleClick}
        ref={cardRef}
      >
        <div className="content">
          <NaviCard
            leg={currentLeg}
            nextLeg={nextLeg}
            cardExpanded={cardExpanded}
            legType={legType}
            startTime={legTimeStr(first.start)}
            time={time}
          />
        </div>
      </button>
      {activeMessages.length > 0 && (
        <NaviStack
          messages={activeMessages}
          handleRemove={handleRemove}
          topPosition={topPosition}
        />
      )}
    </>
  );
}

NaviCardContainer.propTypes = {
  focusToLeg: PropTypes.func,
  time: PropTypes.number.isRequired,
  legs: PropTypes.arrayOf(legShape).isRequired,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
  }),

  /*
  focusToPoint: PropTypes.func.isRequired,
  */
};

NaviCardContainer.defaultProps = {
  focusToLeg: undefined,
  position: undefined,
};

NaviCardContainer.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
  match: matchShape.isRequired,
  router: routerShape.isRequired,
};

export default NaviCardContainer;
