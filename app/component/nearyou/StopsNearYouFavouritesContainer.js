import PropTypes from 'prop-types';
import React from 'react';
import { graphql, createFragmentContainer } from 'react-relay';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import {
  stopShape,
  stationShape,
  vehicleRentalStationShape,
  locationShape,
} from '../../util/shapes';
import StopNearYouContainer from './StopNearYouContainer';
import CityBikeStopNearYou from './VehicleRentalStationNearYou';

function StopsNearYouFavouritesContainer({
  stops,
  stations,
  vehicleStations,
  searchPosition,
}) {
  const stopList = [];
  stopList.push(
    ...stops
      .filter(s => s)
      .map(stop => {
        return {
          type: 'stop',
          distance: distance(searchPosition, stop),
          ...stop,
        };
      }),
  );
  stopList.push(
    ...stations
      .filter(s => s)
      .map(stop => {
        return {
          type: 'station',
          distance: distance(searchPosition, stop),
          ...stop,
        };
      }),
  );
  stopList.push(
    ...vehicleStations
      .filter(s => s)
      .map(stop => {
        return {
          type: 'vehicleRentalStation',
          distance: distance(searchPosition, stop),
          ...stop,
        };
      }),
  );
  stopList.sort((a, b) => a.distance - b.distance);
  const stopElements = stopList.map(stop => {
    switch (stop.type) {
      case 'stop':
      case 'station':
        return (
          <StopNearYouContainer
            key={stop.gtfsId}
            stop={stop}
            currentMode="FAVORITE"
          />
        );
      case 'vehicleRentalStation':
        return <CityBikeStopNearYou key={stop.name} stop={stop} />;
      default:
        return null;
    }
  });
  return stopElements;
}

StopsNearYouFavouritesContainer.propTypes = {
  stops: PropTypes.arrayOf(stopShape),
  stations: PropTypes.arrayOf(stationShape),
  vehicleStations: PropTypes.arrayOf(vehicleRentalStationShape),
  searchPosition: locationShape,
};

const refetchContainer = createFragmentContainer(
  StopsNearYouFavouritesContainer,
  {
    stops: graphql`
      fragment StopsNearYouFavouritesContainer_stops on Stop
      @relay(plural: true) {
        ...StopNearYouContainer_stop
        gtfsId
        lat
        lon
      }
    `,
    stations: graphql`
      fragment StopsNearYouFavouritesContainer_stations on Stop
      @relay(plural: true) {
        ...StopNearYouContainer_stop
        gtfsId
        lat
        lon
        stops {
          gtfsId
          desc
        }
      }
    `,
    vehicleStations: graphql`
      fragment StopsNearYouFavouritesContainer_vehicleStations on VehicleRentalStation
      @relay(plural: true) {
        stationId
        name
        availableVehicles {
          total
        }
        availableSpaces {
          total
        }
        capacity
        rentalNetwork {
          networkId
        }
        lat
        lon
        operative
      }
    `,
  },
);

export {
  refetchContainer as default,
  StopsNearYouFavouritesContainer as Component,
};
