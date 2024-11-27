import PropTypes from 'prop-types';
import React from 'react';
import { routerShape } from 'found';
import { pure } from 'recompose';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import { filterSearchResultsByMode } from '@digitransit-search-util/digitransit-search-util-query-utils';
import { configShape } from '../../util/shapes';
import { withSearchContext } from '../WithSearchContext';
import { getStopRoutePath } from '../../util/path';

const DTAutoSuggestWithSearchContext = withSearchContext(DTAutoSuggest);
const searchSources = ['Favourite', 'History', 'Datasource'];

function StopsNearYouSearch(
  { mode, breakpoint, lang, originLocation },
  { router, config },
) {
  const isMobile = breakpoint !== 'large';
  const transportMode = `route-${mode}`;

  const filter = config.stopSearchFilter
    ? (results, transportmode, type) =>
        filterSearchResultsByMode(results, transportmode, type).filter(
          config.stopSearchFilter,
        )
    : filterSearchResultsByMode;
  const selectHandler = item => {
    router.push(getStopRoutePath(item));
  };
  return (
    <div className="stops-near-you-search-container">
      <div className="search-container-first">
        <DTAutoSuggestWithSearchContext
          icon="search"
          id="stop-route-station"
          lang={lang}
          refPoint={originLocation}
          className="destination"
          placeholder={`stop-near-you-${mode.toLowerCase()}`}
          transportMode={transportMode}
          geocodingSize={40}
          value=""
          filterResults={filter}
          sources={searchSources}
          targets={
            mode === 'CITYBIKE'
              ? ['VehicleRentalStations']
              : ['Stops', 'Stations', 'Routes']
          }
          isMobile={isMobile}
          selectHandler={selectHandler} // prop for context handler
          getAutoSuggestIcons={config.getAutoSuggestIcons}
          modeIconColors={config.colors.iconColors}
          modeSet={config.iconModeSet}
        />
      </div>
    </div>
  );
}

StopsNearYouSearch.propTypes = {
  mode: PropTypes.string.isRequired,
  breakpoint: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  originLocation: PropTypes.shape({
    address: PropTypes.string,
    lat: PropTypes.number,
    lon: PropTypes.number,
  }),
};

StopsNearYouSearch.defaultProps = {
  originLocation: {},
};

StopsNearYouSearch.contextTypes = {
  router: routerShape.isRequired,
  config: configShape.isRequired,
};

export default pure(StopsNearYouSearch);
