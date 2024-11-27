import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from 'react-intl';
import { Link } from 'found';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Modal from '@hsl-fi/modal';
import { stopShape, configShape, relayShape } from '../../util/shapes';
import { hasEntitiesOfType } from '../../util/alertUtils';
import { PREFIX_STOPS, PREFIX_TERMINALS } from '../../util/path';
import { AlertEntityType } from '../../constants';
import StopNearYouHeader from './StopNearYouHeader';
import AlertBanner from '../AlertBanner';
import StopNearYouDepartureRowContainer from './StopNearYouDepartureRowContainer';
import CapacityModal from '../CapacityModal';

const StopNearYou = (
  { stop, desc, stopId, currentTime, currentMode, relay },
  { config, intl },
) => {
  if (!stop.stoptimesWithoutPatterns) {
    return null;
  }
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const stopMode = stop.stoptimesWithoutPatterns[0]?.trip.route.mode;
  useEffect(() => {
    let id = stop.gtfsId;
    if (stopId) {
      id = stopId;
    }
    if (currentMode === stopMode || !currentMode) {
      relay?.refetch(oldVariables => {
        return { ...oldVariables, stopId: id, startTime: currentTime };
      }, null);
    }
  }, [currentTime, currentMode]);
  const description = desc || stop.desc;
  const isStation = stop.locationType === 'STATION';
  const { gtfsId } = stop;
  const urlEncodedGtfsId = gtfsId.replace('/', '%2F');
  const linkAddress = isStation
    ? `/${PREFIX_TERMINALS}/${urlEncodedGtfsId}`
    : `/${PREFIX_STOPS}/${urlEncodedGtfsId}`;

  const { constantOperationStops } = config;
  const { locale } = intl;
  const isConstantOperation = constantOperationStops[stop.gtfsId];
  const filteredAlerts = stop.alerts.filter(alert =>
    hasEntitiesOfType(alert, AlertEntityType.Stop),
  );
  return (
    <span role="listitem">
      <div className="stop-near-you-container">
        <StopNearYouHeader
          stop={stop}
          desc={description}
          isStation={isStation}
          linkAddress={linkAddress}
        />
        <span className="sr-only">
          <FormattedMessage
            id="departure-list-update.sr-instructions"
            default="The departure list and estimated departure times will update in real time."
          />
        </span>
        {filteredAlerts.length > 0 && (
          <AlertBanner
            alerts={filteredAlerts}
            linkAddress={`${linkAddress}/hairiot`}
          />
        )}
        {isConstantOperation ? (
          <div className="stop-constant-operation-container bottom-margin">
            <div style={{ width: '85%' }}>
              <span>{constantOperationStops[stop.gtfsId][locale].text}</span>
              <span style={{ display: 'inline-block' }}>
                <a
                  href={constantOperationStops[stop.gtfsId][locale].link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {constantOperationStops[stop.gtfsId][locale].link}
                </a>
              </span>
            </div>
          </div>
        ) : (
          <>
            <StopNearYouDepartureRowContainer
              currentTime={currentTime}
              mode={stopMode}
              stopTimes={stop.stoptimesWithoutPatterns}
              isStation={isStation && stopMode !== 'SUBWAY'}
              setCapacityModalOpen={() => setCapacityModalOpen(true)}
            />
            <Link
              className="stop-near-you-more-departures"
              as="button"
              onClick={e => {
                e.stopPropagation();
              }}
              to={linkAddress}
            >
              <FormattedMessage
                id="more-departures"
                defaultMessage="More departures"
              />
            </Link>
          </>
        )}
      </div>
      <Modal
        appElement="#app"
        contentLabel="Capacity modal"
        closeButtonLabel="Close"
        variant="small"
        isOpen={capacityModalOpen}
        onCrossClick={() => setCapacityModalOpen(false)}
      >
        <CapacityModal config={config} />
      </Modal>
    </span>
  );
};

const connectedComponent = connectToStores(
  StopNearYou,
  ['TimeStore'],
  (context, props) => {
    return {
      ...props,
      currentTime: context.getStore('TimeStore').getCurrentTime(),
    };
  },
);

StopNearYou.propTypes = {
  stop: stopShape.isRequired,
  stopId: PropTypes.string,
  currentTime: PropTypes.number.isRequired,
  currentMode: PropTypes.string.isRequired,
  desc: PropTypes.string,
  relay: relayShape,
};

StopNearYou.defaultProps = {
  stopId: undefined,
  desc: undefined,
  relay: undefined,
};

StopNearYou.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

export default connectedComponent;
