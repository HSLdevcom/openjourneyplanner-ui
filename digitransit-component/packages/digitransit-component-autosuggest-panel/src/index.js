/* eslint-disable import/no-extraneous-dependencies */
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { ReactSortable } from 'react-sortablejs';
import i18next from 'i18next';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import Icon from '@digitransit-component/digitransit-component-icon';
import isEmpty from 'lodash/isEmpty';
import Select from './helpers/Select';
import translations from './helpers/translations';
import styles from './helpers/styles.scss';

i18next.init({
  lng: 'fi',
  fallbackLng: 'fi',
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

export const getEmptyViaPointPlaceHolder = () => ({});

const isViaPointEmpty = viaPoint => {
  if (viaPoint === undefined || isEmpty(viaPoint)) {
    return true;
  }
  const keys = Object.keys(viaPoint);
  return (
    keys.length === 1 || (keys.length === 2 && keys.includes('locationSlack'))
  );
};

const ItinerarySearchControl = ({
  children,
  className,
  enabled,
  onClick,
  onKeyPress,
  wide,
  ...rest
}) => (
  <div
    className={styles['itinerary-search-control']}
    style={{ '--width': wide ? '47px' : '40px' }}
  >
    {onClick && enabled && (
      <div
        {...rest}
        className={className}
        onClick={onClick}
        onKeyPress={onKeyPress}
        role="button"
        tabIndex="0"
      >
        {children}
      </div>
    )}
  </div>
);

const getSlackDisplay = slackInSeconds => {
  return `${slackInSeconds / 60} ${i18next.t('minute-short')}`;
};

const updateViaPointSlack = (
  activeViaPointSlacks,
  updatedViaPointIndex,
  viaPointRemoved = false,
) => {
  const foundAtIndex = activeViaPointSlacks.indexOf(updatedViaPointIndex);
  if (foundAtIndex > -1) {
    activeViaPointSlacks.splice(foundAtIndex, 1);
  }
  return viaPointRemoved
    ? activeViaPointSlacks.map(value =>
        value > updatedViaPointIndex ? value - 1 : value,
      )
    : activeViaPointSlacks;
};

const isKeyboardSelectionEvent = event => {
  const space = [13, ' ', 'Spacebar'];
  const enter = [32, 'Enter'];
  const key = (event && (event.key || event.which || event.keyCode)) || '';
  if (!key || !space.concat(enter).includes(key)) {
    return false;
  }
  event.preventDefault();
  return true;
};

const value = location =>
  (location && location.address) ||
  (location && location.gps && location.ready && 'Nykyinen sijainti') ||
  '';

const getLocationType = location =>
  location && location.gps === true ? 'position' : 'location';

const getSlackTimeOptions = () => {
  const timeOptions = [];
  for (let i = 0; i <= 9; i++) {
    const valueInMinutes = i * 10;
    timeOptions.push({
      displayName: `${valueInMinutes} ${i18next.t('minute-short')}`,
      value: valueInMinutes * 60,
    });
  }
  return timeOptions;
};

ItinerarySearchControl.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string.isRequired,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  wide: PropTypes.bool,
};

ItinerarySearchControl.defaultProps = {
  children: undefined,
  wide: false,
};

/**
 * Panel that renders two DTAutosuggest search fields, including viapoint handling
 *
 * @example
 * const searchContext = {
 *   isPeliasLocationAware: false // true / false does Let Pelias suggest based on current user location
 *   minimalRegexp: undefined // used for testing min. regexp. For example: new RegExp('.{2,}'),
 *   lineRegexp: undefined //  identify searches for route numbers/labels: bus | train | metro. For example: new RegExp(
 *    //   '(^[0-9]+[a-z]?$|^[yuleapinkrtdz]$|(^m[12]?b?$))',
 *    //  'i',
 *    //  ),
 *   URL_PELIAS: '' // url for pelias searches
 *   feedIDs: ['HSL', 'HSLLautta'] // FeedId's like  [HSL, HSLLautta]
 *   geocodingSources: ['oa','osm','nlsfi']  // sources for geocoding
 *   geocodingSearchParams; {}  // Searchparmas fro geocoding
 *   getFavouriteLocations: () => ({}),    // Function that returns array of favourite locations.
 *   getFavouriteStops: () => ({}),        // Function that returns array of favourite stops.
 *   getLanguage: () => ({}),              // Function that returns current language.
 *   getFavouriteRoutes: () => ({}),       // Function that returns array of favourite routes.
 *   getPositions: () => ({}),             // Function that returns user's geolocation.
 *   getRoutesQuery: () => ({}),           // Function that returns query for fetching routes.
 *   getStopAndStationsQuery: () => ({}),  // Function that fetches favourite stops and stations from graphql API.
 *   getFavouriteRoutesQuery: () => ({}),  // Function that returns query for fetching favourite routes.
 *   getFavouriteVehicleRentalStations: () => ({}),  // Function that returns favourite bike rental station.
 *   getFavouriteVehicleRentalStationsQuery: () => ({}), // Function that returns query for fetching favourite bike rental stations.
 *   startLocationWatch: () => ({}),       // Function that locates users geolocation.
 *   saveSearch: () => ({}),               // Function that saves search to old searches store.
 *   clearOldSearches: () => ({}),         // Function that clears old searches store.
 *   getFutureRoutes: () => ({}),          // Function that return future routes
 *   saveFutureRoute: () => ({}),          // Function that saves a future route
 *   clearFutureRoutes: () => ({}),        // Function that clears future routes
 * };
 *
 * const origin = {
 *  lat: 60.169196,
 *  lon: 24.957674,
 *  address: 'Aleksanterinkatu, Helsinki',
 *  set: true,
 *  ready: true,
 * }
 *
 * const destination = {
 *   lat: 60.199093,
 *   lon: 24.940536,
 *   address: 'Opastinsilta 6, Helsinki',
 *   set: true,
 *   ready: true,
 * }
 * onSelect(item, id) {
 *  return null;  // Define what to do when a suggestion is being selected. None by default.
 *  }
 * onClear(id) {
 *  return null;  // Define what to do when a suggestion is being selected. None by default.
 * }
 * const getAutoSuggestIcons: {
 *   // Called for every city bike station rendered as a search suggestion. Should return the icon and
 *   // color used for that station. Two icons are available, 'citybike-stop-digitransit' anditybike-stop-digitransit-secondary'.
 *   citybikes: station => {
 *      return ['citybike-stop-digitransit', '#f2b62d'];
 *   }
 * }
 * const targets = ['Locations', 'Stops', 'Routes']; // Defines what you are searching. all available options are Locations, Stops, Routes, VehicleRentalStations, FutureRoutes, MapPosition and CurrentPosition. Leave empty to search all targets.
 * const sources = ['Favourite', 'History', 'Datasource'] // Defines where you are searching. all available are: Favourite, History (previously searched searches), and Datasource. Leave empty to use all sources.
 * <DTAutosuggestPanel
 *    appElement={appElement} // Required. Root element's id. Needed for react-modal component.
 *    origin={origin} // Selected origin point
 *    destination={destination} // Selected destination point
 *    originPlaceHolder={'Give origin'} // Optional Give string shown initially inside origin search field
 *    destinationPlaceHolder={'Give destination'} // Optional Give string shown initally inside destination search field
 *    initialViaPoints={[]} // Optional.  If showViapointControl is set to true, pass initial via points to the panel. Currently no default implementation is given.
 *    updateViaPoints={() => return []} // Optional. If showViapointControl is set to true, define how to update your via point list with this function. Currenlty no default implementation is given.
 *    swapOrder={() => return null} // Optional. If showSwapControl is set to true, define how to swap order of your points (origin, destination, viapoints). Currently no default implementation is given.
 *    searchContext={searchContext}
 *    getAutoSuggestIcons={getAutoSuggestIcons}
 *    onSelect={this.onSelect}
 *    onClear={this.onClear}
 *    lang="fi" // Define language fi sv or en.
 *    addAnalyticsEvent={null} // Optional. you can record an analytics event if you wish. if passed, component will pass an category, action, name parameters to addAnalyticsEvent
 *    disableAutoFocus={false} // Optional. use this to disable autofocus completely from DTAutosuggestPanel
 *    sources={sources}
 *    targets={targets}
 *    isMobile  // Optional. Defaults to false. Whether to use mobile search.
 *    originMobileLabel="Origin label" // Optional. Custom label text for origin field on mobile.
 *    destinationMobileLabel="Destination label" // Optional. Custom label text for destination field on mobile.
 *    handleFocusChange={() => {}} // Optional. If defined overrides default onFocusChange behaviour
 *    showSwapControl={false} // Optional.
 *    showViapointControl={false} // Optional.
 */

const locationShape = PropTypes.shape({
  address: PropTypes.string,
  lat: PropTypes.number,
  lon: PropTypes.number,
  locationSlack: PropTypes.number,
});

class DTAutosuggestPanel extends React.Component {
  static propTypes = {
    appElement: PropTypes.string.isRequired,
    origin: locationShape,
    destination: locationShape,
    originPlaceHolder: PropTypes.string,
    destinationPlaceHolder: PropTypes.string,
    viaPoints: PropTypes.arrayOf(locationShape),
    updateViaPoints: PropTypes.func,
    handleViaPointLocationSelected: PropTypes.func,
    swapOrder: PropTypes.func,
    searchPanelText: PropTypes.string,
    searchContext: PropTypes.shape({
      URL_PELIAS: PropTypes.string,
    }).isRequired,
    onSelect: PropTypes.func.isRequired,
    onClear: PropTypes.func,
    addAnalyticsEvent: PropTypes.func,
    lang: PropTypes.string,
    disableAutoFocus: PropTypes.bool,
    sources: PropTypes.arrayOf(PropTypes.string),
    targets: PropTypes.arrayOf(PropTypes.string),
    filterResults: PropTypes.func,
    isMobile: PropTypes.bool,
    color: PropTypes.string,
    hoverColor: PropTypes.string,
    originMobileLabel: PropTypes.string,
    destinationMobileLabel: PropTypes.string,
    refPoint: locationShape,
    modeSet: PropTypes.string,
    modeIconColors: PropTypes.objectOf(PropTypes.string),
    getAutoSuggestIcons: PropTypes.objectOf(PropTypes.func),
    fontWeights: PropTypes.shape({
      medium: PropTypes.number,
    }),
    showScroll: PropTypes.bool,
    onFocusChange: PropTypes.func,
    isEmbedded: PropTypes.bool,
    showSwapControl: PropTypes.bool,
    showViapointControl: PropTypes.bool,
    showSlackControl: PropTypes.bool,
  };

  static defaultProps = {
    origin: undefined,
    destination: undefined,
    viaPoints: [],
    originPlaceHolder: 'give-origin',
    destinationPlaceHolder: 'give-destination',
    swapOrder: undefined,
    updateViaPoints: () => {},
    lang: 'fi',
    searchPanelText: undefined,
    sources: [],
    targets: [],
    filterResults: undefined,
    onClear: undefined,
    getAutoSuggestIcons: undefined,
    refPoint: undefined,
    addAnalyticsEvent: undefined,
    disableAutoFocus: false,
    isMobile: false,
    handleViaPointLocationSelected: undefined,
    color: '#007ac9',
    hoverColor: '#0062a1',
    originMobileLabel: null,
    destinationMobileLabel: null,
    modeSet: undefined,
    modeIconColors: undefined,
    fontWeights: {
      medium: 500,
    },
    showScroll: false,
    onFocusChange: undefined,
    isEmbedded: false,
    showSwapControl: false,
    showViapointControl: false,
    showSlackControl: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      activeSlackInputs: [],
      refs: [],
    };
    Object.keys(translations).forEach(lang => {
      i18next.addResourceBundle(lang, 'translation', translations[lang]);
    });
  }

  componentDidMount() {
    i18next.changeLanguage(this.props.lang);
  }

  componentDidUpdate() {
    if (i18next.language !== this.props.lang) {
      i18next.changeLanguage(this.props.lang);
    }
  }

  storeReference = ref => {
    this.setState(prevState => ({ refs: [...prevState.refs, ref] }));
  };

  handleFocusChange = () => {
    const { destination } = this.props;
    if (!destination || !destination.lat) {
      this.state.refs[1].focus();
    }
  };

  updateViaPoints = viaPoints => {
    if (viaPoints.length === 0) {
      this.props.updateViaPoints([]);
      return;
    }
    this.props.updateViaPoints(viaPoints.filter(vp => !isViaPointEmpty(vp)));
  };

  handleToggleViaPointSlackClick = viaPointIndex => {
    const { activeSlackInputs } = this.state;
    this.setState({
      activeSlackInputs: activeSlackInputs.includes(viaPointIndex)
        ? updateViaPointSlack(activeSlackInputs, viaPointIndex)
        : activeSlackInputs.concat([viaPointIndex]),
    });
  };

  handleViaPointSlackTimeSelected = (slackTimeInSeconds, i) => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'EditViaPointStopDuration',
        category: 'ItinerarySettings',
        name: slackTimeInSeconds / 60,
      });
    }
    const { viaPoints } = this.props;
    viaPoints[i].locationSlack = Number.parseInt(slackTimeInSeconds, 10);
    this.updateViaPoints(viaPoints);
  };

  handleViaPointLocationSelected = (viaPointLocation, i) => {
    this.props.handleViaPointLocationSelected(viaPointLocation, i);
  };

  handleRemoveViaPointClick = viaPointIndex => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'RemoveJourneyViaPoint',
        category: 'ItinerarySettings',
        name: null,
      });
    }
    const { activeSlackInputs } = this.state;
    const { viaPoints } = this.props;
    viaPoints.splice(viaPointIndex, 1);
    this.setState(
      {
        activeSlackInputs: updateViaPointSlack(
          activeSlackInputs,
          viaPointIndex,
          true,
        ),
      },
      () => this.updateViaPoints(viaPoints),
    );
  };

  handleAddViaPointClick = () => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'AddJourneyViaPoint',
        category: 'ItinerarySettings',
        name: 'QuickSettingsButton',
      });
    }
    const { viaPoints } = this.props;
    viaPoints.push(getEmptyViaPointPlaceHolder());
    // We need to update the state so that placeHolder will show up in panel.
    // eslint-disable-next-line react/no-access-state-in-setstate
    this.setState(this.state);
  };

  handleSwapOrderClick = () => {
    if (this.props.addAnalyticsEvent) {
      this.props.addAnalyticsEvent({
        action: 'SwitchJourneyStartAndEndPointOrder',
        category: 'ItinerarySettings',
        name: null,
      });
    }
    const { viaPoints } = this.props;
    viaPoints.reverse();
    this.props.swapOrder();
  };

  render() {
    const {
      origin,
      searchPanelText,
      searchContext,
      disableAutoFocus,
      viaPoints,
      originMobileLabel,
      destinationMobileLabel,
      fontWeights,
      onFocusChange,
      showSwapControl,
      showViapointControl,
    } = this.props;
    const { activeSlackInputs } = this.state;
    const slackTime = getSlackTimeOptions();
    const defaultSlackTimeValue = 0;
    const getViaPointSlackTimeOrDefault = (
      viaPoint,
      defaultValue = defaultSlackTimeValue,
    ) => (viaPoint && viaPoint.locationSlack) || defaultValue;
    const isViaPointSlackTimeInputActive = index =>
      activeSlackInputs.includes(index);
    return (
      <div
        className={cx([
          styles['autosuggest-panel'],
          {
            small: this.props.isMobile,
          },
        ])}
        style={{
          '--color': `${this.props.color}`,
          '--font-weight-medium': fontWeights.medium,
        }}
      >
        {' '}
        {searchPanelText ? (
          <div>
            <h1 className={styles['autosuggest-searchpanel-text']}>
              {' '}
              {searchPanelText}
            </h1>
          </div>
        ) : null}
        <div className={styles['origin-input-container']}>
          <DTAutoSuggest
            appElement={this.props.appElement}
            icon="mapMarker"
            id="origin"
            autoFocus={
              disableAutoFocus === true
                ? false
                : !this.props.isMobile && !origin.lat
            }
            storeRef={this.storeReference}
            refPoint={this.props.refPoint}
            className={getLocationType(origin)}
            placeholder={this.props.originPlaceHolder}
            value={value(origin)}
            searchContext={searchContext}
            getAutoSuggestIcons={this.props.getAutoSuggestIcons}
            onSelect={this.props.onSelect}
            onClear={this.props.onClear}
            focusChange={onFocusChange || this.handleFocusChange}
            lang={this.props.lang}
            sources={this.props.sources}
            targets={this.props.targets}
            filterResults={this.props.filterResults}
            isMobile={this.props.isMobile}
            color={this.props.color}
            hoverColor={this.props.hoverColor}
            mobileLabel={originMobileLabel}
            fontWeights={this.props.fontWeights}
            modeSet={this.props.modeSet}
            modeIconColors={this.props.modeIconColors}
            showScroll={this.props.showScroll}
            isEmbedded={this.props.isEmbedded}
          />
          {(showSwapControl || showViapointControl) && (
            <ItinerarySearchControl
              className={styles.opposite}
              enabled={showSwapControl}
              onClick={() => this.handleSwapOrderClick()}
              onKeyPress={e =>
                isKeyboardSelectionEvent(e) && this.handleSwapOrderClick()
              }
              aria-label={i18next.t('swap-order-button-label')}
            >
              <Icon img="opposite" color={this.props.color} />
            </ItinerarySearchControl>
          )}
        </div>
        {viaPoints.length === 0 && (
          <div className={styles['rectangle-container']}>
            <div className={styles.rectangle} />
          </div>
        )}
        <ReactSortable
          className={styles['viapoints-container']}
          list={viaPoints}
          handle={`.${styles['viapoint-before']}`}
          animation={200}
          setList={items => {
            const newViaPoints = items.filter(vp => !isViaPointEmpty(vp));
            if (newViaPoints.length > 0) {
              this.props.updateViaPoints(newViaPoints);
            }
          }}
        >
          {viaPoints.map((o, i) => (
            <div
              className={cx(styles['viapoint-container'])}
              key={`viapoint-${i}`} // eslint-disable-line
            >
              <div className={styles['light-gray-background']}>
                <div className={styles.row}>
                  <div
                    className={styles['viapoint-before']}
                    style={{ cursor: 'move' }}
                  >
                    <Icon img="ellipsis" rotate={90} color={this.props.color} />
                  </div>
                  <div
                    className={cx(
                      `${styles['viapoint-input-container']} ${
                        styles[`viapoint-${i + 1}`]
                      }`,
                    )}
                  >
                    <DTAutoSuggest
                      appElement={this.props.appElement}
                      icon="mapMarker-via"
                      id="via-point"
                      ariaLabel={i18next.t('via-point-index', { index: i + 1 })}
                      autoFocus={
                        disableAutoFocus === true ? false : !this.props.isMobile
                      }
                      placeholder="via-point"
                      className="viapoint"
                      searchContext={searchContext}
                      refPoint={this.props.refPoint}
                      value={(o && o.address) || ''}
                      onSelect={this.props.onSelect}
                      onClear={this.props.onClear}
                      handleViaPoints={item =>
                        this.handleViaPointLocationSelected(item, i)
                      }
                      lang={this.props.lang}
                      sources={this.props.sources}
                      targets={['Stops', 'Stations']}
                      filterResults={this.props.filterResults}
                      getAutoSuggestIcons={this.props.getAutoSuggestIcons}
                      isMobile={this.props.isMobile}
                      color={this.props.color}
                      hoverColor={this.props.hoverColor}
                      fontWeights={this.props.fontWeights}
                      modeSet={this.props.modeSet}
                      modeIconColors={this.props.modeIconColors}
                      showScroll={this.props.showScroll}
                    />
                  </div>
                  {this.props.showSlackControl && (
                    <ItinerarySearchControl
                      className={styles['add-via-point-slack']}
                      enabled={this.props.showViapointControl}
                      onClick={() => this.handleToggleViaPointSlackClick(i)}
                      onKeyPress={e =>
                        isKeyboardSelectionEvent(e) &&
                        this.handleToggleViaPointSlackClick(i)
                      }
                      aria-label={i18next.t(
                        isViaPointSlackTimeInputActive(i)
                          ? 'add-via-duration-button-label-open'
                          : 'add-via-duration-button-label-close',
                        { index: i + 1 },
                      )}
                      wide
                    >
                      <Icon img="time" color={this.props.color} />
                    </ItinerarySearchControl>
                  )}
                </div>
                {!isViaPointSlackTimeInputActive(i) &&
                  viaPoints[i] &&
                  viaPoints[i].locationSlack > 0 && (
                    <span
                      className={styles['viapoint-slack-time']}
                    >{`${i18next.t('viapoint-slack-amount')}: ${getSlackDisplay(
                      viaPoints[i].locationSlack,
                    )}`}</span>
                  )}
                <div
                  className={cx(styles['input-viapoint-slack-container'], {
                    collapsed: !isViaPointSlackTimeInputActive(i),
                  })}
                >
                  <div className={styles['select-wrapper']}>
                    <Select
                      id={`viapoint-slack-${i}`}
                      label={i18next.t('viapoint-slack-amount')}
                      options={slackTime}
                      value={getViaPointSlackTimeOrDefault(viaPoints[i])}
                      getDisplay={getSlackDisplay}
                      viaPointIndex={i}
                      icon={
                        <span
                          className={`${styles['combobox-icon']} ${styles['time-input-icon']}`}
                        >
                          <Icon img="time" color={this.props.color} />
                        </span>
                      }
                      onSlackTimeSelected={this.handleViaPointSlackTimeSelected}
                    />
                  </div>
                </div>
              </div>
              <ItinerarySearchControl
                className={styles['remove-via-point']}
                enabled={this.props.showViapointControl}
                onClick={() => this.handleRemoveViaPointClick(i)}
                onKeyPress={e =>
                  isKeyboardSelectionEvent(e) &&
                  this.handleRemoveViaPointClick(i)
                }
                aria-label={i18next.t('remove-via-button-label', {
                  index: i + 1,
                })}
              >
                <Icon img="trash" color={this.props.color} />
              </ItinerarySearchControl>
            </div>
          ))}
        </ReactSortable>
        <div className={styles['destination-input-container']}>
          <DTAutoSuggest
            appElement={this.props.appElement}
            icon="mapMarker"
            id="destination"
            autoFocus={
              disableAutoFocus === true
                ? false
                : !this.props.isMobile && !Number.isNaN(origin.lat)
            }
            storeRef={this.storeReference}
            placeholder={this.props.destinationPlaceHolder}
            className={getLocationType(this.props.destination)}
            getAutoSuggestIcons={this.props.getAutoSuggestIcons}
            searchContext={searchContext}
            onSelect={this.props.onSelect}
            onClear={this.props.onClear}
            refPoint={this.props.refPoint}
            value={value(this.props.destination)}
            lang={this.props.lang}
            sources={this.props.sources}
            targets={this.props.targets}
            filterResults={this.props.filterResults}
            isMobile={this.props.isMobile}
            color={this.props.color}
            hoverColor={this.props.hoverColor}
            mobileLabel={destinationMobileLabel}
            fontWeights={this.props.fontWeights}
            modeSet={this.props.modeSet}
            modeIconColors={this.props.modeIconColors}
            showScroll={this.props.showScroll}
            isEmbedded={this.props.isEmbedded}
          />
          {(showSwapControl || showViapointControl) && (
            <ItinerarySearchControl
              className={cx(styles['add-via-point'], styles.more, {
                collapsed: viaPoints.length > 4,
              })}
              enabled={showViapointControl}
              onClick={() => this.handleAddViaPointClick()}
              onKeyPress={e =>
                isKeyboardSelectionEvent(e) && this.handleAddViaPointClick()
              }
              aria-label={i18next.t('add-via-button-label')}
            >
              <Icon
                img="viapoint"
                width={1.25}
                height={1.375}
                color={this.props.color}
              />
            </ItinerarySearchControl>
          )}
        </div>
      </div>
    );
  }
}

export default DTAutosuggestPanel;
