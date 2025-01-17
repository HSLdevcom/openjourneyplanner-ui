import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { v4 as uuid } from 'uuid';
import { configShape, fareShape, legShape } from '../../util/shapes';
import { renderZoneTicket } from './ZoneTicket';
import Icon from '../Icon';
import { getAlternativeFares, formatFare } from '../../util/fareUtils';

export default function TicketInformation(
  { fares, zones, legs },
  { config, intl },
) {
  if (fares.length === 0) {
    return null;
  }

  const alternativeFares = getAlternativeFares(
    zones,
    fares.filter(fare => !fare.isUnknown),
    config.availableTickets,
  );

  const getRouteName = fare => {
    const fareLeg = legs.find(leg => leg.route?.gtfsId === fare.routeGtfsId);
    if (fareLeg.mode === 'FERRY') {
      return fare.routeName;
    }
    return fareLeg.from.name.concat(' - ').concat(fareLeg.to.name);
  };

  const faresInfo = fares.map((fare, i) => {
    return (
      <div key={uuid()} className="ticket-container">
        {i === 0 && (
          <div className="ticket-title">
            {`${intl.formatMessage({
              id:
                fares.length > 1
                  ? 'itinerary-tickets.title'
                  : 'itinerary-ticket.title',
              defaultMessage: 'Required tickets',
            })}:`}
          </div>
        )}
        <div
          className={cx('ticket-type-zone', {
            'multi-component': fares.length > 1,
          })}
          key={i} // eslint-disable-line react/no-array-index-key
        >
          {fare.isUnknown ? (
            <div className="unknown-fare-container">
              <div className="ticket-identifier">{getRouteName(fare)}</div>
              {fare.agency && !config.hideExternalOperator(fare.agency) && (
                <div className="ticket-description">{fare.agency.name}</div>
              )}
            </div>
          ) : (
            (config.ticketLink && (
              <a href={config.ticketLink} target="_blank" rel="noreferrer">
                <div className="ticket-identifier">
                  {config.useTicketIcons
                    ? renderZoneTicket(fare.ticketName, alternativeFares)
                    : fare.ticketName}
                </div>
                {config.showTicketPrice && (
                  <div className="ticket-description">{formatFare(fare)}</div>
                )}
                <Icon img="icon-icon_arrow-collapse--right" />
              </a>
            )) || (
              <div className="fare-container">
                <div className="ticket-identifier">
                  {config.useTicketIcons
                    ? renderZoneTicket(fare.ticketName, alternativeFares)
                    : fare.ticketName}
                </div>
                {config.showTicketPrice && (
                  <div className="ticket-description">
                    {`${fare.price.toFixed(2)} €`}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    );
  });

  return (
    <div className="itinerary-ticket-information">
      <div className="itinerary-ticket-type">{faresInfo}</div>
    </div>
  );
}

TicketInformation.propTypes = {
  legs: PropTypes.arrayOf(legShape),
  fares: PropTypes.arrayOf(fareShape),
  zones: PropTypes.arrayOf(PropTypes.string),
};

TicketInformation.defaultProps = {
  fares: [],
  zones: [],
  legs: [],
};

TicketInformation.contextTypes = {
  config: configShape,
  intl: intlShape.isRequired,
};

TicketInformation.displayName = 'TicketInformation';
