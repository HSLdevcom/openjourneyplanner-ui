import distance from '@digitransit-search-util/digitransit-search-util-distance';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ExtendedRouteTypes } from '../../../constants';
import { getFaresFromLegs, formatFare } from '../../../util/fareUtils';
import { GeodeticToEnu } from '../../../util/geo-utils';
import { legTime, legTimeAcc } from '../../../util/legUtils';
import { locationToUri } from '../../../util/otpStrings';
import { getItineraryPagePath } from '../../../util/path';
import { durationToString, epochToIso, timeStr } from '../../../util/timeUtils';

const TRANSFER_SLACK = 60000;
const DISPLAY_MESSAGE_THRESHOLD = 120 * 1000; // 2 minutes

export const DESTINATION_RADIUS = 20; // meters

export function summaryString(legs, time, previousLeg, currentLeg, nextLeg) {
  const parts = epochToIso(time).split('T')[1].split('+');
  let msg = `${parts[0]} `;
  const colors = [];

  legs.forEach(l => {
    let color = 'color:gray';
    if (legTime(l.start) <= time && time <= legTime(l.end)) {
      color = 'color:green';
    } else if (l.transitLeg) {
      color = 'color:pink';
    }
    colors.push(l.freezeStart ? 'color:lightblue' : color);
    msg += `%c${legTimeAcc(l.start)}`;
    colors.push('color:gray');
    msg += `%c-`;
    colors.push(l.freezeEnd ? 'color:lightblue' : color);
    msg += `%c${legTimeAcc(l.end)} `;
  });
  colors.push('color:gray');
  msg += `%c${previousLeg?.mode} ${currentLeg?.mode} ${nextLeg?.mode}`;
  colors.unshift(msg);

  return colors;
}

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
  const duration = Math.max(legTime(leg.end) - legTime(leg.start), 1); // min 1 ms
  return Math.min(Math.max((legTime(leg.end) - time) / duration, 0), 1.0);
}

function findTransferProblems(legs, time, position, origin) {
  const transfers = [];

  for (let i = 1; i < legs.length - 1; i++) {
    const prev = legs[i - 1];
    const leg = legs[i];
    const next = legs[i + 1];

    if (prev.transitLeg && leg.transitLeg && !leg.interlineWithPreviousLeg) {
      // transfer at a stop
      const start = legTime(leg.start);
      const end = legTime(prev.end);
      if (start > time) {
        const duration = start - end;
        let severity;
        if (start < end) {
          severity = 'ALERT';
        } else if (duration < TRANSFER_SLACK) {
          severity = 'WARNING';
        } else {
          severity = 'INFO'; // normal transfer
        }
        transfers.push({
          severity,
          fromLeg: prev,
          toLeg: leg,
          duration,
          slack: duration,
        });
      }
    }

    if (prev.transitLeg && next.transitLeg && !leg.transitLeg) {
      // transfer with some walking
      const t1 = legTime(prev.end);
      const t2 = legTime(next.start);
      const duration = t2 - t1;
      if (t2 > time) {
        // transfer is not over yet
        if (t1 > t2) {
          // certain failure, next transit departs before previous arrives
          transfers.push({
            severity: 'ALERT',
            fromLeg: prev,
            toLeg: next,
          });
        } else {
          const legDuration = leg.duration * 1000; // this is original duration
          // check if user is already at the next departure stop
          const atStop =
            position && distance(position, leg.to) <= DESTINATION_RADIUS;
          let slack = duration - legDuration;
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
              timeLeft = duration / 1000; // should we consider also transfer slack here?
            }
            if (toGo > 0) {
              const originalSpeed = leg.distance / leg.duration;
              const newSpeed = (toGo * leg.distance) / (timeLeft + 0.0001);
              if (newSpeed > 1.5 * originalSpeed) {
                // too high speed compared to user's routing preference
                severity = 'ALERT';
              }
            }
            transfers.push({
              severity,
              fromLeg: prev,
              toLeg: next,
              duration,
            });
          } else {
            if (atStop) {
              slack = TRANSFER_SLACK * 2; // no slack prob if at stop
            }
            transfers.push({
              severity: 'INFO',
              fromLeg: prev,
              toLeg: next,
              duration,
              slack,
            });
          }
        }
      }
    }
  }
  return transfers;
}

export const getLocalizedMode = (mode, intl) => {
  return intl.formatMessage({
    id: `${mode.toLowerCase()}`,
    defaultMessage: `${mode}`,
  });
};

export const getToLocalizedMode = (mode, intl) => {
  return intl.formatMessage({
    id: `to-${mode.toLowerCase()}`,
    defaultMessage: `${mode}`,
  });
};

export const getAdditionalMessages = (
  leg,
  nextLeg,
  firstLeg,
  time,
  config,
  messages,
) => {
  const msgs = [];
  const closed = messages.get('ticket')?.closed;
  if (
    !closed &&
    leg === firstLeg &&
    legTime(leg.end) - time < DISPLAY_MESSAGE_THRESHOLD
  ) {
    // Todo: multiple fares?
    const fares = getFaresFromLegs([nextLeg], config);
    if (fares?.length) {
      msgs.push({
        severity: 'INFO',
        content: (
          <div className="navi-info-content">
            <span className="notification-header">
              <FormattedMessage id="navigation-remember-ticket" />
            </span>
            <span>
              {fares[0].ticketName} {formatFare(fares[0])}
            </span>
          </div>
        ),
        id: 'ticket',
      });
    }
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
    estimated?.delay > TRANSFER_SLACK || estimated?.delay < -TRANSFER_SLACK;
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
      <div className="navi-alert-content notification-header">
        <FormattedMessage id={translationId} values={{ name: routeName }} />
      </div>
    );
    severity = 'WARNING';
  } else if (!isRealTime) {
    const departure = leg.trip.stoptimesForDate[0];
    const departed =
      1000 * (departure.serviceDay + departure.scheduledDeparture);
    if (time + DISPLAY_MESSAGE_THRESHOLD < departed) {
      // vehicle just departed, maybe no realtime yet
      severity = 'INFO';
    } else {
      severity = 'WARNING';
    }
    content = (
      <div className="navi-info-content">
        <span className="notification-header">
          <FormattedMessage id="navileg-mode-schedule" />
        </span>
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

    const fromId = // eslint-disable-next-line no-nested-ternary
      mode === 'FERRY'
        ? 'from-ferrypier'
        : parentStation
          ? 'from-station'
          : 'from-stop';
    const stopOrStation = intl.formatMessage({ id: fromId });

    content = (
      <div className="navi-info-content">
        <span className="notification-header">
          <FormattedMessage
            id="navileg-mode-realtime"
            values={{ route: shortName, mode: localizedMode }}
          />
        </span>
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

export function itinerarySearchPath(time, leg, nextLeg, position, to) {
  let from;
  if (leg?.transitLeg) {
    from = leg.intermediatePlaces.find(
      p => legTime(p.arrival) > time + TRANSFER_SLACK,
    );
    if (!from) {
      from = leg.to;
    }
  } else {
    from = position || leg?.to || nextLeg?.from;
  }
  const location = { ...from, ...from.stop };

  return getItineraryPagePath(locationToUri(location), to);
}

function withNewSearchBtn(children, searchCallback) {
  return (
    <div className="navi-info-content">
      {children}
      <FormattedMessage id="navigation-abort-trip" />
      <button
        className="new-itinerary-search"
        type="button"
        onClick={searchCallback}
      >
        <span className="notification-header">
          <FormattedMessage id="settings-dropdown-open-label" />
        </span>
      </button>
    </div>
  );
}

const notedSeverity = ['WARNING', 'ALERT'];

export const getItineraryAlerts = (
  legs,
  time,
  position,
  origin,
  intl,
  messages,
  itinerarySearchCallback,
) => {
  const alerts = [];
  legs.forEach(leg => {
    if (leg.transitLeg && legTime(leg.end) > time) {
      const id = `alert-${leg.legId}`; // allow only one alert per leg
      if (!messages.get(id)?.closed) {
        const alert = leg.alerts.find(al => {
          return (
            // show only alerts that are active during the leg
            legTime(leg.end) / 1000 > al.effectiveStartDate &&
            legTime(leg.start) / 1000 < al.effectiveEndDate &&
            notedSeverity.includes(al.alertSeverityLevel)
          );
        });
        if (alert) {
          alerts.push({
            severity: 'ALERT',
            content: (
              <div className="navi-info-content">
                <span className="notification-header">
                  {alert.alertHeaderText}
                </span>
              </div>
            ),
            id,
          });
        }
      }
    }
  });

  const canceled = legs.filter(
    leg => leg.realtimeState === 'CANCELED' && legTime(leg.start) > time,
  );

  if (canceled.length) {
    // show routes button only for first canceled leg.
    canceled.forEach((leg, i) => {
      const { legId, mode, route } = leg;

      const lMode = getLocalizedMode(mode, intl);
      const routeName = `${lMode} ${route.shortName}`;

      const m = (
        <span className="notification-header">
          <FormattedMessage
            id="navigation-mode-canceled"
            values={{ name: routeName }}
          />
        </span>
      );
      // we want to show the show routes button only for the first canceled leg.
      const content =
        i === 0 ? (
          withNewSearchBtn({ m }, itinerarySearchCallback)
        ) : (
          <div className="navi-info-content notification-header">{m}</div>
        );

      if (!messages.get(`canceled-${legId}`)) {
        alerts.push({
          severity: 'ALERT',
          content,
          id: `canceled-${legId}`,
          hideClose: true,
          expiresOn: alert.effectiveEndDate * 1000,
        });
      }
    });
  } else {
    const transfers = findTransferProblems(legs, time, position, origin);
    if (transfers.length) {
      const prob =
        transfers.find(p => p.severity === 'ALERT') ||
        transfers.find(p => p.severity === 'WARNING');
      if (prob) {
        const transferId = `transfer-${prob.fromLeg.legId}-${prob.toLeg.legId}}`;
        const alert = messages.get(transferId);
        if (!alert?.closed || alert?.severity !== prob.severity) {
          let content;
          if (prob.severity === 'ALERT') {
            content = withNewSearchBtn(
              <span className="notification-header">
                <FormattedMessage
                  id="navigation-transfer-problem"
                  values={{
                    route1: prob.fromLeg.route.shortName,
                    route2: prob.toLeg.route.shortName,
                  }}
                />
              </span>,
              itinerarySearchCallback,
            );
          } else {
            content = (
              <div className="navi-info-content">
                <span className="notification-header">
                  <FormattedMessage id="navigation-hurry-transfer" />
                </span>
                <FormattedMessage
                  id="navigation-hurry-transfer-value"
                  values={{
                    transfer: `${prob.fromLeg.route.shortName} - ${prob.toLeg.route.shortName}`,
                    time: durationToString(prob.duration),
                  }}
                />
              </div>
            );
          }

          alerts.push({
            severity: prob.severity,
            content,
            id: transferId,
            hideClose: prob.severity === 'ALERT',
            expiresOn: legTime(prob.toLeg.start),
          });
        }
      }
      // show notification when problem gets solved
      transfers.forEach(tr => {
        if (tr.severity === 'INFO' && tr.slack > 1.5 * TRANSFER_SLACK) {
          const id = `transfer-${tr.fromLeg.legId}-${tr.toLeg.legId}}`;
          const alert = messages.get(id);
          if (alert && alert.severity !== 'INFO') {
            // a warning/alert has been showm
            alerts.push({
              severity: 'INFO',
              content: (
                <div className="navi-info-content">
                  <span className="notification-header">
                    <FormattedMessage id="navigation-hurry-transfer-solved" />
                  </span>
                  <FormattedMessage
                    id="navigation-hurry-transfer-solved-details"
                    values={{
                      transfer: `${tr.fromLeg.route.shortName} - ${tr.toLeg.route.shortName}`,
                      time: durationToString(tr.duration),
                    }}
                  />
                </div>
              ),
              id,
              expiresOn: legTime(tr.toLeg.start),
            });
          }
        }
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
  WAIT_IN_VEHICLE: 'WAIT_IN_VEHICLE',
};
