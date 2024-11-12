import React, { useEffect, useState } from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { legShape, configShape } from '../../util/shapes';
import { legDestination } from '../../util/legUtils';
import RouteNumber from '../RouteNumber';
import { displayDistance } from '../../util/geo-utils';
import { durationToString } from '../../util/timeUtils';

export default function NaviInstructions(
  { leg, nextLeg, instructions, legType },
  { intl, config },
) {
  const { distance, duration } = leg;
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

  if (legType === 'move') {
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

  if (legType === 'wait') {
    const { mode, headsign, route } = nextLeg;

    const color = route.color ? route.color : 'currentColor';
    const localizedMode = intl.formatMessage({
      id: `${mode.toLowerCase()}`,
      defaultMessage: `${mode}`,
    });
    return (
      <>
        <div className="destination-header">
          <FormattedMessage
            id="navigation-wait-mode"
            values={{ mode: localizedMode }}
            defaultMessage="Wait for"
          />
        </div>
        <div className="wait-leg">
          <RouteNumber
            mode={mode.toLowerCase()}
            text={route?.shortName}
            withBar
            isTransitLeg
            color={color}
          />
          <div className="headsign">{headsign}</div>
        </div>
      </>
    );
  }
  return null;
}

NaviInstructions.propTypes = {
  leg: legShape.isRequired,
  nextLeg: legShape.isRequired,
  instructions: PropTypes.string.isRequired,
  legType: PropTypes.string,
};

NaviInstructions.defaultProps = {
  legType: 'move',
};
NaviInstructions.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};
