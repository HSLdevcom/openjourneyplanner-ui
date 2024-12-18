import React from 'react';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import { FormattedMessage } from 'react-intl';
import { GeodeticToEnu } from '../../../util/geo-utils';
import { legTime } from '../../../util/legUtils';
import { timeStr } from '../../../util/timeUtils';
import { getFaresFromLegs } from '../../../util/fareUtils';
import { ExtendedRouteTypes } from '../../../constants';
import { getItineraryPagePath } from '../../../util/path';

const TRANSFER_SLACK = 60000;
const DISPLAY_MESSAGE_THRESHOLD = 120 * 1000; // 2 minutes

export const DESTINATION_RADIUS = 20; // meters

function dist(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function vSub(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return { dx, dy };
}

// compute how big part of a path has been traversed
// returns position's projection to path, distance from path
// and the ratio traversed/full length
export function pathProgress(pos, geom) {
  const lengths = [];

  let p1 = geom[0];
  let dst = dist(pos, p1);
  let minI = 0;
  let minF = 0;
  let totalLength = 0;

  for (let i = 0; i < geom.length - 1; i++) {
    const p2 = geom[i + 1];
    const { dx, dy } = vSub(p2, p1);
    const d = Math.sqrt(dx * dx + dy * dy);
    lengths.push(d);
    totalLength += d;

    if (d > 0.001) {
      // interval distance in meters, safety check
      const dlt = vSub(pos, p1);
      const dp = dlt.dx * dx + dlt.dy * dy; // dot prod

      if (dp > 0) {
        let f;
        let cDist;
        if (dp > 1) {
          cDist = dist(p2, pos);
          f = 1;
        } else {
          f = dp / d; // normalize
          cDist = Math.sqrt(dlt.x * dlt.x + dlt.y * dlt.y - f * f); // pythag.
        }
        if (cDist < dst) {
          dst = cDist;
          minI = i;
          minF = f;
        }
      }
    }
    p1 = p2;
  }

  let traversed = minF * lengths[minI]; // last partial segment
  for (let i = 0; i < minI; i++) {
    traversed += lengths[i];
  }
  traversed /= totalLength;
  const { dx, dy } = vSub(geom[minI + 1], geom[minI]);
  const projected = {
    x: geom[minI].x + minF * dx,
    y: geom[minI].y + minF * dy,
  };

  return { projected, distance: dst, traversed };
}

export function getRemainingTraversal(leg, pos, origin, time) {
  if (pos) {
    // TODO: maybe apply only when distance is close enough to the path
    const posXY = GeodeticToEnu(pos.lat, pos.lon, origin);
    const { traversed } = pathProgress(posXY, leg.geometry);
    return 1.0 - traversed;
  }
  // estimate from elapsed time
  return Math.max((legTime(leg.end) - time) / (leg.duration * 1000), 0);
}

function findTransferProblems(legs, time, position, origin) {
  const problems = [];

  for (let i = 1; i < legs.length - 1; i++) {
    const prev = legs[i - 1];
    const leg = legs[i];
    const next = legs[i + 1];

    if (prev.transitLeg && leg.transitLeg && !leg.interlineWithPreviousLeg) {
      // transfer at a stop
      const start = legTime(leg.start);
      const end = legTime(prev.end);
      if (start > time && start - end < TRANSFER_SLACK) {
        problems.push({
          severity: start > end ? 'ALERT' : 'WARNING',
          fromLeg: prev,
          toLeg: leg,
        });
      }
    }

    if (prev.transitLeg && next.transitLeg && !leg.transitLeg) {
      // transfer with some walking
      const t1 = legTime(prev.end);
      const t2 = legTime(next.start);
      if (t2 > time) {
        // transfer is not over yet
        if (t1 > t2) {
          // certain failure, next transit departs before previous arrives
          problems.push({
            severity: 'ALERT',
            fromLeg: prev,
            toLeg: next,
          });
        } else {
          const transferDuration = leg.duration * 1000; // this is original duration
          // check if user is already at the next departure stop
          const atStop =
            position && distance(position, leg.to) <= DESTINATION_RADIUS;
          const slack = t2 - t1 - transferDuration;
          if (!atStop && slack < TRANSFER_SLACK) {
            // original transfer not possible
            let severity = 'WARNING';
            let toGo;
            let timeLeft;
            // has transit walk already started ?
            if (time > legTime(leg.start)) {
              // compute how transit is proceeding
              toGo = getRemainingTraversal(leg, position, origin, time);
              timeLeft = (t2 - time) / 1000;
            } else {
              toGo = 1.0;
              timeLeft = (t2 - t1) / 1000; // should we consider also transfer slack here?
            }
            if (toGo > 0 && timeLeft > 0) {
              const originalSpeed = leg.distance / leg.duration;
              const newSpeed = (toGo * leg.distance) / timeLeft;
              if (newSpeed > 2 * originalSpeed) {
                // double speed compared to user's routing preference
                severity = 'ALERT';
              }
            }
            problems.push({
              severity,
              fromLeg: prev,
              toLeg: next,
            });
          }
        }
      }
    }
  }
  return problems;
}
export const getLocalizedMode = (mode, intl) => {
  return intl.formatMessage({
    id: `${mode.toLowerCase()}`,
    defaultMessage: `${mode}`,
  });
};
export function getFirstLastLegs(legs) {
  const first = legs[0];
  const last = legs[legs.length - 1];
  return { first, last };
}
export const getAdditionalMessages = (leg, time, intl, config, messages) => {
  const msgs = [];
  const closed = messages.get('ticket')?.closed;
  if (!closed && legTime(leg.start) - time < DISPLAY_MESSAGE_THRESHOLD) {
    // Todo: multiple fares?
    const fare = getFaresFromLegs([leg], config)[0];
    msgs.push({
      severity: 'INFO',
      content: (
        <div className="navi-info-content">
          <FormattedMessage id="navigation-remember-ticket" />
          <span>
            {fare.ticketName} {fare.price} €
          </span>
        </div>
      ),
      id: 'ticket',
    });
  }
  return msgs;
};

export const getTransitLegState = (leg, intl, messages, time) => {
  const { start, realtimeState, from, mode, legId, route } = leg;
  const { scheduledTime, estimated } = start;

  if (messages.get(legId)?.closed) {
    return [];
  }

  const notInSchedule =
    estimated?.delay > DISPLAY_MESSAGE_THRESHOLD ||
    estimated?.delay < -DISPLAY_MESSAGE_THRESHOLD;
  const localizedMode = getLocalizedMode(mode, intl);
  let content;
  let severity;
  const isRealTime = realtimeState === 'UPDATED';
  const shortName = route.shortName || '';

  if (notInSchedule) {
    const lMode = getLocalizedMode(mode, intl);
    const routeName = `${lMode} ${shortName}`;
    const { delay } = estimated;

    const translationId = `navigation-mode-${delay > 0 ? 'late' : 'early'}`;

    content = (
      <div className="navi-alert-content">
        <FormattedMessage id={translationId} values={{ mode: routeName }} />
      </div>
    );
    severity = 'WARNING';
  } else if (!isRealTime) {
    const departure = leg.trip.stoptimesForDate[0];
    const departed =
      1000 * (departure.serviceDay + departure.scheduledDeparture);
    if (time - departed < DISPLAY_MESSAGE_THRESHOLD) {
      // vehicle just departed, maybe no realtime yet
      return [];
    }
    severity = 'WARNING';
    content = (
      <div className="navi-info-content">
        <FormattedMessage id="navileg-mode-schedule" />
        <FormattedMessage
          id="navileg-start-schedule"
          values={{
            route: shortName,
            time: timeStr(scheduledTime),
            mode: localizedMode,
          }}
        />
      </div>
    );
  } else {
    const { parentStation, name } = from.stop;
    const stopOrStation = parentStation
      ? intl.formatMessage({ id: 'from-station' })
      : intl.formatMessage({ id: 'from-stop' });
    content = (
      <div className="navi-info-content">
        <FormattedMessage
          id="navileg-mode-realtime"
          values={{ route: shortName, mode: localizedMode }}
        />
        <FormattedMessage
          id="navileg-start-realtime"
          values={{
            time: <span className="realtime">{timeStr(estimated.time)}</span>,
            stopOrStation,
            stopName: name,
          }}
        />
      </div>
    );
    severity = 'INFO';
  }
  return [{ severity, content, id: legId, expiresOn: legTime(start) }];
};

export const getItineraryAlerts = (
  legs,
  time,
  position,
  origin,
  intl,
  messages,
  location,
  router,
) => {
  const canceled = legs.filter(
    leg => leg.realtimeState === 'CANCELED' && legTime(leg.start) > time,
  );
  let content;
  const alerts = legs.flatMap(leg => {
    return leg.alerts
      .filter(alert => {
        const { first } = getFirstLastLegs(legs);
        const startTime = legTime(first.start) / 1000;
        if (messages.get(alert.id)) {
          return false;
        }
        // show only alerts that are active when
        // the journey starts
        if (startTime < alert.effectiveStartDate) {
          return false;
        }
        if (
          alert.alertSeverityLevel === 'WARNING' ||
          alert.alertSeverityLevel === 'SEVERE'
        ) {
          return true;
        }
        return false;
      })
      .map(alert => ({
        severity: 'ALERT',
        content: (
          <div className="navi-alert-content">
            <span className="header"> {alert.alertHeaderText}</span>
          </div>
        ),
        id: alert.id,
      }));
  });
  const abortTrip = <FormattedMessage id="navigation-abort-trip" />;
  const withShowRoutesBtn = children => (
    <div className="alt-btn">
      {children}
      <button
        className="show-options"
        type="button"
        onClick={() => router.push(getItineraryPagePath('POS', location.to))}
      >
        <FormattedMessage id="settings-dropdown-open-label" />
      </button>
    </div>
  );

  if (canceled) {
    // show routes button only for first canceled leg.
    canceled.forEach((leg, i) => {
      const { legId, mode, route } = leg;

      const lMode = getLocalizedMode(mode, intl);
      const routeName = `${lMode} ${route.shortName}`;
      const m = (
        <FormattedMessage
          id="navigation-mode-canceled"
          values={{ mode: routeName }}
        />
      );
      // we want to show the show routes button only for the first canceled leg.
      if (i === 0) {
        content = withShowRoutesBtn(
          <div className="navi-alert-content">
            {m}
            {abortTrip}
          </div>,
        );
      } else {
        content = <div className="navi-alert-content">{m}</div>;
      }
      if (!messages.get(`canceled-${legId}`)) {
        alerts.push({
          severity: 'ALERT',
          content,
          id: `canceled-${legId}`,
          hideClose: true,
        });
      }
    });
  }

  const transferProblems = findTransferProblems(legs, time, position, origin);
  if (transferProblems.length) {
    let prob = transferProblems.find(p => p.severity === 'ALERT');
    if (!prob) {
      // just take first
      [prob] = transferProblems;
    }
    const transferId = `transfer-${prob.fromLeg.legId}-${prob.toLeg.legId}}`;
    const alert = messages.get(transferId);
    if (!alert || alert.severity !== prob.severity) {
      content = withShowRoutesBtn(
        <div className="navi-alert-content">
          <FormattedMessage
            id="navigation-transfer-problem"
            values={{
              route1: prob.fromLeg.route.shortName,
              route2: prob.toLeg.route.shortName,
            }}
          />
          {abortTrip}
        </div>,
      );
      alerts.push({
        severity: prob.severity,
        content,
        id: transferId,
        hideClose: prob.severity === 'ALERT',
      });
    }
  }
  return alerts;
};

/*
 * Get the properties of the destination based on the leg.
 *
 */
export const getDestinationProperties = (
  rentalVehicle,
  vehicleParking,
  vehicleRentalStation,
  stop,
  config,
) => {
  const { routes, vehicleMode } = stop;
  let destination = {};
  let mode = vehicleMode;
  if (routes && vehicleMode === 'BUS' && config.useExtendedRouteTypes) {
    if (routes.some(p => p.type === ExtendedRouteTypes.BusExpress)) {
      mode = 'bus-express';
    }
  } else if (routes && vehicleMode === 'TRAM' && config.useExtendedRouteTypes) {
    if (routes.some(p => p.type === ExtendedRouteTypes.SpeedTram)) {
      mode = 'speedtram';
    }
  }
  // todo: scooter and citybike icons etc.
  if (rentalVehicle) {
    destination.name = rentalVehicle.rentalNetwork.networkId;
  } else if (vehicleParking) {
    destination.name = vehicleParking.name;
  } else if (vehicleRentalStation) {
    destination.name = vehicleRentalStation.name;
  } else {
    let iconProps = {};
    switch (mode) {
      case 'TRAM,BUS':
        iconProps = {
          iconId: 'icon-icon_bustram-stop-lollipop',
          className: 'tram-stop',
        };
        break;
      case 'SUBWAY':
        iconProps = {
          iconId: 'icon-icon_subway',
          className: 'subway-stop',
        };
        break;
      case 'RAIL':
        iconProps = {
          iconId: 'icon-icon_rail-stop-lollipop',
          className: 'rail-stop',
        };

        break;
      case 'FERRY':
        iconProps = {
          iconId: 'icon-icon_ferry',
          className: 'ferry-stop',
        };
        break;
      case 'bus-express':
        iconProps = {
          iconId: 'icon-icon_bus-stop-express-lollipop',
          className: 'bus-stop',
        };
        break;
      case 'speedtram':
        iconProps = {
          iconId: 'icon-icon_speedtram-stop-lollipop',
          className: 'speedtram-stop',
        };
        break;
      default:
        iconProps = {
          iconId: `icon-icon_${mode.toLowerCase()}-stop-lollipop`,
        };
    }
    destination = {
      ...iconProps,
      name: stop.name,
    };
  }

  return destination;
};

export const LEGTYPE = {
  WAIT: 'WAIT',
  MOVE: 'MOVE',
  TRANSIT: 'TRANSIT',
  PENDING: 'PENDING',
  END: 'END',
};
