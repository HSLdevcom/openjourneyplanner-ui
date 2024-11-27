import PropTypes from 'prop-types';
import React from 'react';
import { createPaginationContainer, graphql } from 'react-relay';
import { intlShape, FormattedMessage } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { matchShape } from 'found';
import { configShape, relayShape } from '../../util/shapes';
import StopNearYouContainer from './StopNearYouContainer';
import withBreakpoint from '../../util/withBreakpoint';
import {
  sortNearbyRentalStations,
  sortNearbyStops,
} from '../../util/sortUtils';
import CityBikeStopNearYou from './VehicleRentalStationNearYou';
import Loading from '../Loading';
import Icon from '../Icon';
import { getDefaultNetworks } from '../../util/vehicleRentalUtils';

class StopsNearYouContainer extends React.Component {
  static propTypes = {
    // eslint-disable-next-line
    stopPatterns: PropTypes.object,
    setLoadState: PropTypes.func.isRequired,
    currentTime: PropTypes.number.isRequired,
    relay: relayShape.isRequired,
    // eslint-disable-next-line
    favouriteIds: PropTypes.objectOf(PropTypes.string).isRequired,
    match: matchShape.isRequired,
    position: PropTypes.shape({
      address: PropTypes.string,
      lat: PropTypes.number,
      lon: PropTypes.number,
    }).isRequired,
    withSeparator: PropTypes.bool,
    prioritizedStops: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    stopPatterns: undefined,
    withSeparator: false,
    prioritizedStops: undefined,
  };

  static contextTypes = {
    config: configShape,
    intl: intlShape.isRequired,
    executeAction: PropTypes.func.isRequired,
    getStore: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.resultsUpdatedAlertRef = React.createRef();
    this.state = {
      maxRefetches: context.config.maxNearbyStopRefetches,
      refetches: 0,
      stopCount: 5,
      currentPosition: props.position,
      fetchMoreStops: false,
      isLoadingmoreStops: false,
      isUpdatingPosition: false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    let newState = null;
    if (
      !prevState.currentPosition ||
      (!prevState.currentPosition.address &&
        nextProps.position &&
        nextProps.position.address)
    ) {
      newState = {
        ...newState,
        currentPosition: nextProps.position,
      };
    }
    if (nextProps.stopPatterns) {
      const stopsForFiltering = [...nextProps.stopPatterns.nearest.edges];
      const newestStops = stopsForFiltering.splice(
        stopsForFiltering.length - 5,
      );
      if (
        newestStops.every(stop => {
          return (
            stop.node.place.stoptimesWithoutPatterns &&
            stop.node.place.stoptimesWithoutPatterns.length === 0
          );
        }) &&
        prevState.refetches < prevState.maxRefetches
      ) {
        newState = {
          ...newState,
          fetchMoreStops: true,
        };
      } else {
        newState = {
          ...newState,
          fetchMoreStops: false,
        };
      }
    }
    return newState;
  }

  componentDidUpdate(prevProps, prevState) {
    const { position } = prevProps;
    if (position && this.state.currentPosition) {
      if (
        position.lat !== this.props.position.lat ||
        position.lon !== this.props.position.lon
      ) {
        this.updatePosition();
      }
    }
    if (this.state.fetchMoreStops) {
      this.showMore(true);
    }
    if (
      this.resultsUpdatedAlertRef.current &&
      prevState.isLoadingmoreStops &&
      !this.state.isLoadingmoreStops
    ) {
      this.resultsUpdatedAlertRef.current.innerHTML =
        this.context.intl.formatMessage({
          id: 'stop-near-you-update-alert',
          defaultMessage: 'Search results updated',
        });
      setTimeout(() => {
        this.resultsUpdatedAlertRef.current.innerHTML = null;
      }, 100);
    }
  }

  componentDidMount() {
    this.props.setLoadState();
    if (this.state.fetchMoreStops) {
      this.showMore(true);
    }
  }

  updatePosition = () => {
    const variables = {
      lat: this.props.position.lat,
      lon: this.props.position.lon,
      startTime: this.props.currentTime,
    };
    this.setState({
      isUpdatingPosition: true,
    });
    this.props.relay.refetchConnection(
      this.state.stopCount,
      () => {
        this.setState({
          isUpdatingPosition: false,
          currentPosition: this.props.position,
        });
      },
      variables,
    );
  };

  showMore = automatic => {
    if (!this.props.relay.hasMore() || this.state.isLoadingmoreStops) {
      return;
    }
    this.setState({ isLoadingmoreStops: true, fetchMoreStops: false });
    this.props.relay.loadMore(5, () => {
      this.setState(previousState => ({
        refetches: automatic
          ? previousState.refetches + 1
          : previousState.refetches,
        stopCount: previousState.stopCount + 5,
        fetchMoreStops: false,
        isLoadingmoreStops: false,
      }));
    });
  };

  createNearbyStops = () => {
    if (!this.props.stopPatterns || !this.props.stopPatterns.nearest) {
      return null;
    }
    const { mode } = this.props.match.params;
    const walkRoutingThreshold =
      mode === 'RAIL' || mode === 'SUBWAY' || mode === 'FERRY' ? 3000 : 1500;
    const stopPatterns = this.props.stopPatterns.nearest.edges;
    const isCityBikeView = this.props.match.params.mode === 'CITYBIKE';
    let sortedPatterns;
    if (isCityBikeView) {
      const withNetworks = stopPatterns.filter(pattern => {
        return !!pattern.node.place?.rentalNetwork?.networkId;
      });
      const filteredCityBikeStopPatterns = withNetworks.filter(pattern => {
        return getDefaultNetworks(this.context.config).includes(
          pattern.node.place?.rentalNetwork?.networkId,
        );
      });
      sortedPatterns = filteredCityBikeStopPatterns
        .slice(0, 5)
        .sort(sortNearbyRentalStations(this.props.favouriteIds));
      sortedPatterns.push(...filteredCityBikeStopPatterns.slice(5));
    } else {
      sortedPatterns = stopPatterns
        .slice(0, 5)
        .sort(sortNearbyStops(this.props.favouriteIds, walkRoutingThreshold));
      sortedPatterns.push(...stopPatterns.slice(5));
    }

    const stops = sortedPatterns.map(({ node }) => {
      const stop = node.place;
      /* eslint-disable-next-line no-underscore-dangle */
      switch (stop.__typename) {
        case 'Stop':
          if (
            stop.stoptimesWithoutPatterns &&
            stop.stoptimesWithoutPatterns.length > 0
          ) {
            if (!this.props.prioritizedStops?.includes(stop.gtfsId)) {
              return (
                <StopNearYouContainer
                  key={`${stop.gtfsId}`}
                  stop={stop}
                  currentMode={this.props.match.params.mode}
                />
              );
            }
          }
          break;
        case 'VehicleRentalStation':
          return (
            <CityBikeStopNearYou
              key={`${stop.stationId}`}
              stop={stop}
              color={this.context.config.colors.primary}
              currentTime={this.props.currentTime}
              currentMode={this.props.match.params.mode}
            />
          );
        default:
          return null;
      }
      return null;
    });
    return stops;
  };

  render() {
    const screenReaderUpdateAlert = (
      <span
        className="sr-only"
        role="alert"
        ref={this.resultsUpdatedAlertRef}
      />
    );
    const stops = this.createNearbyStops().filter(e => e);
    const noStopsFound =
      !stops.length &&
      this.state.refetches >= this.state.maxRefetches &&
      !this.state.isLoadingmoreStops;
    return (
      <>
        {((!this.props.relay.hasMore() &&
          !stops.length &&
          !this.props.prioritizedStops?.length) ||
          (noStopsFound && !this.props.prioritizedStops?.length)) && (
          <>
            {this.props.withSeparator && <div className="separator" />}
            <div className="stops-near-you-no-stops">
              <Icon
                img="icon-icon_info"
                color={this.context.config.colors.primary}
              />
              <FormattedMessage id="nearest-no-stops" />
            </div>
          </>
        )}
        {screenReaderUpdateAlert}
        {this.state.isUpdatingPosition && (
          <div className="stops-near-you-spinner-container">
            <Loading />
          </div>
        )}
        <div role="list" className="stops-near-you-container">
          {stops}
        </div>
        {this.state.isLoadingmoreStops && (
          <div className="stops-near-you-spinner-container">
            <Loading />
          </div>
        )}
        {this.props.relay.hasMore() && !noStopsFound && (
          <button
            type="button"
            aria-label={this.context.intl.formatMessage({
              id: 'show-more-stops-near-you',
              defaultMessage: 'Load more nearby stops',
            })}
            className="show-more-button"
            onClick={() => this.showMore(false)}
          >
            <FormattedMessage id="show-more" defaultMessage="Show more" />
          </button>
        )}
      </>
    );
  }
}
const StopsNearYouContainerWithBreakpoint = withBreakpoint(
  StopsNearYouContainer,
);

const connectedContainer = connectToStores(
  StopsNearYouContainerWithBreakpoint,
  ['TimeStore', 'FavouriteStore'],
  ({ getStore }, { match }) => {
    const favouriteIds =
      match.params.mode === 'CITYBIKE'
        ? new Set(
            getStore('FavouriteStore')
              .getVehicleRentalStations()
              .map(station => station.stationId),
          )
        : new Set(
            getStore('FavouriteStore')
              .getStopsAndStations()
              .map(stop => stop.gtfsId),
          );
    return {
      currentTime: getStore('TimeStore').getCurrentTime(),
      favouriteIds,
    };
  },
);

const refetchContainer = createPaginationContainer(
  connectedContainer,
  {
    stopPatterns: graphql`
      fragment StopsNearYouContainer_stopPatterns on QueryType
      @argumentDefinitions(
        startTime: { type: "Long!", defaultValue: 0 }
        omitNonPickups: { type: "Boolean!", defaultValue: false }
        lat: { type: "Float!" }
        lon: { type: "Float!", defaultValue: 0 }
        filterByPlaceTypes: { type: "[FilterPlaceType]", defaultValue: null }
        filterByModes: { type: "[Mode]", defaultValue: null }
        first: { type: "Int!", defaultValue: 5 }
        after: { type: "String" }
        maxResults: { type: "Int" }
        maxDistance: { type: "Int" }
        filterByNetwork: { type: "[String!]", defaultValue: null }
      ) {
        nearest(
          lat: $lat
          lon: $lon
          filterByPlaceTypes: $filterByPlaceTypes
          filterByModes: $filterByModes
          first: $first
          after: $after
          maxResults: $maxResults
          maxDistance: $maxDistance
          filterByNetwork: $filterByNetwork
        ) @connection(key: "StopsNearYouContainer_nearest") {
          edges {
            node {
              distance
              place {
                __typename
                ... on VehicleRentalStation {
                  ...VehicleRentalStationNearYou_stop
                  stationId
                  rentalNetwork {
                    networkId
                  }
                }
                ... on Stop {
                  ...StopNearYouContainer_stop
                    @arguments(
                      startTime: $startTime
                      omitNonPickups: $omitNonPickups
                    )
                  id
                  name
                  gtfsId
                  stoptimesWithoutPatterns(
                    startTime: $startTime
                    omitNonPickups: $omitNonPickups
                  ) {
                    scheduledArrival
                  }
                }
              }
            }
          }
        }
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.stopPatterns && props.stopPatterns.nearest;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        first: totalCount,
      };
    },
    getVariables(props, pagevars, fragmentVariables) {
      return {
        ...fragmentVariables,
        first: pagevars.count,
        after: pagevars.cursor,
      };
    },
    query: graphql`
      query StopsNearYouContainerRefetchQuery(
        $lat: Float!
        $lon: Float!
        $filterByPlaceTypes: [FilterPlaceType]
        $filterByModes: [Mode]
        $first: Int!
        $after: String
        $maxResults: Int!
        $maxDistance: Int!
        $startTime: Long!
        $omitNonPickups: Boolean!
        $filterByNetwork: [String!]
      ) {
        viewer {
          ...StopsNearYouContainer_stopPatterns
            @arguments(
              startTime: $startTime
              omitNonPickups: $omitNonPickups
              lat: $lat
              lon: $lon
              filterByPlaceTypes: $filterByPlaceTypes
              filterByModes: $filterByModes
              first: $first
              after: $after
              maxResults: $maxResults
              maxDistance: $maxDistance
              filterByNetwork: $filterByNetwork
            )
        }
      }
    `,
  },
);

export { refetchContainer as default, StopsNearYouContainer as Component };
