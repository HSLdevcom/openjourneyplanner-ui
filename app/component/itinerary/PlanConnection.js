import { graphql } from 'react-relay';

const planConnection = graphql`
  query PlanConnectionQuery(
    $fromPlace: PlanLabeledLocationInput!
    $toPlace: PlanLabeledLocationInput!
    $modes: PlanModesInput!
    $datetime: PlanDateTimeInput!
    $walkReluctance: Reluctance
    $walkBoardCost: Cost
    $minTransferTime: Duration
    $walkSpeed: Speed
    $wheelchair: Boolean
    $transferPenalty: Cost
    $bikeSpeed: Speed
    $allowedRentalNetworks: [String!]
    $after: String
    $first: Int
    $before: String
    $last: Int
  ) {
    plan: planConnection(
      dateTime: $datetime
      after: $after
      first: $first
      before: $before
      last: $last
      origin: $fromPlace
      destination: $toPlace
      modes: $modes
      preferences: {
        accessibility: { wheelchair: { enabled: $wheelchair } }
        street: {
          bicycle: {
            speed: $bikeSpeed
            rental: { allowedNetworks: $allowedRentalNetworks }
          }
          walk: {
            speed: $walkSpeed
            reluctance: $walkReluctance
            boardCost: $walkBoardCost
          }
        }
        transit: {
          transfer: { cost: $transferPenalty, slack: $minTransferTime }
        }
      }
    ) {
      searchDateTime
      routingErrors {
        code
        inputField
      }
      pageInfo {
        startCursor
        endCursor
      }
      edges {
        ...ItineraryListContainer_planEdges
        node {
          ...ItineraryDetails_itinerary
          duration
          walkDistance
          emissionsPerPerson {
            co2
          }
          legs {
            ...ItineraryLine_legs
            mode
            distance
            transitLeg
            legId: id
            interlineWithPreviousLeg
            duration
            headsign
            realtimeState
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
            legGeometry {
              points
            }
            route {
              shortName
              color
              gtfsId
            }
            trip {
              gtfsId
              directionId
              stoptimesForDate {
                scheduledDeparture
              }
            }
            from {
              lat
              lon
              stop {
                gtfsId
                name
                lat
                lon
                parentStation {
                  name
                }
              }
              vehicleRentalStation {
                stationId
                name
                rentalNetwork {
                  networkId
                }
                availableVehicles {
                  total
                }
              }
              rentalVehicle {
                vehicleId
              }
            }
            to {
              lat
              lon
              name
              stop {
                gtfsId
                name
                code
                platformCode
                vehicleMode
                zoneId
                parentStation {
                  name
                }
                routes {
                  type
                }
              }
              vehicleParking {
                name
              }
              vehicleRentalStation {
                name
                rentalNetwork {
                  networkId
                }
                availableVehicles {
                  total
                }
              }
              rentalVehicle {
                rentalNetwork {
                  networkId
                  url
                }
              }
            }
            fareProducts {
              product {
                name
                id
                ... on DefaultFareProduct {
                  price {
                    amount
                  }
                }
              }
            }
          }
          start
          end
        }
      }
    }
  }
`;

export default planConnection;
