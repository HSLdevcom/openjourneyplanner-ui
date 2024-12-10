import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { configShape } from '../../../util/shapes';
import { epochToTime } from '../../../util/timeUtils';

export default function NaviBottom(
  { setNavigation, arrival, time },
  { config },
) {
  const remainingDuration = Math.ceil((arrival - time) / 60000); // ms to minutes
  return (
    <div className="navi-bottom-sheet">
      <div className="divider" />
      <div className="navi-bottom-controls">
        <button
          type="button"
          onClick={() => setNavigation(false)}
          className="navi-close-button"
        >
          <FormattedMessage id="navigation-quit" />
        </button>

        {remainingDuration >= 0 && (
          <div className="navi-time">
            <span>
              <FormattedMessage
                id="travel-time"
                values={{ min: remainingDuration }}
              />
            </span>
            <span className="navi-daytime">{epochToTime(arrival, config)}</span>
          </div>
        )}
        {config.ticketLink && (
          <button type="button" className="navi-ticket-button">
            <a
              onClick={e => {
                e.stopPropagation();
              }}
              href={config.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FormattedMessage id="navigation-ticket" />
            </a>
          </button>
        )}
      </div>
    </div>
  );
}

NaviBottom.propTypes = {
  setNavigation: PropTypes.func.isRequired,
  arrival: PropTypes.number.isRequired,
  time: PropTypes.number.isRequired,
};

NaviBottom.contextTypes = {
  config: configShape.isRequired,
};
