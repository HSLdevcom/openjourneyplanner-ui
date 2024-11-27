import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import getJson from '@digitransit-search-util/digitransit-search-util-get-json';
import suggestionToLocation from '@digitransit-search-util/digitransit-search-util-suggestion-to-location';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { configShape, locationStateShape } from '../util/shapes';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import { useCitybikes } from '../util/modeUtils';
import {
  PREFIX_ITINERARY_SUMMARY,
  PREFIX_STOPS,
  PREFIX_ROUTES,
} from '../util/path';
import searchContext from '../util/searchContext';
import intializeSearchContext from '../util/DTSearchContextInitializer';
import SelectFromMapHeader from './SelectFromMapHeader';
import SelectFromMap from './map/SelectFromMap';
import DTModal from './DTModal';
import FromMapModal from './FromMapModal';
import { removeSearch } from '../action/SearchActions';

const PATH_OPTS = {
  stopsPrefix: PREFIX_STOPS,
  routesPrefix: PREFIX_ROUTES,
  itinerarySummaryPrefix: PREFIX_ITINERARY_SUMMARY,
};

export function getLocationSearchTargets(config, isMobile) {
  let locationSearchTargets = ['Locations', 'CurrentPosition'];

  if (config.locationSearchTargetsFromOTP) {
    // configurable setup
    locationSearchTargets = [
      ...locationSearchTargets,
      ...config.locationSearchTargetsFromOTP,
    ];
  } else {
    // default setup
    locationSearchTargets.push('Stations');
    locationSearchTargets.push('Stops');
    if (useCitybikes(config.vehicleRental?.networks, config)) {
      locationSearchTargets.push('VehicleRentalStations');
    }
    if (config.includeParkAndRideSuggestions) {
      locationSearchTargets.push('ParkingAreas');
    }
  }
  if (isMobile) {
    locationSearchTargets.push('MapPosition');
  }
  return locationSearchTargets;
}

export function withSearchContext(WrappedComponent, embeddedSearch = false) {
  class ComponentWithSearchContext extends React.Component {
    static contextTypes = {
      config: configShape.isRequired,
      intl: intlShape.isRequired,
      executeAction: PropTypes.func.isRequired,
      getStore: PropTypes.func.isRequired,
    };

    static propTypes = {
      selectHandler: PropTypes.func.isRequired,
      locationState: locationStateShape.isRequired,
      onGeolocationStart: PropTypes.func,
      fromMap: PropTypes.string,
      isMobile: PropTypes.bool,
      favouriteContext: PropTypes.bool,
      showViapointControl: PropTypes.bool,
    };

    static defaultProps = {
      onGeolocationStart: null,
      fromMap: undefined,
      isMobile: false,
      showViapointControl: false,
      favouriteContext: false,
    };

    constructor(props) {
      super(props);
      this.state = {
        // eslint-disable-next-line react/no-unused-state
        pendingCurrentLocation: false,
        isInitialized: false,
        positioningSelectedFrom: '',
        fromMap: this.props.fromMap,
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      if (prevState.isInitialized) {
        const locState = nextProps.locationState;
        if (
          (prevState.pendingCurrentLocation &&
            locState.status === 'found-address') ||
          locState.locationingFailed
        ) {
          return {
            pendingCurrentLocation: false,
            positioningSelectedFrom: null,
          };
        }
      }
      return null;
    }

    componentDidMount() {
      if (!this.state.isInitialized) {
        intializeSearchContext(this.context, searchContext);
        this.setState({ isInitialized: true });
      }
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        prevState.pendingCurrentLocation !== this.state.pendingCurrentLocation
      ) {
        const locState = this.props.locationState;

        if (locState.status === 'found-address') {
          this.onSuggestionSelected(
            locState,
            prevState.positioningSelectedFrom,
          );
        }
      }
    }

    saveOldSearch = (item, type, id) => {
      if (
        item.type !== 'FutureRoute' &&
        item.type !== 'CurrentLocation' &&
        item.type !== 'SelectFromMap' &&
        item.type.indexOf('Favourite') === -1 &&
        id !== 'favourite' &&
        (!item.properties ||
          !item.properties.layer ||
          item.properties.layer.indexOf('favourite') === -1)
      ) {
        this.context.executeAction(searchContext.saveSearch, {
          item,
          type,
        });
      }
    };

    onSuggestionSelected = (item, id) => {
      if (item.type === 'SelectFromMap') {
        this.setState({ fromMap: id });
      } else if (id !== 'stop-route-station' && item.type !== 'FutureRoute') {
        let location;
        if (item.type === 'CurrentLocation') {
          if (embeddedSearch) {
            this.props.selectHandler(
              {
                type: 'CurrentLocation',
                status: 'no-location',
                address: this.context.intl.formatMessage({
                  id: 'own-position',
                  defaultMessage: 'Own Location',
                }),
              },
              id,
            );
            return;
          }
          // item is already a location.
          location = item;
          if (
            item.properties &&
            item.properties.layer === 'currentPosition' &&
            !item.properties.lat
          ) {
            // eslint-disable-next-line react/no-unused-state
            this.setState(
              { pendingCurrentLocation: true, positioningSelectedFrom: id },
              this.context.executeAction(searchContext.startLocationWatch),
            );
            if (this.props.onGeolocationStart) {
              this.props.onGeolocationStart(item, id);
            }
            return;
          }
          if (!location.address) {
            location.address = this.context.intl.formatMessage({
              id: 'own-position',
              defaultMessage: 'Own Location',
            });
          }
        } else {
          location = suggestionToLocation(item);
        }
        this.props.selectHandler(location, id);
      } else {
        this.props.selectHandler(item, id);
      }
    };

    // top level onSelect callback manages search history
    onSelect = (item, id) => {
      // type for storing old searches. 'endpoint' types are available in itinerary search
      let type = 'endpoint';
      switch (item.type) {
        case 'Route':
          type = 'search'; // can't be used as location
          break;
        default:
      }
      if (item.type === 'OldSearch' && item.properties.gid) {
        getJson(this.context.config.URL.PELIAS_PLACE, {
          ids: item.properties.gid,
        })
          .then(res => {
            const newItem = { ...item };
            let canSave = true;
            if (res.features != null && res.features.length > 0) {
              // update only position. It is surprising if, say, the name changes at selection.
              const geom = res.features[0].geometry;
              newItem.geometry.coordinates = geom.coordinates;
              if (
                newItem.properties.name !== res.features[0].properties.name ||
                newItem.properties.street !==
                  res.features[0].properties.street ||
                newItem.properties.housenumber !==
                  res.features[0].properties.housenumber
              ) {
                // Item properties have changed unexpectedly. For example,
                // an enterprise may have moved to new premises. Remove outdated information.
                canSave = false;
              }
            }
            if (canSave) {
              this.saveOldSearch(newItem, type, id);
            } else {
              this.context.executeAction(removeSearch, {
                item: newItem,
                type,
              });
            }
            this.onSuggestionSelected(item, id);
          })
          .catch(() => {
            this.saveOldSearch(item, type, id);
            this.onSuggestionSelected(item, id);
          });
      } else {
        this.saveOldSearch(item, type, id);
        this.onSuggestionSelected(item, id);
      }
    };

    confirmMapSelection = (type, mapLocation) => {
      this.setState({ fromMap: undefined }, () =>
        this.props.selectHandler(mapLocation, type),
      );
    };

    renderSelectFromMapModal = id => {
      let titleId = 'select-from-map-no-title';

      if (id === 'origin') {
        titleId = 'select-from-map-origin';
      } else if (id === 'destination') {
        titleId = 'select-from-map-destination';
      } else if (id === 'favourite') {
        titleId = 'select-from-map-favourite';
      } else if (id === parseInt(id, 10)) {
        // id = via point index
        titleId = 'select-from-map-viaPoint';
      }

      if (!this.props.isMobile) {
        return (
          <FromMapModal
            onClose={() => this.setState({ fromMap: undefined })}
            titleId={titleId}
            favouriteContext={this.props.favouriteContext}
          >
            <SelectFromMap type={id} onConfirm={this.confirmMapSelection} />
          </FromMapModal>
        );
      }

      return (
        <DTModal show>
          <SelectFromMapHeader
            titleId={titleId}
            onBackBtnClick={() => this.setState({ fromMap: undefined })}
            hideCloseBtn
          />
          <SelectFromMap type={id} onConfirm={this.confirmMapSelection} />
        </DTModal>
      );
    };

    render() {
      const { fromMap } = this.state;

      if (fromMap !== undefined) {
        return this.renderSelectFromMapModal(fromMap);
      }

      const viaProps = this.props.showViapointControl
        ? { handleViaPointLocationSelected: this.onSelect }
        : {};
      return (
        <WrappedComponent
          appElement="#app"
          searchContext={searchContext}
          addAnalyticsEvent={addAnalyticsEvent}
          onSelect={this.onSelect}
          {...this.props}
          {...viaProps}
          pathOpts={PATH_OPTS}
        />
      );
    }
  }
  const componentWithPosition = connectToStores(
    ComponentWithSearchContext,
    ['PositionStore'],
    context => ({
      locationState: context.getStore('PositionStore').getLocationState(),
    }),
  );
  return componentWithPosition;
}
