import cx from 'classnames';
import React, { useState, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { matchShape } from 'found';
import { stopShape } from '../../util/shapes';
import { AlertSeverityLevelType } from '../../constants';
import {
  getCancelationsForStop,
  getAlertsForObject,
  getServiceAlertsForStation,
  getActiveAlertSeverityLevel,
} from '../../util/alertUtils';
import withBreakpoint from '../../util/withBreakpoint';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import { unixTime } from '../../util/timeUtils';
import {
  PREFIX_DISRUPTION,
  PREFIX_ROUTES,
  PREFIX_STOPS,
  PREFIX_TERMINALS,
  PREFIX_TIMETABLE,
} from '../../util/path';
import Icon from '../Icon';

const Tab = {
  Disruptions: PREFIX_DISRUPTION,
  RightNow: 'right-now',
  RoutesAndPlatforms: PREFIX_ROUTES,
  Timetable: PREFIX_TIMETABLE,
};

const getActiveTab = pathname => {
  if (pathname.indexOf(`/${Tab.Disruptions}`) > -1) {
    return Tab.Disruptions;
  }
  if (pathname.indexOf(`/${Tab.RoutesAndPlatforms}`) > -1) {
    return Tab.RoutesAndPlatforms;
  }
  if (pathname.indexOf(`/${Tab.Timetable}`) > -1) {
    return Tab.Timetable;
  }
  return Tab.RightNow;
};

function StopPageTabs({ stop }, { match }) {
  const { router } = match;
  if (!stop) {
    return null;
  }
  const activeTab = getActiveTab(match.location.pathname);
  const { search } = match.location;

  const [focusedTab, changeFocusedTab] = useState(activeTab);
  const rightNowTabRef = useRef();
  const timetableTabRef = useRef();
  const disruptionTabRef = useRef();
  const tabRefs = [rightNowTabRef, timetableTabRef, disruptionTabRef];

  const isTerminal = match.params.terminalId != null;
  const urlBase = `/${
    isTerminal ? PREFIX_TERMINALS : PREFIX_STOPS
  }/${encodeURIComponent(
    match.params.terminalId ? match.params.terminalId : match.params.stopId,
  )}`;

  const currentTime = unixTime();

  const cancelations = getCancelationsForStop(stop);

  const maxAlertSeverity = getActiveAlertSeverityLevel(
    isTerminal ? getServiceAlertsForStation(stop) : getAlertsForObject(stop),
    currentTime,
  );

  let disruptionClassName;
  let disruptionIcon;
  if (
    cancelations.length > 0 ||
    maxAlertSeverity === AlertSeverityLevelType.Severe ||
    maxAlertSeverity === AlertSeverityLevelType.Warning ||
    maxAlertSeverity === AlertSeverityLevelType.Unknown
  ) {
    disruptionClassName = 'active-disruption-alert';
    disruptionIcon = (
      <Icon
        className="disrution-icon"
        img="icon-icon_caution-no-excl-no-stroke"
      />
    );
  } else if (maxAlertSeverity === AlertSeverityLevelType.Info) {
    disruptionClassName = 'active-service-alert';
    disruptionIcon = (
      <Icon className="service-alert-icon" img="icon-icon_info" />
    );
  } else {
    disruptionClassName = 'no-alerts';
  }

  return (
    <div>
      {/* eslint-disable jsx-a11y/interactive-supports-focus */}
      <div
        className="stop-tab-container"
        role="tablist"
        onKeyDown={e => {
          const tabs = [Tab.RightNow, Tab.Timetable, Tab.Disruptions];
          const tabCount = tabs.length;
          const activeIndex = tabs.indexOf(focusedTab);
          let index;
          switch (e.nativeEvent.code) {
            case 'ArrowLeft':
              index = (activeIndex - 1 + tabCount) % tabCount;
              tabRefs[index].current.focus();
              changeFocusedTab(tabs[index]);
              break;
            case 'ArrowRight':
              index = (activeIndex + 1) % tabCount;
              tabRefs[index].current.focus();
              changeFocusedTab(tabs[index]);
              break;
            default:
              break;
          }
        }}
      >
        {/* eslint-enable jsx-a11y/interactive-supports-focus */}
        <button
          type="button"
          className={cx('stop-tab-singletab', {
            active: activeTab === Tab.RightNow,
          })}
          onClick={() => {
            router.replace(`${urlBase}${search}`);
            addAnalyticsEvent({
              category: 'Stop',
              action: 'OpenRightNowTab',
              name: null,
            });
          }}
          role="tab"
          ref={rightNowTabRef}
          tabIndex={focusedTab === Tab.RightNow ? 0 : -1}
          aria-selected={activeTab === Tab.RightNow}
        >
          <div className="stop-tab-singletab-container">
            <div>
              <FormattedMessage id="right-now" defaultMessage="right now" />
            </div>
          </div>
        </button>
        <button
          type="button"
          className={cx('stop-tab-singletab', {
            active: activeTab === Tab.Timetable,
          })}
          onClick={() => {
            router.replace(`${urlBase}/${Tab.Timetable}${search}`);
            addAnalyticsEvent({
              category: 'Stop',
              action: 'OpenTimetableTab',
              name: null,
            });
          }}
          role="tab"
          ref={timetableTabRef}
          tabIndex={focusedTab === Tab.Timetable ? 0 : -1}
          aria-selected={activeTab === Tab.Timetable}
        >
          <div className="stop-tab-singletab-container">
            <div>
              <FormattedMessage id="timetable" defaultMessage="timetable" />
            </div>
          </div>
        </button>
        <button
          type="button"
          className={cx('stop-tab-singletab', {
            active: activeTab === Tab.Disruptions,
            'alert-active': disruptionClassName === 'active-disruption-alert',
            'service-alert-active':
              disruptionClassName === 'active-service-alert',
          })}
          onClick={() => {
            router.replace(`${urlBase}/${Tab.Disruptions}${search}`);
            addAnalyticsEvent({
              category: 'Stop',
              action: 'OpenDisruptionsTab',
              name: null,
            });
          }}
          role="tab"
          ref={disruptionTabRef}
          tabIndex={focusedTab === Tab.Disruptions ? 0 : -1}
          aria-selected={activeTab === Tab.Disruptions}
        >
          <div className="stop-tab-singletab-container">
            <div className={disruptionClassName}>
              {disruptionIcon}
              <FormattedMessage id="disruptions" />
            </div>
            <span className="sr-only">
              {disruptionClassName !== 'no-alerts' ? (
                <FormattedMessage id="disruptions-tab.sr-disruptions" />
              ) : (
                <FormattedMessage id="disruptions-tab.sr-no-disruptions" />
              )}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

StopPageTabs.propTypes = { stop: stopShape };
StopPageTabs.defaultProps = { stop: undefined };
StopPageTabs.contextTypes = { match: matchShape.isRequired };

const componentWithBreakpoint = withBreakpoint(StopPageTabs);

export { componentWithBreakpoint as default, StopPageTabs as Component };
