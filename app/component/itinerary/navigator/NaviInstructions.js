import React, { useEffect, useState } from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { legShape, configShape } from '../../../util/shapes';
import { legDestination, legTimeStr, legTime } from '../../../util/legUtils';
import RouteNumber from '../../RouteNumber';
import { LEGTYPE } from './NaviUtils';
import { displayDistance } from '../../../util/geo-utils';
import { durationToString } from '../../../util/timeUtils';

export default function NaviInstructions(
  { leg, nextLeg, instructions, legType },
  { intl, config },
) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 10000);
    return () => {
      setFadeOut(false);
      clearTimeout(timer);
    };
  }, [leg]);

  if (legType === LEGTYPE.MOVE) {
    const { distance, duration } = leg;
    return (
      <>
        <div className="destination-header">
          <FormattedMessage id={instructions} defaultMessage="Go to" />
          &nbsp;
          {legDestination(intl, leg, null, nextLeg)}
        </div>
        {distance && duration && (
          <div className={cx('duration', fadeOut && 'fade-out')}>
            {displayDistance(distance, config, intl.formatNumber)} &nbsp; (
            {durationToString(duration * 1000)})
          </div>
        )}
      </>
    );
  }
  if (legType === LEGTYPE.WAIT && nextLeg.mode !== 'WALK') {
    const { mode, headsign, route, end, start } = nextLeg;
    const hs = headsign || nextLeg.trip?.tripHeadsign;
    const color = route.color || 'currentColor';
    const localizedMode = intl.formatMessage({
      id: `to-${mode.toLowerCase()}`,
      defaultMessage: `${mode}`,
    });
    const t = leg ? legTime(end) : legTime(start);
    const remainingDuration = Math.ceil((t - Date.now()) / 60000); // ms to minutes
    const rt = nextLeg.realtimeState === 'UPDATED';
    const values = {
      duration: (
        <span className={cx({ realtime: rt })}> {remainingDuration} </span>
      ),
      legTime: <span className={cx({ realtime: rt })}>{legTimeStr(end)}</span>,
    };
    return (
      <>
        <div className="destination-header">
          <FormattedMessage
            id="navigation-wait-mode"
            values={{ mode: localizedMode }}
            defaultMessage="Wait for {mode}"
          />
        </div>
        <div className="wait-leg">
          <div className="route-info">
            <RouteNumber
              mode={mode.toLowerCase()}
              text={route?.shortName}
              withBar
              isTransitLeg
              color={color}
            />
            <div className="headsign">{hs}</div>
          </div>
          <div className="wait-duration">
            <FormattedMessage
              id="navileg-arrive-at"
              defaultMessage="{duration}min päästä klo {legTime}"
              values={values}
            />
          </div>
        </div>
      </>
    );
  }

  if (legType === LEGTYPE.TRANSIT) {
    const t = legTime(leg.end);
    const stopOrStation = leg.to.stop.parentStation
      ? intl.formatMessage({ id: 'navileg-from-station' })
      : intl.formatMessage({ id: 'navileg-from-stop' });
    const rt = leg.realtimeState === 'UPDATED';
    const localizedMode = intl.formatMessage({
      id: `${leg.mode.toLowerCase()}`,
      defaultMessage: `${leg.mode}`,
    });
    const remainingDuration = Math.ceil((t - Date.now()) / 60000); // ms to minutes
    const values = {
      stopOrStation,
      stop: leg.to.stop.name,
      duration: (
        <span className={cx({ realtime: rt })}> {remainingDuration} </span>
      ),
      legTime: (
        <span className={cx({ realtime: rt })}>{legTimeStr(leg.end)}</span>
      ),
    };

    return (
      <>
        <div className="destination-header">
          <FormattedMessage
            id={instructions}
            defaultMessage="{mode}trip"
            values={{ mode: localizedMode }}
          />
        </div>
        <div className="vehicle-leg">
          <FormattedMessage
            id="navileg-leave-at"
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
};

NaviInstructions.defaultProps = {
  legType: '',
  leg: undefined,
  nextLeg: undefined,
};
NaviInstructions.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};
