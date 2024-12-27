import cx from 'classnames';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { matchShape, routerShape } from 'found';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { createFragmentContainer, graphql } from 'react-relay';
import {
  getFaresFromLegs,
  shouldShowFareInfo,
  shouldShowFarePurchaseInfo,
} from '../../util/fareUtils';
import {
  compressLegs,
  getTotalBikingDistance,
  getTotalBikingDuration,
  getTotalDrivingDistance,
  getTotalDrivingDuration,
  getTotalWalkingDistance,
  getTotalWalkingDuration,
  getZones,
  isCallAgencyLeg,
  legContainsBikePark,
  legContainsRentalBike,
} from '../../util/legUtils';
import { streetHash } from '../../util/path';
import { configShape, itineraryShape, relayShape } from '../../util/shapes';
import {
  getFormattedTimeDate,
  isToday,
  isTomorrow,
} from '../../util/timeUtils';
import { BreakpointConsumer } from '../../util/withBreakpoint';
import BackButton from '../BackButton';
import Emissions from './Emissions';
import EmissionsInfo from './EmissionsInfo';
import FareDisclaimer from './FareDisclaimer';
import ItinerarySummary from './ItinerarySummary';
import Legs from './Legs';
import MobileTicketPurchaseInformation from './MobileTicketPurchaseInformation';
import StartNavi from './StartNavi';
import TicketInformation from './TicketInformation';
import VehicleRentalDurationInfo from './VehicleRentalDurationInfo';

class ItineraryDetails extends React.Component {
  static propTypes = {
    itinerary: itineraryShape.isRequired,
    focusToPoint: PropTypes.func.isRequired,
    focusToLeg: PropTypes.func.isRequired,
    isMobile: PropTypes.bool.isRequired,
    hideTitle: PropTypes.bool,
    carEmissions: PropTypes.number,
    currentLanguage: PropTypes.string,
    changeHash: PropTypes.func,
    openSettings: PropTypes.func.isRequired,
    startNavigation: PropTypes.func,
    bikePublicItineraryCount: PropTypes.number,
    carPublicItineraryCount: PropTypes.number,
    relayEnvironment: relayShape,
  };

  static defaultProps = {
    hideTitle: false,
    currentLanguage: 'fi',
    changeHash: () => {},
    bikePublicItineraryCount: 0,
    carPublicItineraryCount: 0,
    carEmissions: undefined,
    relayEnvironment: undefined,
    startNavigation: undefined,
  };

  static contextTypes = {
    config: configShape.isRequired,
    router: routerShape.isRequired,
    match: matchShape.isRequired,
    intl: intlShape.isRequired,
    getStore: PropTypes.func.isRequired,
  };

  shouldShowDisclaimer(config) {
    return (
      config.showDisclaimer &&
      this.context.match.params.hash !== streetHash.walk &&
      this.context.match.params.hash !== streetHash.bike
    );
  }

  getFutureText(startTime) {
    const refTime = Date.now();
    if (isToday(startTime, refTime)) {
      return '';
    }
    if (isTomorrow(startTime, refTime)) {
      return this.context.intl.formatMessage({
        id: 'tomorrow',
      });
    }
    return getFormattedTimeDate(startTime, 'dd D.M.');
  }

  getExtraProps(itinerary) {
    const compressedItinerary = {
      ...itinerary,
      legs: compressLegs(itinerary.legs),
    };
    const walkingDistance = getTotalWalkingDistance(compressedItinerary);
    const walkingDuration = getTotalWalkingDuration(compressedItinerary);
    const bikingDistance = getTotalBikingDistance(compressedItinerary);
    const bikingDuration = getTotalBikingDuration(compressedItinerary);
    const drivingDuration = getTotalDrivingDuration(compressedItinerary);
    const drivingDistance = getTotalDrivingDistance(compressedItinerary);
    const futureText = this.getFutureText(itinerary.start);
    const isMultiRow =
      walkingDistance > 0 &&
      (bikingDistance > 0 || drivingDistance > 0) &&
      futureText !== '';
    return {
      walking: {
        duration: walkingDuration,
        distance: walkingDistance,
      },
      biking: {
        duration: bikingDuration,
        distance: bikingDistance,
      },
      driving: {
        duration: drivingDuration,
        distance: drivingDistance,
      },
      futureText,
      isMultiRow,
    };
  }

  render() {
    const {
      itinerary,
      currentLanguage,
      isMobile,
      bikePublicItineraryCount,
      carPublicItineraryCount,
    } = this.props;
    const { config } = this.context;
    if (!itinerary?.legs[0]) {
      return null;
    }
    const fares = getFaresFromLegs(itinerary.legs, config);
    const extraProps = this.getExtraProps(itinerary);
    const { biking, walking, driving, futureText, isMultiRow } = extraProps;
    // This does not take into account if the user is using a car at the time of using transit,
    // instead this just calculates if the car is used for the whole trip.
    // A smarter approach would be to store the current personal mode of transport (walk, bike, car)
    // this could then be used to set the waiting icon legs that need it.
    const usingOwnCarWholeTrip =
      walking.distance === 0 && biking.distance === 0 && driving.distance > 0;
    const legsWithRentalBike = compressLegs(itinerary.legs).filter(leg =>
      legContainsRentalBike(leg),
    );
    const legswithBikePark = compressLegs(itinerary.legs).filter(leg =>
      legContainsBikePark(leg),
    );
    const legsWithScooter = compressLegs(itinerary.legs).some(
      leg => leg.mode === 'SCOOTER',
    );
    const containsBiking = biking.duration > 0 && biking.distance > 0;
    const showBikeBoardingInformation =
      containsBiking &&
      bikePublicItineraryCount > 0 &&
      legswithBikePark.length === 0;
    const containsDriving = driving.duration > 0 && driving.distance > 0;
    const showCarBoardingInformation =
      containsDriving && carPublicItineraryCount > 0;
    const rentalBikeNetworks = new Set();
    let showRentalBikeDurationWarning = false;
    if (legsWithRentalBike.length > 0) {
      for (let i = 0; i < legsWithRentalBike.length; i++) {
        const leg = legsWithRentalBike[i];
        const network = leg.from.vehicleRentalStation?.rentalNetwork.networkId;
        if (
          config.vehicleRental.networks[network]?.timeBeforeSurcharge &&
          config.vehicleRental.networks[network]?.durationInstructions
        ) {
          const rentDurationOverSurchargeLimit =
            leg.duration >
            config.vehicleRental.networks[network].timeBeforeSurcharge;
          if (rentDurationOverSurchargeLimit) {
            rentalBikeNetworks.add(network);
            showRentalBikeDurationWarning =
              rentDurationOverSurchargeLimit || showRentalBikeDurationWarning;
          }
        }
      }
    }
    let itineraryIndex = this.context.match.params.secondHash
      ? Number(this.context.match.params.secondHash)
      : Number(this.context.match.params.hash);

    if (Number.isNaN(itineraryIndex)) {
      itineraryIndex = 1;
    } else {
      itineraryIndex += 1;
    }

    const disclaimers = [];

    const externalOperatorJourneys = legsWithScooter;

    if (
      shouldShowFareInfo(config) &&
      (fares.some(fare => fare.isUnknown) || externalOperatorJourneys)
    ) {
      const found = {};
      itinerary.legs.forEach(leg => {
        if (config.modeDisclaimers?.[leg.mode] && !found[leg.mode]) {
          found[leg.mode] = true;
          const disclaimer = config.modeDisclaimers[leg.mode][currentLanguage];
          disclaimers.push(
            <FareDisclaimer
              key={leg.mode}
              text={disclaimer.disclaimer}
              href={disclaimer.link}
              linkText={disclaimer.text}
            />,
          );
        }
      });

      const info = config.callAgencyInfo?.[currentLanguage];
      if (info && itinerary.legs.some(leg => isCallAgencyLeg(leg))) {
        disclaimers.push(
          <FareDisclaimer
            key={disclaimers.length}
            textId="separate-ticket-required-for-call-agency-disclaimer"
            href={info.callAgencyInfoLink}
            linkText={info.callAgencyInfoLinkText}
          />,
        );
      }

      if (!disclaimers.length) {
        disclaimers.push(
          <FareDisclaimer
            key="faredisclaimer-separate-ticket-key"
            textId="separate-ticket-required-disclaimer"
            values={{
              agencyName:
                typeof config.primaryAgencyName === 'string'
                  ? config.primaryAgencyName
                  : config.primaryAgencyName?.[currentLanguage],
            }}
          />,
        );
      }
    }

    return (
      <div className="itinerary-tab">
        <h2 className="sr-only" key="srlabel">
          <FormattedMessage
            id="summary-page.row-label"
            values={{
              number: itineraryIndex,
            }}
          />
        </h2>
        <BreakpointConsumer>
          {breakpoint => [
            breakpoint === 'large' && !this.props.hideTitle && (
              <div className="desktop-title" key="header">
                <div className="title-container h2">
                  <BackButton
                    title={
                      <FormattedMessage
                        id="itinerary-page.title"
                        defaultMessage="Itinerary suggestions"
                      />
                    }
                    icon="icon-icon_arrow-collapse--left"
                    iconClassName="arrow-icon"
                    fallback="pop"
                  />
                </div>
              </div>
            ),
            <ItinerarySummary
              itinerary={itinerary}
              key="summary"
              walking={walking}
              biking={biking}
              driving={driving}
              futureText={futureText}
              isMultiRow={isMultiRow}
              isMobile={isMobile}
              hideBottomDivider={
                isMobile &&
                shouldShowFarePurchaseInfo(config, breakpoint, fares)
              }
            />,
            showRentalBikeDurationWarning && (
              <VehicleRentalDurationInfo
                key="rentaldurationinfo"
                networks={Array.from(rentalBikeNetworks)}
                config={config}
              />
            ),
            shouldShowFareInfo(config) &&
              (shouldShowFarePurchaseInfo(config, breakpoint, fares) ? (
                <MobileTicketPurchaseInformation
                  key="mobileticketpurchaseinformation"
                  fares={fares}
                  zones={getZones(itinerary.legs)}
                />
              ) : (
                <TicketInformation
                  key="ticketinformation"
                  fares={fares}
                  zones={getZones(itinerary.legs)}
                  legs={itinerary.legs}
                />
              )),

            this.props.startNavigation && (
              <StartNavi
                key="navigation"
                startNavigation={this.props.startNavigation}
              />
            ),
            config.showCO2InItinerarySummary && !legsWithScooter && (
              <EmissionsInfo
                key="emissionsummary"
                itinerary={itinerary}
                isMobile={isMobile}
              />
            ),
            <div
              className={cx('momentum-scroll itinerary-tabs__scroll', {
                multirow: isMultiRow,
              })}
              key="legs"
            >
              <div
                className={cx('itinerary-main', {
                  'bp-large': breakpoint === 'large',
                })}
                key="legwrapper"
              >
                {disclaimers}
                <Legs
                  key="itinerarylegs"
                  fares={fares}
                  itinerary={itinerary}
                  focusToPoint={this.props.focusToPoint}
                  focusToLeg={this.props.focusToLeg}
                  changeHash={this.props.changeHash}
                  tabIndex={itineraryIndex - 1}
                  openSettings={this.props.openSettings}
                  showBikeBoardingInformation={showBikeBoardingInformation}
                  showCarBoardingInformation={showCarBoardingInformation}
                  usingOwnCarWholeTrip={usingOwnCarWholeTrip}
                  relayEnvironment={this.props.relayEnvironment}
                />
              </div>
              {config.showCO2InItinerarySummary && !legsWithScooter && (
                <Emissions
                  key="emissionsinfo"
                  config={config}
                  itinerary={itinerary}
                  carEmissions={this.props.carEmissions}
                  emissionsInfolink={
                    config.URL.EMISSIONS_INFO?.[currentLanguage]
                  }
                />
              )}
              {this.shouldShowDisclaimer(config) && (
                <div className="itinerary-disclaimer" key="disclaimer">
                  <FormattedMessage
                    id="disclaimer"
                    defaultMessage="Results are based on estimated travel times"
                  />
                </div>
              )}
              <div className="itinerary-empty-space" key="emptyspace" />
            </div>,
          ]}
        </BreakpointConsumer>
      </div>
    );
  }
}

const withRelay = createFragmentContainer(
  connectToStores(ItineraryDetails, ['PreferencesStore'], context => ({
    currentLanguage: context.getStore('PreferencesStore').getLanguage(),
  })),
  {
    itinerary: graphql`
      fragment ItineraryDetails_itinerary on Itinerary {
        duration
        start
        end
        emissionsPerPerson {
          co2
        }
        legs {
          fareProducts {
            id
            product {
              id
              ... on DefaultFareProduct {
                price {
                  amount
                }
              }
            }
          }
          mode
          legGeometry {
            points
          }
          nextLegs(
            numberOfLegs: 2
            originModesWithParentStation: [RAIL]
            destinationModesWithParentStation: [RAIL]
          ) {
            mode
            distance
            route {
              alerts {
                alertSeverityLevel
              }
              shortName
              mode
              type
              gtfsId
              color
            }
            from {
              stop {
                platformCode
                alerts {
                  alertSeverityLevel
                }
              }
            }
            to {
              stop {
                alerts {
                  alertSeverityLevel
                }
              }
            }
            start {
              scheduledTime
              estimated {
                time
              }
            }
            trip {
              tripHeadsign
              pattern {
                code
              }
              occupancy {
                occupancyStatus
              }
              gtfsId
            }
            realTime
          }
          ...LegAgencyInfo_leg
          from {
            lat
            lon
            name
            vehicleParking {
              name
              vehicleParkingId
            }
            vehicleRentalStation {
              rentalNetwork {
                networkId
              }
              availableVehicles {
                total
              }
              lat
              lon
              stationId
            }
            rentalVehicle {
              vehicleId
              name
              lat
              lon
              rentalUris {
                android
                ios
                web
              }
              rentalNetwork {
                networkId
                url
              }
            }
            stop {
              gtfsId
              code
              platformCode
              vehicleMode
              zoneId
              alerts {
                alertSeverityLevel
                effectiveEndDate
                effectiveStartDate
                alertHeaderText
                alertDescriptionText
                entities {
                  __typename
                  ... on Stop {
                    gtfsId
                  }
                }
              }
              parentStation {
                gtfsId
              }
            }
          }
          to {
            lat
            lon
            name
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
              lat
              lon
              rentalNetwork {
                networkId
              }
            }
            stop {
              gtfsId
              code
              platformCode
              zoneId
              name
              vehicleMode
              alerts {
                alertSeverityLevel
                effectiveEndDate
                effectiveStartDate
                alertHeaderText
                alertDescriptionText
                entities {
                  __typename
                  ... on Stop {
                    gtfsId
                  }
                }
              }
              parentStation {
                gtfsId
              }
            }
            vehicleParking {
              vehicleParkingId
              name
            }
          }
          intermediatePlaces {
            arrival {
              scheduledTime
              estimated {
                time
              }
            }
            stop {
              gtfsId
              lat
              lon
              name
              code
              platformCode
              zoneId
              parentStation {
                gtfsId
              }
            }
          }
          realTime
          realtimeState
          transitLeg
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
          interlineWithPreviousLeg
          distance
          duration
          intermediatePlace
          route {
            shortName
            color
            gtfsId
            type
            longName
            desc
            agency {
              gtfsId
              fareUrl
              name
              phone
            }
            alerts {
              alertSeverityLevel
              effectiveEndDate
              effectiveStartDate
              alertHeaderText
              alertDescriptionText
              id
              entities {
                __typename
                ... on Route {
                  gtfsId
                }
              }
            }
          }
          trip {
            gtfsId
            tripHeadsign
            pattern {
              code
            }
            stoptimesForDate {
              headsign
              pickupType
              realtimeState
              stop {
                gtfsId
              }
            }
            occupancy {
              occupancyStatus
            }
          }
        }
      }
    `,
  },
);

export { ItineraryDetails as Component, withRelay as default };
