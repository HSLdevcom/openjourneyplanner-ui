import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { durationToString } from '../../util/timeUtils';
import { getHeadsignFromRouteLongName, legTime } from '../../util/legUtils';
import Icon from '../Icon';
import { legShape } from '../../util/shapes';

const InterlineInfo = ({ legs, leg, usingOwnCarWholeTrip }) => {
  let totalWait = 0;
  const allLegs = [leg, ...legs];
  const routes = [];
  if (legs.length > 0) {
    allLegs.forEach((iLeg, i) => {
      routes.push(iLeg.route.shortName);
      if (allLegs[i + 1]) {
        totalWait += legTime(allLegs[i + 1].start) - legTime(iLeg.end);
      }
    });
  }
  const icon = usingOwnCarWholeTrip ? 'icon-icon_wait-car' : 'icon-icon_wait';
  return (
    <div className="interline-info-container">
      {legs.length === 1 && (
        <>
          <Icon img={icon} />
          <FormattedMessage
            id="itinerary-summary.interline-wait"
            values={{
              shortName: (
                <span className="bold">{legs[0]?.route.shortName}</span>
              ),
              destination: (
                <span className="bold">
                  {legs[0]?.trip.tripHeadsign ||
                    getHeadsignFromRouteLongName(legs[0]?.route)}
                </span>
              ),
              stop: leg.to.name,
              time: (
                <span className="bold no-wrap">
                  {durationToString(totalWait)}
                </span>
              ),
            }}
          />
        </>
      )}
      {legs.length > 1 && (
        <>
          <Icon img={icon} />
          <FormattedMessage
            id="itinerary-summary.interline-wait-multiple-legs"
            values={{
              time: (
                <span className="bold no-wrap">
                  {durationToString(totalWait)}
                </span>
              ),
              shortName: (
                <span className="bold">
                  {Array.from(new Set(routes)).join(', ')}
                </span>
              ),
            }}
          />
        </>
      )}
    </div>
  );
};

InterlineInfo.propTypes = {
  leg: legShape.isRequired,
  legs: PropTypes.arrayOf(legShape).isRequired,
  usingOwnCarWholeTrip: PropTypes.bool.isRequired,
};
export default InterlineInfo;
