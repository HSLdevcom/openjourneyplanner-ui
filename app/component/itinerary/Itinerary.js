import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { createRef, useLayoutEffect, useState } from 'react';
import { graphql, createFragmentContainer } from 'react-relay';
import { FormattedMessage, intlShape } from 'react-intl';
import {
  legShape,
  locationShape,
  itineraryShape,
  configShape,
} from '../../util/shapes';
import Icon from '../Icon';
import RelativeDuration from './RelativeDuration';
import RouteNumber from '../RouteNumber';
import RouteNumberContainer from '../RouteNumberContainer';
import { getActiveLegAlertSeverityLevel } from '../../util/alertUtils';
import {
  getLegMode,
  splitLegsAtViaPoints,
  compressLegs,
  getLegBadgeProps,
  isCallAgencyLeg,
  getInterliningLegs,
  getTotalDistance,
  getRouteText,
  legTime,
  legTimeStr,
  LegMode,
} from '../../util/legUtils';
import { dateOrEmpty, isTomorrow, timeStr } from '../../util/timeUtils';
import withBreakpoint from '../../util/withBreakpoint';
import { isKeyboardSelectionEvent } from '../../util/browser';
import {
  BIKEAVL_UNKNOWN,
  getRentalNetworkIcon,
  getRentalNetworkConfig,
  getVehicleCapacity,
} from '../../util/vehicleRentalUtils';
import { getRouteMode } from '../../util/modeUtils';
import { getCapacityForLeg } from '../../util/occupancyUtil';
import getCo2Value from '../../util/emissions';

const NAME_LENGTH_THRESHOLD = 65; // for truncating long short names

const Leg = ({
  mode,
  routeNumber,
  legLength,
  fitRouteNumber,
  renderModeIcons,
}) => {
  return (
    <div
      className={cx(
        'leg',
        mode.toLowerCase(),
        fitRouteNumber ? 'fit-route-number' : '',
        renderModeIcons ? 'render-icon' : '',
      )}
      style={{ '--width': `${legLength}%` }}
    >
      {routeNumber}
    </div>
  );
};

Leg.propTypes = {
  routeNumber: PropTypes.node.isRequired,
  legLength: PropTypes.number.isRequired,
  mode: PropTypes.string.isRequired,
  fitRouteNumber: PropTypes.bool,
  renderModeIcons: PropTypes.bool,
};

Leg.defaultProps = {
  fitRouteNumber: false,
  renderModeIcons: false,
};

export function RouteLeg(
  {
    leg,
    large,
    intl,
    legLength,
    isTransitLeg,
    interliningWithRoute,
    fitRouteNumber,
    withBicycle,
    withCar,
    hasOneTransitLeg,
    shortenLabels,
  },
  { config },
) {
  const isCallAgency = isCallAgencyLeg(leg);
  let routeNumber;
  const mode = getRouteMode(leg.route, config);

  const getOccupancyStatus = () => {
    if (hasOneTransitLeg) {
      return getCapacityForLeg(config, leg);
    }
    return undefined;
  };

  if (isCallAgency) {
    const message = intl.formatMessage({
      id: 'pay-attention',
      defaultMessage: 'Pay Attention',
    });

    routeNumber = (
      <RouteNumber
        mode="call"
        text={message}
        className={cx('line', 'call')}
        vertical
        withBar
        isTransitLeg={isTransitLeg}
      />
    );
  } else {
    routeNumber = (
      <RouteNumberContainer
        alertSeverityLevel={getActiveLegAlertSeverityLevel(leg)}
        route={leg.route}
        className={cx('line', mode)}
        interliningWithRoute={interliningWithRoute}
        mode={mode}
        vertical
        withBar
        isTransitLeg={isTransitLeg}
        withBicycle={withBicycle}
        withCar={withCar}
        occupancyStatus={getOccupancyStatus()}
        shortenLongText={shortenLabels}
      />
    );
  }
  return (
    <Leg
      mode={mode}
      routeNumber={routeNumber}
      large={large}
      legLength={legLength}
      fitRouteNumber={fitRouteNumber}
    />
  );
}

RouteLeg.propTypes = {
  leg: legShape.isRequired,
  intl: intlShape.isRequired,
  large: PropTypes.bool.isRequired,
  legLength: PropTypes.number.isRequired,
  fitRouteNumber: PropTypes.bool.isRequired,
  interliningWithRoute: PropTypes.string,
  isTransitLeg: PropTypes.bool,
  withBicycle: PropTypes.bool.isRequired,
  withCar: PropTypes.bool.isRequired,
  hasOneTransitLeg: PropTypes.bool,
  shortenLabels: PropTypes.bool,
};

RouteLeg.contextTypes = {
  config: configShape.isRequired,
};

RouteLeg.defaultProps = {
  isTransitLeg: true,
  interliningWithRoute: undefined,
  hasOneTransitLeg: false,
  shortenLabels: false,
};

export const ModeLeg = (
  { leg, mode, large, legLength, duration, renderModeIcons, icon },
  { config },
) => {
  let networkIcon;
  if (
    (mode === 'CITYBIKE' || mode === 'BICYCLE') &&
    leg.from.vehicleRentalStation
  ) {
    networkIcon =
      leg.from.vehicleRentalStation &&
      getRentalNetworkIcon(
        getRentalNetworkConfig(
          leg.from.vehicleRentalStation.rentalNetwork.networkId,
          config,
        ),
      );
  } else if (mode === 'SCOOTER') {
    networkIcon = 'icon-icon_scooter_rider';
  }
  const routeNumber = (
    <RouteNumber
      mode={mode}
      text=""
      className={cx('line', mode.toLowerCase())}
      duration={duration}
      renderModeIcons={renderModeIcons}
      vertical
      withBar
      icon={networkIcon || icon}
      {...getLegBadgeProps(leg, config)}
    />
  );
  return (
    <Leg
      mode={mode}
      routeNumber={routeNumber}
      renderModeIcons={renderModeIcons}
      large={large}
      legLength={legLength}
    />
  );
};

ModeLeg.propTypes = {
  leg: legShape.isRequired,
  mode: PropTypes.string.isRequired,
  large: PropTypes.bool.isRequired,
  legLength: PropTypes.number.isRequired,
  renderModeIcons: PropTypes.bool,
  duration: PropTypes.number,
  icon: PropTypes.string,
};

ModeLeg.defaultProps = {
  renderModeIcons: false,
  duration: undefined,
  icon: undefined,
};

ModeLeg.contextTypes = {
  config: configShape.isRequired,
};

export const ViaLeg = () => (
  <div className="leg via">
    <Icon img="icon-icon_mapMarker-via" className="itinerary-icon place" />
  </div>
);

const getViaPointIndex = (leg, intermediatePlaces) => {
  if (!leg || !Array.isArray(intermediatePlaces)) {
    return -1;
  }
  return intermediatePlaces.findIndex(
    place => place.lat === leg.from.lat && place.lon === leg.from.lon,
  );
};

const connectsFromViaPoint = (currLeg, intermediatePlaces) =>
  getViaPointIndex(currLeg, intermediatePlaces) > -1;

const bikeWasParked = legs => {
  const legsLength = legs.length;
  for (let i = 0; i < legsLength; i++) {
    if (legs[i].to && legs[i].to.vehicleParking) {
      return i;
    }
  }
  return legs.length;
};

const hasOneTransitLeg = itinerary => {
  return itinerary.legs.filter(leg => leg.transitLeg).length === 1;
};

const Itinerary = (
  {
    itinerary,
    breakpoint,
    intermediatePlaces,
    hideSelectionIndicator,
    lowestCo2value,
    ...props
  },
  { intl, intl: { formatMessage }, config },
) => {
  const isTransitLeg = leg => leg.transitLeg;
  const isTransitOrRentalLeg = leg => leg.transitLeg || leg.rentedBike;
  const isLegOnFoot = leg => leg.mode === 'WALK' || leg.mode === 'BICYCLE_WALK';
  const usingOwnBicycle = itinerary.legs.some(
    leg => getLegMode(leg) === 'BICYCLE' && leg.rentedBike === false,
  );
  const usingOwnBicycleWholeTrip =
    usingOwnBicycle && itinerary.legs.every(leg => !leg.to.vehicleParking);
  const usingOwnCar = itinerary.legs.some(leg => getLegMode(leg) === 'CAR');
  const usingOwnCarWholeTrip =
    usingOwnCar && itinerary.legs.every(leg => !leg.to.vehicleParking);
  const { refTime } = props;
  const startTime = Date.parse(itinerary.start);
  const endTime = Date.parse(itinerary.end);
  const departureTime = timeStr(itinerary.start);
  const arrivalTime = timeStr(itinerary.end);
  const duration = endTime - startTime;
  const co2value = getCo2Value(itinerary);
  const mobile = bp => !(bp === 'large');
  const legs = [];
  let noTransitLegs = true;
  const splitLegs = splitLegsAtViaPoints(itinerary.legs, intermediatePlaces);
  const compressedLegs = compressLegs(splitLegs).map(leg => ({
    ...leg,
  }));
  let intermediateSlack = 0;
  let transitLegCount = 0;
  let containsScooterLeg = false;
  let nameLengthSum = 0; // approximate space required for route labels
  compressedLegs.forEach((leg, i) => {
    if (isTransitLeg(leg)) {
      noTransitLegs = false;
      transitLegCount += 1;
      nameLengthSum += getRouteText(leg.route, config).length;
    }
    nameLengthSum += 10; // every leg requires some minimum space
    if (
      leg.intermediatePlace ||
      connectsFromViaPoint(leg, intermediatePlaces)
    ) {
      intermediateSlack +=
        legTime(leg.start) - legTime(compressedLegs[i - 1].end); // calculate time spent at each intermediate place
    }
    containsScooterLeg = leg.mode === 'SCOOTER' || containsScooterLeg;
  });
  const shortenLabels = nameLengthSum > NAME_LENGTH_THRESHOLD;
  const durationWithoutSlack = duration - intermediateSlack; // don't include time spent at intermediate places in calculations for bar lengths
  const relativeLength = durationMs =>
    (100 * durationMs) / durationWithoutSlack; // as %
  let renderBarThreshold = 6;
  const renderRouteNumberThreshold = 12; // route numbers will be rendered on legs that are longer than this
  if (breakpoint === 'small') {
    renderBarThreshold = 8.5;
  }
  let firstLegStartTime = null;
  const vehicleNames = [];
  const stopNames = [];
  let addition = 0;
  let onlyIconLegs = 0; // keep track of legs that are too short to have a bar
  const onlyIconLegsLength = 0;
  const waitThreshold = 180000;
  const lastLeg = compressedLegs[compressedLegs.length - 1];
  const lastLegLength = relativeLength(lastLeg.duration * 1000);
  const fitAllRouteNumbers = transitLegCount < 4; // if there are three or fewer transit legs, we will show all the route numbers.
  const bikeParkedIndex = usingOwnBicycle
    ? bikeWasParked(compressedLegs)
    : undefined;
  const renderModeIcons = compressedLegs.length < 10;
  let bikeNetwork;
  let showRentalBikeDurationWarning = false;
  const citybikeNetworks = new Set();
  let citybikeicon;
  compressedLegs.forEach((leg, i) => {
    let interliningWithRoute;
    let renderBar = true;
    let waiting = false;
    let waitTime;
    let waitLength;
    const startMs = legTime(leg.start);
    const endMs = legTime(leg.end);
    const isNextLegLast = i + 1 === compressedLegs.length - 1;
    const shouldRenderLastLeg =
      isNextLegLast && lastLegLength < renderBarThreshold;
    const previousLeg = compressedLegs[i - 1];
    const nextLeg = compressedLegs[i + 1];
    let legLength = relativeLength(endMs - startMs);
    const longName = !leg?.route?.shortName || leg?.route?.shortName.length > 5;

    if (
      nextLeg &&
      !nextLeg.intermediatePlace &&
      !connectsFromViaPoint(nextLeg, intermediatePlaces)
    ) {
      // don't show waiting in intermediate places
      waitTime = legTime(nextLeg.start) - endMs;
      waitLength = relativeLength(waitTime);
      if (waitTime > waitThreshold && waitLength > renderBarThreshold) {
        // if waittime is long enough, render a waiting bar
        waiting = true;
      } else {
        // otherwise add the waiting to the current leg's length
        legLength = relativeLength(endMs - startMs + waitTime);
      }
    }

    const [interliningLines, interliningLegs] = getInterliningLegs(
      compressedLegs,
      i,
    );

    const lastLegWithInterline = interliningLegs[interliningLegs.length - 1];
    if (lastLegWithInterline) {
      interliningWithRoute = interliningLines.join(' / ');
      legLength =
        ((legTime(lastLegWithInterline.end) - startMs) / durationWithoutSlack) *
        100;
    }
    legLength += addition;
    addition = 0;

    if (shouldRenderLastLeg) {
      legLength += lastLegLength; // if the last leg is too short add its length to the leg before it
    }
    if (legLength < renderBarThreshold && isLegOnFoot(leg)) {
      // don't render short legs that are on foot at all
      renderBar = false;
      addition += legLength; // carry over the length of the leg to the next
    }
    // There are two places which inject ViaLegs in this logic, but we certainly
    // don't want to add it twice in the same place with the same key, so we
    // record whether we added it here at the first place.
    let viaAdded = false;
    if (leg.intermediatePlace) {
      onlyIconLegs += 1;
      legs.push(<ViaLeg key={`via_${leg.mode}_${startMs}`} />);
      viaAdded = true;
    }
    if (isLegOnFoot(leg) && renderBar) {
      const walkingTime = Math.floor(leg.duration / 60);
      let walkMode = 'walk';
      if (usingOwnBicycle && i < bikeParkedIndex) {
        walkMode = 'bicycle_walk';
      }
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${startMs}`}
          renderModeIcons={renderModeIcons}
          isTransitLeg={false}
          leg={leg}
          duration={walkingTime}
          mode={walkMode}
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
      if (usingOwnBicycle && leg.to.vehicleParking) {
        onlyIconLegs += 1;
        legs.push(
          <div
            className="leg bike_park"
            key={`${leg.mode}_${startMs}_bike_park_indicator`}
          >
            <Icon
              img="icon-bike_parking"
              className="itinerary-icon bike_park"
            />
          </div>,
        );
      }
    } else if (
      (leg.mode === 'CITYBIKE' || leg.mode === 'BICYCLE') &&
      leg.rentedBike
    ) {
      const bikingTime = Math.floor(leg.duration / 60);
      bikeNetwork =
        leg.from.vehicleRentalStation?.rentalNetwork.networkId ||
        leg.from.rentalVehicle?.rentalNetwork.networkId;
      if (
        bikeNetwork &&
        config.vehicleRental.networks &&
        config.vehicleRental.networks[bikeNetwork]?.timeBeforeSurcharge &&
        config.vehicleRental.networks[bikeNetwork]?.durationInstructions
      ) {
        const rentDurationOverSurchargeLimit =
          leg.duration >
          config.vehicleRental?.networks[bikeNetwork].timeBeforeSurcharge;
        if (rentDurationOverSurchargeLimit) {
          citybikeNetworks.add(bikeNetwork);
        }
        showRentalBikeDurationWarning =
          showRentalBikeDurationWarning || rentDurationOverSurchargeLimit;
        if (!citybikeicon) {
          citybikeicon = getRentalNetworkIcon(
            getRentalNetworkConfig(bikeNetwork, config),
          );
        }
      }
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${startMs}`}
          isTransitLeg={false}
          renderModeIcons={renderModeIcons}
          leg={leg}
          duration={bikingTime}
          mode="CITYBIKE"
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
      vehicleNames.push(
        formatMessage({
          id: `to-bicycle`,
        }),
      );
      stopNames.push(leg.from.name);
    } else if (leg.mode === 'SCOOTER' && leg.rentedBike) {
      const scooterDuration = Math.floor(leg.duration / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${leg.start.scheduledTime}`}
          isTransitLeg={false}
          renderModeIcons={renderModeIcons}
          leg={leg}
          duration={scooterDuration}
          mode="SCOOTER"
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
      vehicleNames.push(
        formatMessage({
          id: `to-e-scooter`,
        }),
      );
      stopNames.push('');
    } else if (leg.mode === 'CAR') {
      const drivingTime = Math.floor(leg.duration / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${startMs}`}
          leg={leg}
          duration={drivingTime}
          mode="CAR"
          legLength={legLength}
          large={breakpoint === 'large'}
          icon="icon-icon_car-withoutBox"
        />,
      );
      if (leg.to.vehicleParking) {
        onlyIconLegs += 1;
        legs.push(
          <div
            className="leg car_park"
            key={`${leg.mode}_${startMs}_car_park_indicator`}
          >
            <Icon
              img="icon-icon_car-park"
              className="itinerary-icon car_park"
            />
          </div>,
        );
      }
    } else if (leg.mode === 'BICYCLE' && renderBar) {
      const bikingTime = Math.floor(leg.duration / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${startMs}`}
          isTransitLeg={false}
          duration={bikingTime}
          renderModeIcons={renderModeIcons}
          leg={leg}
          mode={leg.mode}
          legLength={legLength}
          large={breakpoint === 'large'}
        />,
      );
      if (leg.to.vehicleParking) {
        onlyIconLegs += 1;
        legs.push(
          <div
            className="leg bike_park"
            key={`${leg.mode}_${startMs}_bike_park_indicator`}
          >
            <Icon
              img="icon-bike_parking"
              className="itinerary-icon bike_park"
            />
          </div>,
        );
      }
    }

    if (leg.route) {
      const withBicycle =
        usingOwnBicycleWholeTrip &&
        config.bikeBoardingModes[leg.route.mode] !== undefined;
      const withCar =
        usingOwnCarWholeTrip &&
        config.carBoardingModes[leg.route.mode] !== undefined;
      if (
        previousLeg &&
        !previousLeg.intermediatePlace &&
        connectsFromViaPoint(leg, intermediatePlaces) &&
        !viaAdded
      ) {
        legs.push(<ViaLeg key={`via_${leg.mode}_${startMs}`} />);
      }
      const renderRouteNumberForALongLeg =
        legLength > renderRouteNumberThreshold &&
        !longName &&
        transitLegCount < 7;
      if (!leg.interlineWithPreviousLeg) {
        legs.push(
          <RouteLeg
            key={`${leg.mode}_${startMs}`}
            leg={leg}
            fitRouteNumber={
              (fitAllRouteNumbers && !longName) || renderRouteNumberForALongLeg
            }
            interliningWithRoute={interliningWithRoute}
            intl={intl}
            legLength={legLength}
            large={breakpoint === 'large'}
            withBicycle={withBicycle}
            withCar={withCar}
            hasOneTransitLeg={hasOneTransitLeg(itinerary)}
            shortenLabels={shortenLabels}
          />,
        );
      }
      vehicleNames.push(
        formatMessage(
          {
            id: `${leg.mode.toLowerCase()}-with-route-number`,
          },
          {
            routeNumber: leg.route.shortName,
            headSign: '',
          },
        ),
      );
      stopNames.push(leg.from.name);
    }

    if (waiting && !nextLeg?.interlineWithPreviousLeg) {
      const waitingTimeinMin = Math.floor(waitTime / 1000 / 60);
      legs.push(
        <ModeLeg
          key={`${leg.mode}_${startMs}_wait`}
          leg={leg}
          legLength={waitLength}
          renderModeIcons={renderModeIcons}
          duration={waitingTimeinMin}
          isTransitLeg={false}
          mode={LegMode.Wait}
          large={breakpoint === 'large'}
          icon={usingOwnCarWholeTrip ? 'icon-icon_wait-car' : undefined}
        />,
      );
    }
  });
  const normalLegs = legs.length - onlyIconLegs;
  // how many pixels to take from each 'normal' leg to give room for the icons
  const iconLegsInPixels = (24 * onlyIconLegs) / normalLegs;
  // the leftover percentage from only showing icons added to each 'normal' leg
  const iconLegsInPercents = onlyIconLegsLength / normalLegs;
  let firstDeparture;
  if (!noTransitLegs) {
    firstDeparture = compressedLegs.find(isTransitLeg);
    if (firstDeparture) {
      let firstDepartureStopType;
      if (firstDeparture.mode === 'RAIL' || firstDeparture.mode === 'SUBWAY') {
        firstDepartureStopType = 'from-station';
      } else {
        firstDepartureStopType = 'from-stop';
      }
      let firstDeparturePlatform;
      if (firstDeparture.from.stop.platformCode) {
        const comma = ', ';
        firstDeparturePlatform = (
          <span className="platform-or-track">
            {comma}
            <FormattedMessage
              id={firstDeparture.mode === 'RAIL' ? 'track-num' : 'platform-num'}
              values={{ platformCode: firstDeparture.from.stop.platformCode }}
            />
          </span>
        );
      }
      firstLegStartTime = firstDeparture.rentedBike ? (
        <div
          className={cx('itinerary-first-leg-start-time', {
            small: breakpoint !== 'large',
          })}
        >
          <FormattedMessage
            id="itinerary-summary-row.first-leg-start-time-citybike"
            values={{
              firstDepartureTime: (
                <span
                  className={cx('time', { realtime: firstDeparture.realTime })}
                >
                  {legTimeStr(firstDeparture.start)}
                </span>
              ),
              firstDepartureStop: firstDeparture.from.name,
            }}
          />
          <div>
            {getVehicleCapacity(
              config,
              firstDeparture.from.vehicleRentalStation.rentalNetwork.networkId,
            ) !== BIKEAVL_UNKNOWN && (
              <FormattedMessage
                id="bikes-available"
                values={{
                  amount:
                    firstDeparture.from.vehicleRentalStation.availableVehicles
                      .total,
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div
          className={cx('itinerary-first-leg-start-time', 'overflow-fade', {
            small: breakpoint !== 'large',
          })}
        >
          <FormattedMessage
            id="itinerary-summary-row.first-leg-start-time"
            values={{
              firstDepartureTime: (
                <span
                  className={cx('start-time', {
                    realtime: firstDeparture.realTime,
                  })}
                >
                  {legTimeStr(firstDeparture.start)}
                </span>
              ),
              firstDepartureStopType: (
                <FormattedMessage id={firstDepartureStopType} />
              ),
              firstDepartureStop: stopNames[0],
              firstDeparturePlatform,
            }}
          />
        </div>
      );
    }
  } else {
    firstLegStartTime = (
      <div
        className={cx('itinerary-first-leg-start-time', {
          small: breakpoint !== 'large',
        })}
      >
        <FormattedMessage id="itinerary-summary-row.no-transit-legs" />
      </div>
    );
  }

  const classes = cx([
    'itinerary-summary-row',
    'cursor-pointer',
    {
      passive: props.passive,
      'bp-large': breakpoint === 'large',
      'no-border': hideSelectionIndicator,
    },
  ]);

  //  accessible representation for summary
  const firstDepartureWithRentals = compressedLegs.find(isTransitOrRentalLeg);
  firstDeparture = firstDepartureWithRentals?.rentedBike
    ? firstDepartureWithRentals
    : firstDeparture;
  const rentalLabelId =
    firstDeparture?.mode.toLowerCase() === 'scooter'
      ? 'itinerary-summary-row.first-leg-start-time-scooter'
      : 'itinerary-summary-row.first-leg-start-time-citybike';
  const firstDepartureLabelId = firstDepartureWithRentals?.rentedBike
    ? rentalLabelId
    : 'itinerary-summary-row.first-departure';
  const textSummary = (
    <div className="sr-only" key="screenReader">
      <FormattedMessage
        id="itinerary-summary-row.description"
        values={{
          departureDate: dateOrEmpty(startTime, refTime),
          departureTime,
          arrivalDate: dateOrEmpty(endTime, refTime),
          arrivalTime,
          firstDeparture: vehicleNames.length && firstDeparture && (
            <FormattedMessage
              id={firstDepartureLabelId}
              values={{
                vehicle: vehicleNames[0],
                departureTime: legTimeStr(firstDeparture.start),
                firstDepartureTime: legTimeStr(firstDeparture.start), // vehicle rental start time
                stopName: stopNames[0],
                firstDepartureStop: stopNames[0], // vehicle rental stop name
              }}
            />
          ),
          transfers: vehicleNames.map((name, index) => {
            if (index === 0) {
              return null;
            }
            return formatMessage(
              {
                id: stopNames[index]
                  ? 'itinerary-summary-row.transfers'
                  : 'itinerary-summary-row.transfers-to-rental',
              },
              {
                vehicle: name,
                stopName: stopNames[index],
              },
            );
          }),
          totalTime: <RelativeDuration duration={duration} />,
        }}
      />
    </div>
  );
  const co2summary = (
    <div className="sr-only">
      <FormattedMessage
        id="itinerary-co2.description-simple"
        defaultMessage="CO₂ emissions for this route"
        values={{
          co2value,
        }}
      />
    </div>
  );

  const ariaLabelMessage = intl.formatMessage(
    {
      id: 'itinerary-page.show-details-label',
    },
    { number: props.hash + 1 },
  );

  const dateString = dateOrEmpty(startTime, refTime);
  const date = (
    <>
      {dateString}
      <span> </span>
      {dateString && <FormattedMessage id="at-time" />}
    </>
  );

  const startDate = isTomorrow(startTime, refTime) ? (
    <div className="tomorrow">
      <FormattedMessage id="tomorrow" />
    </div>
  ) : (
    date
  );
  const showCo2Info =
    config.showCO2InItinerarySummary &&
    co2value !== null &&
    co2value >= 0 &&
    !containsScooterLeg;

  const itineraryContainerOverflowRef = createRef();
  const [showOverflowIcon, setShowOverflowIcon] = useState(false);
  useLayoutEffect(() => {
    // If the itinerary length exceeds its boundaries an icon with dots is displayed.
    if (
      itineraryContainerOverflowRef.current.clientWidth <
      itineraryContainerOverflowRef.current.scrollWidth
    ) {
      setShowOverflowIcon(true);
    } else {
      setShowOverflowIcon(false);
    }
  }, [itineraryContainerOverflowRef]);
  return (
    <span role="listitem" className={classes} aria-atomic="true">
      <h3 className="sr-only">
        <FormattedMessage
          id="summary-page.row-label"
          values={{
            number: props.hash + 1,
          }}
        />
      </h3>
      {textSummary}
      {showCo2Info && co2summary}
      <div className="itinerary-summary-visible" style={{ display: 'flex' }}>
        {/* This next clickable region does not have proper accessible role, tabindex and keyboard handler
            because screen reader works weirdly with nested buttons. Same functonality works from the inner button */
        /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div className="itinerary-summary-header">
          <div
            className="summary-clickable-area"
            onClick={e => {
              if (mobile(breakpoint)) {
                e.stopPropagation();
                props.onSelectImmediately(props.hash);
              } else {
                props.onSelect(props.hash);
              }
            }}
            onKeyPress={e =>
              isKeyboardSelectionEvent(e) && props.onSelect(props.hash)
            }
            tabIndex="0"
            role="button"
            aria-label={ariaLabelMessage}
          >
            <span key="ShowOnMapScreenReader" className="sr-only">
              <FormattedMessage id="itinerary-summary-row.clickable-area-description" />
            </span>
            <div
              className="itinerary-duration-container"
              key="startTime"
              aria-hidden="true"
            >
              {startDate && (
                <div className="itinerary-start-date">{startDate}</div>
              )}
              <div className="itinerary-start-time-and-end-time">
                {`${departureTime} - ${arrivalTime}`}
              </div>

              <div style={{ flexGrow: 1 }} />
              {config.showDistanceInItinerarySummary && (
                <div className="itinerary-total-distance">
                  {(getTotalDistance(itinerary) / 1000).toFixed(1)} km
                </div>
              )}
              {showCo2Info && (
                <div className="itinerary-co2-value-container">
                  {lowestCo2value === co2value && (
                    <Icon img="icon-icon_co2_leaf" className="co2-leaf" />
                  )}
                  <div className="itinerary-co2-value">{co2value} g</div>
                </div>
              )}
              <div className="itinerary-duration">
                <RelativeDuration duration={duration} />
              </div>
            </div>
            <div
              className="legs-container"
              style={{ '--minus': `${iconLegsInPixels}px` }}
              key="legs"
              aria-hidden="true"
            >
              <div
                className={cx(
                  'itinerary-legs',
                  showOverflowIcon ? 'overflow-icon' : '',
                )}
                style={{ '--plus': `${iconLegsInPercents}%` }}
                ref={itineraryContainerOverflowRef}
              >
                {legs}
              </div>
              <div className="overflow-icon-container">
                {showOverflowIcon && (
                  <Icon img="icon-icon_three-dots" className="overflow-icon" />
                )}
              </div>
            </div>
            <div
              className="itinerary-first-leg-start-time-container"
              key="endtime-distance"
              aria-hidden="true"
            >
              {firstLegStartTime}
            </div>
            {showRentalBikeDurationWarning &&
              (citybikeNetworks.size === 1 ? (
                <div className="citybike-duration-info-short">
                  <Icon img={citybikeicon} height={1.2} width={1.2} />
                  <FormattedMessage
                    id="citybike-duration-info-short"
                    values={{
                      duration:
                        config.vehicleRental.networks[bikeNetwork]
                          .timeBeforeSurcharge / 60,
                    }}
                    defaultMessage=""
                  />
                </div>
              ) : (
                <div className="citybike-duration-info-short">
                  <Icon img={citybikeicon} height={1.2} width={1.2} />
                  <FormattedMessage
                    id="citybike-duration-general-header"
                    defaultMessage=""
                  />
                </div>
              ))}
          </div>
          {mobile(breakpoint) !== true && (
            <div
              tabIndex="0"
              role="button"
              title={formatMessage({
                id: 'itinerary-page.show-details',
              })}
              key="arrow"
              className="action-arrow-click-area flex-vertical noborder"
              onClick={e => {
                e.stopPropagation();
                props.onSelectImmediately(props.hash);
              }}
              onKeyPress={e =>
                isKeyboardSelectionEvent(e) &&
                props.onSelectImmediately(props.hash)
              }
              aria-label={ariaLabelMessage}
            >
              <div className="action-arrow flex-grow">
                <Icon img="icon-icon_arrow-collapse--right" />
              </div>
            </div>
          )}
        </div>
        <span className="itinerary-details-container" aria-expanded="false" />
      </div>
    </span>
  );
};

Itinerary.propTypes = {
  itinerary: itineraryShape.isRequired,
  refTime: PropTypes.number.isRequired,
  passive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onSelectImmediately: PropTypes.func.isRequired,
  hash: PropTypes.number.isRequired,
  breakpoint: PropTypes.string.isRequired,
  intermediatePlaces: PropTypes.arrayOf(locationShape),
  hideSelectionIndicator: PropTypes.bool,
  lowestCo2value: PropTypes.number,
  viaPoints: PropTypes.arrayOf(locationShape),
};

Itinerary.defaultProps = {
  passive: false,
  intermediatePlaces: [],
  hideSelectionIndicator: true,
  lowestCo2value: 0,
  viaPoints: [],
};

Itinerary.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

Itinerary.displayName = 'Itinerary';

const ItineraryWithBreakpoint = withBreakpoint(Itinerary);

const containerComponent = createFragmentContainer(ItineraryWithBreakpoint, {
  itinerary: graphql`
    fragment Itinerary_itinerary on Itinerary {
      start
      end
      emissionsPerPerson {
        co2
      }
      legs {
        realTime
        realtimeState
        transitLeg
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
        mode
        distance
        duration
        rentedBike
        interlineWithPreviousLeg
        intermediatePlace
        intermediatePlaces {
          stop {
            zoneId
            gtfsId
            parentStation {
              gtfsId
            }
          }
          arrival {
            scheduledTime
            estimated {
              time
            }
          }
        }
        route {
          gtfsId
          mode
          shortName
          type
          color
          agency {
            name
          }
          alerts {
            alertSeverityLevel
            effectiveEndDate
            effectiveStartDate
          }
        }
        trip {
          gtfsId
          stoptimes {
            stop {
              gtfsId
            }
            pickupType
          }
          occupancy {
            occupancyStatus
          }
        }
        from {
          lat
          lon
          name
          stop {
            gtfsId
            parentStation {
              gtfsId
            }
            zoneId
            alerts {
              alertSeverityLevel
              effectiveEndDate
              effectiveStartDate
            }
          }
          vehicleRentalStation {
            availableVehicles {
              total
            }
            rentalNetwork {
              networkId
            }
          }
        }
        to {
          stop {
            gtfsId
            parentStation {
              gtfsId
            }
            zoneId
            alerts {
              alertSeverityLevel
              effectiveEndDate
              effectiveStartDate
            }
          }
          vehicleParking {
            name
          }
        }
      }
    }
  `,
});

export { containerComponent as default, Itinerary as component };
