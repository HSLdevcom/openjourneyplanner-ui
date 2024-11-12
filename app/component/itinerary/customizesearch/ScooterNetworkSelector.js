import PropTypes from 'prop-types';
import React from 'react';
import Toggle from '../../Toggle';
import { saveRoutingSettings } from '../../../action/SearchSettingsActions';
import Icon from '../../Icon';
import {
  mapDefaultNetworkProperties,
  getRentalNetworkName,
  getRentalNetworkConfig,
  updateVehicleNetworks,
  getScooterNetworks,
} from '../../../util/vehicleRentalUtils';
import { TransportMode } from '../../../constants';

const ScooterNetworkSelector = (
  { currentOptions },
  { config, getStore, executeAction },
) => (
  <React.Fragment>
    {mapDefaultNetworkProperties(config)
      .filter(network => network.type === TransportMode.Scooter.toLowerCase())
      .map(network => (
        <div
          className="mode-option-container"
          key={`cb-${network.networkName}`}
          style={{ height: '3.5em' }}
        >
          <label
            htmlFor={`settings-toggle-scooter-${network.networkName}`}
            className="mode-option-block toggle-label"
          >
            <div className="mode-icon">
              <Icon
                className={`${network.icon}-icon`}
                img={`icon-icon_${network.icon}`}
                height={1}
                width={1}
              />
            </div>
            <span className="mode-name">
              {getRentalNetworkName(
                getRentalNetworkConfig(network.networkName, config),
                getStore('PreferencesStore').getLanguage(),
              )}
            </span>
            <Toggle
              id={`settings-toggle-scooter-${network.networkName}`}
              toggled={
                !!currentOptions &&
                currentOptions.filter(
                  option =>
                    option.toLowerCase() === network.networkName.toLowerCase(),
                ).length > 0
              }
              onToggle={() => {
                const newNetworks = updateVehicleNetworks(
                  getScooterNetworks(config),
                  network.networkName,
                  network.type,
                );
                const newSettings = { scooterNetworks: newNetworks };
                executeAction(saveRoutingSettings, newSettings);
              }}
            />
          </label>
        </div>
      ))}
  </React.Fragment>
);

ScooterNetworkSelector.propTypes = {
  currentOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

ScooterNetworkSelector.contextTypes = {
  config: PropTypes.shape({
    transportModes: PropTypes.shape({
      scooter: PropTypes.shape({
        networks: PropTypes.arrayOf(PropTypes.string),
      }),
    }),
  }).isRequired,
  getStore: PropTypes.func.isRequired,
  executeAction: PropTypes.func.isRequired,
};

export default ScooterNetworkSelector;
