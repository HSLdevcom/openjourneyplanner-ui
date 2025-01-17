import PropTypes from 'prop-types';
import cx from 'classnames';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { legShape, parkShape, configShape } from '../../util/shapes';
import { legTimeStr, legDestination } from '../../util/legUtils';
import { displayDistance } from '../../util/geo-utils';
import { durationToString } from '../../util/timeUtils';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import ItineraryMapAction from './ItineraryMapAction';
import Icon from '../Icon';

const BikeParkLeg = (
  { leg, index, focusAction, bikePark },
  { intl, config },
) => {
  const distance = displayDistance(
    parseInt(leg.distance, 10),
    config,
    intl.formatNumber,
  );
  const duration = durationToString(leg.duration * 1000);
  const time = legTimeStr(leg.start);
  return (
    <div key={index} className="row itinerary-row">
      <span className="sr-only">
        <FormattedMessage
          id="itinerary-details.walk-leg"
          values={{
            time,
            distance,
            to: legDestination(intl, leg),
            origin: leg.from ? leg.from.name : '',
            destination: leg.to ? leg.to.name : '',
            duration,
          }}
        />
      </span>
      <div className="small-2 columns itinerary-time-column" aria-hidden="true">
        <div className="itinerary-time-column-time">{time}</div>
      </div>
      <ItineraryCircleLineWithIcon
        bikePark
        index={index}
        modeClassName="walk"
      />
      <div className="small-9 columns itinerary-instruction-column">
        <div className={cx('itinerary-leg-first-row', 'bicycle')}>
          <div className="address-container">
            {/*  TODO linking when bikepark pages are available */}
            {/* <Link
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  to={''}
                > */}
            <div className="address">
              <FormattedMessage id="bike-park" />
              {leg.isViaPoint && (
                <Icon
                  img="icon-icon_mapMarker-via"
                  className="itinerary-mapmarker-icon"
                />
              )}
              {/* TODO */}
              {/* {bikePark && (
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color={config.colors.primary}
                  />
                )} */}
            </div>
            {/* </Link> */}
            <div className="place">{bikePark.name}</div>
          </div>
          <ItineraryMapAction
            target={leg.from.name || ''}
            focusAction={focusAction}
          />
        </div>
        <div
          className={cx(
            'itinerary-leg-action',
            'bike',
            'itinerary-leg-action-content',
          )}
        >
          <FormattedMessage
            id="walk-distance-duration"
            values={{ distance, duration }}
            defaultMessage="Walk {distance} ({duration})"
          />
          <ItineraryMapAction
            target={leg.from.name || ''}
            focusAction={focusAction}
          />
        </div>
      </div>
    </div>
  );
};
BikeParkLeg.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

BikeParkLeg.propTypes = {
  index: PropTypes.number.isRequired,
  focusAction: PropTypes.func.isRequired,
  bikePark: parkShape.isRequired,
  leg: legShape.isRequired,
};

export default BikeParkLeg;
