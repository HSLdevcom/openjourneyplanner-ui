import PropTypes from 'prop-types';
import React from 'react';
import { graphql, QueryRenderer, ReactRelayContext } from 'react-relay';
import { FormattedMessage } from 'react-intl';
import {
  locationShape,
  relayShape,
  stopShape,
  stationShape,
  vehicleRentalStationShape,
} from '../../util/shapes';
import StopsNearYouFavouritesContainer from './StopsNearYouFavouritesContainer';
import withBreakpoint from '../../util/withBreakpoint';
import Loading from '../Loading';

function StopsNearYouFavorites({
  favoriteStops,
  favoriteStations,
  favoriteVehicleRentalStationIds,
  relayEnvironment,
  searchPosition,
  breakpoint,
  noFavorites,
  favouritesFetched,
}) {
  if (!favouritesFetched) {
    return <Loading />;
  }
  if (noFavorites) {
    return (
      <div className="no-favorites-container">
        {breakpoint !== 'large' && (
          <div className="no-favorites-header">
            <FormattedMessage id="nearest-favorites" />
          </div>
        )}
        <div className="no-favorites-content">
          <FormattedMessage id="nearest-favorites-no-favorites" />
        </div>
        <img
          className="instruction-image"
          src={`/img/nearby-stop_${
            breakpoint === 'large' ? 'desktop-' : ''
          }animation.gif`}
          alt="Käyttöohje"
        />
        <FormattedMessage id="nearest-favorites-browse-stops" />
      </div>
    );
  }
  return (
    <QueryRenderer
      query={graphql`
        query StopsNearYouFavoritesQuery(
          $stopIds: [String!]!
          $stationIds: [String!]!
          $vehicleRentalStationIds: [String!]!
        ) {
          stops: stops(ids: $stopIds) {
            ...StopsNearYouFavouritesContainer_stops
          }
          stations: stations(ids: $stationIds) {
            ...StopsNearYouFavouritesContainer_stations
          }
          vehicleStations: vehicleRentalStations(
            ids: $vehicleRentalStationIds
          ) {
            ...StopsNearYouFavouritesContainer_vehicleStations
          }
        }
      `}
      variables={{
        stopIds: favoriteStops || [],
        stationIds: favoriteStations || [],
        vehicleRentalStationIds: favoriteVehicleRentalStationIds || [],
      }}
      environment={relayEnvironment}
      render={({ props }) => {
        if (props) {
          return (
            <StopsNearYouFavouritesContainer
              searchPosition={searchPosition}
              stops={props.stops}
              stations={props.stations}
              vehicleStations={props.vehicleStations}
            />
          );
        }
        return <Loading />;
      }}
    />
  );
}
StopsNearYouFavorites.propTypes = {
  favoriteStops: PropTypes.arrayOf(PropTypes.string),
  favoriteStations: PropTypes.arrayOf(PropTypes.string),
  favoriteVehicleRentalStationIds: PropTypes.arrayOf(PropTypes.string),
  relayEnvironment: relayShape.isRequired,
  searchPosition: locationShape.isRequired,
  stops: PropTypes.arrayOf(stopShape),
  stations: PropTypes.arrayOf(stationShape),
  vehicleStations: PropTypes.arrayOf(vehicleRentalStationShape),
  breakpoint: PropTypes.string,
  noFavorites: PropTypes.bool,
  favouritesFetched: PropTypes.bool,
};

StopsNearYouFavorites.defaultProps = {
  favoriteStops: undefined,
  favoriteStations: undefined,
  favoriteVehicleRentalStationIds: undefined,
  stops: undefined,
  stations: undefined,
  vehicleStations: undefined,
  breakpoint: undefined,
  noFavorites: false,
  favouritesFetched: false,
};

const StopsNearYouFavoritesWithBreakpoint = withBreakpoint(props => (
  <ReactRelayContext.Consumer>
    {({ environment }) => (
      <StopsNearYouFavorites {...props} relayEnvironment={environment} />
    )}
  </ReactRelayContext.Consumer>
));

export default StopsNearYouFavoritesWithBreakpoint;
