/* eslint-disable prefer-template */

const matkaConfig = require('./config.matka').default;
const HSLParkAndRideUtils = require('../util/ParkAndRideUtils').default.HSL;

const CONFIG = 'kela';
const APP_TITLE = 'Reittiopas';
const APP_DESCRIPTION = 'Digitransit-reittiopas';
const API_URL = process.env.API_URL || 'https://dev-api.digitransit.fi';
const OTP_URL = process.env.OTP_URL || `${API_URL}/routing/v2-kela/kela/`;
const MAP_URL =
  process.env.MAP_URL || 'https://digitransit-dev-cdn-origin.azureedge.net';
const POI_MAP_PREFIX = `${MAP_URL}/map/v3-kela/kela`;

export default {
  CONFIG,
  title: APP_TITLE,
  OTPTimeout: process.env.OTP_TIMEOUT || 30000,
  URL: {
    OTP: OTP_URL,

    // read stops and stations OTP2 vector map tile server
    STOP_MAP: {
      default: `${POI_MAP_PREFIX}/fi/stops,stations/`,
      sv: `${POI_MAP_PREFIX}/sv/stops,stations/`,
    },
  },

  favicon: './app/configurations/images/default/default-favicon.png',
  feedIds: ['kela', 'matkahuolto', 'lansilinjat'],
  textLogo: true,
  logo: null, // override default logo from matka config

  meta: {
    description: APP_DESCRIPTION,
  },
  menu: {
    copyright: null,
    content: [
      {
        name: 'accessibility-statement',
        href: {
          fi: 'https://www.digitransit.fi/accessibility',
          sv: 'https://www.digitransit.fi/accessibility',
          en: 'https://www.digitransit.fi/en/accessibility',
        },
      },
      {
        name: 'about-these-pages',
        href: '/tietoja-palvelusta',
      },
    ],
  },

  transportModes: {
    citybike: {
      availableForSelection: false,
      default: false,
    },
    airplane: {
      availableForSelection: false,
      default: false,
    },
    walk: {
      availableForSelection: false,
      default: false,
    },
    car: {
      availableForSelection: true,
      default: false,
    },
  },
  suggestCarMinDistance: 0,
  showWeatherInformation: false,
  showDistanceBeforeDuration: true,
  hideItinerarySettings: true,
  showTransitLegDistance: true,
  showDistanceInItinerarySummary: false,
  hideWalkOption: true,
  alwaysShowDistanceInKm: true,
  defaultSettings: {
    ...matkaConfig.defaultSettings,
    includeCarSuggestions: true,
    includeBikeSuggestions: false,
    includeParkAndRideSuggestions: false,
  },
  mainMenu: {
    showDisruptions: false,
    stopMonitor: {
      show: false,
    },
    showEmbeddedSearch: false,
    countrySelection: [],
  },

  availableLanguages: ['fi', 'sv', 'en'],
  defaultLanguage: 'fi',

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    locale: 'fi_FI',
  },

  colors: {
    primary: '#002c74',
    iconColors: {
      'mode-airplane': '#0046AD',
      'mode-bus': '#007ac9',
      'mode-tram': '#5E7921',
      'mode-metro': '#CA4000',
      'mode-rail': '#8E5EA0',
      'mode-ferry': '#247C7B',
      'mode-ferry-pier': '#666666',
      'mode-citybike': '#FCBC19',
      'mode-citybike-secondary': '#333333',
    },
  },

  additionalFeedIds: {
    estonia: ['Vikingline', 'Viro'],
  },

  additionalSearchParams: {
    default: {
      'boundary.country': 'FIN',
    },
    estonia: {
      'boundary.country': 'EST',
    },
  },

  feedIdFiltering: true,

  stopSearchFilter: stop => {
    const props = stop.properties;
    if (
      props?.id?.includes('GTFS:HSL') &&
      props?.addendum?.GTFS?.modes?.includes('RAIL')
    ) {
      return false;
    }
    return true;
  },

  routeTimetables: {
    // route timetable data needs to be up-to-date before this is enabled
    //  HSL: HSLRouteTimetable,
  },

  redirectReittiopasParams: true,
  map: {
    minZoom: 5,
    areaBounds: {
      corner1: [70.25, 32.25],
      corner2: [55.99, 17.75],
    },
  },
  suggestBikeMaxDistance: 2000000,

  getAutoSuggestIcons: {
    citybikes: station => {
      if (
        station.properties.source === 'citybikesdonkey_hamina' ||
        station.properties.source === 'vantaa'
      ) {
        return ['citybike-stop-digitransit-secondary', '#FCBC19'];
      }
      return ['citybike-stop-digitransit', '#FCBC19'];
    },
  },

  hideFavourites: true,
  hideStopRouteSearch: true,

  hideMapLayersByDefault: true,
  hideCarSuggestionDuration: true,

  hideWalkLegDurationSummary: true,
  emphasizeDistance: true,
  emphasizeOneWayJourney: true,

  terminalStopsMinZoom: 14,

  useRealtimeTravellerCapacities: false,

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Reittiopasta käytetään Kelan matkaetuuksien hakemisessa ja myöntämisessä. Voit selvittää reittioppaalla matkasi tietoja kuten matkan pituuden, kulkutavan ja matkustusajan. Reittiopasta hyödynnetään Kelan <a href="https://www.kela.fi/koulumatkatuki">koulumatkatuessa</a> sekä <a href="https://www.kela.fi/matkat">terveydenhuollon ja kuntoutuksen matkakorvauksissa</a>.',
          'Kela ei vastaa reittioppaan tiedoista. Jos havaitset reittioppaassa puutteita tai virheitä, ole yhteydessä palvelun tietojen toimittajaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Reseplaneraren används vid ansökan om och beviljande av reseförmåner från FPA. Med hjälp av reseplaneraren ser du uppgifter om din resa, såsom resans längd, färdsätt och restid. Reseplaneraren används för FPA:s <a href="https://www.kela.fi/skolresestod">skoleresestöd</a> samt <a href="https://www.kela.fi/resor">reseersättningar i samband med hälso- och sjukvård och rehabilitering</a>.',
          'FPA svarar inte för uppgifterna i reseplaneraren. Om du märker brister eller fel i reseplaneraren ska du kontakta den som levererar uppgifter till tjänsten.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'The journey planner is used when applying for and granting travel-related benefits from Kela. In the journey planner, you can see information about your trip, for instance travel distance, mode of transport and travel time. The journey planner is used for <a href="https://www.kela.fi/school-transport-subsidy">school transport subsidy</a> and <a href="https://www.kela.fi/travel-costs">reimbursements of travel expenses in connection with health care and rehabilitation</a>.',
          'Kela is not responsible for the information in the journey planner. If you notice inaccuracies or incorrect information in the journey planner, you should contact the supplier of information to the service.',
        ],
      },
    ],
  },
  staticMessagesUrl: process.env.STATIC_MESSAGE_URL,

  showNearYouButtons: false,
  narrowNearYouButtons: true,
  nearYouModes: [
    'bus',
    'tram',
    'subway',
    'rail',
    'ferry',
    'citybike',
    'airplane',
  ],
  useAlternativeNameForModes: ['rail'],

  showVehiclesOnStopPage: false,
  showVehiclesOnItineraryPage: false,

  includeCarSuggestions: true,
  includeParkAndRideSuggestions: true,
  // Park and ride and car suggestions separated into two switches
  separatedParkAndRideSwitch: true,
  showBikeAndParkItineraries: true,

  parkingAreaSources: ['liipi'],

  parkAndRide: {
    showParkAndRide: false,
    parkAndRideMinZoom: 13,
    pageContent: {
      default: HSLParkAndRideUtils,
    },
  },

  sourceForAlertsAndDisruptions: {
    HSL: {
      fi: 'Helsingin seutu',
      sv: 'Helsingforsregion',
      en: 'Helsinki region',
    },
    tampere: {
      fi: 'Tampereen seutu',
      sv: 'Tammerforsregion',
      en: 'Tampere region',
    },
    LINKKI: {
      fi: 'Jyväskylän seutu',
      sv: 'Jyväskyläregion',
      en: 'Jyväskylä region',
    },
    OULU: {
      fi: 'Oulu',
      sv: 'Uleåborg',
      en: 'Oulu',
    },
    Rauma: {
      fi: 'Rauma',
      sv: 'Raumo',
      en: 'Rauma',
    },
    Hameenlinna: {
      fi: 'Hämeenlinna',
      sv: 'Tavastehus',
      en: 'Hämeenlinna',
    },
    Kotka: {
      fi: 'Kotkan seutu',
      sv: 'Kotkaregion',
      en: 'Kotka region',
    },
    Kouvola: {
      fi: 'Kouvola',
      sv: 'Kouvola',
      en: 'Kouvola',
    },
    Lappeenranta: {
      fi: 'Lappeenranta',
      sv: 'Villmanstrand',
      en: 'Lappeenranta',
    },
    Mikkeli: {
      fi: 'Mikkeli',
      sv: 'S:t Michel',
      en: 'Mikkeli',
    },
    Vaasa: {
      fi: 'Vaasan seutu',
      sv: 'Vasaregion',
      en: 'Vaasa region',
    },
    Joensuu: {
      fi: 'Joensuun seutu',
      sv: 'Joensuuregion',
      en: 'Joensuu region',
    },
    FOLI: {
      fi: 'Turun seutu',
      sv: 'Åboregion',
      en: 'Turku region',
    },
    Lahti: {
      fi: 'Lahden seutu',
      sv: 'Lahtisregion',
      en: 'Lahti region',
    },
    Kuopio: {
      fi: 'Kuopion seutu',
      sv: 'Kuopioregion',
      en: 'Kuopio region',
    },
    Rovaniemi: {
      fi: 'Rovaniemi',
      sv: 'Rovaniemi',
      en: 'Rovaniemi',
    },
    Kajaani: {
      fi: 'Kajaani',
      sv: 'Kajana',
      en: 'Kajaani',
    },
    Salo: {
      fi: 'Salo',
      sv: 'Salo',
      en: 'Salo',
    },
    Pori: {
      fi: 'Pori',
      sv: 'Björneborg',
      en: 'Pori',
    },
    Raasepori: {
      fi: 'Raasepori',
      sv: 'Raseborg',
      en: 'Raasepori',
    },
    VARELY: {
      fi: 'Varsinais-Suomi',
      sv: 'Egentliga Finland',
      en: 'Varsinais-Suomi',
    },
  },
  stopCard: {
    header: {
      virtualMonitorBaseUrl: 'https://matkamonitori.digitransit.fi/',
    },
  },
  // Notice! Turning on this setting forces the search for car routes (for the CO2 comparison only).
  showCO2InItinerarySummary: false,
  useAssembledGeoJsonZones: 'isOnByDefault',

  bikeBoardingModes: {
    RAIL: { showNotification: true },
    TRAM: { showNotification: true },
    FERRY: { showNotification: true },
    BUS: { showNotification: true },
  },
  // Include both bike and park and bike and public, if bike is enabled
  includePublicWithBikePlan: true,
};
