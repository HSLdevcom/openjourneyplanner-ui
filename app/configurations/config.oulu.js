/* eslint-disable prefer-template */
import configMerger from '../util/configMerger';

const CONFIG = 'oulu';
const APP_DESCRIPTION = 'Oulun seudun reittiopas';
const APP_TITLE = 'Reittiopas';

const walttiConfig = require('./config.waltti').default;

export default configMerger(walttiConfig, {
  CONFIG,

  feedIds: ['OULU'],

  appBarLink: {
    name: 'Oulun seudun liikenne',
    href: 'https://www.osl.fi/',
  },

  colors: {
    primary: '#e10669',
    iconColors: {
      'mode-bus': '#e10669',
    },
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    twitter: {
      site: '@oulunkaupunki',
    },
  },

  title: APP_TITLE,

  favicon: './app/configurations/images/oulu/oulu-favicon.png',

  // Navbar logo
  logo: 'oulu/oulu-logo.png',
  secondaryLogo: 'oulu/secondary-oulu-logo.png',

  searchParams: {
    'boundary.rect.min_lat': 64.71,
    'boundary.rect.max_lat': 65.38,
    'boundary.rect.min_lon': 24.37,
    'boundary.rect.max_lon': 26.61,
  },

  transportModes: {
    citybike: {
      availableForSelection: false,
    },
  },

  areaPolygon: [
    [24.37, 64.71],
    [24.37, 65.38],
    [26.61, 65.38],
    [26.61, 64.71],
  ],

  defaultEndpoint: {
    address: 'Keskusta',
    lat: 65.0118,
    lon: 25.4702,
  },

  menu: {
    copyright: { label: `© Oulu ${walttiConfig.YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: {
          fi: 'https://www.osl.fi/asiakaspalvelu/#palaute',
          sv: 'https://www.osl.fi/asiakaspalvelu/#palaute',
          en: 'https://www.osl.fi/asiakaspalvelu/#palaute',
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

  geoJson: {
    layers: [
      {
        name: {
          fi: 'Vyöhykkeet',
          sv: 'Zoner',
          en: 'Zones',
        },
        url: '/assets/geojson/oulu_zone_lines_20241011.geojson',
      },
    ],
  },

  vehicles: true,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Tämän palvelun tarjoaa Oulun seudun liikenne joukkoliikenteen reittisuunnittelua varten Oulun, Iin, Kempeleen, Limingan, Lumijoen, Muhoksen ja Tyrnävän alueella. Palvelu kattaa joukkoliikenteen, kävelyn, pyöräilyn ja yksityisautoilun rajatuilta osin. Palvelu perustuu Digitransit-palvelualustaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Den här tjänsten erbjuds av Uleåborgregionens trafik för reseplanering inom Oulu, Ii, Kempele, Liminka, Lumijoki, Muhos och Tyrnävä region. Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'This service is provided by Oulu Region Transport for route planning in Oulu, Ii, Kempele, Liminka, Lumijoki, Muhos and Tyrnävä region. The service covers public transport, walking, cycling, and some private car use. Service is built on Digitransit platform.',
        ],
      },
    ],
  },
  zoneIdMapping: {
    1: 'Oulu',
  },
  zones: {
    stops: true,
    itinerary: true,
  },
  stopCard: {
    header: {
      virtualMonitorBaseUrl: 'https://pysakkinaytto.osl.fi/',
    },
  },

  mainMenu: {
    stopMonitor: {
      show: true,
      url: 'https://pysakkinaytto.osl.fi/createview',
    },
  },
});
