import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { AlertSeverityLevelType } from '../../constants';
import ServiceAlertIcon from '../ServiceAlertIcon';

export default function ItineraryListHeader({
  translationId,
  defaultMessage,
  showBikeBoardingInfo,
  showCarBoardingInfo,
}) {
  return (
    <div className="itinerary-summary-subtitle-container">
      <FormattedMessage id={translationId} defaultMessage={defaultMessage} />
      {showBikeBoardingInfo && (
        <div className="with-bike-info">
          <div className="with-bike-icon notification-icon">
            <ServiceAlertIcon
              className="inline-icon"
              color="#007AC9"
              severityLevel={AlertSeverityLevelType.Info}
            />
          </div>
          <div className="with-bike-info-notification">
            <FormattedMessage
              id="itinerary-summary.bike-boarding-information"
              defaultMessage=""
            />
          </div>
        </div>
      )}
      {showCarBoardingInfo && (
        <div className="with-car-info">
          <div className="with-car-icon notification-icon">
            <ServiceAlertIcon
              className="inline-icon"
              color="#007AC9"
              severityLevel={AlertSeverityLevelType.Info}
            />
          </div>
          <div className="with-car-info-notification">
            <FormattedMessage
              id="itinerary-summary.car-boarding-information"
              defaultMessage=""
            />
          </div>
        </div>
      )}
    </div>
  );
}

ItineraryListHeader.propTypes = {
  translationId: PropTypes.string.isRequired,
  defaultMessage: PropTypes.string,
  showBikeBoardingInfo: PropTypes.bool,
  showCarBoardingInfo: PropTypes.bool,
};

ItineraryListHeader.defaultProps = {
  defaultMessage: '',
  showBikeBoardingInfo: false,
  showCarBoardingInfo: false,
};
