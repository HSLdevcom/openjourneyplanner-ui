import { graphql } from 'react-relay';

const legQuery = graphql`
  query LegQuery($id: String!) {
    leg(id: $id) {
      legId: id
      start {
        scheduledTime
        estimated {
          time
        }
      }
      end {
        scheduledTime
        estimated {
          time
        }
      }
      alerts {
        alertSeverityLevel
        effectiveStartDate
        alertDescriptionText
        alertHeaderText
        id
      }
      intermediatePlaces {
        arrival {
          scheduledTime
          estimated {
            time
          }
        }
      }
      to {
        vehicleRentalStation {
          availableVehicles {
            total
          }
        }
      }
      realtimeState
    }
  }
`;

export { legQuery };
