import React from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Icon from '../../Icon';
import StopCode from '../../StopCode';
import PlatformNumber from '../../PlatformNumber';
import { getZoneLabel, legTime } from '../../../util/legUtils';
import ZoneIcon from '../../ZoneIcon';
import { legShape, configShape } from '../../../util/shapes';
import { getDestinationProperties, LEGTYPE } from './NaviUtils';

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
    const { intermediatePlaces, headsign, trip, realtimeState } = leg;
    const hs = headsign || trip.tripHeadsign;
    const idx = intermediatePlaces.findIndex(p => legTime(p.arrival) > time);
    const count = idx > -1 ? intermediatePlaces.length - idx : 0;
    const stopCount = (
      <span className={cx('bold', { realtime: realtimeState === 'UPDATED' })}>
        {count}
      </span>
    );
    const translationId =
      count === 1 ? 'navileg-one-stop-remaining' : 'navileg-stops-remaining';
    const mode = leg.mode.toLowerCase();
    return (
      <div className="extension">
        <div className="extension-divider" />
        <div className="extension-routenumber">
          <RouteNumberContainer
            className={cx('line', mode)}
            route={leg.route}
            mode={mode}
            isTransitLeg
            vertical
            withBar
          />
          <div className="headsign">{hs}</div>
        </div>
        <div className="stop-count">
          <FormattedMessage
            id={translationId}
            values={{ stopCount }}
            defaultMessage="{nrStopsRemaining} stops remaining"
          />
        </div>
      </div>
    );
  }
  return (
    <div className="extension">
      <div className="extension-divider" />
      <div className="extension-walk">
        <Icon img="navi-expand" className="icon-expand" />
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
