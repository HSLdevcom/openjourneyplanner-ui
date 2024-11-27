import React from 'react';
import PropTypes from 'prop-types';
import { createRefetchContainer, graphql } from 'react-relay';
import { matchShape, routerShape } from 'found';
import { unixTime, unixToYYYYMMDD } from '../../util/timeUtils';
import { configShape, relayShape } from '../../util/shapes';
import { prepareServiceDay } from '../../util/dateParamUtils';
import TimetableContainer from './TimetableContainer';

class StopTimetablePage extends React.Component {
  static propTypes = {
    stop: PropTypes.shape({
      url: PropTypes.string,
    }).isRequired,
    relay: relayShape.isRequired,
  };

  state = prepareServiceDay({});

  componentDidMount() {
    const { match } = this.context;
    const { query } = match.location;

    const dateFromQuery = query.date;
    if (dateFromQuery) {
      this.setState({ date: dateFromQuery });
    }
  }

  onDateChange = value => {
    this.setState({ date: value });
    this.props.relay.refetch(
      {
        date: value,
      },
      null,
    );
  };

  static contextTypes = {
    router: routerShape.isRequired,
    match: matchShape.isRequired,
    config: configShape.isRequired,
  };

  render() {
    return (
      <TimetableContainer
        stop={this.props.stop}
        date={this.state.date}
        startDate={unixToYYYYMMDD(unixTime(), this.context.config)}
        onDateChange={this.onDateChange}
      />
    );
  }
}

export default createRefetchContainer(
  StopTimetablePage,
  {
    stop: graphql`
      fragment StopTimetablePage_stop on Stop
      @argumentDefinitions(date: { type: "String" }) {
        url
        ...TimetableContainer_stop @arguments(date: $date)
      }
    `,
  },
  graphql`
    query StopTimetablePageQuery($stopId: String!, $date: String) {
      stop(id: $stopId) {
        ...StopTimetablePage_stop @arguments(date: $date)
      }
    }
  `,
);
