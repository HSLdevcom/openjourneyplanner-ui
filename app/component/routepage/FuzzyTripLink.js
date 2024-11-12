import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { QueryRenderer, graphql } from 'react-relay';
import Link from 'found/Link';
import cx from 'classnames';
import ReactRelayContext from 'react-relay/lib/ReactRelayContext';
import { intlShape } from 'react-intl';
import VehicleIcon from '../VehicleIcon';
import TripLinkWithScroll from './TripLinkWithScroll';
import { PREFIX_ROUTES, PREFIX_STOPS } from '../../util/path';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import { vehicleShape, tripShape } from '../../util/shapes';

function FuzzyTripLink({ vehicle, stopName, nextStopName, ...rest }, context) {
  const { environment } = useContext(ReactRelayContext);
  const icon = (
    <VehicleIcon
      className={cx(rest.mode, 'tail-icon')}
      mode={rest.mode}
      rotate={180}
      vehicleNumber={vehicle.shortName}
      useLargeIcon
      color={vehicle.color}
    />
  );
  return (
    <QueryRenderer
      query={graphql`
        query FuzzyTripLinkQuery(
          $route: String!
          $direction: Int!
          $time: Int!
          $date: String!
        ) {
          trip: fuzzyTrip(
            route: $route
            direction: $direction
            time: $time
            date: $date
          ) {
            gtfsId
            tripShortName
            pattern {
              code
            }
            route {
              gtfsId
            }
          }
        }
      `}
      variables={{
        route: vehicle.route,
        direction: vehicle.direction,
        date: vehicle.operatingDay,
        time:
          vehicle.tripStartTime.substring(0, 2) * 60 * 60 +
          vehicle.tripStartTime.substring(2, 4) * 60,
      }}
      environment={environment}
      render={({ props }) => {
        if (!props?.trip) {
          return <span className="route-now-content">{icon}</span>;
        }
        if (rest.setHumanScrolling) {
          return (
            <TripLinkWithScroll
              {...rest}
              stopName={stopName}
              nextStopName={nextStopName}
              tripId={props.trip.gtfsId}
            />
          );
        }

        const route = props.trip.route.gtfsId;
        const pattern = props.trip.pattern.code;
        const trip = props.trip.gtfsId;
        const { mode } = vehicle;
        const { shortName } = vehicle;
        const localizedMode = context.intl.formatMessage({
          id: `${mode}`,
          defaultMessage: `${mode}`,
        });
        const ariaMessage = !(rest.vehicleState === 'arrived')
          ? context.intl.formatMessage(
              {
                id: 'route-page-vehicle-position-between',
                defaultMessage:
                  '{mode} {shortName} is between {stopName} and {nextStopName}',
              },
              {
                stopName,
                nextStopName,
                mode: localizedMode,
                shortName: shortName?.toLowerCase(),
              },
            )
          : context.intl.formatMessage(
              {
                id: 'route-page-vehicle-position',
                defaultMessage: '{mode} {shortName} is at {stopName}',
              },
              {
                stopName,
                mode: localizedMode,
                shortName: shortName?.toLowerCase(),
              },
            );

        return (
          <Link
            to={`/${PREFIX_ROUTES}/${route}/${PREFIX_STOPS}/${pattern}/${trip}`}
            className="route-now-content"
            onClick={() => {
              addAnalyticsEvent({
                category: 'Route',
                action: 'OpenTripInformation',
                name: vehicle.mode.toUpperCase(),
              });
            }}
            aria-label={ariaMessage}
          >
            {icon}
          </Link>
        );
      }}
    />
  );
}

FuzzyTripLink.propTypes = {
  trip: tripShape,
  vehicle: vehicleShape.isRequired,
  stopName: PropTypes.string.isRequired,
  nextStopName: PropTypes.string,
};

FuzzyTripLink.defaultProps = {
  trip: undefined,
  nextStopName: undefined,
};

FuzzyTripLink.contextTypes = {
  intl: intlShape.isRequired,
};

export default FuzzyTripLink;
