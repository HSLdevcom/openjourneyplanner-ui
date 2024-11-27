import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { FormattedMessage } from 'react-intl';
import { configShape } from '../../util/shapes';
import { durationToString } from '../../util/timeUtils';
import { isKeyboardSelectionEvent } from '../../util/browser';
import Icon from '../Icon';

export default function StopInfo(
  { intermediateStopCount, toggleFunction, duration, showIntermediateStops },
  { config },
) {
  const message = (showIntermediateStops && (
    <FormattedMessage id="itinerary-hide-stops" defaultMessage="Hide stops" />
  )) || (
    <FormattedMessage
      id="number-of-intermediate-stops"
      values={{
        number: intermediateStopCount,
      }}
      defaultMessage="{number, plural, =0 {No stops} one {1 stop} other {{number} stops} }"
    />
  );
  return (
    <div
      role="button"
      tabIndex="0"
      className={cx('intermediate-stops-clickable', {
        'cursor-pointer': intermediateStopCount > 0,
      })}
      onClick={e => {
        e.stopPropagation();
        if (intermediateStopCount > 0) {
          toggleFunction();
        }
      }}
      onKeyPress={e => {
        if (isKeyboardSelectionEvent(e)) {
          e.stopPropagation();
          toggleFunction();
        }
      }}
    >
      <div
        className={cx('intermediate-stop-info-container', {
          open: showIntermediateStops,
        })}
      >
        {intermediateStopCount === 0 ? (
          <span className="intermediate-stop-no-stops">{message}</span>
        ) : (
          <span className="intermediate-stops-amount">{message}</span>
        )}{' '}
        <span className="intermediate-stops-duration" aria-hidden="true">
          ({durationToString(duration)})
        </span>
        {intermediateStopCount !== 0 && (
          <Icon
            img="icon-icon_arrow-collapse--right"
            className="itinerary-search-icon"
            color={config.colors.primary}
          />
        )}
      </div>
    </div>
  );
}

StopInfo.contextTypes = {
  config: configShape.isRequired,
};

StopInfo.propTypes = {
  intermediateStopCount: PropTypes.number.isRequired,
  toggleFunction: PropTypes.func.isRequired,
  duration: PropTypes.number.isRequired,
  showIntermediateStops: PropTypes.bool,
};

StopInfo.defaultProps = {
  showIntermediateStops: false,
};
