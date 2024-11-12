import React from 'react';
import { FormattedMessage } from 'react-intl';
import { legTime } from '../../util/legUtils';
import { timeStr } from '../../util/timeUtils';
import { getFaresFromLegs } from '../../util/fareUtils';
import { ExtendedRouteTypes } from '../../constants';

const TRANSFER_SLACK = 60000;

function findTransferProblem(legs) {
  for (let i = 1; i < legs.length - 1; i++) {
    const prev = legs[i - 1];
    const leg = legs[i];
    const next = legs[i + 1];

    if (prev.transitLeg && leg.transitLeg && !leg.interlineWithPreviousLeg) {
      // transfer at a stop
      if (legTime(leg.start) - legTime(prev.end) < TRANSFER_SLACK) {
        return [prev, leg];
      }
    }

    if (prev.transitLeg && next.transitLeg && !leg.transitLeg) {
      // transfer with some walking
      const t1 = legTime(prev.end);
      const t2 = legTime(next.start);
      const transferDuration = legTime(leg.end) - legTime(leg.start);
      const slack = t2 - t1 - transferDuration;
      if (slack < TRANSFER_SLACK) {
        return [prev, next];
      }
    }
  }
  return null;
}

export const getAdditionalMessages = (leg, time, intl, config, messages) => {
  const msgs = [];
  const ticketDisplay = 120 * 1000; // 2 minutes
  const ticketMsg = messages.get('ticket');
  if (!ticketMsg && legTime(leg.start) - time < ticketDisplay) {
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

export const getTransitLegState = (leg, intl, messages) => {
  const { start, realtimeState, from, mode, legId } = leg;
  const { scheduledTime, estimated } = start;
  if (mode === 'WALK') {
    return null;
  }
  const previousMessage = messages.get(legId);
  const prevSeverity = previousMessage ? previousMessage.severity : null;

  const late = estimated?.delay > 0;
  const localizedMode = intl.formatMessage({
    id: `${mode.toLowerCase()}`,
    defaultMessage: `${mode}`,
  });
  let content;
  let severity;
  const isRealTime = realtimeState === 'UPDATED';

  if (late && prevSeverity !== 'ALERT') {
    // todo: Do this when design is ready.
    severity = 'ALERT';
    content = <div className="navi-info-content"> Kulkuneuvo on myöhässä </div>;
  } else if (!isRealTime && prevSeverity !== 'WARNING') {
    severity = 'WARNING';
    content = (
      <div className="navi-info-content">
        <FormattedMessage id="navileg-mode-schedule" />
        <FormattedMessage
          id="navileg-start-schedule"
          values={{
            time: timeStr(scheduledTime),
            mode: localizedMode,
          }}
        />
      </div>
    );
  } else if (isRealTime && prevSeverity !== 'INFO') {
    const { parentStation, name } = from.stop;
    const stopOrStation = parentStation
      ? intl.formatMessage({ id: 'from-station' })
      : intl.formatMessage({ id: 'from-stop' });
    content = (
      <div className="navi-info-content">
        <FormattedMessage
          id="navileg-mode-realtime"
          values={{ mode: localizedMode }}
        />
        <FormattedMessage
          id="navileg-start-realtime"
          values={{
            time: timeStr(estimated.time),
            stopOrStation,
            stopName: name,
          }}
        />
      </div>
    );
    severity = 'INFO';
  }
  const state = severity
    ? { severity, content, id: legId, expiresOn: 'legChange' }
    : null;
  return state;
};

// We'll need the intl later.
// eslint-disable-next-line no-unused-vars
export const getItineraryAlerts = (realTimeLegs, intl, messages) => {
  const alerts = [];
  const canceled = realTimeLegs.filter(leg => leg.realtimeState === 'CANCELED');
  const transferProblem = findTransferProblem(realTimeLegs);
  const late = realTimeLegs.filter(leg => leg.start.estimate?.delay > 0);
  let content;
  // TODO: Proper ID handling
  if (canceled.length > 0 && !messages.get('canceled')) {
    content = <div className="notifiler">Osa matkan lähdöistä on peruttu</div>;
    // Todo: No current design
    // todo find modes that are canceled
    alerts.push({
      severity: 'ALERT',
      content,
      id: 'canceled',
    });
  }
  if (transferProblem !== null) {
    const transferId = `transfer-${transferProblem[0].legId}-${transferProblem[1].legId}}`;
    if (!messages.get(transferId)) {
      // todo no current design
      content = (
        <div className="notifiler">{`Vaihto ${transferProblem[0].route.shortName} - ${transferProblem[1].route.shortName} ei onnistu reittisuunnitelman mukaisesti`}</div>
      );

      alerts.push({
        severity: 'ALERT',
        content,
        id: transferId,
      });
    }
  }
  if (late.length && !messages.get('late')) {
    // Todo: No current design
    // Todo add mode and delay time to this message
    content = <div className="notifiler">Kulkuneuvo on myöhässä</div>;
    alerts.push({
      severity: 'ALERT',
      content,
      id: 'late',
    });
  }

  return alerts;
};

/*
 * Get the properties of the destination based on the leg.
 *
 */
export const getDestinationProperties = (leg, stop, config) => {
  const { rentalVehicle, vehicleParking, vehicleRentalStation } = leg.to;
  const { vehicleMode, routes } = stop;

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
