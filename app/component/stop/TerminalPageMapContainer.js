import PropTypes from 'prop-types';
import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { configShape } from '../../util/shapes';
import StopPageMap from '../map/StopPageMap';

const TerminalPageMapContainer = ({ station }) => {
  if (!station) {
    return false;
  }

  return <StopPageMap stop={station} />;
};

TerminalPageMapContainer.contextTypes = {
  config: configShape.isRequired,
};

TerminalPageMapContainer.propTypes = {
  station: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    platformCode: PropTypes.string,
  }),
};

TerminalPageMapContainer.defaultProps = {
  station: undefined,
};

const containerComponent = createFragmentContainer(TerminalPageMapContainer, {
  station: graphql`
    fragment TerminalPageMapContainer_station on Stop {
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

export { containerComponent as default, TerminalPageMapContainer as Component };
