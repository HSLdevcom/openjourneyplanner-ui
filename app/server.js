// React
import React from 'react';
import ReactDOM from 'react-dom/server';
import PropTypes from 'prop-types';

// Routing and state handling
import { Environment, RecordSource, Store } from 'relay-runtime';
import { getFarceResult } from 'found/server';
import makeRouteConfig from 'found/makeRouteConfig';
import { Resolver } from 'found-relay';
import { Helmet } from 'react-helmet';
import {
  RelayNetworkLayer,
  urlMiddleware,
  retryMiddleware,
  errorMiddleware,
  cacheMiddleware,
} from 'react-relay-network-modern';
import RelayServerSSR from 'react-relay-network-modern-ssr/lib/server';
import { ReactRelayContext } from 'react-relay';
import provideContext from 'fluxible-addons-react/provideContext';

// Libraries
import serialize from 'serialize-javascript';
import { IntlProvider } from 'react-intl';
import polyfillLibrary from 'polyfill-library';
import fs from 'fs';
import path from 'path';
import LRU from 'lru-cache';

// Application
import { setRelayEnvironment } from '@digitransit-search-util/digitransit-search-util-query-utils';
import { configShape } from './util/shapes';
import appCreator from './app';
import translations from './translations';
import configureMoment from './util/configure-moment';
import { BreakpointProvider, getServerBreakpoint } from './util/withBreakpoint';
import meta from './meta';

// configuration
import { getConfiguration } from './config';
import { getAnalyticsInitCode } from './util/analyticsUtils';

import { historyMiddlewares, render } from './routes';
import { LOCAL_STORAGE_EMITTER_PATH } from './util/path';
import ErrorHandlerSSR from './component/ErrorHandlerSSR';

// Look up paths for various asset files
const appRoot = `${process.cwd()}/`;

// cached assets
const polyfillls = new LRU(200);

let assets;
let mainAssets;
let manifest;

if (process.env.NODE_ENV !== 'development') {
  // eslint-disable-next-line global-require, import/no-unresolved
  assets = require('../manifest.json');
  // eslint-disable-next-line global-require, import/no-unresolved
  mainAssets = require('../stats.json').entrypoints.main.assets.filter(
    asset => !asset.endsWith('.map'),
  );

  const manifestFiles = mainAssets.filter(asset =>
    asset.startsWith('js/runtime'),
  );

  manifest = manifestFiles
    .map(manifestFile =>
      fs.readFileSync(path.join(appRoot, '_static', manifestFile)),
    )
    .join('\n');

  mainAssets = mainAssets.filter(asset => !manifestFiles.includes(asset));
}

function getPolyfills(userAgent, config) {
  // Do not trust Samsung, LG
  // see https://digitransit.atlassian.net/browse/DT-360 and DT-445
  // Also https://github.com/Financial-Times/polyfill-service/issues/727
  if (
    !userAgent ||
    /(IEMobile|LG-|GT-|SM-|SamsungBrowser|Google Page Speed Insights)/.test(
      userAgent,
    )
  ) {
    userAgent = ''; // eslint-disable-line no-param-reassign
  }

  const normalizedUA = polyfillLibrary.normalizeUserAgent(userAgent);
  let polyfill = polyfillls.get(normalizedUA);

  if (polyfill) {
    return polyfill;
  }

  const features = {
    'caniuse:console-basic': { flags: ['gated'] },
    default: { flags: ['gated'] },
    es5: { flags: ['gated'] },
    es6: { flags: ['gated'] },
    es7: { flags: ['gated'] },
    es2017: { flags: ['gated'] },
    fetch: { flags: ['gated'] },
    Intl: { flags: ['gated'] },
    'Object.assign': { flags: ['gated'] },
    matchMedia: { flags: ['gated'] },
  };

  config.availableLanguages.forEach(language => {
    features[`Intl.~locale.${language}`] = {
      flags: ['gated'],
    };
  });

  polyfill = polyfillLibrary
    .getPolyfillString({
      uaString: userAgent,
      features,
      minify: process.env.NODE_ENV !== 'development',
      unknown: 'polyfill',
    })
    .then(polyfills =>
      // no sourcemaps for inlined js
      polyfills.replace(/^\/\/# sourceMappingURL=.*$/gm, ''),
    );

  polyfillls.set(normalizedUA, polyfill);
  return polyfill;
}

const ContextProvider = provideContext(IntlProvider, {
  config: configShape,
  url: PropTypes.string,
  headers: PropTypes.objectOf(PropTypes.string),
});

const isRobotRequest = agent =>
  agent &&
  (agent.indexOf('facebook') !== -1 || agent.indexOf('Twitterbot') !== -1);

const RELAY_FETCH_TIMEOUT =
  parseInt(process.env.RELAY_FETCH_TIMEOUT, 10) || 3000;

function getEnvironment(config, agent, locale) {
  const relaySSRMiddleware = new RelayServerSSR();
  relaySSRMiddleware.debug = false;
  const queryParameters = config.hasAPISubscriptionQueryParameter
    ? `?${config.API_SUBSCRIPTION_QUERY_PARAMETER_NAME}=${config.API_SUBSCRIPTION_TOKEN}`
    : '';

  const layer = new RelayNetworkLayer([
    next => req => {
      req.fetchOpts.headers['Accept-Language'] = locale;
      return next(req).catch(() => ({ payload: { data: null } }));
    },
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
      fetchTimeout: isRobotRequest(agent) ? 10000 : RELAY_FETCH_TIMEOUT,
      retryDelays: [],
    }),
  ]);

  const environment = new Environment({
    network: layer,
    store: new Store(new RecordSource()),
  });
  environment.relaySSRMiddleware = relaySSRMiddleware;

  return environment;
}

export default async function serve(req, res, next) {
  try {
    const config = getConfiguration(req);
    const application = appCreator(config);
    const agent = req.headers['user-agent'];
    global.navigator = { userAgent: agent };

    // TODO: Move this to PreferencesStore
    // 1. use locale from cookie (user selected) or default
    let locale = req.cookies.lang || config.defaultLanguage;

    if (config.availableLanguages.indexOf(locale) === -1) {
      locale = config.defaultLanguage;
    }

    if (req.cookies.lang === undefined || req.cookies.lang !== locale) {
      res.cookie('lang', locale);
    }

    const environment = getEnvironment(config, agent, locale);

    setRelayEnvironment(environment);

    const resolver = new Resolver(environment);

    const { redirect, status, element } = await getFarceResult({
      url: req.url,
      historyMiddlewares,
      routeConfig: makeRouteConfig(application.getComponent()),
      resolver,
      render,
    });

    if (redirect) {
      res.redirect(302, redirect.url);
      return;
    }

    if (
      element &&
      element.props &&
      element.props.renderArgs &&
      Array.isArray(element.props.renderArgs.elements) &&
      element.props.renderArgs.elements.filter(
        component =>
          component &&
          component.type &&
          component.type.displayName === 'Error404',
      ).length > 0
    ) {
      res.status(404);
    }

    const context = application.createContext({
      url: req.url,
      headers: req.headers,
      config,
    });

    context
      .getComponentContext()
      .getStore('MessageStore')
      .addConfigMessages(config);

    const language = context
      .getComponentContext()
      .getStore('PreferencesStore')
      .getLanguage();

    configureMoment(language, config);

    const polyfills = await getPolyfills(agent, config);
    const breakpoint = getServerBreakpoint(agent);

    let content;
    try {
      content = ReactDOM.renderToString(
        <BreakpointProvider value={breakpoint}>
          <ContextProvider
            locale={locale}
            messages={translations[locale]}
            context={context.getComponentContext()}
          >
            <ReactRelayContext.Provider value={{ environment }}>
              <React.Fragment>
                {element}
                <Helmet
                  {...meta(
                    context.getStore('PreferencesStore').getLanguage(),
                    req.hostname,
                    `https://${req.hostname}${req.originalUrl}`,
                    config,
                  )}
                />
              </React.Fragment>
            </ReactRelayContext.Provider>
          </ContextProvider>
        </BreakpointProvider>,
      );
    } catch (e) {
      if (e.isFoundRedirectException) {
        res.redirect(e.status, e.location);
        return;
      }
      try {
        content = ReactDOM.renderToString(
          <ContextProvider
            locale={locale}
            messages={translations[locale]}
            context={context.getComponentContext()}
          >
            <>
              <ErrorHandlerSSR />
              <Helmet
                {...meta(
                  context.getStore('PreferencesStore').getLanguage(),
                  req.hostname,
                  `https://${req.hostname}${req.originalUrl}`,
                  config,
                )}
              />
            </>
          </ContextProvider>,
        );
      } catch (_) {
        content = '';
      }
    }

    const contentWithBreakpoint = `<div id="app" data-initial-breakpoint="${breakpoint}">${content}</div>\n`;

    let relayData;
    try {
      relayData = await environment.relaySSRMiddleware.getCache();
    } catch {
      relayData = [];
    }

    const spriteName = config.sprites;

    const ASSET_URL = process.env.ASSET_URL || config.APP_PATH;

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.write('<!doctype html>\n');
    res.write(`<html lang="${locale}">\n`);
    res.write('<head>\n');

    // local storage emitter is used from a hidden iframe and these are not necessary for it
    if (req.url !== LOCAL_STORAGE_EMITTER_PATH) {
      // Write preload hints before doing anything else
      if (process.env.NODE_ENV !== 'development') {
        res.write(getAnalyticsInitCode(config, req.hostname));

        const preloads = [
          { as: 'style', href: config.URL.FONT },
          {
            as: 'style',
            href: `${ASSET_URL}/${assets[`${config.CONFIG}_theme.css`]}`,
            crossorigin: true,
          },
          ...mainAssets.map(asset => ({
            as: asset.endsWith('.css') ? 'style' : 'script',
            href: `${ASSET_URL}/${asset}`,
            crossorigin: true,
          })),
        ];

        preloads.forEach(({ as, href, crossorigin }) =>
          res.write(
            `<link rel="preload" as="${as}" ${
              crossorigin ? 'crossorigin' : ''
            } href="${href}">\n`,
          ),
        );

        const preconnects = [config.URL.API_URL, config.URL.MAP_URL];

        if (config.staticMessagesUrl) {
          preconnects.push(config.staticMessagesUrl);
        }

        preconnects.forEach(href =>
          res.write(`<link rel="preconnect" crossorigin href="${href}">\n`),
        );

        res.write(
          `<link rel="stylesheet" type="text/css" crossorigin href="${ASSET_URL}/${
            assets[`${config.CONFIG}_theme.css`]
          }"/>\n`,
        );
        mainAssets
          .filter(asset => asset.endsWith('.css'))
          .forEach(asset =>
            res.write(
              `<link rel="stylesheet" type="text/css" crossorigin href="${ASSET_URL}/${asset}"/>\n`,
            ),
          );
      }

      res.write(
        `<link rel="stylesheet" type="text/css" href="${config.URL.FONT}"/>\n`,
      );

      res.write(`<script>\n${polyfills}\n</script>\n`);

      const head = Helmet.rewind();

      if (head) {
        res.write(head.title.toString());
        res.write(head.meta.toString());
        res.write(head.link.toString());
      }
    }

    res.write('</head>\n');
    res.write('<body>\n');

    // local storage emitter is used from a hidden iframe and these are not necessary for it
    if (req.url !== LOCAL_STORAGE_EMITTER_PATH) {
      if (process.env.NODE_ENV !== 'development') {
        res.write('<script>\n');
        res.write(`fetch('${ASSET_URL}/${assets[spriteName]}')
          .then(function(response) {return response.text();}).then(function(blob) {
            var div = document.createElement('div');
            div.innerHTML = blob;
            document.body.insertBefore(div, document.body.childNodes[0]);
          });`);
        res.write('</script>\n');
      } else {
        res.write('<div>\n');
        res.write(
          fs.readFileSync(`${appRoot}_static/${spriteName}`).toString(),
        );
        res.write('</div>\n');
      }
    }

    res.write(contentWithBreakpoint || '<div id="app" />');

    res.write(
      `<script>\nwindow.state=${serialize(
        application.dehydrate(context),
      )};\n</script>\n`,
    );

    // local storage emitter is used from a hidden iframe and it does not use relay
    if (req.url !== LOCAL_STORAGE_EMITTER_PATH) {
      res.write('<script>\n');
      res.write(
        `window.__RELAY_PAYLOADS__ = ${serialize(JSON.stringify(relayData), {
          isJSON: true,
        })}`,
      );
      res.write('\n</script>\n');
    }

    if (process.env.NODE_ENV === 'development') {
      res.write('<script async src="/proxy/js/main.js"></script>\n');
    } else {
      res.write('<script>');
      res.write(
        manifest.replace(/\/\/# sourceMappingURL=/g, `$&${ASSET_URL}/js/`),
      );
      res.write('\n</script>\n');
      res.write(`<script>window.ASSET_URL="${ASSET_URL}/"</script>\n`);
      mainAssets
        .filter(asset => !asset.endsWith('.css'))
        .forEach(asset =>
          res.write(
            `<script src="${ASSET_URL}/${asset}" crossorigin defer></script>\n`,
          ),
        );
    }
    res.write('</body>\n');
    res.write('</html>\n');
    res.status(status).end();
  } catch (err) {
    next(err);
  }
}
