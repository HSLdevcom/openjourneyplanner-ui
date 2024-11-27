import { FormattedMessage, intlShape } from 'react-intl';
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { configShape, rentalVehicleShape } from '../../util/shapes';
import {
  getRentalNetworkConfig,
  getRentalNetworkIcon,
  getRentalVehicleLink,
  useDeepLink,
} from '../../util/vehicleRentalUtils';

import withBreakpoint from '../../util/withBreakpoint';
import Icon from '../Icon';
import ExternalLink from '../ExternalLink';

function ScooterLinkContainer(
  { rentalVehicle, language, mobileReturn },
  { config },
) {
  const network = rentalVehicle.rentalNetwork.networkId;
  const networkConfig = getRentalNetworkConfig(network, config);
  const vehicleIcon = getRentalNetworkIcon(networkConfig);
  const scooterHeadsign = (
    <FormattedMessage
      id="open-operator-app"
      values={{
        operator: networkConfig.name[language] || network,
      }}
      defaultMessage="Open the app to use a scooter"
    />
  );
  const rentalVehicleLink = getRentalVehicleLink(rentalVehicle, networkConfig);
  const onClick = rentalVehicleLink.startsWith('http')
    ? () => {}
    : () => useDeepLink(rentalVehicleLink, rentalVehicle.rentalNetwork.url);

  return (
    <div>
      <div className="itinerary-transit-leg-route-bike">
        <div className="citybike-itinerary">
          <div
            className={cx(
              'citybike-icon',
              { small: mobileReturn },
              'scooter-icon',
            )}
          >
            <Icon img={vehicleIcon} width={1.655} height={1.655} />
          </div>
          <div className="citybike-itinerary-text-container">
            <span className={cx('headsign', 'scooter-headsign')}>
              <ExternalLink
                className="rental-vehicle-link"
                href={rentalVehicleLink}
                onClick={onClick}
              >
                {scooterHeadsign}
              </ExternalLink>
            </span>
          </div>
        </div>
        <div className="link-to-e-scooter-operator">
          <ExternalLink
            className="rental-vehicle-link"
            href={rentalVehicleLink}
            onClick={onClick}
          >
            <Icon img="icon-icon_external-link-box" height={1} width={1} />
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}

ScooterLinkContainer.propTypes = {
  rentalVehicle: rentalVehicleShape.isRequired,
  language: PropTypes.string.isRequired,
  mobileReturn: PropTypes.bool,
};

ScooterLinkContainer.defaultProps = {
  mobileReturn: false,
};

ScooterLinkContainer.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};
const ScooterLinkWithBreakpoint = withBreakpoint(ScooterLinkContainer);

const connectedComponent = connectToStores(
  ScooterLinkWithBreakpoint,
  ['PreferencesStore'],
  ({ getStore }) => {
    const language = getStore('PreferencesStore').getLanguage();
    return { language };
  },
);

export { connectedComponent as default, ScooterLinkContainer as Component };
