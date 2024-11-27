import { graphql } from 'react-relay';

const walkQuery = graphql`
  query WalkQuery(
    $origin: PlanLabeledLocationInput!
    $destination: PlanLabeledLocationInput!
    $walkSpeed: Speed
    $wheelchair: Boolean
  ) {
    plan: planConnection(
      first: 1
      origin: $origin
      destination: $destination
      modes: { directOnly: true, direct: [WALK] }
      preferences: {
        accessibility: { wheelchair: { enabled: $wheelchair } }
        street: { walk: { speed: $walkSpeed } }
      }
    ) {
      edges {
        node {
          legs {
            mode
            rentedBike
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
            duration
            distance
            legGeometry {
              points
            }
            transitLeg
            interlineWithPreviousLeg
            route {
              gtfsId
              shortName
              color
              type
              agency {
                name
              }
            }
            from {
              lat
              lon
              name
              vertexType
              vehicleRentalStation {
                lat
                lon
                stationId
                rentalNetwork {
                  networkId
                }
                availableVehicles {
                  total
                }
              }
              rentalVehicle {
                vehicleId
                rentalNetwork {
                  networkId
                }
              }
              stop {
                gtfsId
                code
                platformCode
              }
            }
            to {
              lat
              lon
              name
              vertexType
              vehicleRentalStation {
                lat
                lon
                stationId
                rentalNetwork {
                  networkId
                }
                availableVehicles {
                  total
                }
              }
              stop {
                gtfsId
                code
                platformCode
              }
            }
            intermediatePlaces {
              stop {
                gtfsId
                lat
                lon
                name
                platformCode
              }
            }
          }
        }
      }
    }
  }
`;

export { walkQuery };
