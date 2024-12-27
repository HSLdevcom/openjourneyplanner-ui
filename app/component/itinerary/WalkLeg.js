import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import Link from 'found/Link';
import { legShape, configShape } from '../../util/shapes';
import { legTime, legTimeStr, legDestination } from '../../util/legUtils';
import Icon from '../Icon';
import ItineraryMapAction from './ItineraryMapAction';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import PlatformNumber from '../PlatformNumber';
import ServiceAlertIcon from '../ServiceAlertIcon';
import { getActiveAlertSeverityLevel } from '../../util/alertUtils';
import { PREFIX_STOPS } from '../../util/path';
import {
  RentalNetworkType,
  getRentalNetworkConfig,
} from '../../util/vehicleRentalUtils';
import { displayDistance } from '../../util/geo-utils';
import { durationToString } from '../../util/timeUtils';
import { splitStringToAddressAndPlace } from '../../util/otpStrings';
import VehicleRentalLeg from './VehicleRentalLeg';

function WalkLeg(
  { children, focusAction, focusToLeg, index, leg, previousLeg },
  { config, intl },
) {
  const distance = displayDistance(
    parseInt(leg.mode !== 'WALK' ? 0 : leg.distance, 10),
    config,
    intl.formatNumber,
  );
  //
  const duration = durationToString(
    leg.mode !== 'WALK' ? 0 : leg.duration * 1000,
  );
  const startMs = legTime(leg.start);
  // If mode is not WALK, WalkLeg should get information from "to".
  const toOrFrom = leg.mode !== 'WALK' ? 'to' : 'from';
  const modeClassName = 'walk';
  const fromMode = (leg[toOrFrom].stop && leg[toOrFrom].stop.vehicleMode) || '';
  const isFirstLeg = i => i === 0;
  const [address, place] = splitStringToAddressAndPlace(leg[toOrFrom].name);
  const network =
    previousLeg?.[toOrFrom]?.vehicleRentalStation?.rentalNetwork.networkId ||
    previousLeg?.[toOrFrom]?.rentalVehicle?.rentalNetwork.networkId;

  const networkType = getRentalNetworkConfig(
    previousLeg?.rentedBike && network,
    config,
  ).type;
  const isScooter = networkType === RentalNetworkType.Scooter;
  const returnNotice = previousLeg?.rentedBike ? (
    <FormattedMessage
      id={
        networkType === RentalNetworkType.Scooter
          ? 'return-e-scooter-to'
          : 'return-cycle-to'
      }
      values={{ station: leg[toOrFrom] ? leg[toOrFrom].name : '' }}
      defaultMessage="Return the bike to {station} station"
    />
  ) : null;
  let appendClass;

  if (returnNotice) {
    appendClass = !isScooter ? 'return-citybike' : '';
  }

  const destinationLabel =
    leg.to.name?.toLowerCase() === 'scooter'
      ? intl.formatMessage({
          id: 'e-scooter',
          defaultMessage: 'scooter',
        })
      : leg.to.name;

  return (
    <div key={index} className="row itinerary-row">
      <span className="sr-only">
        {returnNotice}
        <FormattedMessage
          id="itinerary-details.walk-leg"
          values={{
            time: legTimeStr(leg.start),
            to: legDestination(intl, leg),
            distance,
            duration,
            origin: leg[toOrFrom] ? leg[toOrFrom].name : '',
            destination: leg.to ? destinationLabel : '',
          }}
        />
      </span>
      <div className="small-2 columns itinerary-time-column" aria-hidden="true">
        <div className="itinerary-time-column-time">
          <span className={cx({ realtime: previousLeg?.realTime })}>
            {leg.mode === 'WALK' ? legTimeStr(leg.start) : legTimeStr(leg.end)}
          </span>
        </div>
      </div>
      <ItineraryCircleLineWithIcon
        appendClass={appendClass}
        index={index}
        modeClassName={modeClassName}
      />
      <div
        className={`small-9 columns itinerary-instruction-column ${leg.mode.toLowerCase()}`}
      >
        <span className="sr-only">
          <FormattedMessage
            id="itinerary-summary.show-on-map"
            values={{ target: leg[toOrFrom].name || '' }}
          />
        </span>
        {isFirstLeg(index) ? (
          <div className={cx('itinerary-leg-first-row', 'walk', 'first')}>
            <div className="address-container">
              <div className="address">
                {address}
                {leg[toOrFrom].stop && (
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color={config.colors.primary}
                  />
                )}
              </div>
              <div className="place">{place}</div>
            </div>
            <ItineraryMapAction
              target={leg[toOrFrom].name || ''}
              focusAction={focusAction}
            />
          </div>
        ) : (
          <div
            className={cx(
              returnNotice
                ? 'itinerary-leg-first-row-return-bike'
                : 'itinerary-leg-first-row',
              isScooter && 'scooter',
            )}
          >
            <div className="itinerary-leg-row">
              {leg[toOrFrom].stop ? (
                <Link
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  to={`/${PREFIX_STOPS}/${leg[toOrFrom].stop.gtfsId}`}
                >
                  {returnNotice || leg[toOrFrom].name}
                  {leg[toOrFrom].stop && (
                    <Icon
                      img="icon-icon_arrow-collapse--right"
                      className="itinerary-arrow-icon"
                      color={config.colors.primary}
                    />
                  )}
                  <ServiceAlertIcon
                    className="inline-icon"
                    severityLevel={getActiveAlertSeverityLevel(
                      leg[toOrFrom].stop && leg[toOrFrom].stop.alerts,
                      startMs / 1000,
                    )}
                  />
                </Link>
              ) : (
                <div>
                  {returnNotice ? (
                    <>
                      <div className="divider" />
                      <VehicleRentalLeg
                        isScooter={isScooter}
                        stationName={leg[toOrFrom].name}
                        vehicleRentalStation={
                          leg[toOrFrom].vehicleRentalStation
                        }
                        returnBike
                        rentalVehicle={leg.from.rentalVehicle}
                      />
                    </>
                  ) : (
                    leg[toOrFrom].name
                  )}
                  {leg[toOrFrom].stop && (
                    <Icon
                      img="icon-icon_arrow-collapse--right"
                      className="itinerary-arrow-icon"
                      color={config.colors.primary}
                    />
                  )}
                  <ServiceAlertIcon
                    className="inline-icon"
                    severityLevel={getActiveAlertSeverityLevel(
                      leg[toOrFrom].stop && leg[toOrFrom].stop.alerts,
                      startMs / 1000,
                    )}
                  />
                </div>
              )}
              {networkType !== RentalNetworkType.Scooter && (
                <div className="stop-code-container">
                  {children}
                  {leg[toOrFrom].stop && (
                    <PlatformNumber
                      number={leg[toOrFrom].stop.platformCode}
                      short
                      isRailOrSubway={
                        fromMode === 'RAIL' || fromMode === 'SUBWAY'
                      }
                    />
                  )}
                </div>
              )}
            </div>
            {!returnNotice && (
              <ItineraryMapAction
                target={leg[toOrFrom].name || ''}
                focusAction={focusAction}
              />
            )}
          </div>
        )}

        <div className="itinerary-leg-action itinerary-leg-action-content">
          <FormattedMessage
            id="walk-distance-duration"
            values={{
              distance: config.emphasizeDistance ? <b>{distance}</b> : distance,
              duration,
            }}
            defaultMessage="Walk {distance} ({duration})"
          />
          <ItineraryMapAction
            target=""
            ariaLabelId="itinerary-summary-row.clickable-area-description"
            focusAction={focusToLeg}
          />
        </div>
      </div>
    </div>
  );
}

WalkLeg.propTypes = {
  children: PropTypes.node,
  focusAction: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  leg: legShape.isRequired,
  previousLeg: legShape,
  focusToLeg: PropTypes.func.isRequired,
};

WalkLeg.defaultProps = {
  previousLeg: undefined,
  children: undefined,
};

WalkLeg.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

export default WalkLeg;
