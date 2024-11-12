import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'react-intl';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { legShape, configShape } from '../../util/shapes';
import { legTime, legTimeStr } from '../../util/legUtils';
import NaviCard from './NaviCard';
import NaviStack from './NaviStack';
import {
  getItineraryAlerts,
  getTransitLegState,
  getAdditionalMessages,
} from './NaviUtils';

const DESTINATION_RADIUS = 20; // meters
const TIME_AT_DESTINATION = 3; // * 10 seconds

function getFirstLastLegs(legs) {
  const first = legs[0];
  const last = legs[legs.length - 1];
  return { first, last };
}

function NaviCardContainer(
  { focusToLeg, time, realTimeLegs, position },
  { intl, config },
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

  const handleClick = () => {
    setCardExpanded(!cardExpanded);
  };

  useEffect(() => {
    const newLeg = realTimeLegs.find(leg => {
      return legTime(leg.start) <= time && time <= legTime(leg.end);
    });

    const incomingMessages = new Map();

    // TODO proper alert handling.
    // Alerts for NaviStack
    const alerts = getItineraryAlerts(realTimeLegs, intl, messages);
    alerts.forEach(alert => {
      incomingMessages.set(alert.id, alert);
    });

    const legChanged = newLeg?.legId
      ? newLeg.legId !== currentLeg?.legId
      : currentLeg?.mode !== newLeg?.mode;
    const l = currentLeg || newLeg;

    if (l) {
      const nextLeg = realTimeLegs.find(
        leg => legTime(leg.start) > legTime(l.start),
      );
      if (nextLeg?.transitLeg) {
        // Messages for NaviStack.
        const transitLegState = getTransitLegState(nextLeg, intl, messages);
        if (transitLegState) {
          incomingMessages.set(transitLegState.id, transitLegState);
        }
        const additionalMsgs = getAdditionalMessages(
          nextLeg,
          time,
          intl,
          config,
          messages,
        );
        if (additionalMsgs) {
          additionalMsgs.forEach(m => {
            incomingMessages.set(m.id, m);
          });
        }
      }
      if (newLeg) {
        focusToLeg?.(newLeg);
      }
      if (legChanged) {
        setCurrentLeg(newLeg);
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
        const { first, last } = getFirstLastLegs(realTimeLegs);
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

  const { first, last } = getFirstLastLegs(realTimeLegs);

  let naviTopContent;
  if (time < legTime(first.start)) {
    naviTopContent = (
      <FormattedMessage
        id="navigation-journey-start"
        values={{ time: legTimeStr(first.start) }}
      />
    );
  } else if (currentLeg) {
    if (!currentLeg.transitLeg) {
      const nextLeg = realTimeLegs.find(leg => {
        return legTime(leg.start) > legTime(currentLeg.start);
      });
      let legType;
      if (destCountRef.current >= TIME_AT_DESTINATION) {
        legType = 'wait';
      } else {
        legType = 'move';
      }
      naviTopContent = (
        <NaviCard
          leg={currentLeg}
          nextLeg={nextLeg}
          cardExpanded={cardExpanded}
          legType={legType}
        />
      );
    } else {
      naviTopContent = `Tracking ${currentLeg?.mode} leg`;
    }
  } else if (time > legTime(last.end)) {
    naviTopContent = <FormattedMessage id="navigation-journey-end" />;
  } else {
    naviTopContent = <FormattedMessage id="navigation-wait" />;
  }
  const handleRemove = index => {
    setActiveMessages(activeMessages.filter((_, i) => i !== index));
  };

  return (
    <>
      <button
        type="button"
        className={`navitop ${cardExpanded ? 'expanded' : ''}`}
        onClick={handleClick}
      >
        <div className="content">{naviTopContent}</div>
      </button>
      {activeMessages.length > 0 && (
        <NaviStack
          messages={activeMessages}
          cardExpanded={cardExpanded}
          handleRemove={handleRemove}
        />
      )}
    </>
  );
}

NaviCardContainer.propTypes = {
  focusToLeg: PropTypes.func,
  time: PropTypes.number.isRequired,
  realTimeLegs: PropTypes.arrayOf(legShape).isRequired,
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
};

export default NaviCardContainer;
