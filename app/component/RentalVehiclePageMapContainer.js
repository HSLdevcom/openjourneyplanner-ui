import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import { FormattedMessage } from 'react-intl';
import StopPageMap from './map/StopPageMap';
import { rentalVehicleShape } from '../util/shapes';

const RentalVehiclePageMapContainer = ({ rentalVehicle }) => {
  if (!rentalVehicle) {
    return false;
  }
  const stopName = (
    <FormattedMessage
      id={rentalVehicle.name.toLowerCase() === 'scooter' && 'e-scooter'}
      defaultMessage={rentalVehicle.name}
    />
  );
  return <StopPageMap stop={rentalVehicle} stopName={stopName} scooter />;
};

RentalVehiclePageMapContainer.propTypes = {
  rentalVehicle: rentalVehicleShape,
};

RentalVehiclePageMapContainer.defaultProps = {
  rentalVehicle: undefined,
};

const containerComponent = createFragmentContainer(
  RentalVehiclePageMapContainer,
  {
    rentalVehicle: graphql`
      fragment RentalVehiclePageMapContainer_rentalVehicle on RentalVehicle {
        lat
        lon
        name
      }
    `,
  },
);

export {
  containerComponent as default,
  RentalVehiclePageMapContainer as Component,
};
