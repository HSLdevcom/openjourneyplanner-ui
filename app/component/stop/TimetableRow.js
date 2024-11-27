/* eslint-disable no-return-assign */
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { intlShape } from 'react-intl';

const TimetableRow = ({ title, stoptimes, showRoutes, timerows }, { intl }) => (
  <div
    className="timetable-row"
    style={{
      display:
        timerows.filter(o => o === title).length === 0 && showRoutes.length > 0
          ? 'none'
          : undefined,
    }}
  >
    <h3 className="title">{title}:</h3>
    <div className="timetable-printable-title">{title}</div>
    <div className="timetable-rowcontainer">
      {stoptimes
        .filter(
          time =>
            (showRoutes.filter(o => o === time.id).length > 0 &&
              showRoutes.length > 0) ||
            showRoutes.length === 0,
        )
        .sort(
          (time1, time2) => time1.scheduledDeparture - time2.scheduledDeparture,
        )
        .map(time => (
          <div
            className={cx('timetablerow-linetime', {
              canceled: time.isCanceled,
            })}
            key={`${time.id}-${time.name}-${time.scheduledDeparture}`}
          >
            <div className="sr-only">
              {time.isCanceled ? intl.formatMessage({ id: 'canceled' }) : ''}
              {`${moment
                .unix(time.serviceDay + time.scheduledDeparture)
                .format('hh:mm')}, ${intl.formatMessage({
                id: time.mode.toLowerCase(),
              })} ${time.name}
              `}
            </div>
            <span aria-hidden>
              <div>
                <span>
                  {moment
                    .unix(time.serviceDay + time.scheduledDeparture)
                    .format('mm')}
                </span>
                <span className="line-name" title={time.name}>
                  /{time.name}
                  {time.duplicate}
                </span>
              </div>
            </span>
          </div>
        ))}
    </div>
  </div>
);

TimetableRow.propTypes = {
  title: PropTypes.string.isRequired,
  stoptimes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      serviceDay: PropTypes.number.isRequired,
      scheduledDeparture: PropTypes.number.isRequired,
    }),
  ).isRequired,
  showRoutes: PropTypes.arrayOf(PropTypes.string),
  timerows: PropTypes.arrayOf(PropTypes.string),
};

TimetableRow.contextTypes = {
  intl: intlShape.isRequired,
};

TimetableRow.defaultProps = {
  showRoutes: [],
  timerows: [],
};

export default TimetableRow;
