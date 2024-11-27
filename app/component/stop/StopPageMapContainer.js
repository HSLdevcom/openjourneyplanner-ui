import PropTypes from 'prop-types';
import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import StopPageMap from '../map/StopPageMap';

function StopPageMapContainer({ stop }) {
  if (!stop) {
    return false;
  }

  return <StopPageMap stop={stop} />;
}

StopPageMapContainer.propTypes = {
  stop: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    platformCode: PropTypes.string,
  }),
};

StopPageMapContainer.defaultProps = {
  stop: undefined,
};

const containerComponent = createFragmentContainer(StopPageMapContainer, {
  stop: graphql`
    fragment StopPageMapContainer_stop on Stop {
      lat
      lon
      platformCode
      name
      code
      desc
      vehicleMode
      locationType
    }
  `,
});

export { containerComponent as default, StopPageMapContainer as Component };
