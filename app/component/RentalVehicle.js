import PropTypes from 'prop-types';
import React from 'react';
import Icon from './Icon';
import {
  getVehicleRentalStationNetworkIcon,
  getVehicleRentalStationNetworkConfig,
} from '../util/vehicleRentalUtils';
import { rentalVehicleShape } from '../util/shapes';

const RentalVehicle = ({ rentalVehicle }, { config }) => {
  const disabled = !rentalVehicle.operative;

  const vehicleIcon = getVehicleRentalStationNetworkIcon(
    getVehicleRentalStationNetworkConfig(rentalVehicle.network, config),
    disabled,
  );
  return (
    <div className="scooter-content-container">
      <Icon img={vehicleIcon} />
    </div>
  );
};

RentalVehicle.contextTypes = {
  config: PropTypes.shape({
    cityBike: { networks: PropTypes.arrayOf(PropTypes.string.isRequired) },
  }).isRequired,
};
RentalVehicle.propTypes = {
  rentalVehicle: rentalVehicleShape.isRequired,
};
export default RentalVehicle;