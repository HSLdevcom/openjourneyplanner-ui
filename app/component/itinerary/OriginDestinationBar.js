import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { matchShape, routerShape } from 'found';
import connectToStores from 'fluxible-addons-react/connectToStores';
import DTAutosuggestPanel from '@digitransit-component/digitransit-component-autosuggest-panel';
import {
  configShape,
  locationStateShape,
  locationShape,
} from '../../util/shapes';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import {
  withSearchContext,
  getLocationSearchTargets,
} from '../WithSearchContext';
import {
  setIntermediatePlaces,
  updateItinerarySearch,
  onLocationPopup,
} from '../../util/queryUtils';
import { getIntermediatePlaces, locationToOTP } from '../../util/otpStrings';
import { setViaPoints } from '../../action/ViaPointActions';
import { LightenDarkenColor } from '../../util/colorUtils';
import { getRefPoint } from '../../util/apiUtils';

const DTAutosuggestPanelWithSearchContext =
  withSearchContext(DTAutosuggestPanel);

class OriginDestinationBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    origin: locationShape.isRequired,
    destination: locationShape.isRequired,
    language: PropTypes.string,
    isMobile: PropTypes.bool,
    showFavourites: PropTypes.bool.isRequired,
    viaPoints: PropTypes.arrayOf(locationShape),
    locationState: locationStateShape.isRequired,
    modeSet: PropTypes.string,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
    router: routerShape.isRequired,
    getStore: PropTypes.func.isRequired,
    executeAction: PropTypes.func.isRequired,
    match: matchShape.isRequired,
    config: configShape.isRequired,
  };

  static defaultProps = {
    className: undefined,
    language: 'fi',
    isMobile: false,
    viaPoints: [],
    modeSet: undefined,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const viaPoints = getIntermediatePlaces(this.context.match.location.query);
    this.context.executeAction(setViaPoints, viaPoints);
    this.mounted = true;
  }

  updateViaPoints = newViaPoints => {
    // fixes the bug that DTPanel starts excecuting updateViaPoints before this component is even mounted
    if (this.mounted) {
      const p = newViaPoints.filter(vp => vp.lat && vp.address);
      this.context.executeAction(setViaPoints, p);
      setIntermediatePlaces(
        this.context.router,
        this.context.match,
        p.map(locationToOTP),
      );
    }
  };

  swapEndpoints = () => {
    const { location } = this.context.match;
    const intermediatePlaces = getIntermediatePlaces(location.query);
    if (intermediatePlaces.length > 1) {
      location.query.intermediatePlaces.reverse();
    }
    updateItinerarySearch(
      this.props.destination,
      this.props.origin,
      this.context.router,
      location,
      this.context.executeAction,
    );
  };

  onLocationSelect = (item, id) => {
    let action;
    if (id === parseInt(id, 10)) {
      // id = via point index
      // item == { ...gtfsId: 'HSL:1000004' }
      action = 'EditJourneyViaPoint';
      const points = [...this.props.viaPoints];
      points[id] = { ...item };
      this.updateViaPoints(points);
    } else {
      action =
        id === 'origin' ? 'EditJourneyStartPoint' : 'EditJourneyEndPoint';
      onLocationPopup(
        item,
        id,
        this.context.router,
        this.context.match,
        this.context.executeAction,
      );
    }
    addAnalyticsEvent({
      action,
      category: 'ItinerarySettings',
      name: item.type,
    });
  };

  render() {
    const { props, context } = this;
    const { config } = context;
    const refPoint = getRefPoint(
      props.origin,
      props.destination,
      props.locationState,
    );
    const filter = config.stopSearchFilter
      ? results => results.filter(config.stopSearchFilter)
      : undefined;
    return (
      <div
        className={cx(
          'origin-destination-bar',
          props.className,
          'flex-horizontal',
        )}
      >
        <DTAutosuggestPanelWithSearchContext
          appElement="#app"
          origin={props.origin}
          destination={props.destination}
          refPoint={refPoint}
          originPlaceHolder="search-origin-index"
          destinationPlaceHolder="search-destination-index"
          viaPoints={props.viaPoints}
          updateViaPoints={this.updateViaPoints}
          addAnalyticsEvent={addAnalyticsEvent}
          swapOrder={this.swapEndpoints}
          selectHandler={this.onLocationSelect}
          sources={[
            'History',
            'Datasource',
            props.showFavourites ? 'Favourite' : '',
          ]}
          targets={getLocationSearchTargets(config, props.isMobile)}
          lang={props.language}
          disableAutoFocus={props.isMobile}
          isMobile={props.isMobile}
          itineraryParams={context.match.location.query}
          color={config.colors.primary}
          hoverColor={
            config.colors.hover ||
            LightenDarkenColor(config.colors.primary, -20)
          }
          modeSet={props.modeSet}
          onFocusChange={() => {}}
          showSwapControl
          showViapointControl={config.viaPointsEnabled}
          filterResults={filter}
        />
      </div>
    );
  }
}

const connectedComponent = connectToStores(
  OriginDestinationBar,
  ['PreferencesStore', 'FavouriteStore', 'ViaPointStore', 'PositionStore'],
  ({ getStore }) => ({
    language: getStore('PreferencesStore').getLanguage(),
    showFavourites: getStore('FavouriteStore').getStatus() === 'has-data',
    viaPoints: getStore('ViaPointStore').getViaPoints(),
    locationState: getStore('PositionStore').getLocationState(),
  }),
);

export { connectedComponent as default, OriginDestinationBar as Component };
