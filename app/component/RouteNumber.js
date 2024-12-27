import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import { intlShape } from 'react-intl';
import { configShape } from '../util/shapes';
import IconWithBigCaution from './IconWithBigCaution';
import IconWithIcon from './IconWithIcon';
import Icon from './Icon';
import { TransportMode } from '../constants';

const LONG_ROUTE_NUMBER_LENGTH = 6;

function RouteNumber(props, context) {
  const mode = props.mode.toLowerCase();
  const { alertSeverityLevel, color, withBicycle, withCar } = props;
  const isScooter = mode === TransportMode.Scooter.toLowerCase();

  // Perform text-related processing
  let filteredText = props.text;
  if (
    props.shortenLongText &&
    context.config.disabledLegTextModes?.includes(mode) &&
    props.className.includes('line')
  ) {
    filteredText = '';
  }
  const textFieldIsText = typeof filteredText === 'string'; // can be also react node
  if (
    props.shortenLongText &&
    context.config.shortenLongTextThreshold &&
    filteredText &&
    textFieldIsText &&
    filteredText.length > context.config.shortenLongTextThreshold
  ) {
    filteredText = `${filteredText.substring(
      0,
      context.config.shortenLongTextThreshold - 3,
    )}...`;
  }
  const longText =
    filteredText &&
    textFieldIsText &&
    filteredText.length >= LONG_ROUTE_NUMBER_LENGTH;
  // Checks if route only has letters without identifying numbers and
  // length doesn't fit in the tab view
  const hasNoShortName =
    filteredText &&
    textFieldIsText &&
    /^([^0-9]*)$/.test(filteredText) &&
    filteredText.length > 3;

  const getColor = () => color || (props.isTransitLeg ? 'currentColor' : null);

  const getIcon = (
    icon,
    isCallAgency,
    hasDisruption,
    badgeFill,
    badgeText,
    badgeTextFill,
  ) => {
    if (isCallAgency) {
      return (
        <IconWithIcon
          color={color}
          className={`${mode} call`}
          img={icon || `icon-icon_${mode}`}
          subIcon="icon-icon_call"
        />
      );
    }

    if (hasDisruption || !!alertSeverityLevel) {
      return (
        <React.Fragment>
          <IconWithBigCaution
            alertSeverityLevel={alertSeverityLevel}
            color={color}
            className={mode}
            img={icon || `icon-icon_${mode}`}
          />
          {withBicycle && (
            <Icon
              img="icon-icon_bicycle_walk"
              className="itinerary-icon_with-bicycle"
            />
          )}
          {withCar && (
            <Icon
              img="icon-icon_car-withoutBox"
              className="itinerary-icon_with-car"
            />
          )}
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <IconWithIcon
          badgeFill={badgeFill}
          badgeText={badgeText}
          badgeTextFill={badgeTextFill}
          color={color}
          className={cx(mode, {
            [['secondary']]:
              mode === 'citybike' &&
              props.icon &&
              props.icon.includes('secondary'), // Vantaa citybike station
          })}
          img={icon || `icon-icon_${mode}`}
          subIcon=""
          mode={mode}
        />
        {withBicycle && (
          <Icon
            img="icon-icon_bicycle_walk"
            className="itinerary-icon_with-bicycle"
          />
        )}
        {withCar && (
          <Icon
            img="icon-icon_car-withoutBox"
            className="itinerary-icon_with-car"
          />
        )}
      </React.Fragment>
    );
  };

  const rNumber = (
    <span
      className={cx('route-number', {
        vertical: props.vertical,
      })}
    >
      <span
        className={cx('vcenter-children', props.className)}
        aria-label={context.intl.formatMessage({
          id: mode,
          defaultMessage: 'Vehicle',
        })}
        role="img"
      >
        {((!props.isTransitLeg && !props.renderModeIcons) ||
          props.appendClass === 'scooter') && (
          <div className={cx('empty', props.appendClass)} />
        )}
        {props.isTransitLeg === true ? (
          <div className={`special-icon ${mode}`}>
            {getIcon(
              props.icon,
              props.isCallAgency,
              props.hasDisruption,
              props.badgeFill,
              props.badgeText,
              props.badgeTextFill,
            )}
          </div>
        ) : (
          <div className={`icon ${mode}`}>
            {getIcon(
              props.icon,
              props.isCallAgency,
              props.hasDisruption,
              props.badgeFill,
              props.badgeText,
              props.badgeTextFill,
            )}
          </div>
        )}
        {filteredText && (
          <div
            className={cx(
              'vehicle-number-container-v'.concat(props.card ? '-map' : ''),
              {
                long: hasNoShortName,
              },
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                'vehicle-number'.concat(props.card ? '-map' : ''),
                mode,
                { long: longText },
              )}
              style={{ color: !props.withBar && getColor() }}
            >
              {filteredText}
            </span>
            {textFieldIsText && (
              <span className="sr-only">{filteredText?.toLowerCase()}</span>
            )}
          </div>
        )}
        {!context.config.hideWalkLegDurationSummary &&
          props.isTransitLeg === false &&
          props.duration > 0 && (
            <div className={`leg-duration-container ${mode} `}>
              <span className="leg-duration">{props.duration}</span>
            </div>
          )}
        {isScooter && !props.vertical && (
          <Icon img="icon-icon_smartphone" className="phone-icon" />
        )}
      </span>
      {props.occupancyStatus && (
        <span className="occupancy-icon-container">
          <Icon
            img={`icon-icon_${props.occupancyStatus}`}
            height={1.5}
            width={1.5}
            color="white"
          />
        </span>
      )}
    </span>
  );

  return props.withBar ? (
    <div className={cx('bar-container', { long: hasNoShortName })}>
      <div className={cx('bar', mode)} style={{ backgroundColor: getColor() }}>
        {rNumber}
      </div>
    </div>
  ) : (
    rNumber
  );
}

RouteNumber.propTypes = {
  alertSeverityLevel: PropTypes.string,
  mode: PropTypes.string.isRequired,
  color: PropTypes.string,
  text: PropTypes.node,
  vertical: PropTypes.bool,
  className: PropTypes.string,
  hasDisruption: PropTypes.bool,
  withBar: PropTypes.bool,
  isCallAgency: PropTypes.bool,
  badgeFill: PropTypes.string,
  badgeText: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  badgeTextFill: PropTypes.string,
  icon: PropTypes.string,
  renderModeIcons: PropTypes.bool,
  duration: PropTypes.number,
  isTransitLeg: PropTypes.bool,
  withBicycle: PropTypes.bool,
  withCar: PropTypes.bool,
  card: PropTypes.bool,
  appendClass: PropTypes.string,
  occupancyStatus: PropTypes.string,
  shortenLongText: PropTypes.bool,
};

RouteNumber.defaultProps = {
  alertSeverityLevel: undefined,
  badgeFill: undefined,
  badgeText: undefined,
  badgeTextFill: undefined,
  appendClass: undefined,
  className: '',
  vertical: false,
  card: false,
  hasDisruption: false,
  text: '',
  withBar: false,
  isCallAgency: false,
  icon: undefined,
  isTransitLeg: false,
  renderModeIcons: false,
  withBicycle: false,
  withCar: false,
  color: undefined,
  duration: undefined,
  occupancyStatus: undefined,
  shortenLongText: false,
};

RouteNumber.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default RouteNumber;
