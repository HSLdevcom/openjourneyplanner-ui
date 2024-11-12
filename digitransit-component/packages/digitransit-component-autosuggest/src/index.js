/* eslint-disable import/no-extraneous-dependencies */
import PropTypes from 'prop-types';
import React from 'react';
import i18next from 'i18next';
import cx from 'classnames';
import Autosuggest from 'react-autosuggest';
import { executeSearch } from '@digitransit-search-util/digitransit-search-util-execute-search-immidiate';
import SuggestionItem from '@digitransit-component/digitransit-component-suggestion-item';
import {
  getNameLabel,
  getStopCode,
} from '@digitransit-search-util/digitransit-search-util-uniq-by-label';
import { getStopName } from '@digitransit-search-util/digitransit-search-util-helpers';
import getLabel from '@digitransit-search-util/digitransit-search-util-get-label';
import Icon from '@digitransit-component/digitransit-component-icon';
import moment from 'moment-timezone';
import 'moment/locale/fi';
import 'moment/locale/sv';
import 'moment/locale/de';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import translations from './helpers/translations';
import styles from './helpers/styles.scss';
import MobileSearch from './helpers/MobileSearch';
import withScrollLock from './helpers/withScrollLock';

moment.locale('en');

i18next.init({
  fallbackLng: 'fi',
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

const Loading = props => (
  <div className={styles['spinner-loader']}>
    {(props && props.children) || (
      <span className={styles['sr-only']}>{i18next.t('loading')}</span>
    )}
  </div>
);

Loading.propTypes = {
  children: PropTypes.node,
};

Loading.defaultProps = {
  children: undefined,
};

const getPlatform = addendum => {
  if (!addendum || !addendum.GTFS.platform) {
    return undefined;
  }
  const { modes, platform } = addendum.GTFS;
  const type =
    modes && modes[0] === 'RAIL' ? i18next.t('track') : i18next.t('platform');
  return [type, platform];
};

function getSuggestionContent(item) {
  if (item.type !== 'FutureRoute') {
    if (item.type === 'SelectFromMap') {
      return ['', i18next.t('select-from-map')];
    }
    if (item.type === 'CurrentLocation') {
      return ['', i18next.t('use-own-position')];
    }
    if (item.type === 'SelectFromOwnLocations') {
      return ['', i18next.t('select-from-own-locations')];
    }
    /* eslint-disable-next-line prefer-const */
    let [name, label] = getNameLabel(item.properties, true);
    let suggestionType;
    if (
      item.properties.layer.toLowerCase().includes('bikerental') ||
      item.properties.layer.toLowerCase().includes('bikestation')
    ) {
      suggestionType = i18next.t('vehiclerentalstation');
      const stopCode = item.properties.labelId;
      return [suggestionType, name, undefined, stopCode];
    }

    if (item.properties.layer === 'bikepark') {
      suggestionType = i18next.t('bikepark');
      return [suggestionType, name, undefined, undefined];
    }

    if (item.properties.layer === 'carpark') {
      suggestionType = i18next.t('carpark');
      return [suggestionType, name, undefined, undefined];
    }

    if (item.properties.mode) {
      suggestionType = i18next.t(
        item.properties.mode.toLowerCase().replace('favourite', ''),
      );
    } else {
      const layer = item.properties.layer
        .replace('route-', '')
        .toLowerCase()
        .replace('favourite', '');
      suggestionType = i18next.t(layer);
    }

    if (
      item.properties.id &&
      (item.properties.layer === 'stop' || item.properties.layer === 'station')
    ) {
      const stopCode = getStopCode(item.properties);
      const mode = item.properties.addendum?.GTFS.modes;
      const platform = getPlatform(item.properties.addendum);
      return [
        suggestionType,
        getStopName(name, stopCode),
        label,
        stopCode,
        mode,
        platform,
      ];
    }
    if (
      item.properties.layer === 'favouriteStop' ||
      item.properties.layer === 'favouriteStation'
    ) {
      const { address, code } = item.properties;
      const stoName = address ? getStopName(address.split(',')[0], code) : name;
      const platform = getPlatform(item.properties.addendum);
      return [suggestionType, stoName, label, code, undefined, platform];
    }
    return [suggestionType, name, label];
  }
  const { origin, destination } = item.properties;
  const tail1 = origin.locality ? `, ${origin.locality} foobar` : '';
  const tail2 = destination.locality ? `, ${destination.locality}` : '';
  const name1 = origin.name;
  const name2 = destination.name;
  return [
    i18next.t('future-route'),
    `${i18next.t('origin')} ${name1}${tail1} ${i18next.t(
      'destination',
    )} ${name2}${tail2}`,
    item.translatedText,
  ];
}

function translateFutureRouteSuggestionTime(item) {
  const time = moment.unix(item.properties.time);
  let str = item.properties.arriveBy
    ? i18next.t('arrival')
    : i18next.t('departure');
  if (time.isSame(moment(), 'day')) {
    str = `${str} ${i18next.t('today-at')}`;
  } else if (time.isSame(moment().add(1, 'day'), 'day')) {
    str = `${str} ${i18next.t('tomorrow-at')}`;
  } else {
    str = `${str} ${time.format('dd D.M.')}`;
  }
  str = `${str} ${moment(time).format('HH:mm')}`;
  return str;
}

const getSuggestionValue = suggestion => {
  if (
    suggestion.type === 'SelectFromOwnLocations' ||
    suggestion.type === 'back'
  ) {
    return '';
  }
  return getLabel(suggestion.properties);
};
/**
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
 * const lang = 'fi'; // en, fi or sv
 * const onSelect = (item, id) => {
 *    // Funtionality when user selects a suggesions. No default implementation is given.
 *    return null;
 * };
 * const onClear = id => {
 *    // Called  when user clicks the clear search string button. No default implementation.
 *    return null;
 * };
 * const getAutoSuggestIcons: {
 *   // Called for every city bike station rendered as a search suggestion. Should return the icon and
 *   // color used for that station. Two icons are available, 'citybike-stop-digitransit' anditybike-stop-digitransit-secondary'.
 *   citybikes: station => {
 *      return ['citybike-stop-digitransit', '#f2b62d'];
 *   }
 * }
 * const transportMode = undefined;
 * const placeholder = "stop-near-you";
 * const targets = ['Locations', 'Stops', 'Routes']; // Defines what you are searching. Options are Locations, Stops, Stations, Routes, VehicleRentalStations, FutureRoutes, MapPosition and CurrentPosition. Leave empty to search all targets.
 * const sources = ['Favourite', 'History', 'Datasource'] // Defines where you are searching. all available are: Favourite, History (previously searched searches) and Datasource. Leave empty to use all sources.
 * return (
 *  <DTAutosuggest
 *    appElement={appElement} // Required. Root element's id. Needed for react-modal component.
 *    searchContext={searchContext}
 *    icon="origin" // Optional String for icon that is shown left of searchfield. used with Icon library
 *    id="origin" // used for style props and info for component.
 *    placeholder={placeholder} // String that is showns initally in search field
 *    value="" // e.g. user typed string that is shown in search field
 *    onSelect={onSelect}
 *    onClear={onClear}
 *    autoFocus={false} // defines that should this field be automatically focused when page is loaded.
 *    lang={lang}
 *    getAutoSuggestIcons={getAutoSuggestIcons}
 *    transportMode={transportMode} // transportmode with which we filter the routes, e.g. route-BUS
 *    geocodingSize={10} // defines how many stops and stations to fetch from geocoding. Useful if you want to filter the results and still get a reasonable amount of suggestions.
 *    filterResults={results => return results} // Optional filtering function for routes and stops
 *    handelViaPoints={() => return null } // Optional Via point handling logic. This is currently managed with DTAutosuggestpanel by default, but if DTAutosuggest is used seperatelly own implementation must be provided.
 *    focusChange={() => return null} // When suggestion is selected, handle changing focus. This is currently managed with DTAutosuggestpanel by default, but if DTAutosuggest is used seperatelly own implementation must be provided.
 *    storeRef={() => return null} // Functionality to store refs. Currenlty managed with DTAutosuggestpanel by default, but if DTAutosuggest is used seperatelly own implementation must be provided.
 *    sources={sources}
 *    targets={targets}
 *    isMobile  // Optional. Defaults to false. Whether to use mobile search.
 *    mobileLabel="Custom label" // Optional. Custom label text for autosuggest field on mobile.
 *    inputClassName="" // Optional. Custom classname applied to the input element of the component for providing CSS styles.
 *    translatedPlaceholder= // Optional. Custon translated placeholder text for autosuggest field.
 */
class DTAutosuggest extends React.Component {
  static propTypes = {
    appElement: PropTypes.string.isRequired,
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    icon: PropTypes.string,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    translatedPlaceholder: PropTypes.string,
    value: PropTypes.string,
    searchContext: PropTypes.shape({
      URL_PELIAS: PropTypes.string,
      // eslint-disable-next-line
      context: PropTypes.object,
      clearOldSearches: PropTypes.func,
      clearFutureRoutes: PropTypes.func,
    }).isRequired,
    ariaLabel: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    transportMode: PropTypes.string,
    filterResults: PropTypes.func,
    geocodingSize: PropTypes.number,
    onClear: PropTypes.func,
    storeRef: PropTypes.func,
    handleViaPoints: PropTypes.func,
    focusChange: PropTypes.func,
    lang: PropTypes.string,
    sources: PropTypes.arrayOf(PropTypes.string),
    targets: PropTypes.arrayOf(PropTypes.string),
    isMobile: PropTypes.bool,
    color: PropTypes.string,
    hoverColor: PropTypes.string,
    accessiblePrimaryColor: PropTypes.string,
    timeZone: PropTypes.string,
    pathOpts: PropTypes.shape({
      routesPrefix: PropTypes.string,
      stopsPrefix: PropTypes.string,
    }),
    mobileLabel: PropTypes.string,
    lock: PropTypes.func.isRequired,
    unlock: PropTypes.func.isRequired,
    refPoint: PropTypes.shape({
      address: PropTypes.string,
      lat: PropTypes.number,
      lon: PropTypes.number,
    }),
    inputClassName: PropTypes.string,
    fontWeights: PropTypes.shape({
      medium: PropTypes.number,
    }),
    modeIconColors: PropTypes.objectOf(PropTypes.string),
    getAutoSuggestIcons: PropTypes.objectOf(PropTypes.func),
    required: PropTypes.bool,
    modeSet: PropTypes.string,
    showScroll: PropTypes.bool,
    isEmbedded: PropTypes.bool,
  };

  static defaultProps = {
    autoFocus: false,
    className: '',
    icon: undefined,
    value: '',
    transportMode: undefined,
    filterResults: undefined,
    onClear: undefined,
    lang: 'fi',
    storeRef: undefined,
    handleViaPoints: undefined,
    focusChange: undefined,
    getAutoSuggestIcons: undefined,
    sources: [],
    targets: undefined,
    isMobile: false,
    isEmbedded: false,
    geocodingSize: undefined,
    color: '#007ac9',
    hoverColor: '#0062a1',
    accessiblePrimaryColor: '#0074be',
    timeZone: 'Europe/Helsinki',
    pathOpts: {
      routesPrefix: 'linjat',
      stopsPrefix: 'pysakit',
    },
    ariaLabel: undefined,
    mobileLabel: undefined,
    inputClassName: '',
    translatedPlaceholder: undefined,
    fontWeights: {
      medium: 500,
    },
    modeIconColors: {
      'mode-bus': '#007ac9',
      'mode-rail': '#8c4799',
      'mode-tram': '#008151',
      'mode-metro': '#ed8c00',
      'mode-ferry': '#007A97',
      'mode-citybike': '#f2b62d',
      'mode-funicular': '#ff00ff',
    },
    required: false,
    modeSet: undefined,
    showScroll: false,
    refPoint: {},
  };

  constructor(props) {
    super(props);
    moment.tz.setDefault(props.timeZone);
    moment.locale(props.lang);

    this.state = {
      value: props.value,
      suggestions: [],
      editing: false,
      valid: true,
      renderMobileSearch: false,
      sources: props.sources,
      ownPlaces: false,
      typingTimer: null,
      typing: false,
      pendingSelection: null,
      suggestionIndex: 0,
      cleanExecuted: false,
      scrollY: 0,
    };
    Object.keys(translations).forEach(lang => {
      i18next.addResourceBundle(lang, 'translation', translations[lang]);
    });
  }

  // DT-4074: When a user's location is updated DTAutosuggest would re-render causing suggestion list to reset.
  // This will prevent it.
  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(nextState, this.state) || !isEqual(nextProps, this.props);
  }

  componentDidUpdate() {
    if (i18next.language !== this.props.lang) {
      i18next.changeLanguage(this.props.lang);
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    // wait until address is set or geolocationing fails
    if (nextProps.value !== this.state.value && !this.state.editing) {
      this.setState({
        value: nextProps.value,
      });
    }
  }

  onChange = (event, { newValue, method }) => {
    const newState = {
      value: this.fInput || newValue || '',
      renderMobileSearch: this.props.isMobile,
    };
    // Remove filled input value so it wont be reused unnecessary
    this.fInput = null;
    if (!this.state.editing) {
      newState.editing = true;
      this.setState(newState, () =>
        this.fetchFunction({ value: newValue || '' }),
      );
    } else if (method !== 'enter' || this.state.valid) {
      // test above drops unnecessary update
      // when user hits enter but search is unfinished
      if (this.state.typingTimer) {
        clearTimeout(this.state.typingTimer);
      }
      if (method === 'type') {
        // after timeout runs, aria alert will announce current selection
        const timer = setTimeout(() => {
          this.setState({ typing: false });
        }, 1000);
        newState.typingTimer = timer;
        newState.typing = true;
      }
      this.setState(newState);
    }
  };

  onBlur = () => {
    if (this.state.renderMobileSearch) {
      return;
    }
    if (this.state.editing) {
      this.input.focus();
    }
    this.setState({
      editing: false,
      renderMobileSearch: false,
      value: this.props.value,
    });
  };

  onSelected = (e, ref) => {
    if (this.state.valid) {
      if (ref.suggestion.type === 'SelectFromOwnLocations') {
        this.setState(
          {
            sources: ['Favourite', 'Back'],
            ownPlaces: true,
            pendingSelection: ref.suggestion.type,
            value: '',
          },
          () => {
            this.fetchFunction({ value: '' });
          },
        );
        return;
      }
      if (
        ref.suggestion.type === 'back' ||
        ref.suggestion.type === 'FutureRoute'
      ) {
        this.setState(
          {
            sources: this.props.sources,
            ownPlaces: false,
            pendingSelection: ref.suggestion.type,
            suggestionIndex: ref.suggestionIndex,
          },
          () => {
            this.fetchFunction({ value: '' });
          },
        );
        return;
      }
      this.selectionDone = true; // selection done, do not let upcoming keyboard events confuse the flow
      this.setState(
        {
          editing: false,
          value: ref.suggestionValue,
        },
        () => {
          this.input.blur();
          if (this.props.handleViaPoints) {
            this.props.handleViaPoints(ref.suggestion, ref.suggestionIndex);
          } else {
            this.props.onSelect(ref.suggestion, this.props.id);
          }
          this.setState(
            {
              renderMobileSearch: false,
              sources: this.props.sources,
              ownPlaces: false,
              suggestions: [],
            },
            () => {
              this.selectionDone = false;
            },
          );
          if (
            this.props.focusChange &&
            (!this.props.isMobile || this.props.isEmbedded)
          ) {
            this.props.focusChange();
          }
          if (this.props.isMobile) {
            this.closeMobileSearch();
          }
        },
      );
    } else {
      this.setState(
        prevState => ({
          pendingSelection: prevState.value,
        }),
        () => this.checkPendingSelection(), // search may finish during state change
      );
    }
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
      sources: this.props.sources,
      ownPlaces: false,
      editing: false,
    });
  };

  checkPendingSelection = () => {
    if (
      (this.state.pendingSelection === 'SelectFromOwnLocations' ||
        this.state.pendingSelection === 'back') &&
      this.state.valid
    ) {
      this.setState(
        {
          pendingSelection: null,
          editing: true,
        },
        () => {
          this.input.focus();
        },
      );
      // accept after all ongoing searches have finished
    } else if (this.state.pendingSelection && this.state.valid) {
      // finish the selection by picking first = best match or with 'FutureRoute' by suggestionIndex
      this.setState(
        {
          pendingSelection: null,
          editing: false,
        },
        () => {
          if (this.state.suggestions.length) {
            this.input.blur();
            this.props.onSelect(
              this.state.suggestions[this.state.suggestionIndex],
              this.props.id,
            );

            if (this.props.isMobile) {
              this.closeMobileSearch();
            }
            if (
              this.props.focusChange &&
              (!this.props.isMobile || this.props.isEmbedded)
            ) {
              this.props.focusChange();
            }
          }
        },
      );
    }
  };

  clearButton = () => {
    return (
      <button
        type="button"
        className={styles['clear-input']}
        onClick={this.clearInput}
        aria-label={i18next.t('clear-button-label')}
      >
        <Icon img="close" color={this.props.color} />
      </button>
    );
  };

  fetchFunction = ({ value, cleanExecuted }) => {
    return this.setState(
      { valid: false, cleanExecuted: !cleanExecuted ? false : cleanExecuted },
      () => {
        if (this.selectionDone) {
          // do not let component cast unnecessary requests
          return;
        }
        const { targets } = this.props;
        const useAll = isEmpty(targets);
        const isLocationSearch =
          isEmpty(targets) || targets.includes('Locations');
        let newTargets;
        if (this.state.ownPlaces) {
          newTargets = ['Locations'];
          if (useAll || targets.includes('Stops')) {
            newTargets.push('Stops');
          }
          if (useAll || targets.includes('Stations')) {
            newTargets.push('Stations');
          }
          if (useAll || targets.includes('VehicleRentalStations')) {
            newTargets.push('VehicleRentalStations');
          }
        } else if (!useAll) {
          newTargets = [...targets];
          // in desktop, favorites are accessed via sub search
          if (
            isLocationSearch &&
            !this.props.isMobile &&
            (isEmpty(this.props.sources) ||
              this.props.sources.includes('Favourite'))
          ) {
            newTargets.push('SelectFromOwnLocations');
          }
        }
        // remove  location favourites in desktop search (collection item replaces it in target array)
        const sources =
          this.state.sources &&
          this.state.sources.filter(
            s =>
              !(
                isLocationSearch &&
                s === 'Favourite' &&
                !this.state.ownPlaces &&
                !this.props.isMobile
              ),
          );

        executeSearch(
          newTargets,
          sources,
          this.props.transportMode,
          this.props.searchContext,
          this.props.filterResults,
          this.props.geocodingSize,
          {
            input: value || '',
          },
          searchResult => {
            if (searchResult == null) {
              return;
            }
            // XXX translates current location
            const suggestions = (searchResult.results || [])
              .filter(
                suggestion =>
                  suggestion.type !== 'FutureRoute' ||
                  (suggestion.type === 'FutureRoute' &&
                    suggestion.properties.time > moment().unix()),
              )
              .map(suggestion => {
                if (
                  suggestion.type === 'CurrentLocation' ||
                  suggestion.type === 'SelectFromMap' ||
                  suggestion.type === 'SelectFromOwnLocations' ||
                  suggestion.type === 'back'
                ) {
                  const translated = { ...suggestion };
                  translated.properties.labelId = i18next.t(
                    suggestion.properties.labelId,
                  );
                  return translated;
                }
                return suggestion;
              });
            if (
              value === this.state.value ||
              value === this.state.pendingSelection ||
              this.state.pendingSelection === 'SelectFromOwnLocations' ||
              this.state.pendingSelection === 'back' ||
              this.state.pendingSelection === 'FutureRoute'
            ) {
              this.setState(
                {
                  valid: true,
                  suggestions,
                },
                () => this.checkPendingSelection(),
              );
            }
          },
          this.props.pathOpts,
          this.props.refPoint,
        );
      },
    );
  };

  clearInput = () => {
    const newState = {
      editing: true,
      value: '',
      sources: this.props.sources,
      ownPlaces: false,
      renderMobileSearch: this.props.isMobile,
    };
    // must update suggestions
    this.setState(newState, () =>
      this.fetchFunction({ value: '', cleanExecuted: true }),
    );
    if (this.props.onClear) {
      this.props.onClear(this.props.id);
    }
    this.input.focus();
  };

  inputClicked = inputValue => {
    this.input.focus();
    this.clearLocationText();
    if (this.props.isMobile) {
      this.props.lock();
    }
    if (!this.state.editing) {
      const newState = {
        editing: true,
        // reset at start, just in case we missed something
        pendingSelection: null,
        renderMobileSearch: this.props.isMobile,
      };

      // DT-3263: added stateKeyDown
      const stateKeyDown = {
        editing: true,
        pendingSelection: null,
        value: inputValue,
      };

      if (!this.state.suggestions.length) {
        // DT-3263: added if-else statement
        if (typeof inputValue === 'object' || !inputValue) {
          this.setState(newState, () =>
            this.fetchFunction({ value: this.state.value }),
          );
        } else {
          this.setState(stateKeyDown, () =>
            this.fetchFunction({ value: inputValue }),
          );
        }
      } else {
        this.fetchFunction({ value: this.state.value });
        this.setState(newState);
      }
    } else if (this.props.isMobile && !this.state.renderMobileSearch) {
      this.setState({ renderMobileSearch: true });
    }
  };

  storeInputReference = autosuggest => {
    if (autosuggest !== null) {
      this.input = autosuggest.input;
      if (this.props.storeRef) {
        this.props.storeRef(autosuggest.input);
      }
    }
  };

  // Fill input when user clicks fill input button in street suggestion item
  fillInput = newValue => {
    this.fInput = newValue.properties.name;
    const newState = {
      editing: true,
      value: newValue.properties.name,
      checkPendingSelection: newValue,
      valid: true,
    };
    // must update suggestions
    this.setState(newState);
    this.fetchFunction({ value: newValue.properties.name });
    this.input.focus();
  };

  renderItem = item => {
    const newItem =
      item.type === 'FutureRoute'
        ? {
            ...item,
            translatedText: translateFutureRouteSuggestionTime(item),
          }
        : item;
    const content = getSuggestionContent(item);
    return (
      <SuggestionItem
        item={newItem}
        content={content}
        loading={!this.state.valid}
        isMobile={this.props.isMobile}
        ariaFavouriteString={i18next.t('favourite')}
        color={this.props.color}
        accessiblePrimaryColor={this.props.accessiblePrimaryColor}
        fillInput={this.fillInput}
        fontWeights={this.props.fontWeights}
        getAutoSuggestIcons={this.props.getAutoSuggestIcons}
        modeIconColors={this.props.modeIconColors}
        modeSet={this.props.modeSet}
      />
    );
  };

  closeMobileSearch = () => {
    this.props.unlock();
    this.setState(
      {
        renderMobileSearch: false,
        value: this.props.value,
      },
      () => {
        window.scrollTo(0, this.state.scrollY);
        this.onSuggestionsClearRequested();
      },
    );
  };

  keyDown = event => {
    if (this.selectionDone) {
      return;
    }
    const keyCode = event.key;
    if (keyCode === 'Escape') {
      this.setState({ editing: false });
    }
    if (this.state.editing) {
      if (keyCode === 'Enter' && this.state.value !== '') {
        this.setState({ pendingSelection: true }, () => {
          this.fetchFunction({ value: this.state.value });
        });
      }
      this.inputClicked();
      return;
    }

    if (
      (keyCode === 'Enter' || keyCode === 'ArrowDown') &&
      this.state.value === ''
    ) {
      this.clearInput();
      return;
    }

    if (keyCode === 'ArrowDown' && this.state.value !== '') {
      const newState = {
        editing: true,
        value: this.state.value,
      };
      // must update suggestions
      this.setState(newState, () =>
        this.fetchFunction({ value: this.state.value }),
      );
    }
    if (!this.state.editing) {
      this.setState({ editing: true });
    }

    if (keyCode === 'Tab') {
      this.onBlur();
    }
  };

  suggestionAsAriaContent = () => {
    let label = [];
    const firstSuggestion = this.state.suggestions[0];
    if (firstSuggestion) {
      if (firstSuggestion.type && firstSuggestion.type.includes('Favourite')) {
        label.push(i18next.t('favourite'));
      }
      label = label.concat(getSuggestionContent(this.state.suggestions[0]));
    }
    return [...new Set(label)].join(' - ');
  };

  clearOldSearches = () => {
    const { context, clearOldSearches, clearFutureRoutes } =
      this.props.searchContext;
    if (context && clearOldSearches) {
      clearOldSearches(context);
      if (clearFutureRoutes) {
        clearFutureRoutes(context);
      }
      this.fetchFunction({ value: this.state.value });
    }
  };

  isOriginDestinationOrViapoint = () =>
    this.props.id === 'origin' ||
    this.props.id === 'destination' ||
    this.props.id === 'via-point' ||
    this.props.id === 'origin-stop-near-you';

  clearLocationText = () => {
    const positions = [
      'Valittu sijainti',
      'Nykyinen sijaintisi',
      'Current position',
      'Selected location',
      'Vald position',
      'Använd min position',
      'Min position',
      'Käytä nykyistä sijaintia',
      'Use current location',
      'Your current location',
      'Wybrane miejsce',
    ];
    if (positions.includes(this.state.value)) {
      this.clearInput();
    }
  };

  onFocus = () => {
    this.clearLocationText();

    const scrollY = window.pageYOffset;
    return this.setState({ scrollY });
  };

  render() {
    if (i18next.language !== this.props.lang) {
      i18next.changeLanguage(this.props.lang);
    }
    const { value, suggestions, renderMobileSearch, cleanExecuted } =
      this.state;
    const inputProps = {
      placeholder: this.props.translatedPlaceholder
        ? this.props.translatedPlaceholder
        : i18next.t(this.props.placeholder),
      value,
      onChange: this.onChange,
      onBlur: this.onBlur,
      className: cx(
        `${styles.input} ${
          this.props.isMobile && this.props.transportMode ? styles.thin : ''
        } ${styles[this.props.id] || ''} ${
          this.state.value ? styles.hasValue : ''
        } ${this.props.inputClassName}`,
      ),
      onKeyDown: this.keyDown, // DT-3263
      required: this.props.required,
    };
    const ariaBarId = this.props.id.replace('searchfield-', '');
    let SearchBarId = this.props.ariaLabel || i18next.t(ariaBarId);
    SearchBarId = SearchBarId.replace('searchfield-', '').concat('.'); // Full stop makes screen reader speech clearer.
    const ariaRequiredText = this.props.required
      ? `${i18next.t('required')}.`
      : '';
    const ariaLabelInstructions = this.props.isMobile
      ? i18next.t('search-autosuggest-label-instructions-mobile')
      : i18next.t('search-autosuggest-label-instructions-desktop');
    const movingToDestinationFieldText =
      this.props.id === 'origin'
        ? i18next.t('search-autosuggest-label-move-to-destination')
        : '';
    const ariaLabelText = ariaLabelInstructions
      .concat(' ')
      .concat(movingToDestinationFieldText);

    const ariaSuggestionLen = i18next.t('search-autosuggest-len', {
      count: suggestions.length,
    });

    const ariaCurrentSuggestion = () => {
      if (this.suggestionAsAriaContent() || this.props.value) {
        return i18next.t('search-current-suggestion', {
          selection:
            this.suggestionAsAriaContent().toLowerCase() || this.props.value,
        });
      }
      return '';
    };

    return (
      <React.Fragment>
        <span className={styles['sr-only']} role="alert">
          {!this.state.typing &&
            this.state.editing &&
            `${ariaSuggestionLen} ${ariaCurrentSuggestion()}`}
        </span>
        {this.props.isMobile && (
          <MobileSearch
            searchOpen={renderMobileSearch}
            appElement={this.props.appElement}
            clearOldSearches={this.clearOldSearches}
            id={this.props.id}
            clearInput={this.clearInput}
            value={this.state.value}
            suggestions={[
              ...suggestions,
              {
                type: 'clear-search-history',
                labelId: i18next.t('clear-search-history'),
              },
            ]}
            inputProps={{
              ...inputProps,
              placeholder: this.isOriginDestinationOrViapoint()
                ? i18next.t('address-place-or-business')
                : inputProps.placeholder,
            }}
            fetchFunction={this.fetchFunction}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={getSuggestionValue}
            renderSuggestion={this.renderItem}
            closeHandle={this.closeMobileSearch}
            ariaLabel={ariaRequiredText
              .concat(' ')
              .concat(SearchBarId)
              .concat(' ')
              .concat(ariaCurrentSuggestion())}
            label={
              this.props.mobileLabel
                ? this.props.mobileLabel
                : i18next.t(this.props.id)
            }
            onSuggestionSelected={this.onSelected}
            dialogHeaderText={i18next.t('delete-old-searches-header')}
            dialogPrimaryButtonText={i18next.t('delete')}
            dialogSecondaryButtonText={i18next.t('cancel')}
            clearInputButtonText={i18next.t('clear-button-label')}
            focusInput={cleanExecuted}
            color={this.props.color}
            hoverColor={this.props.hoverColor}
            accessiblePrimaryColor={this.props.accessiblePrimaryColor}
            fontWeights={this.props.fontWeights}
            showScroll={this.props.showScroll}
          />
        )}
        {!renderMobileSearch && (
          <div
            className={cx([
              styles['autosuggest-input-container'],
              styles[this.props.id],
            ])}
            style={{
              '--color': `${this.props.color}`,
              '--hover-color': `${this.props.hoverColor}`,
            }}
          >
            {this.props.icon && (
              <div
                className={cx([
                  styles[`autosuggest-input-icon`],
                  styles[this.props.id],
                  this.props.inputClassName &&
                    `${this.props.inputClassName}-input-icon`,
                ])}
                aria-label={ariaRequiredText
                  .concat(' ')
                  .concat(SearchBarId)
                  .concat(' ')
                  .concat(i18next.t('search-autosuggest-label'))}
              >
                <Icon img={`${this.props.icon}`} />
              </div>
            )}
            <Autosuggest
              alwaysRenderSuggestions={this.state.editing}
              id={this.props.id}
              suggestions={suggestions}
              onSuggestionsFetchRequested={this.fetchFunction}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              getSuggestionValue={getSuggestionValue}
              renderSuggestion={this.renderItem}
              inputProps={{
                ...inputProps,
                onFocus: this.onFocus,
              }}
              focusInputOnSuggestionClick
              shouldRenderSuggestions={() => this.state.editing}
              highlightFirstSuggestion={!this.state.ownPlaces}
              theme={styles}
              renderInputComponent={p => (
                <>
                  <label className={styles['sr-only']} htmlFor={this.props.id}>
                    {ariaCurrentSuggestion()
                      .concat(' ')
                      .concat(ariaRequiredText)
                      .concat(' ')
                      .concat(SearchBarId)
                      .concat(' ')
                      .concat(ariaLabelText)}
                  </label>
                  <input
                    aria-label={ariaCurrentSuggestion()
                      .concat(' ')
                      .concat(ariaRequiredText)
                      .concat(' ')
                      .concat(SearchBarId)
                      .concat(' ')
                      .concat(ariaLabelText)}
                    id={this.props.id}
                    onClick={this.inputClicked}
                    onKeyDown={this.keyDown}
                    {...p}
                  />
                  {this.state.value && this.clearButton()}
                </>
              )}
              onSuggestionSelected={this.onSelected}
              ref={this.storeInputReference}
            />
          </div>
        )}
      </React.Fragment>
    );
  }
}

const DTAutosuggestWithScrollLock = withScrollLock(DTAutosuggest);

export default DTAutosuggestWithScrollLock;
