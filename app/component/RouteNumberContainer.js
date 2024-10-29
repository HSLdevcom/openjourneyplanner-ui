import PropTypes from 'prop-types';
import React from 'react';
import { routeShape, configShape } from '../util/shapes';
import { getLegText } from '../util/legUtils';
import RouteNumber from './RouteNumber';

const RouteNumberContainer = (
  {
    alertSeverityLevel,
    interliningWithRoute,
    className,
    route,
    isCallAgency,
    occupancyStatus,
    mode,
    ...props
  },
  { config },
) =>
  route && (
    <RouteNumber
      alertSeverityLevel={alertSeverityLevel}
      className={className}
      isCallAgency={isCallAgency || route.type === 715}
      color={route.color ? `#${route.color}` : null}
      mode={mode !== undefined ? mode : route.mode}
      text={
        config.disabledLegTextModes?.includes(route.mode) &&
        className.includes('line')
          ? ''
          : getLegText(route, config, interliningWithRoute)
      }
      occupancyStatus={occupancyStatus}
      {...props}
    />
  );

RouteNumberContainer.propTypes = {
  alertSeverityLevel: PropTypes.string,
  route: routeShape.isRequired,
  interliningWithRoute: PropTypes.string,
  isCallAgency: PropTypes.bool,
  vertical: PropTypes.bool,
  className: PropTypes.string,
  fadeLong: PropTypes.bool,
  occupancyStatus: PropTypes.string,
  mode: PropTypes.string,
};

RouteNumberContainer.defaultProps = {
  interliningWithRoute: undefined,
  alertSeverityLevel: undefined,
  isCallAgency: false,
  vertical: false,
  fadeLong: false,
  className: '',
  occupancyStatus: undefined,
  mode: undefined,
};

RouteNumberContainer.contextTypes = {
  config: configShape.isRequired,
};

RouteNumberContainer.displayName = 'RouteNumberContainer';
export default RouteNumberContainer;
