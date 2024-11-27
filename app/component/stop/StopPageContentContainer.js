import PropTypes from 'prop-types';
import React from 'react';
import { createRefetchContainer, graphql } from 'react-relay';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { FormattedMessage, intlShape } from 'react-intl';
import { matchShape, routerShape, RedirectException } from 'found';
import {
  configShape,
  errorShape,
  relayShape,
  stopShape,
} from '../../util/shapes';
import DepartureListContainer from '../DepartureListContainer';
import Loading from '../Loading';
import Icon from '../Icon';
import ScrollableWrapper from '../ScrollableWrapper';
import { isBrowser } from '../../util/browser';
import { PREFIX_STOPS } from '../../util/path';

class StopPageContent extends React.Component {
  static propTypes = {
    stop: stopShape.isRequired,
    relay: relayShape.isRequired,
    currentTime: PropTypes.number.isRequired,
    error: errorShape,
    router: routerShape.isRequired,
    match: matchShape.isRequired,
  };

  static defaultProps = {
    error: undefined,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
    config: configShape.isRequired,
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
    if (this.props.error && !this.props.stop) {
      throw this.props.error.message;
    }
  }

  render() {
    // Render something in client side to clear SSR
    if (isBrowser && this.props.error && !this.props.stop) {
      return <Loading />;
    }

    if (!this.props.stop && !this.props.error) {
      /* In this case there is little we can do
       * There is no point continuing rendering as it can only
       * confuse user. Therefore redirect to Stops page */
      if (isBrowser) {
        this.props.router.replace(`/${PREFIX_STOPS}`);
      } else {
        throw new RedirectException(`/${PREFIX_STOPS}`);
      }
      return null;
    }

    const { stoptimes } = this.props.stop;
    const { stopId } = this.props.match.params;
    const { constantOperationStops } = this.context.config;
    const { locale } = this.context.intl;
    if (constantOperationStops && constantOperationStops[stopId]) {
      return (
        <div className="stop-constant-operation-container">
          <div style={{ width: '85%' }}>
            <span>{constantOperationStops[stopId][locale].text}</span>
            {/* Next span inline-block so that the link doesn't render on multiple lines */}
            <span style={{ display: 'inline-block' }}>
              <a
                href={constantOperationStops[stopId][locale].link}
                target="_blank"
                rel="noreferrer"
              >
                {constantOperationStops[stopId][locale].link}
              </a>
            </span>
          </div>
        </div>
      );
    }
    if (!stoptimes || stoptimes.length === 0) {
      return (
        <div className="stop-no-departures-container">
          <Icon img="icon-icon_station" />
          <FormattedMessage id="no-departures" defaultMessage="No departures" />
        </div>
      );
    }
    return (
      <ScrollableWrapper>
        <div className="stop-page-departure-wrapper stop-scroll-container">
          <DepartureListContainer
            stoptimes={stoptimes}
            key="departures"
            className="stop-page momentum-scroll"
            infiniteScroll
            currentTime={this.props.currentTime}
            isStopPage
          />
        </div>
      </ScrollableWrapper>
    );
  }
}

const connectedComponent = createRefetchContainer(
  connectToStores(StopPageContent, ['TimeStore'], ({ getStore }) => ({
    currentTime: getStore('TimeStore').getCurrentTime(),
  })),
  {
    stop: graphql`
      fragment StopPageContentContainer_stop on Stop
      @argumentDefinitions(
        startTime: { type: "Long!", defaultValue: 0 }
        timeRange: { type: "Int!", defaultValue: 864000 }
        numberOfDepartures: { type: "Int!", defaultValue: 100 }
      ) {
        url
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
    query StopPageContentContainerQuery(
      $stopId: String!
      $startTime: Long!
      $timeRange: Int!
      $numberOfDepartures: Int!
    ) {
      stop(id: $stopId) {
        ...StopPageContentContainer_stop
          @arguments(
            startTime: $startTime
            timeRange: $timeRange
            numberOfDepartures: $numberOfDepartures
          )
      }
    }
  `,
);

export { connectedComponent as default, StopPageContent as Component };
