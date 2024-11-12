import React from 'react';
import Icon from '../Icon';
import StopCode from '../StopCode';
import PlatformNumber from '../PlatformNumber';
import { getZoneLabel } from '../../util/legUtils';
import ZoneIcon from '../ZoneIcon';
import { legShape, configShape } from '../../util/shapes';
import { getDestinationProperties } from './NaviUtils';

const NaviCardExtension = ({ leg }, { config }) => {
  const { stop, name } = leg.to;
  const { code, platformCode, zoneId, vehicleMode } = stop || {};
  const [place, address] = name?.split(/, (.+)/) || [];

  let destination = {};
  if (stop) {
    destination = getDestinationProperties(leg, stop, config);
    destination.name = stop.name;
  } else {
    destination.iconId = 'icon-icon_mapMarker-to';
    destination.className = 'place';
    destination.name = place;
  }
  return (
    <div className="secondary-info">
      <div className="secondary-divider" />
      <div className="secondary-content">
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
  leg: legShape.isRequired,
};

NaviCardExtension.contextTypes = {
  config: configShape.isRequired,
};

export default NaviCardExtension;
