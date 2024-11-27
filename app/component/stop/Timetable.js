import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import uniqBy from 'lodash/uniqBy';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import padStart from 'lodash/padStart';
import { FormattedMessage, intlShape } from 'react-intl';
import { matchShape, routerShape, RedirectException } from 'found';
import cx from 'classnames';
import { configShape } from '../../util/shapes';
import Icon from '../Icon';
import FilterTimeTableModal from './FilterTimeTableModal';
import TimeTableOptionsPanel from './TimeTableOptionsPanel';
import TimetableRow from './TimetableRow';
import { RealtimeStateType } from '../../constants';
import SecondaryButton from '../SecondaryButton';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import DateSelect from './DateSelect';
import ScrollableWrapper from '../ScrollableWrapper';
import { replaceQueryParams } from '../../util/queryUtils';
import { isBrowser } from '../../util/browser';
import { PREFIX_STOPS } from '../../util/path';

const mapStopTimes = stoptimesObject =>
  stoptimesObject
    .map(stoptime =>
      stoptime.stoptimes
        .filter(st => st.pickupType !== 'NONE')
        .map(st => ({
          id: stoptime.pattern.code,
          name: stoptime.pattern.route.shortName || stoptime.pattern.headsign,
          scheduledDeparture: st.scheduledDeparture,
          serviceDay: st.serviceDay,
          headsign: stoptime.pattern.headsign,
          longName: stoptime.pattern.route.longName,
          isCanceled: st.realtimeState === RealtimeStateType.Canceled,
          mode: stoptime.pattern.route.mode,
        })),
    )
    .reduce((acc, val) => acc.concat(val), []);

const groupArrayByHour = stoptimesArray =>
  groupBy(stoptimesArray, stoptime =>
    Math.floor(stoptime.scheduledDeparture / (60 * 60)),
  );

const printStop = e => {
  e.stopPropagation();
  window.print();
};

const printStopPDF = (e, stopPDFURL) => {
  e.stopPropagation();
  window.open(stopPDFURL.href);
};

class Timetable extends React.Component {
  static propTypes = {
    stop: PropTypes.shape({
      url: PropTypes.string,
      gtfsId: PropTypes.string,
      locationType: PropTypes.string,
      stoptimesForServiceDate: PropTypes.arrayOf(
        PropTypes.shape({
          pattern: PropTypes.shape({
            route: PropTypes.shape({
              shortName: PropTypes.string,
              mode: PropTypes.string.isRequired,
              agency: PropTypes.shape({
                name: PropTypes.string.isRequired,
              }).isRequired,
            }).isRequired,
          }).isRequired,
          stoptimes: PropTypes.arrayOf(
            PropTypes.shape({
              realtimeState: PropTypes.string.isRequired,
              scheduledDeparture: PropTypes.number.isRequired,
              serviceDay: PropTypes.number.isRequired,
            }),
          ).isRequired,
        }),
      ).isRequired,
    }).isRequired,
    startDate: PropTypes.string.isRequired,
    onDateChange: PropTypes.func.isRequired,
    date: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired,
  };

  static contextTypes = {
    router: routerShape.isRequired,
    match: matchShape.isRequired,
    config: configShape.isRequired,
    intl: intlShape.isRequired,
  };

  constructor(props) {
    super(props);
    if (!this.props.stop) {
      const path = `/${PREFIX_STOPS}`;
      if (isBrowser) {
        this.context.router.replace(path);
      } else {
        throw new RedirectException(path);
      }
    }
    this.state = {
      showRoutes: [],
      showFilterModal: false,
      oldStopId: this.props.stop.gtfsId,
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps() {
    if (this.props.stop.gtfsId !== this.state.oldStopId) {
      this.resetStopOptions(this.props.stop.gtfsId);
    }
  }

  componentDidMount() {
    if (this.context.match.location.query.routes) {
      this.setState({
        showRoutes: this.context.match.location.query.routes?.split(',') || [],
      });
    }
  }

  setParams = (routes, date) => {
    replaceQueryParams(this.context.router, this.context.match, {
      routes,
      date,
    });
  };

  getDuplicatedRoutes = () => {
    const routesToCheck = mapStopTimes(this.props.stop.stoptimesForServiceDate)
      .map(o => {
        const obj = {};
        obj.shortName = o.name;
        obj.headsign = o.headsign;
        return obj;
      })
      .filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            o => o.headsign === item.headsign && o.shortName === item.shortName,
          ),
      );

    const routesWithDupes = [];
    Object.entries(groupBy(routesToCheck, 'shortName')).forEach(
      ([key, value]) =>
        value.length > 1 ? routesWithDupes.push(key) : undefined,
    );

    return routesWithDupes;
  };

  setRouteVisibilityState = val => {
    this.setState({ showRoutes: val.showRoutes });
    const showRoutes = val.showRoutes.length
      ? val.showRoutes.join(',')
      : undefined;
    this.setParams(showRoutes, this.props.date);
  };

  resetStopOptions = id => {
    this.setState({ showRoutes: [], showFilterModal: false, oldStopId: id });
  };

  showModal = val => {
    this.setState({ showFilterModal: val });
  };

  dateForPrinting = () => {
    const selectedDate = moment(this.props.date);
    return (
      <div className="printable-date-container">
        <div className="printable-date-icon">
          <Icon className="large-icon" img="icon-icon_schedule" />
        </div>
        <div className="printable-date-right">
          <div className="printable-date-header">
            <FormattedMessage id="date" defaultMessage="Date" />
          </div>
          <div className="printable-date-content">
            {moment(selectedDate).format('dd DD.MM.YYYY')}
          </div>
        </div>
      </div>
    );
  };

  formTimeRow = (timetableMap, hour) => {
    const sortedArr = timetableMap[hour].sort(
      (time1, time2) => time1.scheduledDeparture - time2.scheduledDeparture,
    );

    const filteredRoutes = sortedArr
      .map(
        time =>
          this.state.showRoutes.filter(o => o === time.name || o === time.id)
            .length > 0 &&
          moment.unix(time.serviceDay + time.scheduledDeparture).format('HH'),
      )
      .filter(o => o === padStart(hour % 24, 2, '0'));

    return filteredRoutes;
  };

  createTimeTableRows = timetableMap =>
    Object.keys(timetableMap)
      .sort((a, b) => a - b)
      .map(hour => (
        <TimetableRow
          key={hour}
          title={padStart(hour % 24, 2, '0')}
          stoptimes={timetableMap[hour]}
          showRoutes={this.state.showRoutes}
          timerows={this.formTimeRow(timetableMap, hour)}
        />
      ));

  render() {
    // Check if stop is constant operation
    const { constantOperationStops } = this.context.config;
    const stopId = this.props.stop.gtfsId;
    const { date } = this.props;
    const { locale } = this.context.intl;
    if (constantOperationStops && constantOperationStops[stopId]) {
      return (
        <div className="stop-constant-operation-container">
          <div style={{ width: '85%' }}>
            <span>{constantOperationStops[stopId][locale].text}</span>
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
    // Leave out all the routes without a shortname to avoid flooding of
    // long distance buses being falsely positived as duplicates
    // then look foor routes operating under the same number but
    // different headsigns
    const duplicateRoutes = this.getDuplicatedRoutes();
    const variantList = groupBy(
      sortBy(
        uniqBy(
          mapStopTimes(
            this.props.stop.stoptimesForServiceDate.filter(
              o => o.pattern.route.shortName,
            ),
          )
            .map(o => {
              const obj = Object.assign(o);
              obj.groupId = `${o.name}-${o.headsign}`;
              obj.duplicate = !!duplicateRoutes.includes(o.name);
              return obj;
            })
            .filter(o => o.duplicate === true),
          'groupId',
        ),
        'name',
      ),
      'name',
    );

    let variantsWithMarks = [];

    Object.keys(variantList).forEach(key => {
      variantsWithMarks.push(
        variantList[key].map((o, i) => {
          const obj = Object.assign(o);
          obj.duplicate = '*'.repeat(i + 1);
          return obj;
        }),
      );
    });

    variantsWithMarks = [].concat(...variantsWithMarks);

    const routesWithDetails = mapStopTimes(
      this.props.stop.stoptimesForServiceDate,
    ).map(o => {
      const obj = Object.assign(o);
      const getDuplicate = variantsWithMarks.find(
        o2 => o2.name === o.name && o2.headsign === o.headsign && o2.duplicate,
      );
      obj.duplicate = getDuplicate ? getDuplicate.duplicate : false;
      return obj;
    });
    const timetableMap = groupArrayByHour(routesWithDetails);
    const { locationType } = this.props.stop;
    const stopIdSplitted = this.props.stop.gtfsId.split(':');
    const stopTimetableHandler =
      this.context.config.timetables &&
      this.context.config.timetables[stopIdSplitted[0]];
    const stopPDFURL =
      stopTimetableHandler &&
      this.context.config.URL.STOP_TIMETABLES[stopIdSplitted[0]] &&
      locationType !== 'STATION' &&
      date
        ? stopTimetableHandler.stopPdfUrlResolver(
            this.context.config.URL.STOP_TIMETABLES[stopIdSplitted[0]],
            this.props.stop,
            date,
            this.props.language,
          )
        : null;
    const virtualMonitorUrl =
      this.context.config.stopCard?.header?.virtualMonitorBaseUrl &&
      `${
        this.context.config.stopCard.header.virtualMonitorBaseUrl
      }${locationType.toLowerCase()}/${this.props.stop.gtfsId}`;
    const timeTableRows = this.createTimeTableRows(timetableMap);
    const timeDifferenceDays = moment
      .duration(moment(this.props.date).diff(moment()))
      .asDays();
    return (
      <>
        <ScrollableWrapper>
          <div className="timetable scroll-target">
            {this.state.showFilterModal === true ? (
              <FilterTimeTableModal
                stop={this.props.stop}
                setRoutes={this.setRouteVisibilityState}
                showFilterModal={this.showModal}
                showRoutesList={this.state.showRoutes}
              />
            ) : null}
            <div className="timetable-topbar">
              <DateSelect
                startDate={this.props.startDate}
                selectedDate={this.props.date}
                onDateChange={e => {
                  this.props.onDateChange(e);
                  const showRoutes = this.state.showRoutes.length
                    ? this.state.showRoutes.join(',')
                    : undefined;
                  this.setParams(showRoutes, e);
                  addAnalyticsEvent({
                    category: 'Stop',
                    action: 'ChangeTimetableDay',
                    name: null,
                  });
                }}
                dateFormat="YYYYMMDD"
              />
              <TimeTableOptionsPanel
                showRoutes={this.state.showRoutes}
                showFilterModal={this.showModal}
                stop={this.props.stop}
              />
            </div>
            <div className="timetable-for-printing-header">
              <h1>
                <FormattedMessage id="timetable" defaultMessage="Timetable" />
              </h1>
            </div>
            <div className="timetable-for-printing">
              {this.dateForPrinting()}
            </div>
            {timeTableRows.length > 0 ? (
              <div className="timetable-note">
                <h2>
                  <FormattedMessage
                    id="departures-by-hour"
                    defaultMessage="Departures by hour"
                  />{' '}
                  <FormattedMessage
                    id="departures-by-hour-minutes-route"
                    defaultMessage="(minutes/route)"
                  />
                </h2>
              </div>
            ) : (
              <div className="no-timetable-found-container">
                <div className="no-timetable-found">
                  <div
                    className={cx(
                      'flex-horizontal',
                      'timetable-notification',
                      'info',
                    )}
                  >
                    <Icon
                      className={cx('no-timetable-icon', 'caution')}
                      img="icon-icon_info"
                      color="#0074be"
                    />
                    {timeDifferenceDays > 30 ? (
                      <FormattedMessage
                        id="departures-not-found-time-threshold"
                        defaultMessage="No departures found"
                      />
                    ) : (
                      <FormattedMessage
                        id="departures-not-found"
                        defaultMessage="No departures found"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="momentum-scroll timetable-content-container">
              <div className="timetable-time-headers">
                <div className="hour">
                  <FormattedMessage id="hour" defaultMessage="Hour" />
                </div>
                <div className="minutes-per-route">
                  <FormattedMessage
                    id="minutes-or-route"
                    defaultMessage="Min/Route"
                  />
                </div>
              </div>
              {timeTableRows}
              <div
                className="route-remarks"
                style={{
                  display:
                    variantsWithMarks.filter(o => o.duplicate).length > 0
                      ? 'block'
                      : 'none',
                }}
              >
                <h1>
                  <FormattedMessage
                    id="explanations"
                    defaultMessage="Explanations"
                  />
                  :
                </h1>
                {variantsWithMarks.map(o => (
                  <div className="remark-row" key={`${o.id}-${o.headsign}`}>
                    <span>{`${o.name}${o.duplicate} = ${o.headsign}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollableWrapper>
        <div className="after-scrollable-area" />
        <div className="stop-page-action-bar">
          <div className="print-button-container">
            <SecondaryButton
              ariaLabel="print"
              buttonName="print"
              buttonClickAction={e => {
                printStop(e);
                addAnalyticsEvent({
                  category: 'Stop',
                  action: 'PrintTimetable',
                  name: null,
                });
              }}
              buttonIcon="icon-icon_print"
              smallSize
            />
            {stopPDFURL && (
              <SecondaryButton
                ariaLabel="print-timetable"
                buttonName="print-timetable"
                buttonClickAction={e => {
                  printStopPDF(e, stopPDFURL);
                  addAnalyticsEvent({
                    category: 'Stop',
                    action: 'PrintWeeklyTimetable',
                    name: null,
                  });
                }}
                buttonIcon="icon-icon_print"
                smallSize
              />
            )}
            {virtualMonitorUrl && (
              <SecondaryButton
                ariaLabel="stop-virtual-monitor"
                buttonName="stop-virtual-monitor"
                buttonClickAction={e => {
                  e.preventDefault();
                  window.open(virtualMonitorUrl, '_blank ');
                }}
                smallSize
              />
            )}
          </div>
        </div>
      </>
    );
  }
}

Timetable.displayName = 'Timetable';

export default Timetable;
