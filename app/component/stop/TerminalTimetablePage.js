import React from 'react';
import PropTypes from 'prop-types';
import { createRefetchContainer, graphql } from 'react-relay';
import { matchShape, routerShape } from 'found';
import { configShape, relayShape } from '../../util/shapes';
import { unixTime, unixToYYYYMMDD } from '../../util/timeUtils';
import { prepareServiceDay } from '../../util/dateParamUtils';
import TimetableContainer from './TimetableContainer';

class TerminalTimetablePage extends React.Component {
  static propTypes = {
    station: PropTypes.shape({
      url: PropTypes.string,
    }).isRequired,
    relay: relayShape.isRequired,
  };

  static contextTypes = {
    router: routerShape.isRequired,
    match: matchShape.isRequired,
    config: configShape.isRequired,
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

  render() {
    return (
      <TimetableContainer
        stop={this.props.station}
        date={this.state.date}
        startDate={unixToYYYYMMDD(unixTime(), this.context.config)}
        onDateChange={this.onDateChange}
      />
    );
  }
}

export default createRefetchContainer(
  TerminalTimetablePage,
  {
    station: graphql`
      fragment TerminalTimetablePage_station on Stop
      @argumentDefinitions(date: { type: "String" }) {
        url
        ...TimetableContainer_stop @arguments(date: $date)
      }
    `,
  },
  graphql`
    query TerminalTimetablePageQuery($terminalId: String!, $date: String) {
      station(id: $terminalId) {
        ...TerminalTimetablePage_station @arguments(date: $date)
      }
    }
  `,
);
