import React from 'react';
import PropTypes from 'prop-types';
import { legShape } from '../../util/shapes';
import Icon from '../Icon';
import { isRental } from '../../util/legUtils';
import NaviInstructions from './NaviInstructions';
import NaviCardExtension from './NaviCardExtension';

const iconMap = {
  BICYCLE: 'icon-icon_cyclist',
  CAR: 'icon-icon_car-withoutBox',
  SCOOTER: 'icon-icon_scooter_rider',
  WALK: 'icon-icon_walk',
  WAIT: 'icon-icon_navigation_wait',
};

export default function NaviCard({ leg, nextLeg, legType, cardExpanded }) {
  const iconName = legType === 'wait' ? iconMap.WAIT : iconMap[leg.mode];
  let instructions = `navileg-${leg.mode.toLowerCase()}`;

  if (isRental(leg, nextLeg)) {
    if (leg.mode === 'WALK' && nextLeg?.mode === 'SCOOTER') {
      instructions = `navileg-rent-scooter`;
    } else {
      instructions = `navileg-rent-cycle`;
    }
  }
  return (
    <div className="navi-top-card">
      <div className="main-card">
        <Icon img={iconName} color="black" className="mode" />
        <div className="instructions">
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
      {cardExpanded && <NaviCardExtension leg={leg} />}
    </div>
  );
}

NaviCard.propTypes = {
  leg: legShape.isRequired,
  nextLeg: legShape.isRequired,
  legType: PropTypes.string.isRequired,
  cardExpanded: PropTypes.bool,
};
NaviCard.defaultProps = {
  cardExpanded: false,
};
