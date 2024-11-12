/* eslint-disable prefer-template */
import configMerger from '../util/configMerger';
import { BIKEAVL_WITHMAX } from '../util/vehicleRentalUtils';

const CONFIG = 'turku';
const APP_TITLE = 'Fölin reittiopas';
const APP_DESCRIPTION = 'Turun seudun joukkoliikenteen eli Fölin reittiopas';
const CONSTANT_OPERATION_PARAGRAPHS = {
  funi: {
    fi: {
      text: 'Jatkuva liikennöinti. Lisätietoja ja poikkeukset: ',
      link: 'http://turku.fi/funikulaari',
    },
    en: {
      text: 'Constant operation. More information and service alterations: ',
      link: 'https://www.turku.fi/en/funicular',
    },
    sv: {
      text: 'Kontinuerlig trafik. Mer information och avvikelser: ',
      link: 'https://www.turku.fi/sv/funikularen',
    },
  },
  fori: {
    fi: {
      text: 'Jatkuva liikennöinti. Lisätietoja ja poikkeukset: ',
      link: 'http://turku.fi/fori',
    },
    en: {
      text: 'Constant operation. More information and service alterations: ',
      link: 'https://www.turku.fi/en/fori',
    },
    sv: {
      text: 'Kontinuerlig trafik. Mer information och avvikelser: ',
      link: 'https://www.turku.fi/sv/fori',
    },
  },
};
const walttiConfig = require('./config.waltti').default;

export default configMerger(walttiConfig, {
  CONFIG,

  feedIds: ['FOLI', 'FUNI', 'TurkuTest'],

  searchParams: {
    'boundary.rect.min_lat': 59.963388,
    'boundary.rect.max_lat': 60.950777,
    'boundary.rect.min_lon': 21.145557,
    'boundary.rect.max_lon': 22.939795,
  },

  colors: {
    primary: '#e8aa27',
    hover: '#a07415',
    iconColors: {
      'mode-bus': '#e8aa27',
      'mode-rail': '#8c4799',
      'mode-ferry': '#0064f0',
      'mode-ferry-pier': '#666666',
      'mode-funicular': '#ff00ff',
    },
  },

  appBarLink: { name: 'Föli', href: 'http://www.foli.fi/fi' },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,

    twitter: {
      site: '@Turkukaupunki',
    },
  },

  meta: {
    description: APP_DESCRIPTION,
  },

  title: APP_TITLE,

  favicon: './app/configurations/images/turku/turku-favicon.png',

  // Navbar logo
  logo: 'turku/foli-logo.png',

  vehicleRental: {
    networks: {
      donkey_turku: {
        capacity: BIKEAVL_WITHMAX,
        enabled: true,
        season: {
          start: '1.4',
          end: '23.12',
        },
        icon: 'citybike',
        name: {
          fi: 'Turku',
          sv: 'Åbo',
          en: 'Turku',
        },
        type: 'citybike',
        url: {
          fi: 'https://www.foli.fi/fi/aikataulut-ja-reitit/fölifillarit',
          sv: 'https://www.foli.fi/sv/fölicyklar',
          en: 'https://www.foli.fi/en/föli-bikes',
        },
      },
    },
  },

  transportModes: {
    bus: {
      color: '#e8aa27',
    },

    ferry: {
      availableForSelection: true,
      defaultValue: true,
      color: '#0064f0',
    },

    funicular: {
      availableForSelection: true,
      defaultValue: true,
      color: '#ff00ff',
    },

    citybike: {
      availableForSelection: true,
      color: '#f2b62d',
    },
  },

  nearYouModes: ['bus', 'ferry', 'citybike'],

  areaPolygon: [
    [21.145557, 59.963388],
    [21.145557, 60.950777],
    [22.939795, 60.950777],
    [22.939795, 59.963388],
  ],

  menu: {
    copyright: { label: `© Turun seudun joukkoliikenne ${walttiConfig.YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: {
          fi: 'https://opaskartta.turku.fi/eFeedback/fi/Feedback/35-Joukkoliikenne%20F%C3%B6li',
          sv: 'https://opaskartta.turku.fi/eFeedback/sv/Feedback/35-Kollektivtrafiken%20F%C3%B6li',
          en: 'https://opaskartta.turku.fi/eFeedback/en/Feedback/35-F%C3%96LI%20public%20transport',
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

  defaultEndpoint: {
    address: 'Kauppatori, Turku',
    lat: 60.451159,
    lon: 22.267633,
  },

  vehicles: true,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Seitsemän kunnan yhdessä järjestämä joukkoliikenne Turun seudulla alkoi 1.7.2014. Turun seudun joukkoliikenteessä eli Fölissä ovat mukana Turku, Kaarina, Raisio, Naantali, Lieto, Rusko ja Paimio. Seudullisen joukkoliikenteen alkamisen myötä joukkoliikenteen käyttö on helppoa ja edullista riippumatta kuntarajoista.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Kollektivtrafiken i Åboregionen inleds den 1 juli 2014 och ordnas samfällt av sju kommuner. Åbo, S:t Karins, Reso, Nådendal, Lundo, Rusko och Pemar deltar i Föli, dvs. kollektivtrafiken i Åboregionen. När den regionala kollektivtrafiken startar blir det lätt och förmånligt att använda kollektivtrafiken i regionen kring Åbo stad oberoende av kommungränserna.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'Public transport organised jointly between seven municipalities in the Turku region will start on 1 July 2014. Turku region public transport, under the name of Föli, is a collaboration between Turku, Kaarina, Raisio, Naantali, Lieto, Rusko and Paimio. With regional public transport, using the public transport system in Turku city region will be easy and inexpensive, regardless of municipal borders. Public transport service points will be introduced in each of the seven municipalities. You can use any of the service points.',
        ],
      },
    ],
  },

  staticMessages: [],
  geoJson: {
    layerConfigUrl: 'https://data.foli.fi/geojson/reittiopas',
  },

  showNearYouButtons: true,
  allowLogin: false,
  constantOperationStops: {
    'FUNI:9900': CONSTANT_OPERATION_PARAGRAPHS.fori,
    'FUNI:9901': CONSTANT_OPERATION_PARAGRAPHS.fori,
    'FUNI:9902': CONSTANT_OPERATION_PARAGRAPHS.funi,
    'FUNI:9903': CONSTANT_OPERATION_PARAGRAPHS.funi,
  },
  constantOperationRoutes: {
    'FUNI:1': CONSTANT_OPERATION_PARAGRAPHS.fori,
    'FUNI:2': CONSTANT_OPERATION_PARAGRAPHS.funi,
  },
  customWeights: {
    FERRY: 0.6,
    FUNICULAR: 0.1,
  },
});
