import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { createFragmentContainer, graphql } from 'react-relay';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { FormattedMessage } from 'react-intl';
import { routerShape, RedirectException } from 'found';
import Icon from './Icon';
import withBreakpoint from '../util/withBreakpoint';
import {
  getRentalNetworkIcon,
  getRentalNetworkConfig,
} from '../util/vehicleRentalUtils';
import { isBrowser } from '../util/browser';
import { PREFIX_RENTALVEHICLES } from '../util/path';
import VehicleRentalLeg from './itinerary/VehicleRentalLeg';
import BackButton from './BackButton';
import { rentalVehicleShape } from '../util/shapes';

const RentalVehicleContent = (
  { rentalVehicle, breakpoint, router, error, language, match },
  { config },
) => {
  const [isClient, setClient] = useState(false);

  useEffect(() => {
    setClient(true);
  });

  const networks = match.params.networks?.split(',');

  // throw error in client side relay query fails
  if (isClient && error && !rentalVehicle) {
    throw error.message;
  }

  if (!rentalVehicle && !error) {
    if (isBrowser) {
      router.replace(`/${PREFIX_RENTALVEHICLES}`);
    } else {
      throw new RedirectException(`/${PREFIX_RENTALVEHICLES}`);
    }
    return null;
  }
  const networkConfig = getRentalNetworkConfig(
    rentalVehicle.rentalNetwork.networkId,
    config,
  );
  const vehicleIcon = getRentalNetworkIcon(networkConfig);

  if (networks) {
    return (
      <div className="scooter-page-container">
        <div className="scooter-cluster-back-button-container">
          {breakpoint === 'large' && (
            <BackButton
              icon="icon-icon_arrow-collapse--left"
              iconClassName="arrow-icon"
            />
          )}
        </div>
        <div className="scooter-sub-header scooters-available">
          <FormattedMessage id="e-scooters-available" />
        </div>
        {networks.map(network => (
          <div key={network} className="scooter-box cluster">
            <div className="scooter-content-container cluster">
              <Icon img={vehicleIcon} />
              <div className="scooter-header">
                <div className="header">
                  <h1>
                    {networkConfig.name[language] ||
                      rentalVehicle.rentalNetwork.networkId}
                  </h1>
                  <div className="scooter-sub-header">
                    <FormattedMessage id="e-scooter" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="scooter-page-container">
      <div className="scooter-box">
        <div className="scooter-content-container">
          <Icon img={vehicleIcon} />
          <div className="scooter-header">
            {breakpoint === 'large' && (
              <BackButton
                icon="icon-icon_arrow-collapse--left"
                iconClassName="arrow-icon"
              />
            )}
            <div className="header">
              <h1>
                {networkConfig.name[language] ||
                  rentalVehicle.rentalNetwork.networkId}
              </h1>
              <div className="scooter-sub-header">
                <FormattedMessage id="e-scooter" />
              </div>
            </div>
          </div>
        </div>

        <div className="disclaimer-content">
          <VehicleRentalLeg isScooter rentalVehicle={rentalVehicle} />
        </div>
      </div>
    </div>
  );
};

RentalVehicleContent.propTypes = {
  rentalVehicle: rentalVehicleShape.isRequired,
  breakpoint: PropTypes.string.isRequired,
  router: routerShape.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  language: PropTypes.string.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      networks: PropTypes.string,
    }),
  }),
};

RentalVehicleContent.defaultProps = {
  error: undefined,
  match: undefined,
};

RentalVehicleContent.contextTypes = {
  config: PropTypes.shape({
    text: PropTypes.string,
  }).isRequired,
};

const RentalVehicleContentWithBreakpoint = withBreakpoint(RentalVehicleContent);

const connectedComponent = connectToStores(
  RentalVehicleContentWithBreakpoint,
  ['PreferencesStore'],
  ({ getStore }) => {
    const language = getStore('PreferencesStore').getLanguage();
    return { language };
  },
);

const containerComponent = createFragmentContainer(connectedComponent, {
  rentalVehicle: graphql`
    fragment RentalVehicleContent_rentalVehicle on RentalVehicle {
      lat
      lon
      name
      vehicleId
      rentalUris {
        android
        ios
        web
      }
      rentalNetwork {
        networkId
        url
      }
    }
  `,
});

export {
  containerComponent as default,
  RentalVehicleContentWithBreakpoint as Component,
};
