import PropTypes from 'prop-types';
/* eslint-disable react/no-array-index-key */

import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import polyUtil from 'polyline-encoded';
import { intlShape } from 'react-intl';
import { configShape, legShape } from '../../util/shapes';
import { getRouteMode } from '../../util/modeUtils';
import StopMarker from './non-tile-layer/StopMarker';
import Line from './Line';
import VehicleMarker from './non-tile-layer/VehicleMarker';
import { getMiddleOf } from '../../util/geo-utils';
import { isBrowser } from '../../util/browser';
import {
  isCallAgencyPickupType,
  getLegText,
  getInterliningLegs,
} from '../../util/legUtils';
import SpeechBubble from './SpeechBubble';
import { durationToString } from '../../util/timeUtils';
import TransitLegMarkers from './non-tile-layer/TransitLegMarkers';

class ItineraryLine extends React.Component {
  static contextTypes = {
    config: configShape.isRequired,
    intl: intlShape.isRequired,
  };

  static propTypes = {
    legs: PropTypes.arrayOf(legShape).isRequired,
    passive: PropTypes.bool,
    hash: PropTypes.number.isRequired,
    showTransferLabels: PropTypes.bool,
    showIntermediateStops: PropTypes.bool,
    showDurationBubble: PropTypes.bool,
    streetMode: PropTypes.string,
  };

  static defaultProps = {
    passive: false,
    streetMode: undefined,
    showTransferLabels: false,
    showIntermediateStops: false,
    showDurationBubble: false,
  };

  checkStreetMode(leg) {
    if (this.props.streetMode === 'walk') {
      return leg.mode === 'WALK';
    }
    if (this.props.streetMode === 'bike') {
      return leg.mode === 'BICYCLE';
    }
    return false;
  }

  render() {
    if (!isBrowser) {
      return false;
    }

    const objs = [];
    const transitLegs = [];

    this.props.legs.forEach((leg, i) => {
      if (!leg || leg.mode === 'WAIT') {
        return;
      }
      const nextLeg = this.props.legs[i + 1];
      const previousLeg = this.props.legs[i - 1];

      let mode = getRouteMode({ mode: leg.mode, type: leg.route?.type });

      const [interliningLines, interliningLegs] = getInterliningLegs(
        this.props.legs,
        i,
      );

      const interliningWithRoute = interliningLines.join(' / ');

      if (leg.rentedBike && leg.mode !== 'WALK' && leg.mode !== 'SCOOTER') {
        mode = 'CITYBIKE';
      }

      const modePlusClass = isCallAgencyPickupType(leg)
        ? 'call'
        : mode.toLowerCase() + (this.props.passive ? ' passive' : '');
      const geometry = polyUtil.decode(leg.legGeometry.points);
      let middle = getMiddleOf(geometry);
      let { to, end } = leg;

      const rentalId =
        leg.from.vehicleRentalStation?.stationId ||
        leg.from.rentalVehicle?.vehicleId;
      const rentalNetwork =
        leg.from.vehicleRentalStation?.rentalNetwork.networkId ||
        leg.from.rentalVehicle?.rentalNetwork.networkId;

      if (interliningLegs.length > 0) {
        // merge the geometries of legs where user can wait in the vehicle and find the middle point
        // of the new geometry
        const points = interliningLegs
          .map(iLeg => polyUtil.decode(iLeg.legGeometry.points))
          .flat();
        const interlinedGeometry = [...geometry, ...points];
        middle = getMiddleOf(interlinedGeometry);
        to = interliningLegs[interliningLegs.length - 1].to;
        end = interliningLegs[interliningLegs.length - 1].end;
      }

      if (
        leg.mode === 'WALK' &&
        (nextLeg?.mode === 'SUBWAY' || previousLeg?.mode === 'SUBWAY')
      ) {
        const entranceObjects = leg?.steps?.filter(
          step =>
            // eslint-disable-next-line no-underscore-dangle
            step?.feature?.__typename === 'Entrance' || step?.feature?.code,
        );

        // Select the entrance to the outside if there are multiple entrances
        const entranceObject =
          previousLeg?.mode === 'SUBWAY'
            ? entranceObjects[entranceObjects.length - 1]
            : entranceObjects[0];

        if (entranceObject) {
          const entranceCoordinates = [entranceObject.lat, entranceObject.lon];
          // eslint-disable-next-line no-console
          console.log('steps', leg.steps);
          const getDistance = (coord1, coord2) => {
            const [lat1, lon1] = coord1;
            const [lat2, lon2] = coord2;
            return Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2);
          };

          const entranceIndex = geometry.reduce(
            (closestIdx, currentCoord, currentIdx) => {
              const currentDistance = getDistance(
                entranceCoordinates,
                currentCoord,
              );
              const closestDistance = getDistance(
                entranceCoordinates,
                geometry[closestIdx],
              );
              return currentDistance < closestDistance
                ? currentIdx
                : closestIdx;
            },
            0,
          );

          objs.push(
            <Line
              color={
                leg.route && leg.route.color ? `#${leg.route.color}` : null
              }
              key={`${this.props.hash}_${i}_${mode}_0`}
              geometry={geometry.slice(0, entranceIndex + 1)}
              mode={nextLeg?.mode === 'SUBWAY' ? 'walk' : 'walk-inside'}
              passive={this.props.passive}
            />,
          );
          objs.push(
            <Line
              color={
                leg.route && leg.route.color ? `#${leg.route.color}` : null
              }
              key={`${this.props.hash}_${i}_${mode}_1`}
              geometry={geometry.slice(entranceIndex)}
              mode={nextLeg?.mode === 'SUBWAY' ? 'walk-inside' : 'walk'}
              passive={this.props.passive}
            />,
          );
        } else {
          objs.push(
            <Line
              color={
                leg.route && leg.route.color ? `#${leg.route.color}` : null
              }
              key={`${this.props.hash}_${i}_${mode}`}
              geometry={geometry}
              mode={isCallAgencyPickupType(leg) ? 'call' : mode.toLowerCase()}
              passive={this.props.passive}
            />,
          );
        }
      } else {
        objs.push(
          <Line
            color={leg.route && leg.route.color ? `#${leg.route.color}` : null}
            key={`${this.props.hash}_${i}_${mode}`}
            geometry={geometry}
            mode={isCallAgencyPickupType(leg) ? 'call' : mode.toLowerCase()}
            passive={this.props.passive}
          />,
        );
      }

      if (
        this.props.showDurationBubble ||
        (this.checkStreetMode(leg) && leg.distance > 100)
      ) {
        const duration = durationToString(leg.duration * 1000);
        objs.push(
          <SpeechBubble
            key={`speech_${this.props.hash}_${i}_${mode}`}
            position={middle}
            text={duration}
          />,
        );
      }

      if (!this.props.passive) {
        if (
          this.props.showIntermediateStops &&
          leg.intermediatePlaces != null
        ) {
          leg.intermediatePlaces
            .filter(place => place.stop)
            .forEach(place =>
              objs.push(
                <StopMarker
                  disableModeIcons
                  limitZoom={14}
                  stop={place.stop}
                  key={`intermediate-${place.stop.gtfsId}`}
                  mode={modePlusClass}
                  thin
                />,
              ),
            );
        }

        if (leg.from.vertexType === 'BIKESHARE') {
          objs.push(
            <VehicleMarker
              key={`${leg.from.lat}:${leg.from.lon}`}
              showBikeAvailability={leg.mode === 'BICYCLE'}
              rental={{
                id: rentalId,
                lat: leg.from.lat,
                lon: leg.from.lon,
                network: rentalNetwork,
                vehiclesAvailable:
                  leg.from.vehicleRentalStation?.vehiclesAvailable,
              }}
              mode={leg.mode}
              transit
            />,
          );
        } else if (leg.transitLeg) {
          const name = getLegText(
            leg.route,
            this.context.config,
            interliningWithRoute,
          );

          if (!leg?.interlineWithPreviousLeg) {
            transitLegs.push({
              ...leg,
              to,
              end,
              nextLeg,
              index: i,
              mode: isCallAgencyPickupType(leg) ? 'call' : mode.toLowerCase(),
              legName: name,
              zIndexOffset: 300,
              interliningWithRoute,
            });
          }
          objs.push(
            <StopMarker
              key={`${i},${leg.mode}marker,from`}
              disableModeIcons
              stop={{
                ...leg.from,
                gtfsId: leg.from.stop.gtfsId,
                code: leg.from.stop.code,
                platformCode: leg.from.stop.platformCode,
                transfer: true,
              }}
              mode={isCallAgencyPickupType(leg) ? 'call' : mode.toLowerCase()}
              renderText={leg.transitLeg && this.props.showTransferLabels}
            />,
          );
          objs.push(
            <StopMarker
              key={`${i},${leg.mode}marker,to`}
              disableModeIcons
              stop={{
                ...leg.to,
                gtfsId: leg.to.stop.gtfsId,
                code: leg.to.stop.code,
                platformCode: leg.to.stop.platformCode,
                transfer: true,
              }}
              mode={isCallAgencyPickupType(leg) ? 'call' : mode.toLowerCase()}
              renderText={leg.transitLeg && this.props.showTransferLabels}
            />,
          );
        }
      }
    });

    // Add dynamic transit leg and transfer stop markers
    if (!this.props.passive) {
      objs.push(
        <TransitLegMarkers key="transitlegmarkers" transitLegs={transitLegs} />,
      );
    }

    return <div style={{ display: 'none' }}>{objs}</div>;
  }
}

export default createFragmentContainer(ItineraryLine, {
  legs: graphql`
    fragment ItineraryLine_legs on Leg @relay(plural: true) {
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
      steps {
        feature {
          __typename
          ... on Entrance {
            code
            wheelchairAccessible
          }
        }
        lat
        lon
      }
      transitLeg
      interlineWithPreviousLeg
      route {
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
      trip {
        stoptimes {
          stop {
            gtfsId
          }
          pickupType
        }
      }
      intermediatePlaces {
        stop {
          gtfsId
          lat
          lon
          name
          code
          platformCode
        }
      }
    }
  `,
});
