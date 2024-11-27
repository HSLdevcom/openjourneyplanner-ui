import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';
import DTAutosuggest from '@digitransit-component/digitransit-component-autosuggest';
import { configShape } from '../util/shapes';
import EmbeddedSearch from './EmbeddedSearch';
import { EMBEDDED_SEARCH_PATH } from '../util/path';
import { getRefPoint } from '../util/apiUtils';
import withBreakpoint from '../util/withBreakpoint';
import {
  withSearchContext,
  getLocationSearchTargets,
} from './WithSearchContext';
import { isBrowser } from '../util/browser';

const LocationSearch = withSearchContext(DTAutosuggest, true);

const sources = ['Favourite', 'History', 'Datasource'];

const languages = [
  { id: 'fi', name: 'finnish', defaultMessage: 'Finnish' },
  { id: 'sv', name: 'swedish', defaultMessage: 'Swedish' },
  { id: 'en', name: 'english', defaultMessage: 'English' },
  { id: 'pl', name: 'polish', defaultMessage: 'Polish' },
];

const EmbeddedSearchGenerator = (props, context) => {
  if (!isBrowser) {
    return false;
  }
  const { breakpoint, lang } = props;
  const { config, intl } = context;
  const { colors, fontWeights } = config;
  const MIN_WIDTH = 360;
  const MAX_WIDTH = 640;

  const [searchLang, setSearchLang] = useState('fi');
  const [searchWidth, setSearchWidth] = useState(360);
  const [searchModeRestriction, setSearchModeRestriction] = useState('');

  const [chooseFreely, setChooseFreely] = useState(true);
  const [searchOriginDefined, setSearchOriginDefined] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState();
  const [searchDestinationDefined, setSearchDestinationDefined] =
    useState(false);
  const [searchDestination, setSearchDestination] = useState();

  const originIsCurrentLocation = () =>
    searchOrigin?.type === 'CurrentLocation';
  const destinationIsCurrentLocation = () =>
    searchDestination?.type === 'CurrentLocation';

  const beforePreview = useRef();
  const afterPreview = useRef();

  const refPoint = getRefPoint(searchOrigin, searchDestination, {});

  const value = location => {
    return (
      location?.address ||
      location?.name ||
      (location?.gps && intl.formatMessage({ id: 'own-position' })) ||
      ''
    );
  };

  const onSelectLocation = (item, id) => {
    if (id === 'origin') {
      setSearchOrigin(item);
    } else {
      setSearchDestination(item);
    }
  };

  const searchProps = {
    appElement: '#app',
    icon: 'mapMarker',
    autoFocus: true,
    refPoint,
    lang,
    sources,
    targets: getLocationSearchTargets(config, false),
    isMobile: breakpoint !== 'large',
    color: colors.primary,
    hoverColor: colors.hover,
    fontWeights,
    modeSet: config.iconModeSet,
    modeIconColors: config.colors.modeIconColors,
    selectHandler: onSelectLocation,
    getAutoSuggestIcons: context.config.getAutoSuggestIcons,
  };

  const generateComponent = () => {
    let locData = {};
    if (searchOriginDefined) {
      if (originIsCurrentLocation()) {
        locData = { ...locData, originLoc: true };
      } else {
        locData = {
          ...locData,
          lon1: searchOrigin?.lon,
          lat1: searchOrigin?.lat,
          address1: value(searchOrigin),
        };
      }
    }
    if (searchDestinationDefined) {
      if (destinationIsCurrentLocation()) {
        locData = { ...locData, destinationLoc: true };
      } else {
        locData = {
          ...locData,
          lon2: searchDestination?.lon,
          lat2: searchDestination?.lat,
          address2: value(searchDestination),
        };
      }
    }
    const mode = {};
    mode[searchModeRestriction.substring(0, searchModeRestriction.length - 2)] =
      'true';
    const searchMatch = {
      location: { query: { ...mode, ...locData, lang: searchLang } },
    };
    return <EmbeddedSearch match={searchMatch} />;
  };

  const generateComponentString = () => {
    const currentURL = window.location.origin;
    let iframeHTML = `<iframe width="${searchWidth}" height="250" style="border-radius: 10px;" src="${currentURL}${EMBEDDED_SEARCH_PATH}?${searchModeRestriction}&lang=${searchLang}`;
    if (!chooseFreely) {
      if (searchOriginDefined && searchOrigin) {
        if (originIsCurrentLocation()) {
          iframeHTML += '&originLoc=1';
        } else {
          iframeHTML += `&address1=${value(searchOrigin)}&lon1=${
            searchOrigin?.lon
          }&lat1=${searchOrigin?.lat}`;
        }
      }
      if (searchDestinationDefined && searchDestination) {
        if (destinationIsCurrentLocation()) {
          iframeHTML += '&destinationLoc=1';
        } else {
          iframeHTML += `&address2=${value(searchDestination)}&lon2=${
            searchDestination?.lon
          }&lat2=${searchDestination?.lat}`;
        }
      }
    }

    iframeHTML += `" title="Digitransit UI embedded search" scrolling="no"></iframe>`;
    return iframeHTML;
  };

  const handleLangChange = event => {
    if (event.target.value) {
      setSearchLang(event.target.value);
    }
  };

  const hanldeWidthChange = val => {
    setSearchWidth(Number(val));
  };

  const hanldeWidthOnBlur = val => {
    if (val < MIN_WIDTH) {
      setSearchWidth(MIN_WIDTH);
    }
    if (val > MAX_WIDTH) {
      setSearchWidth(MAX_WIDTH);
    }
  };

  return (
    <section id="mainContent" className="content">
      <div
        className={`embedded-search-generator ${
          breakpoint !== 'large' ? 'mobile' : ''
        }`}
      >
        <h1 id="embed-form-heading">{config.embeddedSearch.title[lang]}</h1>
        <p>{config.embeddedSearch.infoText[lang]}</p>
        <form onSubmit={event => event.preventDefault()} action="">
          <h2>
            <FormattedMessage
              id="embedded-search.form-heading"
              defaultMessage="Embedded search settings"
            />
          </h2>

          <fieldset id="lang">
            <legend>
              <h3>
                <FormattedMessage
                  id="embedded-search.choose-language"
                  defaultMessage="Search language"
                />
              </h3>
            </legend>

            {languages
              .filter(({ id }) => config.availableLanguages.includes(id))
              .map(language => (
                <label key={language.id} htmlFor={`lang-${language.id}`}>
                  <input
                    type="radio"
                    value={language.id}
                    name="lang"
                    id={`lang-${language.id}`}
                    onChange={event => handleLangChange(event)}
                    checked={searchLang === language.id}
                  />
                  <FormattedMessage
                    id={language.name}
                    defaultMessage={language.defaultMessage}
                  />
                </label>
              ))}
          </fieldset>

          <fieldset id="width">
            <legend>
              <h3>
                <FormattedMessage
                  id="embedded-search.choose-width-component"
                  defaultMessage="Width of the component"
                />
                ({MIN_WIDTH} - {MAX_WIDTH} px)
              </h3>
            </legend>

            <label htmlFor="embedded-search-width">
              <input
                type="number"
                value={searchWidth}
                name="embedded-search-width"
                id="embedded-search-width"
                min={MIN_WIDTH}
                max={MAX_WIDTH}
                onChange={event => {
                  hanldeWidthChange(event.target.value);
                }}
                onBlur={event => {
                  hanldeWidthOnBlur(event.target.value);
                }}
              />
              <span> px x 250px</span>
            </label>
          </fieldset>

          <fieldset id="mode-restrictions">
            <legend>
              <h3>
                <FormattedMessage
                  id="embedded-search.choose-mode"
                  defaultMessage="Mode of transport"
                />
              </h3>
            </legend>

            <label htmlFor="mode-all">
              <input
                type="radio"
                value=""
                name="mode"
                id="mode-all"
                onChange={event => setSearchModeRestriction(event.target.value)}
                checked={searchModeRestriction === ''}
              />
              <FormattedMessage id="all" defaultMessage="All" />
            </label>

            <label htmlFor="mode-bike">
              <input
                type="radio"
                value="bikeOnly=1"
                name="mode"
                id="mode-bike"
                onChange={event => setSearchModeRestriction(event.target.value)}
                checked={searchModeRestriction === 'bikeOnly=1'}
              />
              <FormattedMessage id="bike-only" defaultMessage="Bike only" />
            </label>

            <label htmlFor="mode-walk">
              <input
                type="radio"
                value="walkOnly=1"
                name="mode"
                id="mode-walk"
                onChange={event => setSearchModeRestriction(event.target.value)}
                checked={searchModeRestriction === 'walkOnly=1'}
              />
              <FormattedMessage id="walk-only" defaultMessage="Walk only" />
            </label>
          </fieldset>

          <fieldset id="origin-and-destination">
            <legend>
              <h3>
                <FormattedMessage
                  id="origin-and-destination"
                  defaultMessage="Origin and destination"
                />
              </h3>
            </legend>

            <label htmlFor="choose-freely">
              <input
                type="checkbox"
                value="1"
                name="origin-and-destination"
                id="choose-freely"
                onChange={() => {
                  if (!chooseFreely) {
                    setSearchOriginDefined(false);
                    setSearchDestinationDefined(false);
                    setChooseFreely(!chooseFreely);
                  }
                }}
                checked={chooseFreely}
              />
              <FormattedMessage
                id="choose-freely"
                defaultMessage="Choose freely"
              />
            </label>

            <label htmlFor="origin">
              <input
                type="checkbox"
                value="1"
                name="origin-and-destination"
                id="origin"
                onChange={() => {
                  if (!searchOriginDefined) {
                    setChooseFreely(false);
                  }
                  if (!searchDestinationDefined && searchOriginDefined) {
                    setChooseFreely(true);
                  }
                  setSearchOriginDefined(!searchOriginDefined);
                }}
                checked={searchOriginDefined}
              />
              <FormattedMessage
                id="origin-defined"
                defaultMessage="Origin defined"
              />
            </label>
            {searchOriginDefined && (
              <div className="location-search-wrapper">
                <LocationSearch
                  id="origin"
                  placeholder="search-origin-index"
                  className="origin-search"
                  value={value(searchOrigin)}
                  onClear={() => setSearchOrigin(undefined)}
                  {...searchProps}
                />
              </div>
            )}

            <label htmlFor="destination">
              <input
                type="checkbox"
                value="1"
                name="origin-and-destination"
                id="destination"
                onChange={() => {
                  if (!searchDestinationDefined) {
                    setChooseFreely(false);
                  }
                  if (searchDestinationDefined && !searchOriginDefined) {
                    setChooseFreely(true);
                  }
                  setSearchDestinationDefined(!searchDestinationDefined);
                }}
                ref={beforePreview}
                checked={searchDestinationDefined}
              />
              <FormattedMessage
                id="destination-defined"
                defaultMessage="Destination defined"
              />
            </label>
            {searchDestinationDefined && (
              <div className="location-search-wrapper">
                <LocationSearch
                  id="destination"
                  placeholder="search-destination-index"
                  className="destination-search"
                  value={value(searchDestination)}
                  onClear={() => setSearchDestination(undefined)}
                  {...searchProps}
                />
              </div>
            )}
          </fieldset>

          <div
            className="embed-preview"
            onFocus={e => {
              e.preventDefault();
              afterPreview.current?.focus();
            }}
          >
            <h3>
              <FormattedMessage id="preview" defaultMessage="Preview" />
            </h3>
            <div
              className="embedded-search-container"
              id="embedded-search-container-id"
              style={{
                height: 250,
                width: searchWidth,
                minWidth: MIN_WIDTH,
                maxWidth: MAX_WIDTH,
              }}
              disabled="disabled"
              readOnly="readonly"
              aria-disabled
              aria-hidden
              tabIndex="-1"
            >
              {generateComponent()}
            </div>
          </div>

          <div>
            <h3>
              <FormattedMessage id="copy-code" defaultMessage="Copy code" />
            </h3>

            <label htmlFor="code" className="code-label">
              <p>HTML</p>
              <textarea
                id="code"
                name="code"
                rows="5"
                cols="50"
                value={generateComponentString()}
                readOnly
                ref={afterPreview}
                onKeyDown={e => {
                  if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    beforePreview.current?.focus();
                  }
                }}
              />
            </label>
          </div>
        </form>
        {config.embeddedSearch?.cookieLink && (
          <p>
            <a
              href={config.embeddedSearch.cookieLink[lang].url}
              target="_blank"
              rel="noreferrer"
            >
              {config.embeddedSearch.cookieLink[lang].text}
            </a>
          </p>
        )}
      </div>
    </section>
  );
};

EmbeddedSearchGenerator.propTypes = {
  breakpoint: PropTypes.string,
  lang: PropTypes.string.isRequired,
};

EmbeddedSearchGenerator.defaultProps = { breakpoint: undefined };

EmbeddedSearchGenerator.contextTypes = {
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

export default connectToStores(
  withBreakpoint(EmbeddedSearchGenerator),
  ['PreferencesStore'],
  context => ({
    lang: context.getStore('PreferencesStore').getLanguage(),
  }),
);
