import PropTypes from 'prop-types';
import React from 'react';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { graphql, createFragmentContainer } from 'react-relay';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import NearYouMap from '../map/NearYouMap';
import PreferencesStore from '../../store/PreferencesStore';
import FavouriteStore from '../../store/FavouriteStore';
import {
  vehicleRentalStationShape,
  stopShape,
  stationShape,
  locationShape,
} from '../../util/shapes';

function StopsNearYouFavoritesMapContainer(props) {
  const { stops, stations, vehicleStations, position } = props;
  const stopList = [];
  stopList.push(
    ...stops
      .filter(s => s)
      .map(stop => {
        return {
          type: 'stop',
          node: {
            distance: distance(position, stop),
            place: {
              ...stop,
            },
          },
        };
      }),
  );
  stopList.push(
    ...stations
      .filter(s => s)
      .map(stop => {
        return {
          type: 'station',
          node: {
            distance: distance(position, stop),
            place: {
              ...stop,
            },
          },
        };
      }),
  );
  if (vehicleStations) {
    stopList.push(
      ...vehicleStations
        .filter(s => s)
        .map(stop => {
          return {
            type: 'vehicleRentalStation',
            node: {
              distance: distance(position, stop),
              place: {
                ...stop,
              },
            },
          };
        }),
    );
  }
  stopList.sort((a, b) => a.node.distance - b.node.distance);

  return <NearYouMap {...props} stopsNearYou={stopList} />;
}

StopsNearYouFavoritesMapContainer.propTypes = {
  stops: PropTypes.arrayOf(stopShape),
  stations: PropTypes.arrayOf(stationShape),
  vehicleStations: PropTypes.arrayOf(vehicleRentalStationShape),
  position: locationShape.isRequired,
};

StopsNearYouFavoritesMapContainer.defaultProps = {
  stops: undefined,
  stations: undefined,
  vehicleStations: undefined,
};

const StopsNearYouMapWithStores = connectToStores(
  StopsNearYouFavoritesMapContainer,
  [PreferencesStore, FavouriteStore],
  ({ getStore }) => {
    const language = getStore(PreferencesStore).getLanguage();
    return { language };
  },
);

const containerComponent = createFragmentContainer(StopsNearYouMapWithStores, {
  stops: graphql`
    fragment StopsNearYouFavoritesMapContainer_stops on Stop
    @relay(plural: true)
    @argumentDefinitions(startTime: { type: "Long!", defaultValue: 0 }) {
      gtfsId
      lat
      lon
      name
      patterns {
        route {
          gtfsId
          shortName
          mode
        }
        code
        directionId
        patternGeometry {
          points
        }
      }
      stoptimesWithoutPatterns(startTime: $startTime, omitNonPickups: true) {
        scheduledArrival
      }
    }
  `,
  stations: graphql`
    fragment StopsNearYouFavoritesMapContainer_stations on Stop
    @relay(plural: true)
    @argumentDefinitions(startTime: { type: "Long!", defaultValue: 0 }) {
      gtfsId
      lat
      lon
      name
      stops {
        patterns {
          route {
            gtfsId
            shortName
            mode
          }
          code
          directionId
          patternGeometry {
            points
          }
        }
      }
      stoptimesWithoutPatterns(startTime: $startTime, omitNonPickups: true) {
        scheduledArrival
      }
    }
  `,
  vehicleStations: graphql`
    fragment StopsNearYouFavoritesMapContainer_vehicleStations on VehicleRentalStation
    @relay(plural: true) {
      name
      lat
      lon
      stationId
    }
  `,
});

export {
  containerComponent as default,
  StopsNearYouFavoritesMapContainer as Component,
};
