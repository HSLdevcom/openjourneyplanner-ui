import React from 'react';
import { v4 as uuid } from 'uuid';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import DepartureRow from '../DepartureRow';

export default function StopNearYouDepartureRowContainer({
  stopTimes,
  mode,
  setCapacityModalOpen,
  ...props
}) {
  const sortedStopTimes = stopTimes
    .slice()
    .sort(
      (a, b) =>
        a.serviceDay +
        a.realtimeDeparture -
        (b.serviceDay + b.realtimeDeparture),
    );
  const departures = sortedStopTimes.map(row => {
    const departureTime = row.serviceDay + row.realtimeDeparture;
    return (
      <DepartureRow
        key={uuid()}
        departure={row}
        departureTime={departureTime}
        currentTime={props.currentTime}
        showPlatformCode={props.isStation}
        showLink
        onCapacityClick={() => setCapacityModalOpen(true)}
      />
    );
  });
  return (
    <table className="near-departures-container">
      <thead className="sr-only">
        <tr>
          <th>
            <FormattedMessage id="route" defaultMessage="Route" />
          </th>
          <th>
            <FormattedMessage id="destination" defaultMessage="Destination" />
          </th>
          <th>
            <FormattedMessage id="leaving-at" defaultMessage="Leaves" />
          </th>
          <th>
            <FormattedMessage
              id={mode === 'BUS' ? 'platform' : 'track'}
              defaultMessage={mode === 'BUS' ? 'Platform' : 'Track'}
            />
          </th>
        </tr>
      </thead>
      <tbody>{departures}</tbody>
    </table>
  );
}

StopNearYouDepartureRowContainer.propTypes = {
  stopTimes: PropTypes.arrayOf(
    PropTypes.shape({
      distance: PropTypes.number,
    }),
  ).isRequired,
  mode: PropTypes.string.isRequired,
  isStation: PropTypes.bool.isRequired,
  currentTime: PropTypes.number.isRequired,
  setCapacityModalOpen: PropTypes.func.isRequired,
};
