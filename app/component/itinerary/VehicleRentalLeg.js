import { FormattedMessage, intlShape } from 'react-intl';
import Link from 'found/Link';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import connectToStores from 'fluxible-addons-react/connectToStores';
import {
  configShape,
  vehicleRentalStationShape,
  rentalVehicleShape,
} from '../../util/shapes';
import {
  BIKEAVL_UNKNOWN,
  getVehicleCapacity,
  getRentalNetworkConfig,
  getRentalNetworkIcon,
  hasVehicleRentalCode,
} from '../../util/vehicleRentalUtils';

import withBreakpoint from '../../util/withBreakpoint';
import Icon from '../Icon';
import { PREFIX_BIKESTATIONS } from '../../util/path';
import {
  getVehicleAvailabilityTextColor,
  getVehicleAvailabilityIndicatorColor,
} from '../../util/legUtils';
import { getIdWithoutFeed } from '../../util/feedScopedIdUtils';
import ScooterLinkContainer from './ScooterLinkContainer';

function VehicleRentalLeg(
  {
    stationName,
    isScooter,
    vehicleRentalStation,
    returnBike = false,
    breakpoint,
    rentalVehicle,
    language,
    nextLegMode,
    nearestScooters,
  },
  { config, intl },
) {
  if (!vehicleRentalStation && !isScooter) {
    return null;
  }
  const network =
    vehicleRentalStation?.rentalNetwork.networkId ||
    rentalVehicle?.rentalNetwork.networkId;
  // eslint-disable-next-line no-nested-ternary
  const rentMessageId = isScooter ? 'rent-e-scooter-at' : 'rent-cycle-at';
  const returnMessageId = isScooter ? 'return-e-scooter-to' : 'return-cycle-to';
  const id = returnBike ? returnMessageId : rentMessageId;
  const legDescription = (
    <span
      className={cx(
        'citybike-leg-header',
        returnBike && isScooter && 'scooter-return',
      )}
      aria-hidden={isScooter} // scooter screen reader message is already defined elsewhere
    >
      <FormattedMessage id={id} defaultMessage="Fetch a bike" />
    </span>
  );
  const networkConfig = getRentalNetworkConfig(network, config);
  const vehicleIcon = getRentalNetworkIcon(networkConfig);
  const availabilityIndicatorColor = vehicleRentalStation
    ? getVehicleAvailabilityIndicatorColor(
        vehicleRentalStation.availableVehicles.total,
        config,
      )
    : null;
  const availabilityTextColor = vehicleRentalStation
    ? getVehicleAvailabilityTextColor(
        vehicleRentalStation.availableVehicles.total,
        config,
      )
    : null;
  const mobileReturn = breakpoint === 'small' && returnBike;
  const vehicleCapacity = vehicleRentalStation
    ? getVehicleCapacity(config, vehicleRentalStation?.rentalNetwork.networkId)
    : null;
  const rentalStationLink = `/${PREFIX_BIKESTATIONS}/${vehicleRentalStation?.stationId}`;
  return (
    <>
      {(!isScooter || (nextLegMode !== 'WALK' && isScooter)) && (
        <div
          className={cx(
            'itinerary-leg-row-bike',
            (!isScooter || !returnBike) && 'withPadding',
          )}
        >
          {legDescription}
        </div>
      )}
      {vehicleRentalStation && (
        <div className="itinerary-transit-leg-route-bike">
          <div className="citybike-itinerary">
            <div
              className={cx(
                'citybike-icon',
                { small: mobileReturn },
                isScooter && 'scooter-icon',
              )}
            >
              <Icon
                img={vehicleIcon}
                width={1.655}
                height={1.655}
                badgeText={
                  vehicleRentalStation &&
                  vehicleCapacity !== BIKEAVL_UNKNOWN &&
                  !returnBike
                    ? vehicleRentalStation?.availableVehicles.total
                    : ''
                }
                badgeFill={returnBike ? null : availabilityIndicatorColor}
                badgeTextFill={returnBike ? null : availabilityTextColor}
              />
            </div>
            <div className="citybike-itinerary-text-container">
              <span className={cx('headsign', isScooter && 'scooter-headsign')}>
                <Link
                  style={{ textDecoration: 'none', color: 'black' }}
                  to={rentalStationLink}
                >
                  {stationName}
                </Link>
              </span>
              <span className="citybike-station-text">
                {intl.formatMessage({
                  id: 'citybike-station-no-id',
                  defaultMessage: 'Bike station',
                })}
                {vehicleRentalStation &&
                  hasVehicleRentalCode(vehicleRentalStation.stationId) && (
                    <span className="itinerary-stop-code">
                      {getIdWithoutFeed(vehicleRentalStation?.stationId)}
                    </span>
                  )}
              </span>
            </div>
          </div>
          <div className="link-to-stop">
            <Link to={rentalStationLink}>
              <Icon
                img="icon-icon_arrow-collapse--right"
                height={1.3}
                width={1.3}
              />
            </Link>
          </div>
        </div>
      )}
      {rentalVehicle && !returnBike && isScooter && (
        <ScooterLinkContainer
          rentalVehicle={rentalVehicle}
          language={language}
          mobileReturn={mobileReturn}
        />
      )}
      {nearestScooters &&
        !returnBike &&
        isScooter &&
        nearestScooters.map(nearestScooter => {
          return (
            <ScooterLinkContainer
              key={`nearestScooter-${nearestScooter.node.place.vehicleId}`}
              rentalVehicle={nearestScooter.node.place}
              language={language}
              mobileReturn={mobileReturn}
            />
          );
        })}
    </>
  );
}

VehicleRentalLeg.propTypes = {
  vehicleRentalStation: vehicleRentalStationShape,
  stationName: PropTypes.string,
  isScooter: PropTypes.bool,
  returnBike: PropTypes.bool,
  breakpoint: PropTypes.string,
  rentalVehicle: rentalVehicleShape,
  language: PropTypes.string.isRequired,
  nextLegMode: PropTypes.string,
  nearestScooters: PropTypes.arrayOf(rentalVehicleShape),
};

VehicleRentalLeg.defaultProps = {
  vehicleRentalStation: undefined,
  isScooter: false,
  returnBike: false,
  breakpoint: undefined,
  rentalVehicle: undefined,
  stationName: undefined,
  nextLegMode: undefined,
  nearestScooters: [],
};

VehicleRentalLeg.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};
const VehicleRentalLegWithBreakpoint = withBreakpoint(VehicleRentalLeg);

const connectedComponent = connectToStores(
  VehicleRentalLegWithBreakpoint,
  ['PreferencesStore'],
  ({ getStore }) => {
    const language = getStore('PreferencesStore').getLanguage();
    return { language };
  },
);

export { connectedComponent as default, VehicleRentalLeg as Component };
