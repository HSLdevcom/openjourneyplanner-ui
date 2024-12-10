import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { matchShape, routerShape } from 'found';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { intlShape } from 'react-intl';
import { legTime, legTimeStr } from '../../../util/legUtils';
import { configShape, legShape } from '../../../util/shapes';
import NaviCard from './NaviCard';
import NaviStack from './NaviStack';
import {
  getAdditionalMessages,
  getItineraryAlerts,
  getTransitLegState,
  LEGTYPE,
} from './NaviUtils';

const DESTINATION_RADIUS = 20; // meters
const TIME_AT_DESTINATION = 3; // * 10 seconds
const TOPBAR_PADDING = 8; // pixels

function addMessages(incominMessages, newMessages) {
  newMessages.forEach(m => {
    incominMessages.set(m.id, m);
  });
}
function NaviCardContainer(
  {
    focusToLeg,
    time,
    legs,
    position,
    origin,
    mapLayerRef,
    currentLeg,
    nextLeg,
    firstLeg,
    lastLeg,
    isJourneyCompleted,
  },
  { intl, config, match, router },
) {
  const [cardExpanded, setCardExpanded] = useState(false);
  // All notifications including those user has dismissed.
  const [messages, setMessages] = useState(new Map());
  // notifications that are shown to the user.
  const [activeMessages, setActiveMessages] = useState([]);
  const [topPosition, setTopPosition] = useState(0);

  const legRef = useRef(currentLeg);
  const focusRef = useRef(false);
  // Destination counter. How long user has been at the destination. * 10 seconds
  const destCountRef = useRef(0);
  const cardRef = useRef(null);

  const handleRemove = index => {
    setActiveMessages(activeMessages.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    setCardExpanded(!cardExpanded);
  };

  useEffect(() => {
    if (cardRef.current) {
      const contentHeight = cardRef.current.getBoundingClientRect();
      // Navistack top position depending on main card height.
      setTopPosition(contentHeight.bottom + TOPBAR_PADDING);
    }
  }, [currentLeg, cardExpanded]);

  useEffect(() => {
    const incomingMessages = new Map();

    const legChanged = legRef.current?.legId
      ? legRef.current.legId !== currentLeg?.legId
      : legRef.current?.mode !== currentLeg?.mode;

    if (legChanged) {
      legRef.current = currentLeg;
    }

    // Alerts for NaviStack
    addMessages(
      incomingMessages,
      getItineraryAlerts(legs, intl, messages, match.params, router),
    );

    if (currentLeg) {
      if (nextLeg?.transitLeg) {
        // Messages for NaviStack.
        addMessages(incomingMessages, [
          ...getTransitLegState(nextLeg, intl, messages, time),
          ...getAdditionalMessages(nextLeg, time, intl, config, messages),
        ]);
      }
      if (legChanged) {
        focusToLeg?.(currentLeg);
        setCardExpanded(false);
      }
    }
    if (incomingMessages.size || legChanged) {
      // Handle messages when new messages arrives.

      // Current active messages. Filter away expired messages.
      const previousValidMessages = legChanged
        ? activeMessages.filter(m => m.expiresOn < time)
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
      if (currentLeg) {
        focusToLeg(currentLeg);
        destCountRef.current = 0;
      } else if (time < legTime(firstLeg.start)) {
        focusToLeg(firstLeg);
      } else {
        focusToLeg(lastLeg);
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

  let legType;

  if (time < legTime(firstLeg.start)) {
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
  } else {
    legType = LEGTYPE.WAIT;
  }

  const containerTopPosition =
    mapLayerRef.current.getBoundingClientRect().top + TOPBAR_PADDING;

  return (
    <div
      className={`navi-card-container ${isJourneyCompleted ? 'slide-out' : ''}`}
      style={{ top: containerTopPosition }}
    >
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
            startTime={legTimeStr(firstLeg.start)}
            time={time}
            position={position}
            origin={origin}
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
    </div>
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
  mapLayerRef: PropTypes.func.isRequired,
  origin: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  currentLeg: legShape,
  nextLeg: legShape,
  firstLeg: legShape,
  lastLeg: legShape,
  isJourneyCompleted: PropTypes.bool,

  /*
  focusToPoint: PropTypes.func.isRequired,
  */
};

NaviCardContainer.defaultProps = {
  focusToLeg: undefined,
  position: undefined,
  currentLeg: undefined,
  nextLeg: undefined,
  firstLeg: undefined,
  lastLeg: undefined,
  isJourneyCompleted: false,
};

NaviCardContainer.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
  match: matchShape.isRequired,
  router: routerShape.isRequired,
};

export default NaviCardContainer;
