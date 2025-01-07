import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import BrowserProtocol from 'farce/BrowserProtocol';
import createInitialFarceRouter from 'found/createInitialFarceRouter';
import createFarceStore from 'found/createFarceStore';
import makeRouteConfig from 'found/makeRouteConfig';
import getStoreRenderArgs from 'found/getStoreRenderArgs';
import { Resolver } from 'found-relay';
import provideContext from 'fluxible-addons-react/provideContext';
import debug from 'debug';
import {
  RelayNetworkLayer,
  urlMiddleware,
  retryMiddleware,
  errorMiddleware,
  cacheMiddleware,
} from 'react-relay-network-modern';
import RelayClientSSR from 'react-relay-network-modern-ssr/lib/client';
import OfflinePlugin from 'offline-plugin/runtime';
import { Helmet } from 'react-helmet';
import { Environment, RecordSource, Store } from 'relay-runtime';
import { ReactRelayContext } from 'react-relay';
import { setRelayEnvironment } from '@digitransit-search-util/digitransit-search-util-query-utils';
import { configShape } from './util/shapes';
import { historyMiddlewares, render } from './routes';
import configureMoment from './util/configure-moment';
import StoreListeningIntlProvider from './util/StoreListeningIntlProvider';
import appCreator from './app';
import translations from './translations';
import { BUILD_TIME } from './buildInfo';
import ErrorBoundary from './component/ErrorBoundary';
import oldParamParser from './util/oldParamParser';
import { ClientProvider as ClientBreakpointProvider } from './util/withBreakpoint';
import meta from './meta';
import { isIOSApp } from './util/browser';
import {
  initAnalyticsClientSide,
  addAnalyticsEvent,
  handleUserAnalytics,
} from './util/analyticsUtils';
import { configureCountry } from './util/configureCountry';
import { getUser } from './util/apiUtils';
import setUser from './action/userActions';
import {
  fetchFavourites,
  fetchFavouritesComplete,
} from './action/FavouriteActions';

window.debug = debug; // Allow _debug.enable('*') in browser console

// TODO: this is an ugly hack, but required due to cyclical processing in app
const { config } = window.state.context.plugins['extra-context-plugin'];
const app = appCreator(config);

const getParams = query => {
  if (!query) {
    return {};
  }

  return query
    .substring(1)
    .split('&')
    .map(v => v.split('='))
    .reduce((params, [key, value]) => {
      const newParam = {};
      newParam[key] = decodeURIComponent(value);
      return { ...params, ...newParam };
    }, {});
};

async function init() {
  // Guard againist Samsung et.al. which are not properly polyfilled by polyfill-service
  if (typeof window.Intl === 'undefined') {
    const modules = [
      import(/* webpackChunkName: "intl",  webpackMode: "lazy" */ 'intl'),
    ];

    config.availableLanguages.forEach(language => {
      modules.push(
        import(
          /* webpackChunkName: "intl",  webpackMode: "lazy-once" */ `intl/locale-data/jsonp/${language}`
        ),
      );
    });
    await Promise.all(modules);
  }

  const context = await app.rehydrate(window.state);

  // Get additional feedIds and searchParams from localstorage
  if (config.mainMenu.countrySelection) {
    const selectedCountries = context.getStore('CountryStore').getCountries();
    configureCountry(config, selectedCountries);
  }

  // For Google Tag Manager
  initAnalyticsClientSide(config);

  window.context = context;

  if (process.env.NODE_ENV === 'development') {
    /* if (config.AXE) {
      const axeConfig = {
        resultTypes: ['violations'],
      };
      // eslint-disable-next-line global-require
      const axe = require('@axe-core/react');
      axe(React, ReactDOM, 2500, axeConfig);
    } */
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      require(`../sass/themes/${config.CONFIG}/main.scss`);
    } catch (error) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      require('../sass/themes/default/main.scss');
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  const relaySSRMiddleware = new RelayClientSSR(window.__RELAY_PAYLOADS__);

  relaySSRMiddleware.debug = false;

  // Query parameter is used instead of header because browsers send
  // OPTIONS queries where you can't define headers
  const queryParameters = config.hasAPISubscriptionQueryParameter
    ? `?${config.API_SUBSCRIPTION_QUERY_PARAMETER_NAME}=${config.API_SUBSCRIPTION_TOKEN}`
    : '';

  const language = context
    .getComponentContext()
    .getStore('PreferencesStore')
    .getLanguage();

  const network = new RelayNetworkLayer([
    relaySSRMiddleware.getMiddleware(),
    cacheMiddleware({
      size: 200,
      ttl: 60 * 60 * 1000,
    }),
    urlMiddleware({
      url: () => Promise.resolve(`${config.URL.OTP}gtfs/v1${queryParameters}`),
    }),
    errorMiddleware(),
    retryMiddleware({
      fetchTimeout: config.OTPTimeout + 1000,
    }),
    next => async req => {
      // eslint-disable-next-line no-param-reassign
      req.fetchOpts.headers.OTPTimeout = config.OTPTimeout;
      req.fetchOpts.headers['Accept-Language'] = language;
      return next(req);
    },
  ]);

  const environment = new Environment({
    network,
    store: new Store(new RecordSource()),
  });

  environment.relaySSRMiddleware = relaySSRMiddleware;

  setRelayEnvironment(environment);

  const resolver = new Resolver(environment);

  const routeConfig = makeRouteConfig(app.getComponent());

  const historyProtocol = new BrowserProtocol();

  const store = createFarceStore({
    historyProtocol,
    historyMiddlewares,
    routeConfig,
  });

  await getStoreRenderArgs({
    store,
    resolver,
  });

  const Router = await createInitialFarceRouter({
    historyProtocol,
    historyMiddlewares,
    routeConfig,
    resolver,
    render,
  });

  context
    .getComponentContext()
    .getStore('MessageStore')
    .addConfigMessages(config);

  configureMoment(language, config);

  const path = window.location.pathname;

  if (config.redirectReittiopasParams) {
    const query = getParams(window.location.search);

    if (query.from || query.to || query.from_in || query.to_in) {
      oldParamParser(query, config).then(redirectUrl =>
        window.location.replace(redirectUrl),
      );
    } else if (['/fi/', '/en/', '/sv/', '/ru/', '/slangi/'].includes(path)) {
      window.location.replace('/');
    }
  }
  // send tracking call for initial page load.
  // tracking page changes is done in TopLevel component
  addAnalyticsEvent({
    event: 'Pageview',
    url: path,
  });

  // fetch Userdata and favourites
  if (config.allowLogin) {
    getUser()
      .then(user => {
        context.executeAction(setUser, {
          ...user,
        });
        handleUserAnalytics(user, config);
        context.executeAction(fetchFavourites);
      })
      .catch(() => {
        context.executeAction(setUser, { notLogged: true });
        context.executeAction(fetchFavouritesComplete);
      });
  }

  const ContextProvider = provideContext(StoreListeningIntlProvider, {
    /* eslint-disable-next-line */
    config: configShape,
    headers: PropTypes.objectOf(PropTypes.string),
  });

  const root = document.getElementById('app');
  const { initialBreakpoint } = root.dataset;

  // KLUDGE: SSR and CSR mismatch breaks the UI in iOS PWA mode
  // see: https://github.com/facebook/react/issues/11336
  if (isIOSApp) {
    root.innerHTML = '';
  }

  const content = (
    <ClientBreakpointProvider serverGuessedBreakpoint={initialBreakpoint}>
      <ContextProvider
        translations={translations}
        context={context.getComponentContext()}
      >
        <ReactRelayContext.Provider value={{ environment }}>
          <ErrorBoundary>
            <React.Fragment>
              <Helmet
                {...meta(
                  context.getStore('PreferencesStore').getLanguage(),
                  window.location.host,
                  window.location.href,
                  config,
                )}
              />
              <Router resolver={resolver} />
            </React.Fragment>
          </ErrorBoundary>
        </ReactRelayContext.Provider>
      </ContextProvider>
    </ClientBreakpointProvider>
  );

  ReactDOM.hydrate(content, root, () => {
    // Run only in production mode and when built in a docker container
    if (process.env.NODE_ENV === 'production' && BUILD_TIME !== 'unset') {
      OfflinePlugin.install({
        onUpdateReady: () => OfflinePlugin.applyUpdate(),
      });
    }
  });

  // Listen for Web App Install Banner events
  window.addEventListener('beforeinstallprompt', e => {
    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'installprompt',
      action: 'fired',
      name: 'fired',
    });
    // e.userChoice will return a Promise. (Only in chrome, not IE)
    if (e.userChoice) {
      e.userChoice.then(choiceResult =>
        addAnalyticsEvent({
          event: 'sendMatomoEvent',
          category: 'installprompt',
          action: 'result',
          name: choiceResult.outcome,
        }),
      );
    }
  });
}

init();
