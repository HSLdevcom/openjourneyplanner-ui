import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { legShape } from '../../util/shapes';
import TransitLeg from './TransitLeg';
import Icon from '../Icon';

const CallAgencyLeg = ({ leg, ...props }) => {
  const modeClassName = 'call';
  return (
    <TransitLeg mode={modeClassName} leg={leg} {...props}>
      <div className="itinerary-transit-leg-route call">
        <Icon img="icon-icon_call" className="call-icon" />
        <span className="warning-message">
          <FormattedMessage
            id="warning-call-agency"
            values={{
              routeName: (
                <span className="route-name">{leg.route.longName}</span>
              ),
            }}
            defaultMessage="Only on demand: {routeName}, which needs to be booked in advance."
          />
          <div className="itinerary-warning-agency-container" />
          {leg.route.agency.phone && (
            <div className="call-button">
              <a href={`tel:${leg.route.agency.phone}`}>
                <FormattedMessage
                  id="call"
                  defaultMessage="Call"
                  values={{ number: leg.route.agency.phone }}
                />
              </a>
            </div>
          )}
        </span>
      </div>
    </TransitLeg>
  );
};

CallAgencyLeg.propTypes = {
  leg: legShape.isRequired,
  index: PropTypes.number.isRequired,
};

export default CallAgencyLeg;
