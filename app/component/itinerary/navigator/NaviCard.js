import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { legShape, configShape } from '../../../util/shapes';
import Icon from '../../Icon';
import { isRental } from '../../../util/legUtils';
import NaviInstructions from './NaviInstructions';
import NaviCardExtension from './NaviCardExtension';
import { LEGTYPE } from './NaviUtils';
import { getRouteMode } from '../../../util/modeUtils';

const iconMap = {
  BICYCLE: 'icon-icon_cyclist',
  CAR: 'icon-icon_car-withoutBox',
  SCOOTER: 'icon-icon_scooter_rider',
  WALK: 'icon-icon_walk',
  WAIT: 'icon-icon_navigation_wait',
  BUS: 'icon-icon_bus',
  RAIL: 'icon-icon_rail',
  SUBWAY: 'icon-icon_subway',
  TRAM: 'icon-icon_tram',
  FERRY: 'icon-icon_ferry',
  'BUS-EXPRESS': 'icon-icon_bus-express',
  'BUS-LOCAL': 'icon-icon_bus-local',
  SPEEDTRAM: 'icon-icon_speedtram',
};

export default function NaviCard(
  { leg, nextLeg, legType, cardExpanded, startTime, time, position, origin },
  { config },
) {
  if (legType === LEGTYPE.PENDING) {
    return (
      <FormattedMessage
        id="navigation-journey-start"
        values={{ time: startTime }}
      />
    );
  }
  if (legType === LEGTYPE.END) {
    return <FormattedMessage id="navigation-journey-end" />;
  }
  if (!leg && !nextLeg) {
    return null;
  }
  let iconColor = 'currentColor';
  let iconName;
  let instructions = '';
  if (legType === LEGTYPE.TRANSIT) {
    const m = getRouteMode(leg.route, config);
    iconColor = config.colors.iconColors[`mode-${m}`] || leg.route.color;
    iconName = iconMap[m.toUpperCase()];

    instructions = `navileg-in-transit`;
  } else if (legType !== LEGTYPE.WAIT && isRental(leg, nextLeg)) {
    if (leg.mode === 'WALK' && nextLeg?.mode === 'SCOOTER') {
      instructions = `navileg-rent-scooter`;
    } else {
      instructions = 'rent-cycle-at';
    }
    iconName = iconMap[leg.mode];
  } else if (legType === LEGTYPE.MOVE) {
    instructions = `navileg-${leg?.mode.toLowerCase()}`;
    iconName = iconMap.WALK;
  } else if (legType === LEGTYPE.WAIT) {
    iconName = iconMap.WAIT;
  }

  return (
    <div className="navi-top-card">
      <div className="main-card">
        <Icon img={iconName} className="mode" color={iconColor} />
        <div className={`instructions ${cardExpanded ? 'expanded' : ''}`}>
          <NaviInstructions
            leg={leg}
            nextLeg={nextLeg}
            instructions={instructions}
            legType={legType}
            time={time}
            position={position}
            origin={origin}
          />
        </div>
        <div type="button" className="navitop-arrow">
          <Icon
            img="icon-icon_arrow-collapse"
            className={`cursor-pointer ${cardExpanded ? 'inverted' : ''}`}
          />
        </div>
      </div>
      {cardExpanded && (
        <NaviCardExtension
          legType={legType}
          leg={leg}
          nextLeg={nextLeg}
          time={time}
        />
      )}
    </div>
  );
}

NaviCard.propTypes = {
  leg: legShape,
  nextLeg: legShape,
  legType: PropTypes.string.isRequired,
  cardExpanded: PropTypes.bool,
  startTime: PropTypes.string,
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
NaviCard.defaultProps = {
  cardExpanded: false,
  leg: undefined,
  nextLeg: undefined,
  startTime: '',
  position: undefined,
};

NaviCard.contextTypes = {
  config: configShape.isRequired,
};
