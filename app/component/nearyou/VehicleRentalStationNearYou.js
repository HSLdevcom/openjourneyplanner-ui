import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Link } from 'found';
import { graphql, createRefetchContainer } from 'react-relay';
import VehicleRentalStation from '../VehicleRentalStation';
import FavouriteVehicleRentalStationContainer from '../FavouriteVehicleRentalStationContainer';
import { PREFIX_BIKESTATIONS } from '../../util/path';
import { isKeyboardSelectionEvent } from '../../util/browser';
import { hasVehicleRentalCode } from '../../util/vehicleRentalUtils';
import { getIdWithoutFeed } from '../../util/feedScopedIdUtils';
import { relayShape } from '../../util/shapes';

const VehicleRentalStationNearYou = ({
  stop,
  relay,
  currentTime,
  currentMode,
}) => {
  useEffect(() => {
    const { stationId } = stop;
    if (currentMode === 'CITYBIKE') {
      relay?.refetch(
        oldVariables => {
          return { ...oldVariables, stopId: stationId };
        },
        null,
        null,
        { force: true }, // query variables stay the same between refetches
      );
    }
  }, [currentTime]);
  return (
    <span role="listitem">
      <div className="stop-near-you-container">
        <div className="stop-near-you-header-container">
          <div className="stop-header-content">
            <Link
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyPress={e => {
                if (isKeyboardSelectionEvent(e)) {
                  e.stopPropagation();
                }
              }}
              to={`/${PREFIX_BIKESTATIONS}/${stop.stationId}`}
            >
              <h3 className="stop-near-you-name">{stop.name}</h3>
            </Link>
            <div className="bike-station-code">
              <FormattedMessage
                id="citybike-station"
                values={{
                  stationId: hasVehicleRentalCode(stop.stationId)
                    ? getIdWithoutFeed(stop.stationId)
                    : '',
                }}
              />
            </div>
          </div>
          <FavouriteVehicleRentalStationContainer
            vehicleRentalStation={stop}
            className="bike-rental-favourite-container"
          />
        </div>
        <VehicleRentalStation vehicleRentalStation={stop} />
      </div>
    </span>
  );
};
VehicleRentalStationNearYou.propTypes = {
  stop: PropTypes.shape({
    capacity: PropTypes.number,
    distance: PropTypes.number,
    lat: PropTypes.number,
    lon: PropTypes.number,
    name: PropTypes.string,
    rentalNetwork: PropTypes.shape({
      networkId: PropTypes.string,
    }),
    operative: PropTypes.bool,
    stationId: PropTypes.string,
    type: PropTypes.string,
    availableVehicles: PropTypes.shape({ total: PropTypes.number }),
    availableSpaces: PropTypes.shape({ total: PropTypes.number }),
  }).isRequired,
  currentTime: PropTypes.number,
  currentMode: PropTypes.string,
  relay: relayShape.isRequired,
};

VehicleRentalStationNearYou.defaultProps = {
  currentTime: undefined,
  currentMode: undefined,
};

const containerComponent = createRefetchContainer(
  VehicleRentalStationNearYou,
  {
    stop: graphql`
      fragment VehicleRentalStationNearYou_stop on VehicleRentalStation {
        stationId
        name
        availableVehicles {
          total
        }
        availableSpaces {
          total
        }
        capacity
        rentalNetwork {
          networkId
        }
        operative
      }
    `,
  },
  graphql`
    query VehicleRentalStationNearYouRefetchQuery($stopId: String!) {
      vehicleRentalStation(id: $stopId) {
        ...VehicleRentalStationNearYou_stop
      }
    }
  `,
);

export {
  containerComponent as default,
  VehicleRentalStationNearYou as Component,
};
