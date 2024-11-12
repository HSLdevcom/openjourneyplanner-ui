/* eslint-disable prefer-template */
import configMerger from '../util/configMerger';
import { BIKEAVL_BIKES } from '../util/vehicleRentalUtils';

const CONFIG = 'lahti';
const APP_TITLE = 'LSL reittiopas';
const APP_DESCRIPTION = 'Lahden seudun liikenteen reittiopas';
const walttiConfig = require('./config.waltti').default;

const minLat = 60.692506;
const maxLat = 61.790694;
const minLon = 24.873833;
const maxLon = 26.544819;

export default configMerger(walttiConfig, {
  CONFIG,

  appBarLink: { name: 'LSL.fi', href: 'http://www.lsl.fi/' },
  colors: {
    primary: '#0066B3',
    iconColors: {
      'mode-bus': '#0066B3',
    },
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    twitter: {
      site: '@LSL_fi',
    },
  },

  title: APP_TITLE,

  favicon: './app/configurations/images/lahti/lahti-favicon.png',

  // Navbar logo
  logo: 'lahti/lahti-logo.png',
  secondaryLogo: 'lahti/secondary-lahti-logo.png',

  feedIds: ['Lahti'],

  searchParams: {
    'boundary.rect.min_lat': minLat,
    'boundary.rect.max_lat': maxLat,
    'boundary.rect.min_lon': minLon,
    'boundary.rect.max_lon': maxLon,
  },

  areaPolygon: [
    [minLon, minLat],
    [minLon, maxLat],
    [maxLon, maxLat],
    [maxLon, minLat],
  ],

  defaultEndpoint: {
    address: 'Keskusta, Lahti',
    lat: 60.983552,
    lon: 25.656398,
  },

  menu: {
    copyright: { label: `© Lahti ${walttiConfig.YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: {
          fi: 'https://e-asiointi.lahti.fi/eFeedback/fi/Feedback/29-Joukkoliikenne',
          sv: 'https://e-asiointi.lahti.fi/eFeedback/sv/Feedback/29-Kollektivtrafik',
          en: 'https://e-asiointi.lahti.fi/eFeedback/en/Feedback/29-Public%20transport',
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
          'Tämän palvelun tarjoaa LSL joukkoliikenteen reittisuunnittelua varten Päijät-Hämeen alueella. Palvelu kattaa joukkoliikenteen, kävelyn, pyöräilyn ja yksityisautoilun rajatuilta osin. Palvelu perustuu Digitransit-palvelualustaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Den här tjänsten erbjuds av LSL för reseplanering inom Lahti region trafiken. Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'The Journey Planner shows you how to get to your destination fast and easy by public transport in Lahti region. You can also use the planner to find fast walking and cycling routes, and to an extent, for driving directions. The Journey Planner is provided by Lahti region transport and it is based on the Digitransit service platform.',
        ],
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
        url: '/assets/geojson/lahti_zone_lines_20230105.geojson',
      },
    ],
  },
  zoneIdMapping: {
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'D',
  },
  zones: {
    stops: true,
    itinerary: true,
  },

  vehicles: true,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,

  transportModes: {
    citybike: {
      availableForSelection: true,
    },
  },

  vehicleRental: {
    networks: {
      freebike_lahti: {
        enabled: true,
        season: {
          start: '24.4',
          end: '17.11',
        },
        capacity: BIKEAVL_BIKES,
        icon: 'citybike',
        name: {
          fi: 'Mankeli',
          sv: 'Mankeli',
          en: 'Mankeli',
        },
        type: 'citybike',
        url: {
          fi: 'https://kaupunkipyorat.lahti.fi/',
          sv: 'https://kaupunkipyorat.lahti.fi/?lang=19',
          en: 'https://kaupunkipyorat.lahti.fi/?lang=2',
        },
      },
    },
  },

  showTicketInformation: true,
  useTicketIcons: true,
  ticketLink: 'https://www.lsl.fi/liput-ja-hinnat/',
  showTicketPrice: true,

  showTicketLinkOnlyWhenTesting: true,
  settingsForFeatureTesting: {
    walkSpeed: 0.69,
    bikeSpeed: 8.33,
    includeBikeSuggestions: false,
    transferPenalty: 1600,
  },
  ticketLinkOperatorCode: 50223,
});
