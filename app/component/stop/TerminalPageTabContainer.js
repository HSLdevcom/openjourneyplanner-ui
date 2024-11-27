import PropTypes from 'prop-types';
import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { alertShape } from '../../util/shapes';
import StopPageTabs from './StopPageTabs';

function TerminalPageTabContainer({ children, station }) {
  return (
    <div className="stop-page-content-wrapper">
      <StopPageTabs stop={station} />
      {children}
    </div>
  );
}

TerminalPageTabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  station: PropTypes.shape({
    alerts: PropTypes.arrayOf(alertShape),
    vehicleMode: PropTypes.string,
    stoptimes: PropTypes.arrayOf(
      PropTypes.shape({
        realtimeState: PropTypes.string,
        trip: PropTypes.shape({
          pattern: PropTypes.shape({
            code: PropTypes.string,
          }),
          route: PropTypes.shape({
            alerts: PropTypes.arrayOf(alertShape),
          }),
        }),
      }),
    ),
  }),
};

TerminalPageTabContainer.defaultProps = {
  station: undefined,
};

const containerComponent = createFragmentContainer(TerminalPageTabContainer, {
  station: graphql`
    fragment TerminalPageTabContainer_station on Stop
    @argumentDefinitions(
      startTime: { type: "Long" }
      timeRange: { type: "Int", defaultValue: 3600 }
    ) {
      id
      gtfsId
      code
      stops {
        id
        gtfsId
        alerts(types: [STOP, ROUTES]) {
          id
          alertSeverityLevel
          effectiveEndDate
          effectiveStartDate
        }
      }
      alerts(types: [STOP]) {
        id
        alertSeverityLevel
        effectiveEndDate
        effectiveStartDate
      }
      stoptimes: stoptimesWithoutPatterns(
        startTime: $startTime
        timeRange: $timeRange
        numberOfDepartures: 100
        omitCanceled: false
      ) {
        realtimeState
      }
    }
  `,
});

export { containerComponent as default, TerminalPageTabContainer as Component };
