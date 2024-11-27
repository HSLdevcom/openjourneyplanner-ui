/* eslint-disable react/jsx-key */
import React from 'react';
import { graphql } from 'react-relay';
import Route from 'found/Route';
import Redirect from 'found/Redirect';
import queryMiddleware from 'farce/queryMiddleware';
import createRender from 'found/createRender';
import Error404 from './component/404';
import TopLevel from './component/TopLevel';
import { prepareWeekDays } from './util/dateParamUtils';
import { isBrowser } from './util/browser';
import {
  PREFIX_ITINERARY_SUMMARY,
  PREFIX_NEARYOU,
  PREFIX_BIKESTATIONS,
  PREFIX_BIKEPARK,
  PREFIX_CARPARK,
  PREFIX_RENTALVEHICLES,
  createReturnPath,
  TAB_NEARBY,
  TAB_FAVOURITES,
  EMBEDDED_SEARCH_PATH,
} from './util/path';
import {
  getDefault,
  errorLoading,
  getComponentOrLoadingRenderer,
  getComponentOrNullRenderer,
} from './util/routerUtils';

import getStopRoutes from './stopRoutes';
import routeRoutes from './routeRoutes';

export const historyMiddlewares = [queryMiddleware];

export const render = createRender({});

export default config => {
  const indexPageComponents = {
    title: (
      <Route
        getComponent={() =>
          import(/* webpackChunkName: "itinerary" */ './component/Title').then(
            getDefault,
          )
        }
      />
    ),
    content: (
      <Route
        getComponent={() =>
          import(
            /* webpackChunkName: "itinerary" */ './component/IndexPage'
          ).then(getDefault)
        }
      />
    ),
    meta: (
      <Route
        getComponent={() =>
          import(
            /* webpackChunkName: "itinerary" */ './component/IndexPageMeta'
          ).then(getDefault)
        }
      />
    ),
    map: (
      <Route
        disableMapOnMobile
        getComponent={() =>
          import(
            /* webpackChunkName: "itinerary" */ './component/map/IndexPageMap.js'
          ).then(getDefault)
        }
      />
    ),
  };

  const itineraryPageGeolocatorProps = {
    getComponent: () =>
      import(/* webpackChunkName: "itinerary" */ './component/Geolocator').then(
        getDefault,
      ),
    render: ({ Component, props }) => {
      if (Component) {
        return (
          <Component
            {...props}
            createReturnPath={createReturnPath}
            path={PREFIX_ITINERARY_SUMMARY}
          />
        );
      }
      return undefined;
    },
  };

  const vehicleParkingProps = {
    content: (
      <Route
        getComponent={() =>
          import(
            /* webpackChunkName: "vehiclepark" */ './component/ParkContainer'
          )
            .then(getDefault)
            .catch(errorLoading)
        }
        prepareVariables={prepareWeekDays}
        query={graphql`
          query routes_VehiclePark_Query($id: String!) {
            vehicleParking(id: $id) {
              ...ParkContainer_vehicleParking
            }
          }
        `}
        render={({ Component, props, error, retry }) => {
          if (Component && (props || error)) {
            return <Component {...props} error={error} />;
          }
          return getComponentOrLoadingRenderer({
            Component,
            props,
            error,
            retry,
          });
        }}
      />
    ),
    map: (
      <Route
        path="(.*)?"
        getComponent={() =>
          import(
            /* webpackChunkName: "vehiclepark" */ './component/VehicleParkMapContainer'
          ).then(getDefault)
        }
        // TODO remove prepareVariables after hsl.fi has updated its vehicle parking addresses
        prepareVariables={prepareWeekDays}
        query={graphql`
          query routes_VehicleParkMap_Query($id: String!) {
            vehicleParking(id: $id) {
              ...VehicleParkMapContainer_vehiclePark
            }
          }
        `}
        render={getComponentOrNullRenderer}
      />
    ),
  };

  return (
    <Route Component={TopLevel}>
      {getStopRoutes()}
      {getStopRoutes(true) /* terminals */}
      {routeRoutes(config)}
      <Route path={`/${PREFIX_BIKESTATIONS}/:id`}>
        {{
          content: (
            <Route
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/VehicleRentalStationContent'
                ).then(getDefault)
              }
              query={graphql`
                query routes_VehicleRentalStation_Query($id: String!) {
                  vehicleRentalStation(id: $id) {
                    ...VehicleRentalStationContent_vehicleRentalStation
                  }
                }
              `}
              render={({ Component, props, error, retry }) => {
                if (Component && (props || error)) {
                  return <Component {...props} error={error} />;
                }
                return getComponentOrLoadingRenderer({
                  Component,
                  props,
                  error,
                  retry,
                });
              }}
            />
          ),
          map: (
            <Route
              path="(.*)?"
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/VehicleRentalStationMapContainer'
                ).then(getDefault)
              }
              query={graphql`
                query routes_VehicleRentalStationMap_Query($id: String!) {
                  vehicleRentalStation(id: $id) {
                    ...VehicleRentalStationMapContainer_vehicleRentalStation
                  }
                }
              `}
              render={getComponentOrNullRenderer}
            />
          ),
        }}
      </Route>
      <Route path={`/${PREFIX_BIKEPARK}`}>
        <Route Component={Error404} />
        <Route path=":id">
          {{
            ...vehicleParkingProps,
          }}
        </Route>
      </Route>
      <Route path={`/${PREFIX_CARPARK}`}>
        <Route Component={Error404} />
        <Route path=":id">
          {{
            ...vehicleParkingProps,
          }}
        </Route>
      </Route>
      <Route path={`/${PREFIX_NEARYOU}/:mode/:place/:origin?`}>
        {{
          content: (
            <Route
              getComponent={() =>
                import(
                  /* webpackChunkName: "nearyou" */ './component/nearyou/NearYouPage'
                ).then(getDefault)
              }
              render={({ Component, props, error }) => {
                if (Component) {
                  return props ? (
                    <Component {...props} error={error} />
                  ) : (
                    <Component error={error} />
                  );
                }
                return undefined;
              }}
            />
          ),
          meta: (
            <Route
              path="(.*)?"
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/nearyou/NearYouPageMeta'
                ).then(getDefault)
              }
            />
          ),
        }}
      </Route>
      <Route path={`/${PREFIX_RENTALVEHICLES}/:id/:networks?`}>
        {{
          content: (
            <Route
              getComponent={() =>
                import('./component/RentalVehicleContent').then(getDefault)
              }
              query={graphql`
                query routes_RentalVehicle_Query($id: String!) {
                  rentalVehicle(id: $id) {
                    ...RentalVehicleContent_rentalVehicle
                  }
                }
              `}
              render={({ Component, props, error, retry }) => {
                if (Component && (props || error)) {
                  return <Component {...props} error={error} />;
                }
                return getComponentOrLoadingRenderer({
                  Component,
                  props,
                  error,
                  retry,
                });
              }}
            />
          ),
          map: (
            <Route
              path="(.*)?"
              getComponent={() =>
                import('./component/RentalVehiclePageMapContainer').then(
                  getDefault,
                )
              }
              query={graphql`
                query routes_RentalVehicleMap_Query($id: String!) {
                  rentalVehicle(id: $id) {
                    ...RentalVehiclePageMapContainer_rentalVehicle
                  }
                }
              `}
              render={getComponentOrNullRenderer}
            />
          ),
        }}
      </Route>

      <Redirect
        from={`/${PREFIX_ITINERARY_SUMMARY}/:from`}
        to={`${config.indexPath === '' ? '' : `/${config.indexPath}`}/:from`}
      />
      <Route
        path={`/${PREFIX_ITINERARY_SUMMARY}/POS/:to`}
        {...itineraryPageGeolocatorProps}
      />
      <Route
        path={`/${PREFIX_ITINERARY_SUMMARY}/POS/:to/:hash`}
        {...itineraryPageGeolocatorProps}
      />
      <Route
        path={`/${PREFIX_ITINERARY_SUMMARY}/:from/POS`}
        {...itineraryPageGeolocatorProps}
      />
      <Route
        path={`/${PREFIX_ITINERARY_SUMMARY}/:from/POS/:hash`}
        {...itineraryPageGeolocatorProps}
      />
      <Route path={`/${PREFIX_ITINERARY_SUMMARY}/:from/:to`}>
        {{
          title: (
            <Route
              path="(.*)?"
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/itinerary/ItineraryPageTitle'
                ).then(getDefault)
              }
            />
          ),
          content: (
            <Route
              getComponent={() =>
                isBrowser
                  ? import(
                      /* webpackChunkName: "itinerary" */ './component/itinerary/ItineraryPageContainer'
                    ).then(getDefault)
                  : import(
                      /* webpackChunkName: "loading" */ './component/Loading'
                    ).then(getDefault)
              }
              render={getComponentOrNullRenderer}
            >
              {{
                content: [
                  <Route path="" />,
                  <Route path="/:hash/:secondHash?">
                    <Route
                      getComponent={() =>
                        import(
                          /* webpackChunkName: "itinerary" */ './component/itinerary/ItineraryDetails'
                        ).then(getDefault)
                      }
                      render={getComponentOrLoadingRenderer}
                    />
                  </Route>,
                ],
              }}
            </Route>
          ),
          meta: (
            <Route
              path="(.*)?"
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/itinerary/ItineraryPageMeta'
                ).then(getDefault)
              }
            />
          ),
        }}
      </Route>
      <Route
        path="/tietoja-palvelusta"
        getComponent={() =>
          import(/* webpackChunkName: "about" */ './component/AboutPage').then(
            getDefault,
          )
        }
      />
      <Route
        path={config.URL.EMBEDDED_SEARCH_GENERATION}
        getComponent={() =>
          import(
            /* webpackChunkName: "embedded-search-generator" */ './component/EmbeddedSearchGenerator'
          ).then(getDefault)
        }
      />
      <Route
        path={EMBEDDED_SEARCH_PATH}
        getComponent={() =>
          import(
            /* webpackChunkName: "embedded-search" */ './component/EmbeddedSearchContainer'
          ).then(getDefault)
        }
        topBarOptions={{ hidden: true }}
      />
      <Route path="/js/*" Component={Error404} />
      <Route path="/css/*" Component={Error404} />
      <Route path="/assets/*" Component={Error404} />
      <Redirect
        from={`/:from/:to/${TAB_NEARBY}`}
        to={`${
          config.indexPath === '' ? '' : `/${config.indexPath}`
        }/:from/:to`}
      />
      <Redirect
        from={`/:from/:to/${TAB_FAVOURITES}`}
        to={`${
          config.indexPath === '' ? '' : `/${config.indexPath}`
        }/:from/:to`}
      />
      <Route
        path={`${
          config.indexPath === '' ? '' : `/${config.indexPath}`
        }/POS/:to?`}
      >
        {{
          content: (
            <Route
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/Geolocator'
                ).then(getDefault)
              }
              render={({ Component, props }) => {
                if (Component) {
                  return (
                    <Component
                      {...props}
                      createReturnPath={createReturnPath}
                      path={config.indexPath}
                    />
                  );
                }
                return undefined;
              }}
            />
          ),
        }}
      </Route>
      <Route
        path={`${
          config.indexPath === '' ? '' : `/${config.indexPath}`
        }/:from/POS`}
      >
        {{
          content: (
            <Route
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/Geolocator'
                ).then(getDefault)
              }
              render={({ Component, props }) => {
                if (Component) {
                  return (
                    <Component
                      {...props}
                      createReturnPath={createReturnPath}
                      path={config.indexPath}
                    />
                  );
                }
                return undefined;
              }}
            />
          ),
        }}
      </Route>
      <Route path={config.indexPath === '' ? '/' : `/${config.indexPath}`}>
        {indexPageComponents}
      </Route>
      <Route
        path={`${config.indexPath === '' ? '' : `/${config.indexPath}`}/:from`}
      >
        {indexPageComponents}
      </Route>
      <Route
        path={`${
          config.indexPath === '' ? '' : `/${config.indexPath}`
        }/:from/-`}
      >
        {indexPageComponents}
      </Route>
      <Route
        path={`${config.indexPath === '' ? '' : `/${config.indexPath}`}/-/:to`}
      >
        {indexPageComponents}
      </Route>
      <Redirect
        from="/:from/:to"
        to={`/${PREFIX_ITINERARY_SUMMARY}/:from/:to`}
      />
      {config.indexPath !== '' && (
        <Redirect
          from={`/${config.indexPath}/:from/:to`}
          to={`/${PREFIX_ITINERARY_SUMMARY}/:from/:to`}
        />
      )}
      <Route path="/?mock">
        {{
          title: (
            <Route
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/Title'
                ).then(getDefault)
              }
            >
              <Route path=":hash" />
            </Route>
          ),
          content: (
            <Route
              getComponent={() =>
                import(
                  /* webpackChunkName: "itinerary" */ './component/IndexPage'
                ).then(getDefault)
              }
            />
          ),
        }}
      </Route>
      {config.indexPath !== '' && (
        <Redirect from="/" to={`/${config.indexPath}`} />
      )}
      {/* For all the rest render 404 */}
      <Route path="*" Component={Error404} />
    </Route>
  );
};
