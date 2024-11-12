/* eslint-disable prefer-template */
import configMerger from '../util/configMerger';

const CONFIG = 'hameenlinna';
const APP_TITLE = 'reittiopas.hameenlinna.fi';
const APP_DESCRIPTION = '';

const walttiConfig = require('./config.waltti').default;

export default configMerger(walttiConfig, {
  CONFIG,

  appBarLink: {
    name: 'Hämeenlinnan joukkoliikenne',
    href: 'http://hameenlinnanjoukkoliikenne.fi/',
  },

  colors: {
    primary: 'rgb(196,40,31)',
    iconColors: {
      'mode-bus': 'rgb(196,40,31)',
    },
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    twitter: {
      site: '@hmlkaupunki',
    },
  },

  title: APP_TITLE,

  favicon: './app/configurations/images/hameenlinna/hameenlinna-favicon.png',

  // Navbar logo
  logo: 'hameenlinna/logo.png',
  secondaryLogo: 'hameenlinna/secondary-logo.png',

  feedIds: ['Hameenlinna'],

  geoJson: {
    noZoneSharing: true,
    layers: [
      {
        name: {
          fi: 'Vyöhykkeet',
          sv: 'Zoner',
          en: 'Zones',
        },
        url: '/assets/geojson/hml_zone_lines_20230214.geojson',
      },
    ],
  },

  searchParams: {
    'boundary.rect.min_lat': 60.75705,
    'boundary.rect.max_lat': 61.30156,
    'boundary.rect.min_lon': 23.73155,
    'boundary.rect.max_lon': 25.28315,
  },

  areaPolygon: [
    [23.73155, 60.75705],
    [23.73155, 61.30156],
    [25.28315, 61.30156],
    [25.28315, 60.75705],
  ],

  defaultEndpoint: {
    address: 'Hämeenlinnan linja-autoasema',
    lat: 60.9952717075545,
    lon: 24.4662911533486,
  },

  menu: {
    copyright: { label: `© Hameenlinna ${walttiConfig.YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: {
          fi: 'https://kartta.hameenlinna.fi/eFeedback/fi/Feedback/35-Joukkoliikenne',
          sv: 'https://kartta.hameenlinna.fi/eFeedback/sv/Feedback/35-Joukkoliikenne',
          en: 'https://kartta.hameenlinna.fi/eFeedback/en/Feedback/35-Public%20transportation',
        },
      },
      {
        name: 'about-this-service',
        route: '/tietoja-palvelusta',
      },
      {
        name: 'accessibility-statement',
        href: {
          fi: 'https://www.digitransit.fi/accessibility',
          sv: 'https://www.digitransit.fi/accessibility',
          en: 'https://www.digitransit.fi/en/accessibility',
        },
      },
    ],
  },

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Tämän palvelun tarjoaa Hämeenlinnan seudun joukkoliikenne reittisuunnittelua varten Hattulan, Hämeenlinnan ja Janakkalan alueella. Palvelu sisältää paikallisen ja seudullisen joukkoliikenteen reitit ja aikataulut. Palvelu perustuu Digitransit-palvelualustaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Den här tjänsten erbjuds av Hämeenlinnan seudun joukkoliikenne för reseplanering inom Hattula, Hämeenlinna och Janakkala region. Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'This service is provided by Hämeenlinnan seudun joukkoliikenne for route planning in Hattula, Hämeenlinna and Janakkala region. The service covers public transport, walking, cycling, and some private car use. Service is built on Digitransit platform.',
        ],
      },
    ],
  },
  zoneIdMapping: {
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'D',
    5: 'E',
    6: 'F',
    7: 'G',
  },

  vehicles: true,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,
  zones: {
    stops: true,
    itinerary: true,
  },
});
