import PropTypes from 'prop-types';
import React from 'react';
import { createRefetchContainer, graphql } from 'react-relay';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { FormattedMessage } from 'react-intl';
import { routerShape, RedirectException } from 'found';
import DepartureListContainer from '../DepartureListContainer';
import Loading from '../Loading';
import Icon from '../Icon';
import ScrollableWrapper from '../ScrollableWrapper';
import { isBrowser } from '../../util/browser';
import { PREFIX_TERMINALS } from '../../util/path';
import { stationShape, errorShape, relayShape } from '../../util/shapes';

class TerminalPageContent extends React.Component {
  static propTypes = {
    station: stationShape.isRequired,
    relay: relayShape.isRequired,
    currentTime: PropTypes.number.isRequired,
    error: errorShape,
    router: routerShape.isRequired,
  };

  static defaultProps = {
    error: undefined,
  };

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps({ relay, currentTime }) {
    const currUnix = this.props.currentTime;
    if (currUnix !== currentTime) {
      relay.refetch(oldVariables => {
        return { ...oldVariables, startTime: currentTime };
      });
    }
  }

  componentDidMount() {
    // Throw error in client side if relay fails to fetch data
    if (this.props.error && !this.props.station) {
      throw this.props.error.message;
    }
  }

  render() {
    // Render something in client side to clear SSR
    if (isBrowser && this.props.error && !this.props.station) {
      return <Loading />;
    }

    if (!this.props.station && !this.props.error) {
      /* In this case there is little we can do
       * There is no point continuing rendering as it can only
       * confuse user. Therefore redirect to Terminals page */
      if (isBrowser) {
        this.props.router.replace(`/${PREFIX_TERMINALS}`);
      } else {
        throw new RedirectException(`/${PREFIX_TERMINALS}`);
      }
      return null;
    }

    const { stoptimes } = this.props.station;
    // eslint-disable-next-line prefer-destructuring
    const stopsWithPatterns = this.props.station.stops.filter(
      stop => stop.patterns.length > 0,
    );
    const mode =
      stopsWithPatterns.length > 0
        ? stopsWithPatterns[0].patterns[0].route.mode
        : 'BUS';
    if (!stoptimes || stoptimes.length === 0) {
      return (
        <div className="stop-no-departures-container">
          <Icon img="icon-icon_station" />
          <FormattedMessage id="no-departures" defaultMessage="No departures" />
        </div>
      );
    }
    const isStreetTrafficTerminal = () =>
      stopsWithPatterns.some(stop => stop.patterns[0].route.mode === 'BUS');
    return (
      <ScrollableWrapper>
        <div className="stop-page-departure-wrapper stop-scroll-container">
          <div
            className="departure-list-header row padding-vertical-normal"
            aria-hidden="true"
          >
            <span className="route-number-header">
              <FormattedMessage id="route" defaultMessage="Route" />
            </span>
            <span className="route-destination-header">
              <FormattedMessage id="destination" defaultMessage="Destination" />
            </span>
            <span className="time-header">
              <FormattedMessage id="leaving-at" defaultMessage="Leaves" />
            </span>
            <span className="track-header">
              <FormattedMessage
                id={
                  mode === 'BUS' || isStreetTrafficTerminal()
                    ? 'platform'
                    : 'track'
                }
                defaultMessage={
                  mode === 'BUS' || isStreetTrafficTerminal()
                    ? 'Platform'
                    : 'Track'
                }
              />
            </span>
          </div>
          <DepartureListContainer
            stoptimes={stoptimes}
            mode={mode}
            key="departures"
            className="stop-page"
            infiniteScroll
            isTerminal
            currentTime={this.props.currentTime}
            showPlatformCodes
            isTerminalPage
          />
        </div>
      </ScrollableWrapper>
    );
  }
}

const connectedComponent = createRefetchContainer(
  connectToStores(TerminalPageContent, ['TimeStore'], ({ getStore }) => ({
    currentTime: getStore('TimeStore').getCurrentTime(),
  })),
  {
    station: graphql`
      fragment TerminalPageContentContainer_station on Stop
      @argumentDefinitions(
        startTime: { type: "Long!", defaultValue: 0 }
        timeRange: { type: "Int!", defaultValue: 43200 }
        numberOfDepartures: { type: "Int!", defaultValue: 100 }
      ) {
        url
        stops {
          patterns {
            route {
              mode
            }
          }
        }
        stoptimes: stoptimesWithoutPatterns(
          startTime: $startTime
          timeRange: $timeRange
          numberOfDepartures: $numberOfDepartures
          omitCanceled: false
        ) {
          ...DepartureListContainer_stoptimes
        }
      }
    `,
  },
  graphql`
    query TerminalPageContentContainerQuery(
      $terminalId: String!
      $startTime: Long!
      $timeRange: Int!
      $numberOfDepartures: Int!
    ) {
      station(id: $terminalId) {
        ...TerminalPageContentContainer_station
          @arguments(
            startTime: $startTime
            timeRange: $timeRange
            numberOfDepartures: $numberOfDepartures
          )
      }
    }
  `,
);

export { connectedComponent as default, TerminalPageContent as Component };
