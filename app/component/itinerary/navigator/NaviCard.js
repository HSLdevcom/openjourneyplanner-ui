import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { legShape } from '../../../util/shapes';
import Icon from '../../Icon';
import { isRental } from '../../../util/legUtils';
import NaviInstructions from './NaviInstructions';
import NaviCardExtension from './NaviCardExtension';
import { LEGTYPE } from './NaviUtils';

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
};

export default function NaviCard({
  leg,
  nextLeg,
  legType,
  cardExpanded,
  startTime,
}) {
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
  const iconName = legType === LEGTYPE.WAIT ? iconMap.WAIT : iconMap[leg.mode];

  let instructions = '';
  if (legType === LEGTYPE.TRANSIT) {
    instructions = `navileg-in-transit`;
  } else if (legType !== LEGTYPE.WAIT && isRental(leg, nextLeg)) {
    if (leg.mode === 'WALK' && nextLeg?.mode === 'SCOOTER') {
      instructions = `navileg-rent-scooter`;
    } else {
      instructions = 'rent-cycle-at';
    }
  } else if (legType === LEGTYPE.MOVE) {
    instructions = `navileg-${leg?.mode.toLowerCase()}`;
  }

  return (
    <div className="navi-top-card">
      <div className="main-card">
        <Icon img={iconName} className="mode" />
        <div className={`instructions ${cardExpanded ? 'expanded' : ''}`}>
          <NaviInstructions
            leg={leg}
            nextLeg={nextLeg}
            instructions={instructions}
            legType={legType}
          />
          <div type="button" className="navitop-arrow">
            <Icon
              img="icon-icon_arrow-collapse"
              className={`cursor-pointer ${cardExpanded ? 'inverted' : ''}`}
            />
          </div>
        </div>
      </div>
      {cardExpanded && (
        <NaviCardExtension legType={legType} leg={leg} nextLeg={nextLeg} />
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
};
NaviCard.defaultProps = {
  cardExpanded: false,
  leg: undefined,
  nextLeg: undefined,
  startTime: '',
};
