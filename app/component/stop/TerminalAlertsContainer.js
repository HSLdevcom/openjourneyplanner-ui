import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { stationShape } from '../../util/shapes';
import StopAlerts from './StopAlerts';

const TerminalAlertsContainer = ({ station }) => {
  return <StopAlerts stop={station} />;
};

TerminalAlertsContainer.propTypes = { station: stationShape.isRequired };

const containerComponent = createFragmentContainer(TerminalAlertsContainer, {
  station: graphql`
    fragment TerminalAlertsContainer_station on Stop
    @argumentDefinitions(
      startTime: { type: "Long" }
      timeRange: { type: "Int", defaultValue: 3600 }
    ) {
      gtfsId
      locationType
      stops {
        id
        gtfsId
        routes {
          gtfsId
        }
        alerts(types: [STOP, ROUTES]) {
          id
          alertDescriptionText
          alertHash
          alertHeaderText
          alertSeverityLevel
          alertUrl
          effectiveEndDate
          effectiveStartDate
          entities {
            __typename
            ... on Route {
              color
              type
              mode
              shortName
              gtfsId
            }
            ... on Stop {
              gtfsId
            }
          }
        }
      }
      alerts(types: [STOP]) {
        id
        alertDescriptionText
        alertHash
        alertHeaderText
        alertSeverityLevel
        alertUrl
        effectiveEndDate
        effectiveStartDate
        entities {
          __typename
          ... on Stop {
            gtfsId
          }
        }
      }
      stoptimes: stoptimesWithoutPatterns(
        startTime: $startTime
        timeRange: $timeRange
        numberOfDepartures: 100
        omitCanceled: false
      ) {
        serviceDay
        scheduledDeparture
        headsign
        realtimeState
        trip {
          tripHeadsign
          route {
            gtfsId
            type
            color
            mode
            shortName
          }
        }
      }
    }
  `,
});

export { containerComponent as default, TerminalAlertsContainer as Component };
