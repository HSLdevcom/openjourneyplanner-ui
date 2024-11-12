import debounce from 'lodash/debounce';
import flatten from 'lodash/flatten';
import take from 'lodash/take';
import {
  sortSearchResults,
  isStop,
} from '@digitransit-search-util/digitransit-search-util-helpers';
import filterMatchingToInput from '@digitransit-search-util/digitransit-search-util-filter-matching-to-input';
import getGeocodingResults from '@digitransit-search-util/digitransit-search-util-get-geocoding-results';
import getJson from '@digitransit-search-util/digitransit-search-util-get-json';

function getStopsFromGeocoding(stops, URL_PELIAS_PLACE) {
  if (!stops || stops.length < 1) {
    return Promise.resolve([]);
  }
  let gids = '';
  const stopsWithGids = stops.map(stop => {
    const type = stop.type === 'stop' ? 'stop' : 'station';
    let gid = `gtfs${stop.gtfsId.split(':')[0].toLowerCase()}:${type}:GTFS:${
      stop.gtfsId
    }`;
    if (stop.code) {
      gid += `#${stop.code}`;
    }
    gids += `${gid},`;
    return { ...stop, gid };
  });
  const stopStationMap = stopsWithGids.reduce(function redu(
    map,
    stopOrStation,
  ) {
    // eslint-disable-next-line no-param-reassign
    map[stopOrStation.gid] = stopOrStation;
    return map;
  }, {});
  return getJson(URL_PELIAS_PLACE, {
    ids: gids.slice(0, -1),
    // lang: context.getStore('PreferencesStore').getLanguage(), TODO enable this when OTP supports translations
  }).then(res => {
    return res.features.map(stop => {
      const favourite = {
        type: 'FavouriteStop',
        properties: {
          addendum: stop.properties.addendum,
          gid: stopStationMap[stop.properties.gid].gid,
          code: stopStationMap[stop.properties.gid].code,
          gtfsId: stopStationMap[stop.properties.gid].gtfsId,
          lastUpdated: stopStationMap[stop.properties.gid].lastUpdated,
          favouriteId: stopStationMap[stop.properties.gid].favouriteId,
          address: stop.properties.label,
          layer: isStop(stop.properties) ? 'favouriteStop' : 'favouriteStation',
        },
        geometry: stop.geometry,
      };
      return favourite;
    });
  });
}
function filterFavouriteLocations(favourites, input) {
  return Promise.resolve(
    filterMatchingToInput(favourites, input, ['address', 'name']).map(item => ({
      type: 'FavouritePlace',
      properties: {
        ...item,
        label: item.name,
        layer: 'favouritePlace',
      },
      geometry: { type: 'Point', coordinates: [item.lon, item.lat] },
    })),
  );
}
function selectPositionFomMap(input) {
  if (typeof input !== 'string' || input.length === 0) {
    return Promise.resolve([
      {
        type: 'SelectFromMap',
        address: 'SelectFromMap',
        lat: null,
        lon: null,
        properties: {
          labelId: 'select-from-map',
          layer: 'selectFromMap',
          address: 'SelectFromMap',
          lat: null,
          lon: null,
        },
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      },
    ]);
  }
  return Promise.resolve([]);
}

function getCurrentPositionIfEmpty(input, position) {
  if (typeof input !== 'string' || input.length === 0) {
    return Promise.resolve([
      {
        type: 'CurrentLocation',
        address: position.address,
        lat: position.lat,
        lon: position.lon,
        properties: {
          labelId: 'use-own-position',
          layer: 'currentPosition',
          address: position.address,
          lat: position.lat,
          lon: position.lon,
        },
        geometry: {
          type: 'Point',
          coordinates: [position.lon, position.lat],
        },
      },
    ]);
  }

  return Promise.resolve([]);
}

function selectFromOwnLocations(input) {
  if (typeof input !== 'string' || input.length === 0) {
    return Promise.resolve([
      {
        type: 'SelectFromOwnLocations',
        address: 'SelectFromOwnLocations',
        lat: null,
        lon: null,
        properties: {
          labelId: 'select-from-own-locations',
          layer: 'ownLocations',
          address: 'selectFromOwnLocations',
          lat: null,
          lon: null,
        },
        geometry: {
          type: 'Point',
          coordinates: [],
        },
      },
    ]);
  }
  return Promise.resolve([]);
}

function getBackSuggestion() {
  return Promise.resolve([
    {
      type: 'back',
      address: 'back',
      lat: null,
      lon: null,
      properties: {
        labelId: 'back',
        layer: 'back',
        address: 'back',
        lat: null,
        lon: null,
      },
      geometry: {
        type: 'Point',
        coordinates: [],
      },
    },
  ]);
}

function filterFavouriteStops(stopsAndStations, input, useStops, useStations) {
  return stopsAndStations.then(stopsStations => {
    const candidates = stopsStations.filter(s =>
      s.type === 'stop' ? useStops : useStations,
    );
    return filterMatchingToInput(candidates, input, [
      'properties.name',
      'properties.name',
      'properties.address',
    ]);
  });
}

function filterOldSearches(oldSearches, input, dropLayers) {
  let matchingOldSearches = filterMatchingToInput(oldSearches, input, [
    'properties.name',
    'properties.label',
    'properties.address',
    'properties.shortName',
    'properties.longName',
  ]);
  if (dropLayers) {
    // don't want these
    matchingOldSearches = matchingOldSearches.filter(
      item => !dropLayers.includes(item.properties.layer),
    );
  }
  return Promise.resolve(
    take(matchingOldSearches, 10).map(item => {
      const newItem = {
        ...item,
        type: 'OldSearch',
        timetableClicked: false, // reset latest selection action
        arrowClicked: false,
      };
      delete newItem.properties.confidence;
      return newItem;
    }),
  );
}

function hasFavourites(searchContext) {
  const favouriteLocations = searchContext.getFavouriteLocations(
    searchContext.context,
  );
  if (favouriteLocations?.length > 0) {
    return true;
  }

  const favouriteVehicleRentalStations =
    searchContext.getFavouriteVehicleRentalStations(searchContext.context);
  if (favouriteVehicleRentalStations?.length > 0) {
    return true;
  }
  const favouriteStops = searchContext.getFavouriteStops(searchContext.context);
  return favouriteStops?.length > 0;
}

const routeLayers = [
  'route-TRAM',
  'route-BUS',
  'route-RAIL',
  'route-FERRY',
  'route-SUBWAY',
  'route-AIRPLANE',
  'route-FUNICULAR',
];
const locationLayers = ['venue', 'address', 'street'];
const parkingLayers = ['carpark', 'bikepark'];
const stopLayers = ['stop', 'station'];

/**
 * Executes the search
 *
 */
export function getSearchResults(
  targets,
  sources,
  transportMode,
  searchContext,
  filterResults,
  geocodingSize,
  { input },
  callback,
  pathOpts,
  refPoint,
) {
  const {
    getPositions,
    getFavouriteLocations,
    getOldSearches,
    getFavouriteStops,
    parkingAreaSources,
    getLanguage,
    getStopAndStationsQuery,
    getFavouriteVehicleRentalStationsQuery,
    getFavouriteVehicleRentalStations,
    getFavouriteRoutesQuery,
    getFavouriteRoutes,
    getRoutesQuery,
    context,
    isPeliasLocationAware: locationAware,
    minimalRegexp,
    lineRegexp,
    URL_PELIAS,
    URL_PELIAS_PLACE,
    feedIDs,
    geocodingSearchParams,
    geocodingSources,
    getFutureRoutes,
    cityBikeNetworks,
  } = searchContext;
  // if no targets are provided, search them all.
  const allTargets = !targets || targets.length === 0;
  // if no sources are provided, use them all.
  const allSources = !sources || sources.length === 0;
  const position = getPositions(context);
  const searchComponents = [];
  const searches = { type: 'all', term: input, results: [] };
  const language = getLanguage(context);
  const focusPoint =
    locationAware && refPoint?.lat && refPoint?.lon
      ? {
          // Round coordinates to approx 1 km, in order to improve caching
          'focus.point.lat': refPoint.lat.toFixed(3),
          'focus.point.lon': refPoint.lon.toFixed(3),
        }
      : {};
  const mode = transportMode ? transportMode.split('-')[1] : undefined;
  if (
    targets.includes('CurrentPosition') &&
    position.status !== 'geolocation-not-supported'
  ) {
    searchComponents.push(getCurrentPositionIfEmpty(input, position));
  }
  if (allTargets || targets.includes('MapPosition')) {
    searchComponents.push(selectPositionFomMap(input));
  }
  if (targets.includes('FutureRoutes')) {
    const items = getFutureRoutes(context);
    searchComponents.push(take(items, 3));
  }
  if (
    targets.includes('SelectFromOwnLocations') &&
    hasFavourites(searchContext)
  ) {
    searchComponents.push(selectFromOwnLocations(input));
  }
  if (allTargets || targets.includes('Locations')) {
    // eslint-disable-next-line prefer-destructuring
    const searchParams = geocodingSearchParams;
    if (sources.includes('Favourite')) {
      const favouriteLocations = getFavouriteLocations(context);
      searchComponents.push(
        filterFavouriteLocations(favouriteLocations, input),
      );
      if (sources.includes('Back')) {
        searchComponents.push(getBackSuggestion());
      }
    }

    if (allSources || sources.includes('Datasource')) {
      const geocodingLayers = ['venue', 'address', 'street'];
      if (targets.includes('Stations')) {
        geocodingLayers.push('station'); // search stations from OSM
      }
      searchComponents.push(
        getGeocodingResults(
          input,
          searchParams,
          language,
          focusPoint,
          geocodingSources.join(','),
          URL_PELIAS,
          minimalRegexp,
          geocodingLayers,
        ),
      );
    }
    if (allSources || sources.includes('History')) {
      const locationHistory = getOldSearches(context, 'endpoint');
      const dropLayers = ['bikestation'];
      dropLayers.push(...stopLayers);
      dropLayers.push(...routeLayers);
      dropLayers.push(...parkingLayers);
      searchComponents.push(
        filterOldSearches(locationHistory, input, dropLayers),
      );
    }
  }
  if (allTargets || targets.includes('ParkingAreas')) {
    if (allSources || sources.includes('Datasource')) {
      const searchParams = geocodingSearchParams;
      if (geocodingSize && geocodingSize !== 10) {
        searchParams.size = geocodingSize;
      }
      const geocodingLayers = ['carpark', 'bikepark'];
      const feedIds = parkingAreaSources ? parkingAreaSources.join(',') : null;
      searchComponents.push(
        getGeocodingResults(
          input,
          searchParams,
          language,
          focusPoint,
          feedIds,
          URL_PELIAS,
          minimalRegexp,
          geocodingLayers,
        ).then(results => {
          if (filterResults) {
            return filterResults(results, mode);
          }
          return results;
        }),
      );
    }
    if (allSources || sources.includes('History')) {
      const history = getOldSearches(context);
      const dropLayers = ['bikestation'];
      dropLayers.push(...stopLayers);
      dropLayers.push(...routeLayers);
      dropLayers.push(...locationLayers);
      searchComponents.push(filterOldSearches(history, input, dropLayers));
    }
  }

  const useStops = targets.includes('Stops');
  const useStations = targets.includes('Stations');

  if (allTargets || useStops || useStations) {
    if (sources.includes('Favourite')) {
      const favouriteStops = getFavouriteStops(context);
      let stopsAndStations;
      if (favouriteStops.every(stop => stop.type === 'station')) {
        stopsAndStations = getStopsFromGeocoding(
          favouriteStops,
          URL_PELIAS_PLACE,
        ).then(results => {
          if (filterResults) {
            return filterResults(results, mode);
          }
          return results;
        });
      } else {
        stopsAndStations = getStopAndStationsQuery(favouriteStops)
          .then(favourites =>
            getStopsFromGeocoding(favourites, URL_PELIAS_PLACE),
          )
          .then(results => {
            if (filterResults) {
              return filterResults(results, mode);
            }
            return results;
          });
      }
      searchComponents.push(
        filterFavouriteStops(stopsAndStations, input, useStops, useStations),
      );
    }
    if (allSources || sources.includes('Datasource')) {
      const geocodingLayers = [];
      if (useStops) {
        geocodingLayers.push('stop');
      }
      if (useStations) {
        geocodingLayers.push('station');
      }
      const searchParams =
        geocodingSize && geocodingSize !== 10 ? { size: geocodingSize } : {};
      if (geocodingSearchParams && geocodingSearchParams['boundary.country']) {
        searchParams['boundary.country'] =
          geocodingSearchParams['boundary.country'];
      }
      // a little hack: when searching location data, automatically dedupe stops
      // this could be a new explicit prop
      if (allTargets || targets.includes('Locations')) {
        searchParams.dedupestops = 1;
      }
      const feeds = feedIDs.map(v => `gtfs${v}`).join(',');
      searchComponents.push(
        getGeocodingResults(
          input,
          searchParams,
          language,
          focusPoint,
          feeds,
          URL_PELIAS,
          minimalRegexp,
          geocodingLayers,
        ).then(results => {
          if (filterResults) {
            return filterResults(results, mode);
          }
          return results;
        }),
      );
    }
    if (allSources || sources.includes('History')) {
      const stopHistory = getOldSearches(context).filter(item => {
        if (item.properties.gid) {
          return item.properties.gid.includes('GTFS:');
        }
        return true;
      });
      const dropLayers = ['bikestation'];
      dropLayers.push(...routeLayers);
      dropLayers.push(...locationLayers);
      dropLayers.push(...parkingLayers);
      if (!useStops) {
        dropLayers.push('stop');
      }
      if (!useStations) {
        dropLayers.push('station');
      }
      if (transportMode) {
        searchComponents.push(
          filterOldSearches(stopHistory, input, dropLayers).then(result =>
            filterResults ? filterResults(result, mode) : result,
          ),
        );
      } else {
        searchComponents.push(
          filterOldSearches(stopHistory, input, dropLayers),
        );
      }
    }
  }
  if (allTargets || targets.includes('Routes')) {
    if (sources.includes('Favourite')) {
      const favouriteRoutes = getFavouriteRoutes(context);
      searchComponents.push(
        getFavouriteRoutesQuery(favouriteRoutes, input, mode, pathOpts).then(
          result =>
            filterResults ? filterResults(result, mode, 'Routes') : result,
        ),
      );
    }
    searchComponents.push(
      getRoutesQuery(input, feedIDs, transportMode, pathOpts).then(result =>
        filterResults ? filterResults(result, mode, 'Routes') : result,
      ),
    );
    if (allSources || sources.includes('History')) {
      const routeHistory = getOldSearches(context);
      const dropLayers = ['bikestation'];
      if (transportMode) {
        dropLayers.push(...routeLayers.filter(i => !(i === transportMode)));
      }
      dropLayers.push(...stopLayers);
      dropLayers.push(...locationLayers);
      dropLayers.push(...parkingLayers);

      searchComponents.push(
        filterOldSearches(routeHistory, input, dropLayers).then(results =>
          filterResults ? filterResults(results, mode, 'Routes') : results,
        ),
      );
    }
  }
  if (allTargets || targets.includes('VehicleRentalStations')) {
    if (sources.includes('Favourite')) {
      const favouriteVehicleRentalStation =
        getFavouriteVehicleRentalStations(context);
      searchComponents.push(
        getFavouriteVehicleRentalStationsQuery(
          favouriteVehicleRentalStation,
          input,
        ),
      );
    }
    if (allSources || sources.includes('Datasource')) {
      const geocodingLayers = ['bikestation'];
      const searchParams =
        geocodingSize && geocodingSize !== 10 ? { size: geocodingSize } : {};
      searchComponents.push(
        getGeocodingResults(
          input,
          searchParams,
          language,
          focusPoint,
          cityBikeNetworks.join(','),
          URL_PELIAS,
          minimalRegexp,
          geocodingLayers,
        ).then(results => {
          if (filterResults) {
            return filterResults(results, mode, 'VehicleRentalStations');
          }
          return results;
        }),
      );
    }
    if (allSources || sources.includes('History')) {
      const history = getOldSearches(context);
      const dropLayers = [...stopLayers];
      dropLayers.push(...routeLayers);
      dropLayers.push(...locationLayers);
      dropLayers.push(...parkingLayers);

      searchComponents.push(filterOldSearches(history, input, dropLayers));
    }
  }

  const searchResultsPromise = Promise.all(searchComponents)
    .then(flatten)
    .then(results => {
      searches.results = results;
    })
    .catch(err => {
      searches.error = err;
    });
  searchResultsPromise.then(() => {
    callback({
      ...searches,
      results: sortSearchResults(lineRegexp, searches.results, input),
    });
  });
}

const debouncedSearch = debounce(getSearchResults, 300, {
  leading: true,
});

export const executeSearch = (
  targets,
  sources,
  transportMode,
  searchContext,
  filterResults,
  geocodingSize,
  data,
  callback,
  pathOpts,
  refPoint,
) => {
  callback(null); // This means 'we are searching'
  debouncedSearch(
    targets,
    sources,
    transportMode,
    searchContext,
    filterResults,
    geocodingSize,
    data,
    callback,
    pathOpts,
    refPoint,
  );
};
