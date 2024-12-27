import PropTypes from 'prop-types';
import React from 'react';
import {
  graphql,
  createFragmentContainer,
  ReactRelayContext,
} from 'react-relay';
import { matchShape, routerShape } from 'found';
import getContext from 'recompose/getContext';
import { intlShape, FormattedMessage } from 'react-intl';
import { configShape, planEdgeShape } from '../../util/shapes';
import Icon from '../Icon';
import ItineraryList from './ItineraryList';
import { getItineraryPagePath, streetHash } from '../../util/path';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import { isIOS, isSafari } from '../../util/browser';
import ItineraryNotification from './ItineraryNotification';
import { transitEdges } from './ItineraryPageUtils';

function ItineraryListContainer(
  {
    planEdges,
    activeIndex,
    params,
    focusToHeader,
    onLater,
    onEarlier,
    settingsNotification,
    topNote,
    bottomNote,
    ...rest
  },
  { router, match, intl },
) {
  function getSubPath(fallback) {
    const modesWithSubpath = [
      streetHash.bikeAndVehicle,
      streetHash.parkAndRide,
      streetHash.carAndVehicle,
    ];
    const { hash } = params;
    if (modesWithSubpath.includes(hash)) {
      return `/${hash}/`;
    }
    return fallback;
  }

  const onSelectImmediately = index => {
    const subpath = getSubPath('/');
    // eslint-disable-next-line compat/compat
    const momentumScroll =
      document.getElementsByClassName('momentum-scroll')[0];
    if (momentumScroll) {
      momentumScroll.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }

    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'Itinerary',
      action: 'OpenItineraryDetails',
      name: index,
    });
    const newLocation = {
      ...match.location,
      state: { selectedItineraryIndex: index },
    };
    const basePath = `${getItineraryPagePath(
      params.from,
      params.to,
    )}${subpath}`;
    const indexPath = `${basePath}${index}`;

    newLocation.pathname = basePath;
    router.replace(newLocation);
    newLocation.pathname = indexPath;
    router.push(newLocation);
    focusToHeader();
  };

  const onSelectActive = index => {
    if (activeIndex === index) {
      onSelectImmediately(index);
    } else {
      router.replace({
        ...match.location,
        state: { selectedItineraryIndex: index },
      });

      addAnalyticsEvent({
        category: 'Itinerary',
        action: 'HighlightItinerary',
        name: index,
      });
    }
  };

  function laterButton(reversed) {
    return (
      <button
        type="button"
        aria-label={intl.formatMessage({
          id: 'set-time-later-button-label',
          defaultMessage: 'Set travel time to later',
        })}
        className={`time-navigation-btn ${
          reversed ? 'top-btn' : 'bottom-btn'
        } ${!reversed && isIOS && isSafari ? 'extra-whitespace' : ''} `}
        onClick={() => onLater()}
      >
        <Icon
          img="icon-icon_arrow-collapse"
          className={`cursor-pointer back ${reversed ? 'arrow-up' : ''}`}
        />
        <FormattedMessage
          id="later"
          defaultMessage="Later"
          className="time-navigation-text"
        />
      </button>
    );
  }

  function earlierButton(reversed = false) {
    return (
      <button
        type="button"
        aria-label={intl.formatMessage({
          id: 'set-time-earlier-button-label',
          defaultMessage: 'Set travel time to earlier',
        })}
        className={`time-navigation-btn ${
          reversed ? 'bottom-btn' : 'top-btn'
        } ${reversed && isIOS && isSafari ? 'extra-whitespace' : ''}`}
        onClick={() => onEarlier()}
      >
        <Icon
          img="icon-icon_arrow-collapse"
          className={`cursor-pointer ${reversed ? '' : 'arrow-up'}`}
        />
        <FormattedMessage
          id="earlier"
          defaultMessage="Earlier"
          className="time-navigation-text"
        />
      </button>
    );
  }

  function renderMoreButton(arriveBy, onTop) {
    if (onTop) {
      return arriveBy ? laterButton(true) : earlierButton();
    }
    return arriveBy ? earlierButton(true) : laterButton();
  }

  const { location } = match;
  const arriveBy = location.query.arriveBy === 'true';
  const showEarlierLaterButtons =
    transitEdges(planEdges).length > 0 && !match.params.hash;
  return (
    <div className="summary">
      <h2 className="sr-only">
        <FormattedMessage
          id="itinerary-summary-page.description"
          defaultMessage="Route suggestions"
        />
      </h2>
      {showEarlierLaterButtons && renderMoreButton(arriveBy, true)}
      {topNote && <ItineraryNotification bodyId={topNote} />}
      <ItineraryList
        planEdges={planEdges}
        activeIndex={activeIndex}
        onSelect={onSelectActive}
        onSelectImmediately={onSelectImmediately}
        {...rest}
      />
      {settingsNotification && (
        <ItineraryNotification
          headerId="settings-missing-itineraries-header"
          bodyId="settings-missing-itineraries-body"
          iconId="icon-icon_settings"
        />
      )}
      {bottomNote && <ItineraryNotification bodyId={bottomNote} />}
      {showEarlierLaterButtons && renderMoreButton(arriveBy, false)}
    </div>
  );
}

ItineraryListContainer.propTypes = {
  planEdges: PropTypes.arrayOf(planEdgeShape).isRequired,
  activeIndex: PropTypes.number.isRequired,
  params: PropTypes.shape({
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    hash: PropTypes.string,
    secondHash: PropTypes.string,
  }).isRequired,
  focusToHeader: PropTypes.func.isRequired,
  onLater: PropTypes.func.isRequired,
  onEarlier: PropTypes.func.isRequired,
  settingsNotification: PropTypes.bool,
  topNote: PropTypes.string,
  bottomNote: PropTypes.string,
};

ItineraryListContainer.defaultProps = {
  settingsNotification: false,
  topNote: undefined,
  bottomNote: undefined,
};

ItineraryListContainer.contextTypes = {
  router: routerShape.isRequired,
  match: matchShape.isRequired,
  intl: intlShape.isRequired,
};

const withConfig = getContext({
  config: configShape.isRequired,
})(props => (
  <ReactRelayContext.Consumer>
    {({ environment }) => (
      <ItineraryListContainer {...props} relayEnvironment={environment} />
    )}
  </ReactRelayContext.Consumer>
));

const connectedContainer = createFragmentContainer(withConfig, {
  planEdges: graphql`
    fragment ItineraryListContainer_planEdges on PlanEdge @relay(plural: true) {
      ...ItineraryList_planEdges
      node {
        legs {
          mode
        }
      }
    }
  `,
});

export { connectedContainer as default, ItineraryListContainer as Component };
