import PropTypes from 'prop-types';
import React from 'react';
import { configShape } from '../../../util/shapes';
import Toggle from '../../Toggle';
import { saveRoutingSettings } from '../../../action/SearchSettingsActions';
import Icon from '../../Icon';
import {
  mapDefaultNetworkProperties,
  getRentalNetworkName,
  getRentalNetworkConfig,
  updateVehicleNetworks,
  getCitybikeNetworks,
} from '../../../util/vehicleRentalUtils';
import { TransportMode } from '../../../constants';

const RentalNetworkSelector = (
  { currentOptions },
  { config, getStore, executeAction },
) => (
  <React.Fragment>
    {mapDefaultNetworkProperties(config)
      .filter(network => network.type === TransportMode.Citybike.toLowerCase())
      .map(network => (
        <div
          className="mode-option-container"
          key={`cb-${network.networkName}`}
          style={{ height: '3.5em' }}
        >
          <label
            htmlFor={`settings-toggle-bike-${network.networkName}`}
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
              id={`settings-toggle-bike-${network.networkName}`}
              toggled={
                !!currentOptions &&
                currentOptions.filter(
                  option =>
                    option.toLowerCase() === network.networkName.toLowerCase(),
                ).length > 0
              }
              onToggle={() => {
                const newNetworks = updateVehicleNetworks(
                  getCitybikeNetworks(config),
                  network.networkName,
                  network.type,
                );
                const newSettings = { allowedBikeRentalNetworks: newNetworks };
                executeAction(saveRoutingSettings, newSettings);
              }}
            />
          </label>
        </div>
      ))}
  </React.Fragment>
);

RentalNetworkSelector.propTypes = {
  currentOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

RentalNetworkSelector.contextTypes = {
  config: configShape.isRequired,
  getStore: PropTypes.func.isRequired,
  executeAction: PropTypes.func.isRequired,
};

export default RentalNetworkSelector;
