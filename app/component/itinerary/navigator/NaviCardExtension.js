import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Icon from '../../Icon';
import StopCode from '../../StopCode';
import PlatformNumber from '../../PlatformNumber';
import {
  getZoneLabel,
  getHeadsignFromRouteLongName,
  legTimeStr,
  legTime,
} from '../../../util/legUtils';
import ZoneIcon from '../../ZoneIcon';
import { legShape, configShape } from '../../../util/shapes';
import { getDestinationProperties, LEGTYPE, withRealTime } from './NaviUtils';
import { getRouteMode } from '../../../util/modeUtils';
import RouteNumber from '../../RouteNumber';
import RouteNumberContainer from '../../RouteNumberContainer';

const NaviCardExtension = ({ legType, leg, nextLeg, time }, { config }) => {
  const { stop, name, rentalVehicle, vehicleParking, vehicleRentalStation } =
    leg ? leg.to : nextLeg.from;
  const { code, platformCode, zoneId, vehicleMode } = stop || {};
  const [place, address] = name?.split(/, (.+)/) || [];

  let destination = {};
  if (stop) {
    destination = getDestinationProperties(
      rentalVehicle,
      vehicleParking,
      vehicleRentalStation,
      stop,
      config,
    );
  } else {
    destination.iconId = 'icon-icon_mapMarker-to';
    destination.className = 'place';
    destination.name = place;
  }

  if (legType === LEGTYPE.TRANSIT) {
    const { intermediatePlaces, headsign, trip, route } = leg;
    const hs = headsign || trip.tripHeadsign;
    const stopCount = <span className="bold">{intermediatePlaces.length}</span>;
    const translationId =
      intermediatePlaces.length === 1
        ? 'navileg-one-intermediate-stop'
        : 'navileg-intermediate-stops';
    const mode = getRouteMode(route, config);
    const iconColor =
      config.colors.iconColors[`mode-${mode}`] || leg.route.color;
    return (
      <div className="extension">
        <div className="extension-routenumber">
          <RouteNumberContainer
            className={cx('line', mode)}
            route={route}
            mode={mode}
            isTransitLeg
            vertical
            withBar
          />
          <div className="headsign">{hs}</div>
        </div>
        <div className="extension-divider" />
        <div className="stop-count">
          <Icon img="navi-intermediatestops" color={iconColor} />
          <FormattedMessage
            id={translationId}
            values={{ stopCount }}
            defaultMessage="{nrStopsRemaining} stops remaining"
          />
        </div>
      </div>
    );
  }
  const stopInformation = (expandIcon = false) => {
    return (
      <div className="extension-walk">
        {expandIcon && <Icon img="navi-expand" className="icon-expand" />}
        <Icon
          img={destination.iconId}
          height={2}
          width={2}
          className={`destination-icon ${destination.className}`}
        />
        <div className="destination">
          {destination.name}
          <div className="details">
            {!stop && address && <div className="address">{address}</div>}
            {code && <StopCode code={code} />}
            {platformCode && (
              <PlatformNumber
                number={platformCode}
                short
                isRailOrSubway={
                  vehicleMode === 'RAIL' || vehicleMode === 'SUBWAY'
                }
              />
            )}
            <ZoneIcon
              zoneId={getZoneLabel(zoneId, config)}
              showUnknown={false}
            />
          </div>
        </div>
      </div>
    );
  };

  if (legType === LEGTYPE.WAIT_IN_VEHICLE) {
    const { route, trip } = nextLeg;
    return (
      <div className="extension">
        <div className="extension-divider" />
        <div className="wait-in-vehicle">
          <FormattedMessage
            id="navigation-interline-wait"
            values={{
              line: <span className="bold">{route.shortName}</span>,
              destination: (
                <span className="bold">
                  {trip.tripHeadsign || getHeadsignFromRouteLongName(route)}
                </span>
              ),
            }}
          />
        </div>
        {stopInformation()}
      </div>
    );
  }
  if (legType === LEGTYPE.MOVE && nextLeg) {
    const { headsign, route, start } = nextLeg;
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
      <div className="extension">
        {stopInformation()}
        <div className="extension-divider" />
        <div className="wait-leg">
          <div className="route-info">
            <div className="expand">
              <Icon img="navi-expand" className="icon-expand-small" />
              <div className="wait-duration">
                <FormattedMessage
                  id="navileg-arrive-at"
                  defaultMessage="{duration} min päästä klo {legTime}"
                  values={values}
                />
              </div>
            </div>
            <div className="routenumber">
              <RouteNumber
                mode={routeMode}
                text={route?.shortName}
                withBar
                isTransitLeg
                color={iconColor}
              />
              <div className="headsign">{hs}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="extension">
      <div className="extension-divider" />
      {stopInformation(true)}
    </div>
  );
};
NaviCardExtension.propTypes = {
  leg: legShape,
  nextLeg: legShape,
  legType: PropTypes.string,
  time: PropTypes.number.isRequired,
};

NaviCardExtension.defaultProps = {
  legType: '',
  leg: undefined,
  nextLeg: undefined,
};

NaviCardExtension.contextTypes = {
  config: configShape.isRequired,
};

export default NaviCardExtension;
