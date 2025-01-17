import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { displayDistance } from '../../../util/geo-utils';
import { legShape, configShape } from '../../../util/shapes';
import { legDestination, legTimeStr, legTime } from '../../../util/legUtils';
import RouteNumber from '../../RouteNumber';
import {
  LEGTYPE,
  getLocalizedMode,
  getToLocalizedMode,
  getRemainingTraversal,
} from './NaviUtils';
import { durationToString } from '../../../util/timeUtils';
import { getRouteMode } from '../../../util/modeUtils';

export default function NaviInstructions(
  { leg, nextLeg, instructions, legType, time, position, origin },
  { intl, config },
) {
  const withRealTime = (rt, children) => (
    <span className={cx('bold', { realtime: rt })}>{children}</span>
  );

  if (legType === LEGTYPE.MOVE) {
    const remainingTraversal = getRemainingTraversal(
      leg,
      position,
      origin,
      time,
    );
    const distance = remainingTraversal * leg.distance;

    return (
      <>
        <div className="notification-header">
          <FormattedMessage id={instructions} defaultMessage="Go to" />
          &nbsp;
          {legDestination(intl, leg, null, nextLeg)}
        </div>

        <div className={cx('duration', { realtime: !!position })}>
          {displayDistance(distance, config, intl.formatNumber)}&nbsp;
          {durationToString(legTime(leg.end) - time)}
        </div>
      </>
    );
  }
  if (legType === LEGTYPE.WAIT && nextLeg.transitLeg) {
    const { mode, headsign, route, start } = nextLeg;
    const hs = headsign || nextLeg.trip?.tripHeadsign;

    const remainingDuration = Math.max(
      Math.ceil((legTime(start) - time) / 60000),
      0,
    ); // ms to minutes, >= 0
    const rt = nextLeg.realtimeState === 'UPDATED';
    const values = {
      duration: withRealTime(rt, remainingDuration),
      legTime: withRealTime(rt, legTimeStr(start)),
    };
    const routeMode = getRouteMode(route, config);
    const iconColor =
      config.colors.iconColors[`mode-${routeMode}`] ||
      route.color ||
      'currentColor';

    return (
      <>
        <div className="notification-header">
          <FormattedMessage
            id="navigation-get-mode"
            values={{ mode: getToLocalizedMode(mode, intl) }}
            defaultMessage="Get on the {mode}"
          />
        </div>
        <div className="wait-leg">
          <div className="route-info">
            <RouteNumber
              mode={routeMode}
              text={route?.shortName}
              withBar
              isTransitLeg
              color={iconColor}
            />
            <div className="headsign">{hs}</div>
          </div>
          <div className="wait-duration">
            <FormattedMessage
              id="navileg-arrive-at"
              defaultMessage="{duration} min päästä klo {legTime}"
              values={values}
            />
          </div>
        </div>
      </>
    );
  }

  if (legType === LEGTYPE.WAIT_IN_VEHICLE) {
    const totalWait = legTime(nextLeg.start) - time;
    return (
      <>
        <div className="notification-header">
          <FormattedMessage
            id="wait-in-vehicle"
            defaultMessage="Wait in the vehicle"
          />
        </div>
        <div className="wait-leg">
          <FormattedMessage
            id="navigation-interline-resume"
            values={{
              duration: withRealTime(
                nextLeg.realtimeState === 'UPDATED',
                durationToString(totalWait),
              ),
            }}
          />
        </div>
      </>
    );
  }

  if (legType === LEGTYPE.TRANSIT) {
    const rt = leg.realtimeState === 'UPDATED';
    const t = legTime(leg.end);

    const destId = // eslint-disable-next-line no-nested-ternary
      leg.mode === 'FERRY'
        ? 'navileg-at-ferrypier'
        : leg.to.stop.parentStation
          ? 'navileg-at-station'
          : 'navileg-at-stop';
    const stopOrStation = intl.formatMessage({ id: destId });

    const remainingDuration = Math.max(Math.ceil((t - time) / 60000), 0); // ms to minutes, >= 0
    const values = {
      stopOrStation,
      stop: leg.to.stop.name,
      duration: withRealTime(rt, remainingDuration),
      legTime: withRealTime(rt, legTimeStr(leg.end)),
    };
    const translationId = nextLeg?.interlineWithPreviousLeg
      ? 'navileg-in-transit-interline'
      : 'navileg-leave-at';
    return (
      <>
        <div className="notification-header">
          <FormattedMessage
            id={instructions}
            defaultMessage="{mode}trip"
            values={{ mode: getLocalizedMode(leg.mode, intl) }}
          />
        </div>
        <div className="vehicle-leg">
          <FormattedMessage
            id={translationId}
            defaultMessage="leave from the vehicle at stop {stop} in {duration} minutes at {legTime}"
            values={values}
          />
        </div>
      </>
    );
  }
  return null;
}

NaviInstructions.propTypes = {
  leg: legShape,
  nextLeg: legShape,
  instructions: PropTypes.string.isRequired,
  legType: PropTypes.string,
  time: PropTypes.number.isRequired,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
  }),
  origin: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
};

NaviInstructions.defaultProps = {
  legType: '',
  leg: undefined,
  nextLeg: undefined,
  position: undefined,
};
NaviInstructions.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};
