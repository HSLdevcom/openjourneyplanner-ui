import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import cx from 'classnames';
import { Link } from 'found';
import { legShape, parkShape, configShape } from '../../util/shapes';
import Icon from '../Icon';
import ItineraryMapAction from './ItineraryMapAction';
import { displayDistance } from '../../util/geo-utils';
import { durationToString } from '../../util/timeUtils';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import { PREFIX_CARPARK } from '../../util/path';
import ItineraryCircleLine from './ItineraryCircleLine';
import { legTimeStr, legDestination } from '../../util/legUtils';

function CarParkLeg(props, { config, intl }) {
  const distance = displayDistance(
    parseInt(props.leg.distance, 10),
    config,
    intl.formatNumber,
  );
  const duration = durationToString(props.leg.duration * 1000);
  const firstLegClassName = props.index === 0 ? 'first' : '';

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
  return (
    <div key={props.index} className="row itinerary-row">
      <span className="sr-only">
        {!props.noWalk && (
          <FormattedMessage
            id="itinerary-details.walk-leg"
            values={{
              time: legTimeStr(props.leg.start),
              distance,
              to: legDestination(intl, props.leg),
              origin: props.leg.from ? props.leg.from.name : '',
              destination: props.leg.to ? props.leg.to.name : '',
              duration,
            }}
          />
        )}
      </span>
      <div className="small-2 columns itinerary-time-column" aria-hidden="true">
        <div className="itinerary-time-column-time">
          {legTimeStr(props.leg.start)}
        </div>
      </div>
      {props.noWalk ? (
        <ItineraryCircleLine
          index={props.index}
          modeClassName="car-park-walk"
          carPark
        />
      ) : (
        <ItineraryCircleLineWithIcon
          index={props.index}
          modeClassName="walk"
          carPark
        />
      )}

      <div
        className={`small-9 columns itinerary-instruction-column ${firstLegClassName} ${props.leg.mode.toLowerCase()}`}
      >
        <div className={`itinerary-leg-first-row ${firstLegClassName}`}>
          <div className="address-container">
            <Link
              onClick={e => {
                e.stopPropagation();
              }}
              to={`/${PREFIX_CARPARK}/${props.carPark.vehicleParkingId}`}
            >
              <div className="address">
                <FormattedMessage id="car_park" defaultMessage="Park & Ride" />
                {props.leg.isViaPoint && (
                  <Icon
                    img="icon-icon_mapMarker-via"
                    className="itinerary-mapmarker-icon"
                  />
                )}
                {props.carPark && (
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color={config.colors.primary}
                  />
                )}
              </div>
            </Link>
            <div className="place">{props.carPark.name}</div>
          </div>
          <div>{props.children}</div>
          <ItineraryMapAction
            target={props.leg.from.name || ''}
            focusAction={props.focusAction}
          />
        </div>
        {!props.noWalk && (
          <div
            className={cx(
              'itinerary-leg-action',
              'car',
              'itinerary-leg-action-content',
            )}
          >
            <FormattedMessage
              id="walk-distance-duration"
              values={{ distance, duration }}
              defaultMessage="Walk {distance} ({duration})"
            />
            <ItineraryMapAction
              target={props.leg.from.name || ''}
              focusAction={props.focusAction}
            />
          </div>
        )}
      </div>
    </div>
  );
}

CarParkLeg.propTypes = {
  leg: legShape.isRequired,
  index: PropTypes.number.isRequired,
  focusAction: PropTypes.func.isRequired,
  children: PropTypes.node,
  carPark: parkShape.isRequired,
  noWalk: PropTypes.bool,
};

CarParkLeg.defaultProps = {
  children: undefined,
  noWalk: false,
};

CarParkLeg.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

export default CarParkLeg;
