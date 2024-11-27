/* eslint-disable react/no-array-index-key */
import PropTypes from 'prop-types';
import React from 'react';
import {
  configShape,
  fareShape,
  itineraryShape,
  relayShape,
} from '../../util/shapes';
import TransitLeg from './TransitLeg';
import WalkLeg from './WalkLeg';
import WaitLeg from './WaitLeg';
import BicycleLeg from './BicycleLeg';
import EndLeg from './EndLeg';
import AirportCheckInLeg from './AirportCheckInLeg';
import AirportCollectLuggageLeg from './AirportCollectLuggageLeg';
import StopCode from '../StopCode';
import AirplaneLeg from './AirplaneLeg';
import CarLeg from './CarLeg';
import CarParkLeg from './CarParkLeg';
import ViaLeg from './ViaLeg';
import CallAgencyLeg from './CallAgencyLeg';
import {
  compressLegs,
  isCallAgencyPickupType,
  isLegOnFoot,
  legTime,
} from '../../util/legUtils';
import { getRouteMode } from '../../util/modeUtils';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import Profile from './Profile';
import BikeParkLeg from './BikeParkLeg';

const stopCode = stop => stop && stop.code && <StopCode code={stop.code} />;

export default class Legs extends React.Component {
  static childContextTypes = {
    focusFunction: PropTypes.func,
  };

  static propTypes = {
    itinerary: itineraryShape.isRequired,
    fares: PropTypes.arrayOf(fareShape),
    focusToPoint: PropTypes.func.isRequired,
    focusToLeg: PropTypes.func.isRequired,
    changeHash: PropTypes.func,
    tabIndex: PropTypes.number,
    openSettings: PropTypes.func.isRequired,
    showBikeBoardingInformation: PropTypes.bool,
    relayEnvironment: relayShape,
  };

  static contextTypes = { config: configShape };

  static defaultProps = {
    fares: [],
    changeHash: undefined,
    tabIndex: undefined,
    showBikeBoardingInformation: false,
    relayEnvironment: undefined,
  };

  getChildContext() {
    return { focusFunction: this.focus };
  }

  focus = position => e => {
    e.stopPropagation();
    this.props.focusToPoint(position.lat, position.lon);
    addAnalyticsEvent({
      category: 'Itinerary',
      action: 'ZoomMapToStopLocation',
      name: null,
    });
  };

  focusToLeg = leg => e => {
    e.stopPropagation();
    this.props.focusToLeg(leg);
  };

  render() {
    const { itinerary, fares, showBikeBoardingInformation, relayEnvironment } =
      this.props;
    const { waitThreshold } = this.context.config.itinerary;

    const compressedLegs = compressLegs(itinerary.legs, true).map(leg => ({
      showBikeBoardingInformation,
      ...leg,
      fare:
        (leg.route &&
          fares?.find(fare => fare.routeGtfsId === leg.route.gtfsId)) ||
        undefined,
    }));
    const numberOfLegs = compressedLegs.length;
    if (numberOfLegs === 0) {
      return null;
    }
    const bikeParked = compressedLegs.some(
      leg => leg.to.vehicleParking && leg.mode === 'BICYCLE',
    );
    let previousLeg;
    let nextLeg;
    const legs = [];
    compressedLegs.forEach((leg, j) => {
      nextLeg = j + 1 < numberOfLegs ? compressedLegs[j + 1] : undefined;
      if (j > 0) {
        previousLeg = compressedLegs[j - 1];
      }
      const startTime = previousLeg?.end || leg.start;
      let index = j;
      const interliningLegs = [];
      // there can be an arbitrary amount of interlining legs, search for the last one
      while (
        compressedLegs[index + 1] &&
        compressedLegs[index + 1].interlineWithPreviousLeg
      ) {
        interliningLegs.push(compressedLegs[index + 1]);
        index += 1;
      }
      const isNextLegInterlining = nextLeg?.interlineWithPreviousLeg;
      const bikePark =
        previousLeg?.mode === 'BICYCLE' && previousLeg.to.vehicleParking;
      const carPark =
        previousLeg?.mode === 'CAR' && previousLeg.to.vehicleParking;
      const legProps = {
        leg,
        index: j,
        focusAction: this.focus(leg.from),
        focusToLeg: this.focusToLeg(leg),
      };
      const transitLegProps = {
        leg,
        index: j,
        interliningLegs,
        focusAction: this.focus(leg.from),
        changeHash: this.props.changeHash,
        tabIndex: this.props.tabIndex,
      };

      let waitLeg;
      if (nextLeg) {
        const waitThresholdInMs = waitThreshold * 1000;
        const waitTime = legTime(nextLeg.start) - legTime(leg.end);
        if (
          waitTime > waitThresholdInMs &&
          (nextLeg != null ? nextLeg.mode : null) !== 'AIRPLANE' &&
          leg.mode !== 'AIRPLANE' &&
          leg.mode !== 'CAR' &&
          !nextLeg.intermediatePlace &&
          !isNextLegInterlining &&
          leg.to.stop
        ) {
          waitLeg = (
            <WaitLeg
              index={j}
              leg={leg}
              start={leg.end}
              waitTime={waitTime}
              focusAction={this.focus(leg.to)}
            >
              {stopCode(leg.to.stop)}
            </WaitLeg>
          );
        }
      }
      if (leg.mode !== 'WALK' && isCallAgencyPickupType(leg)) {
        legs.push(<CallAgencyLeg {...transitLegProps} />);
      } else if (leg.intermediatePlace) {
        legs.push(<ViaLeg {...legProps} arrival={startTime} />);
      } else if (bikePark) {
        legs.push(<BikeParkLeg {...legProps} bikePark={bikePark} />);
      } else if (carPark) {
        legs.push(<CarParkLeg {...legProps} carPark={carPark} />);
      } else if (isLegOnFoot(leg)) {
        legs.push(
          <WalkLeg {...legProps} previousLeg={previousLeg}>
            {stopCode(leg.from.stop)}
          </WalkLeg>,
        );
      } else if (
        (leg.mode === 'BUS' ||
          leg.mode === 'TRAM' ||
          leg.mode === 'RAIL' ||
          leg.mode === 'SUBWAY' ||
          leg.mode === 'FERRY' ||
          leg.mode === 'FUNICULAR') &&
        !leg.interlineWithPreviousLeg
      ) {
        const mode = getRouteMode(
          {
            mode: leg.mode,
            type: leg.route?.type,
            gtfsId: leg.route?.gtfsId,
          },
          this.context.config,
        );
        legs.push(<TransitLeg mode={mode} {...transitLegProps} />);
      } else if (leg.mode === 'AIRPLANE') {
        legs.push(
          <AirportCheckInLeg
            index={j - 0.5}
            leg={leg}
            start={startTime}
            focusAction={this.focus(leg.from)}
          />,
        );
        legs.push(<AirplaneLeg {...transitLegProps} />);
        legs.push(
          <AirportCollectLuggageLeg
            index={j + 0.5}
            leg={leg}
            focusAction={this.focus(leg.to)}
          />,
        );
      } else if (
        leg.rentedBike ||
        leg.mode === 'BICYCLE' ||
        leg.mode === 'SCOOTER'
      ) {
        let bicycleWalkLeg;
        if (nextLeg?.mode === 'BICYCLE_WALK' && !bikeParked) {
          bicycleWalkLeg = nextLeg;
        }
        if (previousLeg?.mode === 'BICYCLE_WALK' && !bikeParked) {
          bicycleWalkLeg = previousLeg;
        }
        // if there is a transit leg after or before a bicycle leg, render a bicycle_walk leg without distance information
        // currently bike walk leg is not rendered if there is waiting at stop, because
        // 'walk bike to train and wait x minutes' is too confusing instruction
        // This cannot be fixed as long as bicycle leg renders also bike walking
        if (
          !bikeParked &&
          ((nextLeg?.transitLeg && !waitLeg) || previousLeg?.transitLeg)
        ) {
          let { from, to } = leg;
          // don't render instructions to walk bike out from vehicle
          // if biking starts from stop (no transit first)
          if (!previousLeg?.transitLeg && leg.from.stop) {
            from = {
              ...from,
              stop: undefined,
            };
          }
          if ((!nextLeg?.transitLeg && leg.to.stop) || waitLeg) {
            to = {
              ...to,
              stop: undefined,
            };
          }
          bicycleWalkLeg = {
            duration: 0,
            start: leg.start,
            end: leg.start,
            distance: -1,
            rentedBike: leg.rentedBike,
            to,
            from,
            mode: 'BICYCLE_WALK',
          };
        }
        legs.push(
          <BicycleLeg
            {...legProps}
            bicycleWalkLeg={bicycleWalkLeg}
            openSettings={this.props.openSettings}
            nextLegMode={nextLeg?.mode}
            relayEnvironment={relayEnvironment}
          />,
        );
      } else if (leg.mode === 'CAR') {
        legs.push(<CarLeg {...legProps}>{stopCode(leg.from.stop)}</CarLeg>);
      }

      if (waitLeg) {
        legs.push(waitLeg);
      }
    });

    // This solves edge case when itinerary ends at the stop without walking.
    // There should be WalkLeg rendered before EndLeg.
    const lastLeg = compressedLegs[numberOfLegs - 1];
    if (lastLeg.transitLeg && lastLeg.to.stop) {
      legs.push(
        <WalkLeg
          index={numberOfLegs}
          leg={lastLeg}
          previousLeg={lastLeg}
          focusAction={this.focus(lastLeg.to)}
          focusToLeg={this.focusToLeg(lastLeg)}
        >
          {stopCode(lastLeg.to.stop)}
        </WalkLeg>,
      );
    }

    legs.push(
      <EndLeg
        index={numberOfLegs}
        endTime={itinerary.end}
        focusAction={this.focus(lastLeg.to)}
        to={lastLeg.to}
      />,
    );

    legs.push(<Profile itinerary={itinerary} />);

    return (
      <span className="itinerary-list-container" role="list">
        {legs.map((item, idx) => {
          const listKey = `leg_${idx}`;
          return (
            <span role="listitem" key={listKey}>
              {item}
            </span>
          );
        })}
      </span>
    );
  }
}
