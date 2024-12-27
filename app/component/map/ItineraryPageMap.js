/* eslint-disable react/no-array-index-key */
import { matchShape, routerShape } from 'found';
import PropTypes from 'prop-types';
import React from 'react';
import { onLocationPopup } from '../../util/queryUtils';
import {
  configShape,
  itineraryShape,
  locationShape,
  planEdgeShape,
} from '../../util/shapes';
import BackButton from '../BackButton';
import CookieSettingsButton from '../CookieSettingsButton';
import ItineraryLine from './ItineraryLine';
import LocationMarker from './LocationMarker';
import MapWithTracking from './MapWithTracking';
import VehicleMarkerContainer from './VehicleMarkerContainer';

const POINT_FOCUS_ZOOM = 17; // default

function ItineraryPageMap(
  {
    planEdges,
    active,
    showActiveOnly,
    from,
    to,
    viaPoints,
    breakpoint,
    showVehicles,
    topics,
    showDurationBubble,
    itinerary,
    showBackButton,
    isLocationPopupEnabled,
    ...rest
  },
  { match, router, executeAction, config },
) {
  const { hash } = match.params;
  const leafletObjs = [];

  if (showVehicles) {
    leafletObjs.push(
      <VehicleMarkerContainer key="vehicles" useLargeIcon topics={topics} />,
    );
  }

  if (itinerary) {
    leafletObjs.push(
      <ItineraryLine
        key={`line_${active}`}
        hash={active}
        streetMode={hash}
        legs={itinerary.legs}
        showTransferLabels={showActiveOnly}
        showIntermediateStops
        showDurationBubble={showDurationBubble}
      />,
    );
  } else {
    if (!showActiveOnly) {
      planEdges.forEach((edge, i) => {
        if (i !== active) {
          leafletObjs.push(
            <ItineraryLine
              key={`line_${i}`}
              hash={i}
              legs={edge.node.legs}
              passive
            />,
          );
        }
      });
    }
    if (active < planEdges.length) {
      leafletObjs.push(
        <ItineraryLine
          key={`line_${active}`}
          hash={active}
          streetMode={hash}
          legs={planEdges[active].node.legs}
          showTransferLabels={showActiveOnly}
          showIntermediateStops
          showDurationBubble={showDurationBubble}
        />,
      );
    }
  }

  if (from.lat && from.lon) {
    leafletObjs.push(
      <LocationMarker key="fromMarker" position={from} type="from" />,
    );
  }
  if (to.lat && to.lon) {
    leafletObjs.push(<LocationMarker key="toMarker" position={to} type="to" />);
  }
  viaPoints.forEach((via, i) => {
    leafletObjs.push(<LocationMarker key={`via_${i}`} position={via} />);
  });

  let locationPopup = 'none';
  let onSelectLocation;

  if (isLocationPopupEnabled) {
    // max 5 viapoints
    locationPopup =
      config.viaPointsEnabled && viaPoints.length < 5
        ? 'all'
        : 'origindestination';
    onSelectLocation = (item, id) =>
      onLocationPopup(item, id, router, match, executeAction);
  }

  return (
    <MapWithTracking
      leafletObjs={leafletObjs}
      locationPopup={locationPopup}
      onSelectLocation={onSelectLocation}
      zoom={POINT_FOCUS_ZOOM}
      {...rest}
    >
      {showBackButton && breakpoint !== 'large' && (
        <BackButton
          icon="icon-icon_arrow-collapse--left"
          iconClassName="arrow-icon"
          fallback="pop"
        />
      )}

      {breakpoint === 'large' && config.useCookiesPrompt && (
        <CookieSettingsButton />
      )}
    </MapWithTracking>
  );
}

ItineraryPageMap.propTypes = {
  planEdges: PropTypes.arrayOf(planEdgeShape).isRequired,
  topics: PropTypes.arrayOf(
    PropTypes.shape({
      feedId: PropTypes.string.isRequired,
      mode: PropTypes.string,
      direction: PropTypes.number,
    }),
  ),
  active: PropTypes.number.isRequired,
  showActiveOnly: PropTypes.bool,
  breakpoint: PropTypes.string.isRequired,
  showVehicles: PropTypes.bool,
  from: locationShape.isRequired,
  to: locationShape.isRequired,
  viaPoints: PropTypes.arrayOf(locationShape).isRequired,
  showDurationBubble: PropTypes.bool,
  itinerary: itineraryShape,
  showBackButton: PropTypes.bool,
  isLocationPopupEnabled: PropTypes.bool,
};

ItineraryPageMap.defaultProps = {
  topics: undefined,
  showActiveOnly: false,
  showVehicles: false,
  showDurationBubble: false,
  itinerary: undefined,
  showBackButton: true,
  isLocationPopupEnabled: false,
};

ItineraryPageMap.contextTypes = {
  match: matchShape.isRequired,
  router: routerShape.isRequired,
  config: configShape,
  executeAction: PropTypes.func.isRequired,
};

export default ItineraryPageMap;
