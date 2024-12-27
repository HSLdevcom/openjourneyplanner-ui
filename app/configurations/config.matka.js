/* eslint-disable prefer-template */
import HSLConfig from './config.hsl';
import TurkuConfig from './config.turku';
import LappeenrantaConfig from './config.lappeenranta';
import TampereConfig from './config.tampere';
import KotkaConfig from './config.kotka';
import KouvolaConfig from './config.kouvola';
import KuopioConfig from './config.kuopio';
import LahtiConfig from './config.lahti';

const CONFIG = 'matka';
const APP_DESCRIPTION = 'Matka.fi–palvelu.';
const APP_TITLE = 'Matka.fi';
const YEAR = 1900 + new Date().getYear();

const HSLParkAndRideUtils = require('../util/ParkAndRideUtils').default.HSL;

// route timetable data needs to be up-to-date before this is enabled
// const HSLRouteTimetable = require('./timetableConfigUtils').default.HSLRoutes;

export default {
  CONFIG,
  OTPTimeout: process.env.OTP_TIMEOUT || 30000,
  URL: {
    FONT: 'https://digitransit-prod-cdn-origin.azureedge.net/matka-fonts/roboto/roboto+montserrat.css',
  },

  mainMenu: {
    stopMonitor: {
      show: true,
      url: 'https://matkamonitori.digitransit.fi/createview',
    },
    countrySelection: ['estonia'],
  },

  availableLanguages: ['fi', 'sv', 'en'],
  defaultLanguage: 'fi',

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    locale: 'fi_FI',
  },

  title: APP_TITLE,

  // Navbar logo
  logo: 'matka/matka-logo.svg',

  favicon: './app/configurations/images/matka/matka-favicon.svg',

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
      'mode-scooter': '#C5CAD2',
    },
  },
  feedIds: [
    'MATKA',
    'HSL',
    'LINKKI',
    'tampere',
    'OULU',
    'digitraffic',
    'Rauma',
    'Hameenlinna',
    'Kotka',
    'Kouvola',
    'Lappeenranta',
    'Mikkeli',
    'Vaasa',
    'Joensuu',
    'FOLI',
    'Lahti',
    'Kuopio',
    'Rovaniemi',
    'Kajaani',
    'Salo',
    'Pori',
    'Raasepori',
    'VARELY',
    'Harma',
    'PohjolanMatka',
    'Korsisaari',
  ],

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

  meta: {
    description: APP_DESCRIPTION,
    keywords: `reitti,reitit,opas,reittiopas,joukkoliikenne`,
  },

  menu: {
    copyright: { label: `© Matka.fi ${YEAR}` },
    content: [
      {
        name: 'traficom',
        href: 'https://www.traficom.fi/fi/liikenne/liikennejarjestelma/joukkoliikenteen-informaatiopalvelut',
      },
      {
        name: 'about-service-feedback',
        href: 'http://www.matka.fi',
      },
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
        href: 'https://traficom.fi/fi/tietoa-matkafi-sivustosta',
      },
    ],
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

  vehicleRental: {
    useAllSeasons: true,
    networks: {
      ...HSLConfig.vehicleRental.networks,
      ...TampereConfig.vehicleRental.networks,
      ...TurkuConfig.vehicleRental.networks,
      ...KuopioConfig.vehicleRental.networks,
      ...LahtiConfig.vehicleRental.networks,
      ...LappeenrantaConfig.vehicleRental.networks,
      ...KotkaConfig.vehicleRental.networks,
      ...KouvolaConfig.vehicleRental.networks,
    },
    scooterInfoLink: {
      fi: {
        text: 'Potkulaudat',
        url: 'https://www.fintraffic.fi/fi/uutiset/sahkopotkulaudat-nyt-mukana-opasmatkafi-reittioppaassa',
      },
      en: {
        text: 'Scooters',
        url: 'https://www.fintraffic.fi/en/news/electric-scooters-now-included-opasmatkafi-journey-planner',
      },
      sv: {
        text: 'Elsparkcyklar',
        url: 'https://www.fintraffic.fi/sv/nyheter/elsparkcyklarna-finns-nu-med-i-reseplaneraren-opasmatkafi',
      },
    },
  },

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

  transportModes: {
    citybike: {
      availableForSelection: true,
    },
    scooter: {
      availableForSelection: true,
      defaultValue: false,
    },
  },

  useRealtimeTravellerCapacities: true,

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Tämän palvelun tarjoaa Traficomin joukkoliikenteen reittisuunnittelua varten koko Suomen alueella. Palvelu kattaa joukkoliikenteen, kävelyn, pyöräilyn ja yksityisautoilun rajatuilta osin. Palvelu perustuu Digitransit-palvelualustaan. Reittiehdotukset perustuvat arvioituihin ajoaikoihin. Ehdotetun yhteyden toteutumista ei voida kuitenkaan taata. Kulkuyhteyden toteutumatta jäämisestä mahdollisesti aiheutuvia vahinkoja ei korvata.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Den här tjänsten erbjuds av Traficom för reseplanering inom hela Finland. Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'This service is provided by Traficom for journey planning and information in Finland. The service covers public transport, walking, cycling, and some private car use. Service is built on Digitransit platform.',
        ],
      },
    ],
  },
  staticMessagesUrl: process.env.STATIC_MESSAGE_URL,

  showNearYouButtons: true,
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
  showVehiclesOnItineraryPage: true,

  includeCarSuggestions: true,
  includeParkAndRideSuggestions: true,
  // Park and ride and car suggestions separated into two switches
  separatedParkAndRideSwitch: true,
  showBikeAndParkItineraries: true,

  parkingAreaSources: ['liipi'],

  parkAndRide: {
    showParkAndRide: true,
    showParkAndRideForBikes: true,
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
  showCO2InItinerarySummary: true,
  useAssembledGeoJsonZones: 'isOffByDefault',

  bikeBoardingModes: {
    RAIL: { showNotification: true },
    TRAM: { showNotification: true },
    FERRY: { showNotification: true },
    BUS: { showNotification: true },
  },

  carBoardingModes: {
    FERRY: { showNotification: true },
  },

  disabledLegTextModes: ['ferry'],

  // Include both bike and park and bike and public, if bike is enabled
  includePublicWithBikePlan: true,

  startSearchFromUserLocation: true,

  minTransferTimeSelection: [
    {
      title: '1.5 min',
      value: 90,
    },
    {
      title: '3 min',
      value: 180,
    },
    {
      title: '5 min',
      value: 300,
    },
    {
      title: '7 min',
      value: 420,
    },
    {
      title: '10 min',
      value: 600,
    },
    {
      title: '30 min',
      value: 1800,
    },
  ],
};
