/* eslint-disable prefer-template */
import safeJsonParse from '../util/safeJsonParser';
import { BIKEAVL_WITHMAX } from '../util/vehicleRentalUtils';

const CONFIG = process.env.CONFIG || 'default';
const API_URL = process.env.API_URL || 'https://dev-api.digitransit.fi';
const GEOCODING_BASE_URL =
  process.env.GEOCODING_BASE_URL || `${API_URL}/geocoding/v1`;
const MAP_URL = process.env.MAP_URL || 'https://dev-cdn.digitransit.fi';
const MAP_VERSION = process.env.MAP_VERSION || 'v3';
const POI_MAP_PREFIX = `${MAP_URL}/map/v3/finland`;
const OTP_URL = process.env.OTP_URL || `${API_URL}/routing/v2/finland/`;
const STOP_TIMETABLES_URL =
  process.env.STOP_TIMETABLES_URL || 'https://dev.kartat.hsl.fi';
const APP_PATH = process.env.APP_CONTEXT || '';
const {
  // AXE,
  NODE_ENV,
  API_SUBSCRIPTION_QUERY_PARAMETER_NAME,
  API_SUBSCRIPTION_HEADER_NAME,
  API_SUBSCRIPTION_TOKEN,
  RUN_ENV,
} = process.env;
const hasAPISubscriptionQueryParameter =
  API_SUBSCRIPTION_QUERY_PARAMETER_NAME && API_SUBSCRIPTION_TOKEN;
const PORT = process.env.PORT || 8080;
const APP_DESCRIPTION = 'Digitransit journey planning UI';
const OTP_TIMEOUT = process.env.OTP_TIMEOUT || 12000;
const YEAR = 1900 + new Date().getYear();
const realtime = require('./realtimeUtils').default;

const REALTIME_PATCH = safeJsonParse(process.env.REALTIME_PATCH) || {};

export default {
  PORT,
  // AXE,
  CONFIG,
  NODE_ENV,
  OTPTimeout: OTP_TIMEOUT,
  URL: {
    API_URL,
    ASSET_URL: process.env.ASSET_URL,
    MAP_URL,
    OTP: OTP_URL,
    MAP: {
      default: `${MAP_URL}/map/${MAP_VERSION}/hsl-map/`,
      sv: `${MAP_URL}/map/${MAP_VERSION}/hsl-map-sv/`,
      en: `${MAP_URL}/map/${MAP_VERSION}/hsl-map-en/`,
    },
    STOP_MAP: {
      default: `${POI_MAP_PREFIX}/fi/stops,stations/`,
      sv: `${POI_MAP_PREFIX}/sv/stops,stations/`,
    },
    RENTAL_STATION_MAP: {
      default: `${POI_MAP_PREFIX}/fi/rentalStations/`,
    },
    REALTIME_RENTAL_STATION_MAP: {
      default: `${POI_MAP_PREFIX}/fi/realtimeRentalStations/`,
    },
    REALTIME_RENTAL_VEHICLE_MAP: {
      default: `${POI_MAP_PREFIX}/fi/realtimeRentalVehicles/`,
    },
    PARK_AND_RIDE_MAP: {
      default: `${POI_MAP_PREFIX}/en/vehicleParking/`,
      sv: `${POI_MAP_PREFIX}/sv/vehicleParking/`,
      fi: `${POI_MAP_PREFIX}/fi/vehicleParking/`,
    },
    PARK_AND_RIDE_GROUP_MAP: {
      default: `${POI_MAP_PREFIX}/en/vehicleParkingGroups/`,
      sv: `${POI_MAP_PREFIX}/sv/vehicleParkingGroups/`,
      fi: `${POI_MAP_PREFIX}/fi/vehicleParkingGroups/`,
    },

    FONT: 'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Roboto:wght@400;700',
    PELIAS: `${process.env.GEOCODING_BASE_URL || GEOCODING_BASE_URL}/search${
      hasAPISubscriptionQueryParameter
        ? `?${API_SUBSCRIPTION_QUERY_PARAMETER_NAME}=${API_SUBSCRIPTION_TOKEN}`
        : ''
    }`,
    PELIAS_REVERSE_GEOCODER: `${
      process.env.GEOCODING_BASE_URL || GEOCODING_BASE_URL
    }/reverse${
      hasAPISubscriptionQueryParameter
        ? `?${API_SUBSCRIPTION_QUERY_PARAMETER_NAME}=${API_SUBSCRIPTION_TOKEN}`
        : ''
    }`,
    PELIAS_PLACE: `${
      process.env.GEOCODING_BASE_URL || GEOCODING_BASE_URL
    }/place${
      hasAPISubscriptionQueryParameter
        ? `?${API_SUBSCRIPTION_QUERY_PARAMETER_NAME}=${API_SUBSCRIPTION_TOKEN}`
        : ''
    }`,
    ROUTE_TIMETABLES: {
      HSL: `${API_URL}/timetables/v1/hsl/routes/`,
      tampere: 'https://www.nysse.fi/aikataulut-ja-reitit/linjat/',
    },
    STOP_TIMETABLES: {
      HSL: `${STOP_TIMETABLES_URL}/julkaisin-render/?component=Timetable`,
    },
    WEATHER_DATA:
      'https://opendata.fmi.fi/wfs?service=WFS&version=2.0.0&request=getFeature&storedquery_id=fmi::forecast::harmonie::surface::point::simple&timestep=5&parameters=temperature,WindSpeedMS,WeatherSymbol3',
    EMBEDDED_SEARCH_GENERATION: '/reittihakuelementti',
  },

  API_SUBSCRIPTION_QUERY_PARAMETER_NAME,
  API_SUBSCRIPTION_HEADER_NAME,
  API_SUBSCRIPTION_TOKEN,
  RUN_ENV,

  hasAPISubscriptionQueryParameter,

  hasAPISubscriptionHeader:
    API_SUBSCRIPTION_HEADER_NAME && API_SUBSCRIPTION_TOKEN,

  APP_PATH: `${APP_PATH}`,
  indexPath: '',
  title: 'Reittihaku',

  textLogo: false,
  // Navbar logo
  logo: 'default/digitransit-logo.png',

  searchParams: {},
  feedIds: [],

  realTime: realtime,
  realTimePatch: REALTIME_PATCH,

  // Google Tag Manager id
  GTMid: process.env.GTM_ID || null,
  /*
   * Define the icon and icon color used for each citybike station. Two icons are available,
   * 'citybike-stop-digitransit' and 'citybike-stop-digitransit-secondary'. For the first icon
   * the color controls the color of the background and for the second the color of the bicycle
   */
  getAutoSuggestIcons: {
    // eslint-disable-next-line no-unused-vars
    citybikes: station => {
      return ['citybike-stop-digitransit', '#f2b62d'];
    },
  },
  /*
   * by default search endpoints from all but gtfs sources, correct gtfs source
   * figured based on feedIds config variable
   */
  searchSources: ['oa', 'osm', 'nlsfi'],

  search: {
    suggestions: {
      useTransportIcons: false,
    },
    usePeliasStops: false,
    mapPeliasModality: false,
    peliasMapping: {},
    peliasLayer: null,
    peliasLocalization: null,
    minimalRegexp: /.{2,}/,
  },

  nearbyRoutes: {
    radius: 10000,
    bucketSize: 1000,
  },

  omitNonPickups: true,
  maxNearbyStopAmount: 5,
  maxNearbyStopRefetches: 5,
  maxNearbyStopDistance: {
    favorite: 20000,
    bus: 50000,
    tram: 20000,
    subway: 20000,
    rail: 50000,
    ferry: 50000,
    citybike: 20000,
    airplane: 100000,
  },

  defaultSettings: {
    accessibilityOption: 0,
    optimize: 'GREENWAYS',
    bikeSpeed: 5.55,
    ticketTypes: 'none',
    walkBoardCost: 120,
    walkReluctance: 1.8,
    walkSpeed: 1.2,
    transferPenalty: 0,
    minTransferTime: 90,
    includeBikeSuggestions: true,
    includeParkAndRideSuggestions: false,
    includeCarSuggestions: false,
    showBikeAndParkItineraries: false,
  },

  /**
   * These are used for dropdown selection of values to override the default
   * settings. This means that values ought to be relative to the current default.
   * If not, the selection may not make any sense.
   */
  defaultOptions: {
    walkReluctance: {
      least: 5,
      less: 3,
      more: 1,
      most: 0.2,
    },
    walkSpeed: [0.69, 0.97, 1.2, 1.67, 2.22],
    bikeSpeed: [2.77, 4.15, 5.55, 6.94, 8.33],
  },

  transferPenaltyHigh: 1600,

  suggestWalkMaxDistance: 10000,
  suggestBikeMaxDistance: 30000,
  // if you enable car suggestions but the linear distance between all points is less than this, then a car route will
  // not be computed
  suggestCarMinDistance: 2000,
  availableLanguages: [
    'fi',
    'sv',
    'en',
    'fr',
    'nb',
    'de',
    'da',
    'es',
    'ro',
    'pl',
  ],
  defaultLanguage: 'en',
  // This timezone data will expire in 2037
  timezoneData:
    'Europe/Helsinki|EET EEST|-20 -30|0101010101010101010101010101010101010|22k10 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|12e5',
  timeZone: 'Europe/Helsinki',
  allowLogin: false,
  allowFavouritesFromLocalstorage: true,
  useExtendedRouteTypes: false,
  mainMenu: {
    // Whether to show the left menu toggle button at all
    show: true,
    showDisruptions: true,
    showLoginCreateAccount: true,
    showOffCanvasList: true,
    showFrontPageLink: true,
    stopMonitor: {
      show: false,
    },
    showEmbeddedSearch: true,
  },

  itinerary: {
    // Wait time to show "wait leg"? e.g. 180 means over 3 minutes are shown as wait time.
    // Measured in seconds.
    waitThreshold: 180,
    // Number of days to include to the service time range from the future
    serviceTimeRange: 60,
  },

  map: {
    useRetinaTiles: true,
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 9,
    maxZoom: 18,
    controls: {
      zoom: {
        // available controls positions: 'topleft', 'topright', 'bottomleft, 'bottomright'
        position: 'bottomright',
      },
      scale: {
        position: 'bottomright',
      },
    },
    genericMarker: {
      // Do not render name markers at zoom levels below this value
      nameMarkerMinZoom: 18,

      popup: {
        offset: [106, 16],
        maxWidth: 250,
        minWidth: 250,
      },
    },

    line: {
      halo: {
        weight: 7,
        thinWeight: 2,
      },

      leg: {
        weight: 6,
        thinWeight: 2,
      },

      passiveColor: '#758993',
    },

    showZoomControl: true,
    showLayerSelector: true,
    showStopMarkerPopupOnMobile: true,
    showScaleBar: true,
    attribution:
      '<a tabIndex="-1" href="http://osm.org/copyright" target="_blank">© OpenStreetMap</a>',

    useModeIconsInNonTileLayer: false,
    // areBounds is for keeping map and user inside given area
    // Finland + Stockholm
    areaBounds: {
      corner1: [70.25, 32.25],
      corner2: [58.99, 17.75],
    },
  },

  stopCard: {
    header: {
      showDescription: true,
      showStopCode: true,
      showDistance: true,
    },
  },

  autoSuggest: {
    // Let Pelias suggest based on current user location
    locationAware: true,
  },

  vehicleRental: {
    // Config for map features. NOTE: availability for routing is controlled by
    // transportModes.citybike.availableForSelection
    showFullInfo: false,
    cityBikeMinZoom: 14,
    cityBikeSmallIconZoom: 14,
    // When should bikeshare availability be rendered in orange rather than green
    fewAvailableCount: 3,
    networks: {},
    capacity: BIKEAVL_WITHMAX,
    buyInstructions: {
      fi: 'Osta käyttöoikeutta päiväksi, viikoksi tai koko kaudeksi',
      sv: 'Köp ett abonnemang för en dag, en vecka eller för en hel säsong',
      en: 'Buy a daily, weekly or season pass',
    },
    maxNearbyRentalVehicleAmount: 5,
    maxDistanceToRentalVehiclesInMeters: 100,
    maxMinutesToRentalJourneyStart: 60,
    maxMinutesToRentalJourneyEnd: 720,
    allowDirectScooterJourneys: false,
  },

  // Lowest level for stops and terminals are rendered
  stopsMinZoom: 13,
  // Highest level when stops and terminals are still rendered as small markers
  stopsSmallMaxZoom: 14,
  // Highest level when terminals are still rendered instead of individual stops
  terminalStopsMaxZoom: 18,
  terminalStopsMinZoom: 12,
  // lowest zoom level when to draw rail platforms
  railPlatformsMinZoom: 15,
  terminalNamesZoom: 16,
  stopsIconSize: {
    small: 8,
    selected: 28,
    default: 18,
  },

  appBarStyle: 'default',

  colors: {
    primary: '#000F94',
    backgroundInfo: '#e5f2fa',
    iconColors: {
      'mode-airplane': '#0046ad',
      'mode-bus': '#0088ce',
      'mode-tram': '#6a8925',
      'mode-metro': '#ed8c00',
      'mode-rail': '#af8dbc',
      'mode-ferry': '#247C7B',
      'mode-citybike': '#f2b62d',
      'mode-scooter': '#C5CAD2',
    },
  },
  iconModeSet: 'digitransit',
  fontWeights: {
    medium: 700,
  },

  sprites: 'assets/svg-sprite.default.svg',

  disruption: {
    showInfoButton: true,
  },

  agency: {
    show: true,
  },

  socialMedia: {
    title: 'Digitransit',
    description: APP_DESCRIPTION,
    locale: 'en_US',

    image: {
      url: '/img/default-social-share.png',
      width: 2400,
      height: 1260,
    },

    twitter: {
      card: 'summary_large_image',
      site: '@hsldevcom',
    },
  },

  meta: {
    description: APP_DESCRIPTION,
    keywords: 'digitransit',
  },

  hideExternalOperator: () => false,
  useTicketIcons: false,

  // Control what transport modes that should be possible to select in the UI
  // and whether the transport mode is used in trip planning by default.
  transportModes: {
    bus: {
      availableForSelection: true,
      defaultValue: true,
    },

    tram: {
      availableForSelection: true,
      defaultValue: true,
    },

    rail: {
      availableForSelection: true,
      defaultValue: true,
    },

    subway: {
      availableForSelection: true,
      defaultValue: true,
    },

    airplane: {
      availableForSelection: true,
      defaultValue: true,
    },

    ferry: {
      availableForSelection: true,
      defaultValue: true,
    },

    funicular: {
      availableForSelection: false,
      defaultValue: false,
    },

    citybike: {
      availableForSelection: false,
      defaultValue: false, // always false
    },

    scooter: {
      availableForSelection: false,
      defaultValue: false, // always false
    },
  },

  moment: {
    relativeTimeThreshold: {
      seconds: 55,
      minutes: 59,
      hours: 23,
      days: 26,
      months: 11,
    },
  },

  areaPolygon: [
    [18.776, 60.3316],
    [18.9625, 60.7385],
    [19.8615, 60.8957],
    [20.4145, 61.1942],
    [20.4349, 61.9592],
    [19.7853, 63.2157],
    [20.4727, 63.6319],
    [21.6353, 63.8559],
    [23.4626, 64.7794],
    [23.7244, 65.3008],
    [23.6873, 65.8569],
    [23.2069, 66.2701],
    [23.4627, 66.8344],
    [22.9291, 67.4662],
    [23.0459, 67.9229],
    [20.5459, 68.7605],
    [20.0996, 69.14],
    [21.426, 69.4835],
    [21.9928, 69.4009],
    [22.9226, 68.8678],
    [23.8108, 69.0145],
    [24.6903, 68.8614],
    [25.2262, 69.0596],
    [25.4029, 69.7235],
    [26.066, 70.0559],
    [28.2123, 70.2496],
    [29.5813, 69.7854],
    [29.8467, 69.49],
    [28.9502, 68.515],
    [30.4855, 67.6952],
    [29.4962, 66.9232],
    [30.5219, 65.8728],
    [30.1543, 64.9646],
    [30.9641, 64.1321],
    [30.572, 63.7098],
    [31.5491, 63.3309],
    [31.9773, 62.9304],
    [31.576, 62.426],
    [27.739, 60.1117],
    [26.0945, 59.8015],
    [22.4235, 59.3342],
    [20.2983, 59.2763],
    [19.3719, 59.6858],
    [18.7454, 60.1305],
    [18.776, 60.3316],
  ],

  // Minimun distance between from and to locations in meters. User is noticed
  // if distance is less than this.
  minDistanceBetweenFromAndTo: 20,

  // If certain mode(s) only exist in limited number of areas, listing the areas as a list of polygons for
  // selected mode key will remove the mode(s) from queries if no coordinates in the query are within the polygon(s).
  // This reduces complexity in finding routes for the query.
  modePolygons: {},

  menu: {
    copyright: { label: `© Digitransit ${YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: 'https://github.com/HSLdevcom/digitransit-ui/issues',
      },
      {
        name: 'about-this-service',
        route: '/tietoja-palvelusta',
      },
    ],
  },

  // Default origin endpoint to use when user is outside of area
  defaultEndpoint: {
    address: 'Helsinki-Vantaan Lentoasema',
    lat: 60.317429,
    lon: 24.9690395,
  },

  defaultMapZoom: 12,

  availableRouteTimetables: {},

  routeTimetableUrlResolver: {},

  showTenWeeksOnRouteSchedule: true,

  useRealtimeTravellerCapacities: false,

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Palvelu kattaa joukkoliikenteen, kävelyn, pyöräilyn ja yksityisautoilun rajatuilta osin. Palvelu perustuu Digitransit-palvelualustaan.',
        ],
      },
      {
        header: 'Digitransit-palvelualusta',
        paragraphs: [
          'Reittiopas perustuu Digitransit-palvelualustaan, joka on Liikenteenohjausyhtiö Fintraffic Oy:n, Helsingin seudun liikenteen (HSL) ja Waltti Solutions Oy:n tarjoama avoimen lähdekoodin reititysalusta. Reittiehdotukset perustuvat arvioituihin ajoaikoihin. Digitransit tai muut tiedon hyödyntäjät eivät takaa ehdotetun yhteyden toteutumista eivätkä korvaa kulkuyhteyden toteutumatta jäämisestä mahdollisesti aiheutuvia vahinkoja. Palvelun käyttäjien tietoja ei tallenneta palveluun.',
        ],
      },
      {
        header: 'Tietolähteet',
        paragraphs: [
          'Tiedot perustuvat joukkoliikenneviranomaisten, liikennöitsijöiden, VR:n ja Finavian toimittamiin tietoihin. Tietolähteinä hyödynnetään Fintrafficin liikkumisen tietopalveluita, erityisesti liikkumispalveluiden avointa yhteyspistettä <a href="https://www.finap.fi/#/" target="_blank">Finap-palvelua</a>. Kartat, tiedot kaduista, rakennuksista, pysäkkien sijainnista ynnä muusta tarjoaa © OpenStreetMap contributors. Osoitetiedot tuodaan Digi- ja väestötietoviraston rakennusten osoitetietokannasta.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
      {
        header: 'Digitransit-plattformen',
        paragraphs: [
          'Reseplaneraren baseras på tjänsteplattformen Digitransit med öppen källkod, som är en tjänst som underhålls och utvecklas av Helsingforsregionens Trafik (HRT) Fintraffic Oy och Waltti Solutions Oy. Digitransit eller andra användare av informationen garanterar inte realiseringen av den föreslagna anslutningen och ersätter inte för eventuella skador som kan uppstå på grund av att transportförbindelsen inte fungerar. Tjänstanvändarnas information lagras inte i tjänsten.',
        ],
      },
      {
        header: 'Datakällor',
        paragraphs: [
          'Tjänsteinformationen baseras på information om kollektivtrafiken som tillhandahålls av kollektivtrafikmyndigheter, trafik operatörer, VR och Finavia. Fintraffics mobilitetsinformationstjänster används som datakällor, särskilt <a href="https://www.finap.fi/#/" target="_blank">National Access Point</a> för mobilitetstjänster FINAP Kartor, information om gator, byggnader, hållplatser och mer tillhandahålls av © OpenStreetMap-bidragsgivare. Adressuppgifter importeras från adressdatabasen till Myndigheten för Digitalisering och Befolkninsdata (DVV).',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'The service covers public transport, walking, cycling, and some private car use. Service is built on Digitransit platform.',
        ],
      },
      {
        header: 'Digitransit platform',
        paragraphs: [
          "The route planner is based on the open source Digitransit service platform, which is an service maintained and developed by Helsinki Region Transport (HRT) Traffic Management Company Fintraffic Oy and Waltti Solutions Oy. Route suggestions are based on estimated times. Digitransit or other users of the information do not guarantee the realization of the proposed connection and do not compensate for any damages that may arise from the failure of the transport connection. The service users' information is not stored in the service.",
        ],
      },
      {
        header: 'Data sources',
        paragraphs: [
          "The service information is based on public transport route information provided by public transport authorities, operators, VR and Finavia. Fintraffic's mobility information services are used as data sources, especially National Access Point for mobility services <a href='https://www.finap.fi/#/' target='_blank'>FINAP</a>. Maps, information about streets, buildings, bus stop locations and more is provided by © OpenStreetMap contributors. Address information is imported from the address database of the buildings of the Digital and Population Data Services Agency (DVV).",
        ],
      },
    ],
    nb: {},
    fr: {},
    de: {},
  },

  staticMessages: [],

  staticIEMessage: [
    {
      id: '3',
      priority: -1,
      content: {
        fi: [
          {
            type: 'text',
            content:
              'Palvelu ei tue käyttämääsi selainta. Päivitä selainohjelmasi tai lataa uusi selain oheisista linkeistä.\n',
          },
          {
            type: 'a',
            content: 'Google Chrome',
            href: 'https://www.google.com/chrome/',
          },
          {
            type: 'a',
            content: 'Firefox',
            href: 'https://www.mozilla.org/fi/firefox/new/',
          },
          {
            type: 'a',
            content: 'Microsoft Edge',
            href: 'https://www.microsoft.com/en-us/windows/microsoft-edge',
          },
        ],
        en: [
          {
            type: 'text',
            content:
              'The service does not support the browser you are using. Update your browser or download a new browser using the links below.\n',
          },
          {
            type: 'a',
            content: 'Google Chrome',
            href: 'https://www.google.com/chrome/',
          },
          {
            type: 'a',
            content: 'Firefox',
            href: 'https://www.mozilla.org/fi/firefox/new/',
          },
          {
            type: 'a',
            content: 'Microsoft Edge',
            href: 'https://www.microsoft.com/en-us/windows/microsoft-edge',
          },
        ],
        sv: [
          {
            type: 'text',
            content:
              'Tjänsten stöder inte den webbläsare som du har i bruk. Uppdatera din webbläsare eller ladda ner en ny webbläsare via nedanstående länk.\n',
          },
          {
            type: 'a',
            content: 'Google Chrome',
            href: 'https://www.google.com/chrome/',
          },
          {
            type: 'a',
            content: 'Firefox',
            href: 'https://www.mozilla.org/sv-SE/firefox/new/',
          },
          {
            type: 'a',
            content: 'Microsoft Edge',
            href: 'https://www.microsoft.com/en-us/windows/microsoft-edge',
          },
        ],
      },
    },
  ],

  /* Do not change order of theme map lines */
  /* key: name of theme, value: regex matching part of host name */
  themeMap: {
    hsl: '(reittiopas|next-dev.digitransit)',
    apphsl: '(test.digitransit)',
    turku: '(turku|foli)',
    lappeenranta: 'lappeenranta',
    joensuu: 'joensuu',
    oulu: '(oulu|osl)',
    hameenlinna: 'hameenlinna',
    matka: '(matka|^dev.digitransit)',
    vaasa: 'vaasa',
    walttiOpas: 'waltti',
    walttiTest: 'waltti-test',
    rovaniemi: 'rovaniemi',
    kouvola: 'kouvola',
    tampere: 'tampere',
    mikkeli: 'mikkeli',
    kotka: 'kotka',
    jyvaskyla: 'jyvaskyla',
    lahti: 'lahti',
    kuopio: 'kuopio',
    varely: '(seutuplus|varely)',
    kela: 'kelareitit',
    pori: 'pori',
    raasepori: '(raasepori|bosse)',
  },

  minutesToDepartureLimit: 9,

  routeCancelationAlertValidity: {
    before: 3600, // 1 hour
    after: 900, // 15 minutes
  },

  imperialEnabled: false,
  // this flag when true enables imperial measurements  'feet/miles system'

  vehicles: false,
  showVehiclesOnStopPage: false,
  trafficNowLink: '',

  timetables: {},

  showVehiclesOnItineraryPage: false,

  showWeatherInformation: true,
  showBikeAndParkItineraries: false,

  includeBikeSuggestions: true,
  includeCarSuggestions: false,
  includeParkAndRideSuggestions: false,
  // Park and ride and car suggestions separated
  separatedParkAndRideSwitch: false,

  showNearYouButtons: false,
  nearYouModes: [],
  narrowNearYouButtons: false,

  /* Option to disable the "next" column of the Route panel as it can be confusing sometimes: https://github.com/mfdz/digitransit-ui/issues/167 */
  displayNextDeparture: true,

  messageBarAlerts: false,

  availableTickets: {},
  zones: {
    stops: false,
    itinerary: false,
  },

  viaPointsEnabled: true,

  // Toggling this off shows the alert bodytext instead of the header
  showAlertHeader: true,

  showSimilarRoutesOnRouteDropDown: false,

  prioritizedStopsNearYou: {},

  constantOperationStops: {},
  constantOperationRoutes: {},

  embeddedSearch: {
    title: {
      fi: 'Reittihakuelementti',
      en: 'Route search element',
      sv: 'Ruttsökningselement',
    },
    infoText: {
      fi: 'Luo reittihakuelementti ja lisää se omaan palveluusi. Hakukomponentin Hae reitti -painikkeesta siirrytään Reittioppaaseen.',
      en: 'Create a route search element and add it to your own service. The Find route button in the search component will transfer you to the journey planner.',
      sv: 'Skapa ett ruttsökningselement och lägg det till din egen tjänst. Sök rutt-knappen i sökkomponenten tar dig till reseplaneraren.',
    },
  },

  showAlternativeLegs: true,
  // Notice! Turning on this setting forces the search for car routes (for the CO2 comparison only).
  showCO2InItinerarySummary: false,
  geoJsonSvgSize: 20,
  routeNotifications: [
    {
      showForBikeWithPublic: true,

      id: 'externalCostWithBike',

      content: {
        fi: [
          'Kulkuneuvossa mahdollisuus kuljettaa pyörää. ',
          'Tarkasta pyörän kuljettamisen mahdollinen maksullisuus operaattorilta.',
        ],
        en: [
          'There is a possibility to transport a bicycle in the vehicle. ',
          'Check the possible cost of transporting a bicycle from the operator.',
        ],
        sv: [
          'Möjlighet att transportera cykel i fordonet. ',
          'Kontrollera eventuell avgift för att transportera cykel från operatören.',
        ],
      },
    },
    {
      showForCarWithPublic: true,

      id: 'externalCostWithCar',

      content: {
        fi: [
          'Kulkuneuvossa mahdollisuus kuljettaa autoa. ',
          'Tarkasta auton kuljettamisen mahdollinen maksullisuus operaattorilta.',
        ],
        en: [
          'You can take your car on board. ',
          'Check with the transport operator if an additional fee will be charged for the transportation of cars.',
        ],
        sv: [
          'Du kan ta med bilen ombord. ',
          'Kontrollera med trafikoperatören om det är avgiftsbelagt att transportera bilar.',
        ],
      },
    },
  ],
  navigation: false,
  sendAnalyticsCustomEventGoals: false,
  shortenLongTextThreshold: 10, // for route number in itinerary summary
};
