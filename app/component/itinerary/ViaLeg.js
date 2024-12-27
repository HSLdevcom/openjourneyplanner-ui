import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { legShape, legTimeShape, configShape } from '../../util/shapes';
import { displayDistance } from '../../util/geo-utils';
import { durationToString } from '../../util/timeUtils';
import { legTime, legTimeStr, legDestination } from '../../util/legUtils';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import ItineraryMapAction from './ItineraryMapAction';
import { splitStringToAddressAndPlace } from '../../util/otpStrings';

const getDescription = (mode, distance, duration) => {
  if (mode === 'BICYCLE_WALK') {
    return (
      <FormattedMessage
        id="cyclewalk-distance-duration"
        values={{ distance, duration }}
        defaultMessage="Walk your bike {distance} ({duration})"
      />
    );
  }

  if (mode === 'BICYCLE') {
    return (
      <FormattedMessage
        id="cycle-distance-duration"
        values={{ distance, duration }}
        defaultMessage="Cycle {distance} ({duration})"
      />
    );
  }

  return (
    <FormattedMessage
      id="walk-distance-duration"
      values={{ distance, duration }}
      defaultMessage="Walk {distance} ({duration})"
    />
  );
};

function ViaLeg(props, { config, intl }) {
  const distance = displayDistance(
    parseInt(props.leg.distance, 10),
    config,
    intl.formatNumber,
  );
  const [address, place] = splitStringToAddressAndPlace(props.leg.from.name);
  const startTime = legTimeStr(props.leg.start);
  const arrivalMs = legTime(props.arrival);
  const arrivalTime = legTimeStr(props.arrival);
  const duration = durationToString(props.leg.duration * 1000);
  const stayDuration = legTime(props.leg.start) - arrivalMs;
  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
  return (
    <div key={props.index} className="row itinerary-row">
      <span className="sr-only">
        <FormattedMessage
          id="itinerary-details.via-leg"
          defaultMessage="{arrivalTime} saavu välipisteeseen {viaPoint}. {leaveAction}"
          values={{
            arrivalTime,
            viaPoint: props.leg.from.name,
            leaveAction: (
              <FormattedMessage
                id={
                  props.leg.mode === 'BICYCLE'
                    ? 'itinerary-details.biking-leg'
                    : 'itinerary-details.walk-leg'
                }
                values={{
                  time: startTime,
                  to: legDestination(intl, props.leg),
                  distance,
                  origin: props.leg.from ? props.leg.from.name : '',
                  destination: props.leg.to ? props.leg.to.name : '',
                  duration,
                }}
              />
            ),
          }}
        />
      </span>
      <div
        className="small-2 columns itinerary-time-column via-time-column"
        aria-hidden="true"
      >
        <div className="itinerary-time-column-time via-arrival-time">
          {arrivalTime}
        </div>
        <div className="itinerary-time-column-time via-divider">
          <div className="via-divider-line" />
        </div>
        <div className="itinerary-time-column-time via-departure-time">
          {startTime}
        </div>
      </div>
      <ItineraryCircleLineWithIcon
        isVia
        index={props.index}
        modeClassName={props.leg.mode.toLowerCase()}
      />
      <div className="small-9 columns itinerary-instruction-column via">
        <span className="sr-only">
          <FormattedMessage
            id="itinerary-summary.show-on-map"
            values={{ target: props.leg.from.name || '' }}
          />
        </span>
        <div className="itinerary-leg-first-row via">
          <div>
            <div className="address-container">
              <div className="address">{address}</div>
              <div className="place">{place}</div>
            </div>
            {stayDuration > 0 && (
              <div className="itinerary-via-leg-duration">
                <FormattedMessage
                  id="via-leg-stop-duration"
                  values={{ stayDuration: durationToString(stayDuration) }}
                  defaultMessage="At via point {stayDuration}"
                />
              </div>
            )}
            {props.children}
          </div>
          <ItineraryMapAction
            target={props.leg.from.name || ''}
            focusAction={props.focusAction}
          />
        </div>
        <div className="itinerary-leg-action itinerary-leg-action-content">
          {getDescription(props.leg.mode, distance, duration)}
          <ItineraryMapAction target="" focusAction={props.focusToLeg} />
        </div>
      </div>
    </div>
  );
}

ViaLeg.propTypes = {
  arrival: legTimeShape.isRequired,
  leg: legShape.isRequired,
  index: PropTypes.number.isRequired,
  focusAction: PropTypes.func.isRequired,
  focusToLeg: PropTypes.func.isRequired,
  children: PropTypes.node,
};

ViaLeg.defaultProps = {
  children: undefined,
};

ViaLeg.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

export default ViaLeg;
