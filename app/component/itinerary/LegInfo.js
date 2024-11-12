import React, { useState } from 'react';
import cx from 'classnames';
import Link from 'found/Link';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import Modal from '@hsl-fi/modal';
import { legShape, configShape } from '../../util/shapes';
import { legTimeStr } from '../../util/legUtils';
import { getRouteMode } from '../../util/modeUtils';
import RouteNumber from '../RouteNumber';
import { PREFIX_ROUTES, PREFIX_STOPS } from '../../util/path';
import { getCapacityForLeg } from '../../util/occupancyUtil';
import Icon from '../Icon';
import CapacityModal from '../CapacityModal';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
export default function LegInfo(
  {
    leg,
    hasNoShortName,
    headsign,
    alertSeverityLevel,
    isAlternativeLeg,
    displayTime,
    changeHash,
    tabIndex,
    isCallAgency,
  },
  { config, intl },
) {
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const { constantOperationRoutes } = config;
  const shouldLinkToTrip =
    !constantOperationRoutes || !constantOperationRoutes[leg.route.gtfsId];
  const mode = isCallAgency
    ? 'call'
    : getRouteMode(
        { mode: leg.mode, type: leg.route.type, gtfsId: leg.route?.gtfsId },
        config,
      );
  const capacity = getCapacityForLeg(config, leg);
  let capacityTranslation;
  if (capacity) {
    capacityTranslation = capacity.toLowerCase().replaceAll('_', '-');
  }
  const startTime = legTimeStr(leg.start);

  return (
    <div
      className={cx('itinerary-transit-leg-route', {
        'long-name': hasNoShortName,
        'alternative-leg-suggestion': isAlternativeLeg,
      })}
    >
      <Link
        onClick={e => {
          e.stopPropagation();
        }}
        to={
          `/${PREFIX_ROUTES}/${leg.route.gtfsId}/${PREFIX_STOPS}/${
            leg.trip.pattern.code
          }${shouldLinkToTrip ? `/${leg.trip.gtfsId}` : ''}`
          // TODO: Create a helper function for generating links
        }
        aria-label={`${intl.formatMessage({
          id: mode.toLowerCase(),
          defaultMessage: 'Vehicle',
        })} ${leg.route && leg.route.shortName?.toLowerCase()}`}
      >
        <span aria-hidden="true">
          <RouteNumber
            mode={mode.toLowerCase()}
            alertSeverityLevel={alertSeverityLevel}
            color={leg.route ? `#${leg.route.color}` : 'currentColor'}
            text={leg.route && leg.route.shortName}
            realtime={false}
            withBar
            fadeLong
          />
        </span>
      </Link>
      <div className="headsign">{headsign}</div>
      {config.showTransitLegDistance && (
        <div className={cx({ 'distance-bold': config.emphasizeDistance })}>
          {(leg.distance / 1000).toFixed(1)} km
        </div>
      )}
      {capacity && (
        <button
          type="button"
          className="capacity-icon-container"
          onClick={() => setCapacityModalOpen(true)}
          aria-label={intl.formatMessage({
            id: capacityTranslation,
            defaultMessage: 'Capacity status',
          })}
        >
          <Icon
            width={1.75}
            height={1.75}
            img={`icon-icon_${capacity}`}
            color={config.colors.primary}
          />
        </button>
      )}
      {displayTime && (
        <>
          <span className="sr-only">
            {`${startTime} ${
              leg.realTime ? intl.formatMessage({ id: 'realtime' }) : ''
            }`}
          </span>
          <span
            className={cx('leg-departure-time', { realtime: leg.realTime })}
            aria-hidden="true"
          >
            {startTime}
          </span>
        </>
      )}
      <Modal
        appElement="#app"
        contentLabel="Capacity modal"
        closeButtonLabel="Close"
        variant="small"
        isOpen={capacityModalOpen}
        onCrossClick={() => {
          setCapacityModalOpen(false);
          if (changeHash) {
            setTimeout(() => {
              changeHash(tabIndex);
            }, 500);
          }
        }}
      >
        <CapacityModal config={config} />
      </Modal>
    </div>
  );
}

LegInfo.propTypes = {
  leg: legShape.isRequired,
  hasNoShortName: PropTypes.bool,
  headsign: PropTypes.string.isRequired,
  alertSeverityLevel: PropTypes.string,
  isAlternativeLeg: PropTypes.bool.isRequired,
  displayTime: PropTypes.bool.isRequired,
  changeHash: PropTypes.func,
  tabIndex: PropTypes.number,
  isCallAgency: PropTypes.bool,
};

LegInfo.defaultProps = {
  changeHash: undefined,
  tabIndex: undefined,
  alertSeverityLevel: undefined,
  hasNoShortName: undefined,
  isCallAgency: false,
};

LegInfo.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};
