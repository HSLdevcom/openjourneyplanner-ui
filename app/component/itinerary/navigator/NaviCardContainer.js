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
  DESTINATION_RADIUS,
} from './NaviUtils';
import { updateClient, getTopics } from '../ItineraryPageUtils';

const TIME_AT_DESTINATION = 3; // * 10 seconds
const TOPBAR_PADDING = 8; // pixels
const HIDE_TOPCARD_DURATION = 2000; // milliseconds

function addMessages(incominMessages, newMessages) {
  newMessages.forEach(m => {
    incominMessages.set(m.id, m);
  });
}

const handleLegChange = (leg, firstLeg, time) => {
  let legType;
  if (time < legTime(firstLeg.start)) {
    legType = LEGTYPE.PENDING;
  } else if (leg) {
    if (!leg.transitLeg) {
      if (leg.current >= TIME_AT_DESTINATION) {
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
  return legType;
};

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
    previousLeg,
    isJourneyCompleted,
  },
  context,
) {
  const [cardExpanded, setCardExpanded] = useState(false);
  // All notifications including those user has dismissed.
  const [messages, setMessages] = useState(new Map());
  // notifications that are shown to the user.
  const [activeMessages, setActiveMessages] = useState([]);
  const [legChanging, setLegChanging] = useState(false);
  const legRef = useRef(currentLeg);
  const focusRef = useRef(false);
  // Destination counter. How long user has been at the destination. * 10 seconds
  const destCountRef = useRef(0);
  const cardRef = useRef(null);
  const { intl, config, match, router } = context;
  const handleRemove = index => {
    const msg = messages.get(activeMessages[index].id);
    msg.closed = true; // remember closing action
    setActiveMessages(activeMessages.filter((_, i) => i !== index));
  };

  const handleClick = () => {
    setCardExpanded(!cardExpanded);
  };

  // track only relevant vehicles for the journey.
  const getNaviTopics = () =>
    getTopics(
      legs.filter(leg => legTime(leg.end) >= time),
      config,
    );

  useEffect(() => {
    updateClient(getNaviTopics(), context);
  }, []);

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
      getItineraryAlerts(
        legs,
        time,
        position,
        origin,
        intl,
        messages,
        match.params,
        router,
      ),
    );

    if (nextLeg?.transitLeg) {
      // Messages for NaviStack.
      addMessages(incomingMessages, [
        ...getTransitLegState(nextLeg, intl, messages, time),
        ...getAdditionalMessages(
          currentLeg,
          nextLeg,
          firstLeg,
          time,
          intl,
          config,
          messages,
        ),
      ]);
    }
    let timeoutId;
    if (legChanged) {
      updateClient(getNaviTopics(), context);
      setCardExpanded(false);
      setLegChanging(true);
      timeoutId = setTimeout(() => {
        setLegChanging(false);
      }, HIDE_TOPCARD_DURATION);
      if (currentLeg) {
        focusToLeg?.(currentLeg);
      }
    }

    // Update messages if there are changes
    const expired = activeMessages.find(m => m.expiresOn < time);
    if (incomingMessages.size || expired) {
      // Current active messages. Filter away expired messages.
      const previousValidMessages = expired
        ? activeMessages.filter(m => !m.expiresOn || m.expiresOn > time)
        : activeMessages;

      // handle messages that are updated.
      const keptMessages = previousValidMessages.filter(
        msg => !incomingMessages.get(msg.id),
      );
      const newMessages = Array.from(incomingMessages.values());
      setActiveMessages([...keptMessages, ...newMessages]);
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

    return () => clearTimeout(timeoutId);
  }, [time]);

  // LegChange fires animation, we need to keep the old data until card goes out of the view.
  const l = legChanging ? previousLeg : currentLeg;
  const legType = handleLegChange(l, firstLeg, time);

  const containerTopPosition =
    mapLayerRef.current.getBoundingClientRect().top + TOPBAR_PADDING;
  let className;
  if (isJourneyCompleted) {
    className = 'slide-out';
  } else if (legChanging) {
    className = 'hide-card';
  } else {
    className = 'show-card';
  }
  return (
    <div
      className={`navi-card-container ${className}`}
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
            leg={l}
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
        <NaviStack messages={activeMessages} handleRemove={handleRemove} />
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
  mapLayerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
    .isRequired,
  origin: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  currentLeg: legShape,
  nextLeg: legShape,
  firstLeg: legShape,
  lastLeg: legShape,
  previousLeg: legShape,
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
  previousLeg: undefined,
  isJourneyCompleted: false,
};

NaviCardContainer.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
  match: matchShape.isRequired,
  router: routerShape.isRequired,
  executeAction: PropTypes.func.isRequired,
  getStore: PropTypes.func.isRequired,
};

export default NaviCardContainer;
