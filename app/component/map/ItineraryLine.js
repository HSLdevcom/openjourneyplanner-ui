import PropTypes from 'prop-types';
/* eslint-disable react/no-array-index-key */

import polyUtil from 'polyline-encoded';
import React from 'react';
import { isBrowser } from '../../util/browser';
import { getMiddleOf } from '../../util/geo-utils';
import {
  getInterliningLegs,
  getLegText,
  isCallAgencyLeg,
} from '../../util/legUtils';
import { getRouteMode } from '../../util/modeUtils';
import { configShape, legShape } from '../../util/shapes';
import { durationToString } from '../../util/timeUtils';
import Line from './Line';
import StopMarker from './non-tile-layer/StopMarker';
import TransitLegMarkers from './non-tile-layer/TransitLegMarkers';
import VehicleMarker from './non-tile-layer/VehicleMarker';
import SpeechBubble from './SpeechBubble';

class ItineraryLine extends React.Component {
  static contextTypes = {
    config: configShape.isRequired,
  };

  static propTypes = {
    legs: PropTypes.arrayOf(legShape).isRequired,
    passive: PropTypes.bool,
    hash: PropTypes.number,
    showTransferLabels: PropTypes.bool,
    showIntermediateStops: PropTypes.bool,
    showDurationBubble: PropTypes.bool,
    streetMode: PropTypes.string,
  };

  static defaultProps = {
    hash: 0,
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

      let mode = getRouteMode(
        {
          mode: leg.mode,
          type: leg.route?.type,
        },
        this.context.config,
      );

      const [interliningLines, interliningLegs] = getInterliningLegs(
        this.props.legs,
        i,
      );

      const interliningWithRoute = interliningLines.join(' / ');

      if (leg.rentedBike && leg.mode !== 'WALK' && leg.mode !== 'SCOOTER') {
        mode = 'CITYBIKE';
      }

      const modePlusClass = isCallAgencyLeg(leg)
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

      objs.push(
        <Line
          color={leg.route && leg.route.color ? `#${leg.route.color}` : null}
          key={`${this.props.hash}_${i}_${mode}`}
          geometry={geometry}
          mode={isCallAgencyLeg(leg) ? 'call' : mode.toLowerCase()}
          passive={this.props.passive}
        />,
      );

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
              mode: isCallAgencyLeg(leg) ? 'call' : mode.toLowerCase(),
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
              mode={isCallAgencyLeg(leg) ? 'call' : mode.toLowerCase()}
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
              mode={isCallAgencyLeg(leg) ? 'call' : mode.toLowerCase()}
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

export default ItineraryLine;
