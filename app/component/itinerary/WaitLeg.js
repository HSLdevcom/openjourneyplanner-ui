import PropTypes from 'prop-types';
import React from 'react';
import Link from 'found/Link';
import { FormattedMessage } from 'react-intl';
import { legShape, legTimeShape, configShape } from '../../util/shapes';
import Icon from '../Icon';
import { durationToString } from '../../util/timeUtils';
import ItineraryMapAction from './ItineraryMapAction';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import { PREFIX_STOPS } from '../../util/path';
import { legTimeStr } from '../../util/legUtils';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
function WaitLeg(
  { children, leg, start, waitTime, focusAction, index, icon },
  { config },
) {
  const modeClassName = 'wait';
  return (
    <div className="row itinerary-row">
      <span className="sr-only">
        <FormattedMessage
          id="wait-amount-of-time"
          values={{
            duration: durationToString(waitTime),
          }}
        />
      </span>
      <div className="small-2 columns itinerary-time-column" aria-hidden="true">
        <div className="itinerary-time-column-time">{legTimeStr(start)}</div>
      </div>
      <ItineraryCircleLineWithIcon
        modeClassName={modeClassName}
        index={index}
        icon={icon}
      />
      <div className="small-9 columns itinerary-instruction-column wait">
        <span className="sr-only">
          <FormattedMessage
            id="itinerary-summary.show-on-map"
            values={{ target: leg.to.name || '' }}
          />
        </span>
        <div className="itinerary-leg-first-row wait">
          <div className="itinerary-leg-row">
            <Link
              onClick={e => {
                e.stopPropagation();
              }}
              to={`/${PREFIX_STOPS}/${leg.to.stop.gtfsId}`}
            >
              {leg.to.name}
              {leg.isViaPoint && (
                <Icon
                  img="icon-icon_mapMarker-via"
                  className="itinerary-mapmarker-icon"
                />
              )}
              <Icon
                img="icon-icon_arrow-collapse--right"
                className="itinerary-arrow-icon"
                color={config.colors.primary}
              />
            </Link>
            <div className="stop-code-container">{children}</div>
          </div>
          <ItineraryMapAction
            target={leg.to.name || ''}
            focusAction={focusAction}
          />
        </div>
        <div className="itinerary-leg-action itinerary-leg-action-content">
          <FormattedMessage
            id="wait-amount-of-time"
            values={{ duration: `(${durationToString(waitTime)})` }}
            defaultMessage="Wait {duration}"
          />
          <ItineraryMapAction target="" focusAction={focusAction} />
        </div>
      </div>
    </div>
  );
}

WaitLeg.propTypes = {
  start: legTimeShape.isRequired,
  focusAction: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  children: PropTypes.node,
  waitTime: PropTypes.number.isRequired,
  leg: legShape.isRequired,
  icon: PropTypes.string,
};

WaitLeg.defaultProps = {
  children: undefined,
  icon: undefined,
};

WaitLeg.contextTypes = {
  config: configShape.isRequired,
};

export default WaitLeg;
