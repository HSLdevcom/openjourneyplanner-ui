/* eslint-disable prefer-template */
import { BIKEAVL_WITHMAX } from '../util/vehicleRentalUtils';

const CONFIG = 'hsl';
const API_URL = process.env.API_URL || 'https://dev-api.digitransit.fi';
const OTP_URL = process.env.OTP_URL || `${API_URL}/routing/v2/hsl/`;
const MAP_URL =
  process.env.MAP_URL || 'https://digitransit-dev-cdn-origin.azureedge.net';
const POI_MAP_PREFIX = `${MAP_URL}/map/v3/hsl`;
const APP_DESCRIPTION = 'Helsingin seudun liikenteen Reittiopas.';
const HSLTimetables = require('./timetableConfigUtils').default.HSL;
const HSLParkAndRideUtils = require('../util/ParkAndRideUtils').default.HSL;

const rootLink = process.env.ROOTLINK || 'https://test.hslfi.hsldev.com';

const BANNER_URL = process.env.CONTENT_DOMAIN
  ? `${process.env.CONTENT_DOMAIN}/api/v1/banners?site=JourneyPlanner`
  : process.env.BANNER_URL ||
    'https://cms-test.hslfi.hsldev.com/api/v1/banners?site=JourneyPlanner';
const SUGGESTION_URL = process.env.CONTENT_DOMAIN
  ? `${process.env.CONTENT_DOMAIN}/api/v1/search/suggestions`
  : 'https://content.hsl.fi/api/v1/search/suggestions'; // old url

const localStorageEmitter =
  process.env.USE_EMITTER && rootLink + '/local-storage-emitter';

export default {
  CONFIG,

  URL: {
    OTP: OTP_URL,
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
    FONT: 'https://www.hsl.fi/fonts/784131/6C5FB8083F348CFBB.css',
    FONTCOUNTER: 'https://cloud.typography.com/6364294/7432412/css/fonts.css',
    ROOTLINK: rootLink,
    BANNERS: BANNER_URL,
    HSL_FI_SUGGESTIONS: SUGGESTION_URL,
    EMBEDDED_SEARCH_GENERATION: '/reittiopas-elementti',
    EMISSIONS_INFO: {
      fi: 'https://www.hsl.fi/hsl/sahkobussit/ymparisto-lukuina',
      sv: 'https://www.hsl.fi/sv/reseplaneraren_co2',
      en: 'https://www.hsl.fi/en/journey_planner_co2',
    },
  },

  indexPath: 'etusivu',

  title: 'Reittiopas',

  availableLanguages: ['fi', 'sv', 'en'],
  availableTickets: {
    Sipoo: true,
  },
  defaultLanguage: 'fi',
  passLanguageToRootLink: true,

  favicon: './app/configurations/images/hsl/hsl-favicon.png',

  // Navbar logo
  logo: 'hsl/reittiopas-logo.svg',

  useCookiesPrompt: true,
  copyrightText: '© Copyright HSL',

  useRoutingFeedbackPrompt: true,

  feedIds: ['HSL', 'HSLlautta', 'Sipoo'],
  externalFeedIds: ['HSLlautta'],

  showHSLTracking: false,
  allowLogin: true,
  allowFavouritesFromLocalstorage: !process.env.OIDC_CLIENT_ID,
  loginAnalyticsEventName: 'user-hsl-id',
  loginAnalyticsKey: 'hsl-id',

  nearbyRoutes: {
    radius: 500,
    bucketSize: 100,
  },

  omitNonPickups: true,

  parkAndRide: {
    showParkAndRide: true,
    parkAndRideMinZoom: 13,
    url: {
      fi: 'https://www.hsl.fi/matkustaminen/liityntapysakointi',
      sv: 'https://www.hsl.fi/sv/att-resa/anslutningsparkering',
      en: 'https://www.hsl.fi/en/travelling/park--ride',
    },
    pageContent: {
      default: HSLParkAndRideUtils,
    },
  },

  showDisclaimer: true,

  stopsMinZoom: 14,
  mergeStopsByCode: true,
  useExtendedRouteTypes: true,
  colors: {
    primary: '#0074bf',
    accessiblePrimary: '#0074be',
    hover: '#0062a1',
    iconColors: {
      'mode-bus': '#007ac9',
      'mode-bus-express': '#CA4000',
      'mode-bus-local': '#007ac9',
      'mode-rail': '#8c4799',
      'mode-tram': '#008151',
      'mode-ferry': '#007A97',
      'mode-ferry-pier': '#666666',
      'mode-metro': '#CA4000',
      'mode-citybike': '#f2b62d',
      'mode-citybike-secondary': '#333333',
      'mode-speedtram': '#007E79',
    },
  },
  getAutoSuggestIcons: {
    citybikes: station => {
      if (station.properties.source === 'citybikesvantaa') {
        return ['citybike-stop-default-secondary', '#f2b62d'];
      }
      return ['citybike-stop-default', '#f2b62d'];
    },
  },
  iconModeSet: 'default',
  fontWeights: {
    medium: 500,
  },

  sprites: 'assets/svg-sprite.hsl.svg',

  appBarStyle: 'hsl',

  nationalServiceLink: {
    fi: {
      name: 'matka.fi',
      href: 'https://opas.matka.fi/',
    },
    sv: {
      name: 'matka.fi',
      href: 'https://opas.matka.fi/sv/',
    },
    en: {
      name: 'matka.fi',
      href: 'https://opas.matka.fi/en/',
    },
  },

  agency: {
    show: false,
  },

  socialMedia: {
    title: 'Reittiopas',
    description: APP_DESCRIPTION,

    image: {
      url: '/img/hsl-social-share.png',
      width: 400,
      height: 400,
    },

    twitter: {
      card: 'summary',
      site: '@HSL_HRT',
    },
  },

  meta: {
    description: APP_DESCRIPTION,
  },

  transportModes: {
    citybike: {
      availableForSelection: true,
    },
    scooter: {
      availableForSelection: true,
      defaultValue: false,
      showIfSelectedForRouting: true,
    },
    airplane: {
      availableForSelection: false,
      defaultValue: false,
    },
  },

  search: {
    /* identify searches for route numbers/labels: bus | train | metro */
    lineRegexp: /(^[0-9]+[a-z]?$|^[yuleapinkrtdz]$|(^m[12]?b?$))/i,
  },

  useSearchPolygon: true,

  areaPolygon: [
    [25.5345, 60.2592],
    [25.3881, 60.1693],
    [25.3559, 60.103],
    [25.3293, 59.9371],
    [24.2831, 59.78402],
    [24.2721, 59.95501],
    [24.2899, 60.00895],
    [24.3087, 60.01947],
    [24.1994, 60.12753],
    [24.1362, 60.1114],
    [24.1305, 60.12847],
    [24.099, 60.1405],
    [24.0179, 60.1512],
    [24.0049, 60.1901],
    [24.0445, 60.1918],
    [24.0373, 60.2036],
    [24.0796, 60.2298],
    [24.1652, 60.2428],
    [24.3095, 60.2965],
    [24.3455, 60.2488],
    [24.428, 60.3002],
    [24.5015, 60.2872],
    [24.4888, 60.3306],
    [24.5625, 60.3142],
    [24.5957, 60.3242],
    [24.6264, 60.3597],
    [24.666, 60.3638],
    [24.7436, 60.3441],
    [24.9291, 60.4523],
    [24.974, 60.5253],
    [24.9355, 60.5131],
    [24.8971, 60.562],
    [25.0388, 60.5806],
    [25.1508, 60.5167],
    [25.2242, 60.5016],
    [25.3661, 60.4118],
    [25.3652, 60.3756],
  ],

  menu: {},

  defaultEndpoint: {
    address: 'Rautatieasema, Helsinki',
    lat: 60.1710688,
    lon: 24.9414841,
  },

  redirectReittiopasParams: true,
  queryMaxAgeDays: 14, // to drop too old route request times from entry url

  timetables: {
    HSL: HSLTimetables,
  },

  aboutThisService: {
    fi: [
      {
        header: 'Tietoja palvelusta',
        paragraphs: [
          'Tervetuloa Reittioppaaseen! Reittiopas kertoo, miten pääset nopeasti ja helposti perille joukkoliikenteellä Helsingissä, Espoossa, Vantaalla, Kauniaisissa, Keravalla, Kirkkonummella, Sipoossa, Siuntiossa ja Tuusulassa. Reittiopas etsii nopeat reitit myös kävelyyn ja pyöräilyyn sekä rajatusti myös yksityisautoiluun. Reittiopas-palvelun tarjoaa HSL Helsingin seudun liikenne, ja se perustuu Digitransit-palvelualustaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Den här tjänsten erbjuds av HRT för reseplanering inom huvudstadsregionen (Helsingfors, Esbo, Vanda, Grankulla, Kervo, Kyrkslätt, Sibbo, Sjundeå och Tusby). Reseplaneraren täcker med vissa begränsningar kollektivtrafik, promenad, cykling samt privatbilism. Tjänsten baserar sig på Digitransit-plattformen.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'Welcome to the Journey Planner! The Journey Planner shows you how to get to your destination fast and easy by public transport in Helsinki, Espoo, Vantaa, Kauniainen, Kerava, Kirkkonummi, Sipoo, Siuntio and Tuusula. You can also use the planner to find fast walking and cycling routes, and to an extent, for driving directions. The Journey Planner is provided by HSL Helsinki Region Transport and it is based on the Digitransit service platform.',
        ],
      },
    ],
  },

  hideExternalOperator: agency => agency.name === 'Helsingin seudun liikenne',
  showTicketInformation: true,
  primaryAgencyName: {
    fi: 'HSL',
    sv: 'HRT',
    en: 'HSL',
  },

  maxNearbyStopDistance: {
    favorite: 20000,
    bus: 20000,
    tram: 20000,
    subway: 20000,
    rail: 20000,
    ferry: 20000,
    citybike: 20000,
  },

  prioritizedStopsNearYou: {
    ferry: ['HSL:1030701'],
  },

  showTicketSelector: false,

  staticMessages: [
    // {
    //   id: '2',
    //   priority: -1,
    //   content: {
    //     fi: [
    //       {
    //         type: 'text',
    //         content:
    //           'Käytämme evästeitä palveluidemme kehitykseen. Käyttämällä sivustoa hyväksyt evästeiden käytön. Lue lisää: ',
    //       },
    //       {
    //         type: 'a',
    //         content: 'Käyttöehdot',
    //         href: 'https://www.hsl.fi/kayttoehdot',
    //       },
    //       {
    //         type: 'a',
    //         content: 'Tietosuojaseloste',
    //         href: 'https://www.hsl.fi/tietosuojaseloste',
    //       },
    //     ],
    //     en: [
    //       {
    //         type: 'text',
    //         content:
    //           'We use cookies to improve our services. By using this site, you agree to its use of cookies. Read more: ',
    //       },
    //       {
    //         type: 'a',
    //         content: 'Terms of use',
    //         href: 'https://www.hsl.fi/en/terms-of-use',
    //       },
    //       {
    //         type: 'a',
    //         content: 'Privacy Statement',
    //         href: 'https://www.hsl.fi/en/description-of-the-file',
    //       },
    //     ],
    //     sv: [
    //       {
    //         type: 'text',
    //         content:
    //           'Vi använder cookies för att utveckla våra tjänster. Genom att använda webbplatsen godkänner du att vi använder cookies. Läs mer: ',
    //       },
    //       {
    //         type: 'a',
    //         content: 'Användarvillkor',
    //         href: 'https://www.hsl.fi/sv/anvandarvillkor',
    //       },
    //       {
    //         type: 'a',
    //         content: 'Dataskyddsbeskrivning',
    //         href: 'https://www.hsl.fi/sv/dataskyddsbeskrivning',
    //       },
    //     ],
    //   },
    // },
  ],
  geoJson: {
    layers: [
      {
        name: {
          fi: 'Vyöhykkeet',
          sv: 'Zoner',
          en: 'Zones',
        },
        url: '/assets/geojson/hsl_zone_lines_20190508.geojson',
      },
    ],
  },

  unknownZones: ['Ei HSL'],

  map: {
    showZoomControl: true,
    showLayerSelector: false,
    showStopMarkerPopupOnMobile: false,
    showScaleBar: true,
    // areBounds is for keeping map and user inside given area
    // HSL region + Lahti
    areaBounds: {
      corner1: [62, 27],
      corner2: [59, 22],
    },
  },

  showTicketPrice: false,
  useTicketIcons: true,
  ticketPurchaseLink: function purchaseTicketLink(fare) {
    return `https://open.app.hsl.fi/zoneTicketWizard/TICKET_TYPE_SINGLE_TICKET/${fare.ticketName}/adult/-`;
  },
  ticketLink: 'https://open.app.hsl.fi/tickets',
  ticketLinkOperatorCode: 'hsl',
  // mapping fareId from OTP fare identifiers to human readable form
  // in the new HSL zone model, just strip off the prefix 'HSL:'
  fareMapping: function mapHslFareId(fareId) {
    return fareId && fareId.substring
      ? fareId.substring(fareId.indexOf(':') + 1)
      : '';
  },
  ticketButtonTextId: 'open-app',

  trafficNowLink: {
    fi: 'matkustaminen/liikenne',
    en: 'travelling/services-now',
    sv: 'att-resa/Trafiken-just-nu',
  },

  localStorageEmitter,

  vehicleRental: {
    minZoomStopsNearYou: 10,
    showFullInfo: true,
    networks: {
      smoove: {
        enabled: true,
        season: {
          preSeasonStart: '18.3',
          start: '1.4',
          end: '31.10',
        },
        capacity: BIKEAVL_WITHMAX,
        icon: 'citybike',
        name: {
          fi: 'Helsinki ja Espoo',
          sv: 'Helsingfors och Esbo',
          en: 'Helsinki and Espoo',
        },
        type: 'citybike',
        returnInstructions: {
          fi: 'https://www.hsl.fi/kaupunkipyorat/helsinki/kayttoohje#palauta',
          sv: 'https://www.hsl.fi/sv/stadscyklar/helsingfors/anvisningar#aterlamna',
          en: 'https://www.hsl.fi/en/citybikes/helsinki/instructions#return',
        },
        // Shown if citybike leg duration exceeds timeBeforeSurcharge
        durationInstructions: {
          fi: 'https://www.hsl.fi/kaupunkipyorat/helsinki/kayttoohje#aja',
          sv: 'https://www.hsl.fi/sv/stadscyklar/helsingfors/anvisningar#cykla',
          en: 'https://www.hsl.fi/en/citybikes/helsinki/instructions#ride',
        },
        timeBeforeSurcharge: 60 * 60,
        showRentalStations: true,
      },
      vantaa: {
        enabled: true,
        season: {
          preSeasonStart: '18.3',
          start: '1.4',
          end: '31.10',
        },
        capacity: BIKEAVL_WITHMAX,
        icon: 'citybike-secondary',
        name: {
          fi: 'Vantaa',
          sv: 'Vanda',
          en: 'Vantaa',
        },
        type: 'citybike',
        returnInstructions: {
          fi: 'https://www.hsl.fi/kaupunkipyorat/vantaa/kayttoohje#palauta',
          sv: 'https://www.hsl.fi/sv/stadscyklar/vanda/anvisningar#aterlamna',
          en: 'https://www.hsl.fi/en/citybikes/vantaa/instructions#return',
        },
        durationInstructions: {
          fi: 'https://www.hsl.fi/kaupunkipyorat/vantaa/kayttoohje#aja',
          sv: 'https://www.hsl.fi/sv/stadscyklar/vanda/anvisningar#cykla',
          en: 'https://www.hsl.fi/en/citybikes/vantaa/instructions#ride',
        },
        timeBeforeSurcharge: 120 * 60,
        showRentalStations: true,
      },
      bolt_helsinki: {
        enabled: true,
        season: {
          alwaysOn: true,
        },
        icon: 'scooter',
        name: {
          fi: 'Bolt',
          sv: 'Bolt',
          en: 'Bolt',
        },
        type: 'scooter',
        showRentalVehicles: true,
        showRentalStations: false,
      },
    },
    buyUrl: {
      fi: 'https://www.hsl.fi/kaupunkipyorat?utm_campaign=kaupunkipyorat-omat&utm_source=reittiopas&utm_medium=referral#block-28474',
      sv: 'https://www.hsl.fi/sv/stadscyklar?utm_campaign=kaupunkipyorat-omat&utm_source=reittiopas&utm_medium=referral#block-28474',
      en: 'https://www.hsl.fi/en/citybikes?utm_campaign=kaupunkipyorat-omat&utm_source=reittiopas&utm_medium=referral#block-28474',
    },
    scooterInfoLink: {
      fi: {
        text: 'Potkulaudat',
        url: 'https://www.hsl.fi/reittiopas_potkulaudat',
      },
      en: {
        text: 'Scooters',
        url: 'https://www.hsl.fi/en/journey_planner_scooters',
      },
      sv: {
        text: 'Elsparkcyklar',
        url: 'https://www.hsl.fi/sv/reseplaneraren_sparkcyklar',
      },
    },
    maxMinutesToRentalJourneyEnd: 240,
  },

  showVehiclesOnItineraryPage: true,
  showBikeAndParkItineraries: true,
  bikeBoardingModes: {
    RAIL: { showNotification: false },
    FERRY: { showNotification: false },
  },

  // Notice! Turning on this setting forces the search for car routes (for the CO2 comparison only).
  showCO2InItinerarySummary: true,

  includeCarSuggestions: false,
  includeParkAndRideSuggestions: true,
  // Include both bike and park and bike and public, if bike is enabled
  includePublicWithBikePlan: true,
  // Park and ride and car suggestions separated into two switches
  separatedParkAndRideSwitch: false,

  parkingAreaSources: ['liipi'],

  showNearYouButtons: true,
  nearYouModes: [
    'favorite',
    'bus',
    'tram',
    'subway',
    'rail',
    'ferry',
    'citybike',
  ],
  narrowNearYouButtons: true,

  hostnames: [
    // DEV hostnames
    'https://next-dev.digitransit.fi',
    'https://dev.reittiopas.fi',
    // PROD hostnames
    'https://reittiopas.hsl.fi',
  ],
  zones: {
    stops: true,
    itinerary: true,
  },

  showSimilarRoutesOnRouteDropDown: true,
  useRealtimeTravellerCapacities: true,

  stopCard: {
    header: {
      virtualMonitorBaseUrl: 'https://omatnaytot.hsl.fi/',
    },
  },

  routeNotifications: [
    {
      showForRoute: route => route.gtfsId.slice(4)[0] === '7',
      id: 'uLineNotification',
      header: {
        fi: 'U-linja',
        en: 'U-line',
        sv: 'U-linje',
      },
      content: {
        fi: [
          'Mm. lastenvaunujen osalta noudatetaan liikennöitsijän sääntöjä.',
          'HSL-alueen ulkopuolelle käytetään liikennöitsijän lippuja.',
        ],
        en: [
          "The bus operators' regulations are applied e.g. to the transport of prams.",
          "The bus operators' tickets are used outside the HSL area.",
        ],
        sv: [
          'Trafikföretagets regler tillämpas t.ex. på barnvagnar.',
          'Trafikföretagets egna biljetter gäller utanför HRT-området.',
        ],
      },
      closeButtonLabel: {
        fi: 'Mitä U-linja tarkoittaa?',
        en: 'What does U-line mean?',
        sv: 'Vad betyder U-linje?',
      },
      link: {
        fi: 'hsl.fi/matkustaminen/u-liikenne/',
        en: 'hsl.fi/matkustaminen/u-liikenne/',
        sv: 'hsl.fi/sv/att-resa/U-trafik/',
      },
    },
    {
      showForRoute: route => route.type === 702,
      id: 'trunkRouteNotification',
      header: {
        fi: 'Runkolinja',
        en: 'Trunk route',
        sv: 'Stomlinje',
      },
      content: {
        fi: [
          'Pääset kyytiin myös keskiovista näyttämättä lippua kuljettajalle.',
          'Linja käyttää valikoituja pysäkkejä eli ei pysähdy kaikilla pysäkeillä.',
        ],
        en: [
          'Passengers can board the buses also through the middle doors.',
          'The bus will not serve all stops along the route.',
        ],
        sv: [
          'Man kan stiga på genom mittdörren och behöver inte visa upp sin biljett för föraren.',
          'För att snabba upp trafiken stannar bussarna inte vid alla hållplatser.',
        ],
      },
      closeButtonLabel: {
        fi: 'Mitä runkolinja tarkoittaa?',
        en: 'What does a trunk route mean?',
        sv: 'Vad betyder en Stomlinje?',
      },
      link: {
        fi: 'hsl.fi/hsl/runkoverkko',
        en: 'hsl.fi/en/hsl/trunk-route-network',
        sv: 'hsl.fi/sv/hrt/stomnatet',
      },
    },
    {
      showForRoute: route => route.type === 704,
      id: 'localRouteNotification',
      header: {
        fi: 'Lähibussi',
        en: 'Neighbourhood route',
        sv: 'Närbuss',
      },
      content: {
        fi: [
          'Kyytiin voi nousta ja kyydistä poistua pysäkkien lisäksi myös muualla, liikennesääntöjen puitteissa.',
          'Lähibussit soveltuvat myös ikäihmisten ja liikuntarajoitteisten käyttötarkoituksiin.',
        ],
        en: [
          'In addition to regular bus stops, the buses can stop at other locations, as long as it is safe to do so.',
          'The routes and timetables also serve the needs of senior citizens.',
        ],
        sv: [
          'Närbussarna kan inom ramen för trafikreglerna också stanna annanstans än vid markerade hållplatser.',
          'Rutterna och tidtabellerna servar även seniorer och rörelsehindrade.',
        ],
      },
      closeButtonLabel: {
        fi: 'Mitä lähibussi tarkoittaa?',
        en: 'What does a neigbourhood route mean?',
        sv: 'Vad betyder en närbuss?',
      },
      link: {
        fi: 'hsl.fi/matkustaminen/lahibussit',
        en: 'hsl.fi/en/travelling/neighborhood-buses',
        sv: 'hsl.fi/sv/att-resa/narbussar',
      },
    },
    {
      showForRoute: route => route.type === 900,
      id: 'speedtramNotification',
      header: {
        fi: 'Mitä pikaratikka tarkoittaa?',
        en: 'What is light rail?',
        sv: 'Vad är en snabbspårvagn?',
      },
      content: {
        fi: [
          'Pikaratikat kulkevat nopeammin ja pääosin omalla kaistalla erillään muusta liikenteestä.',
          'Pikaratikat ovat aiempaa tilavampia, joten matkustaminen sujuu mukavasti.',
        ],
        en: [
          'Light rail runs faster and mostly on a dedicated lane, separated from other traffic.',
          'Light rail vehicles are more spacious than traditional trams, improving travel comfort.',
        ],
        sv: [
          'Snabbspårvagnarna är snabbare och använder i regel en egen fil som är skild från annan trafik.',
          'Snabbspårvagnarna har mer utrymme och bidrar till bekvämare resor.',
        ],
      },
      closeButtonLabel: {
        fi: '',
        en: '',
        sv: '',
      },
      link: {
        fi: 'hsl.fi/reittiopas-pikaratikka',
        en: 'hsl.fi/en/campaigns/light-rail',
        sv: 'hsl.fi/sv/kampanjer/snabbsparvag',
      },
    },
  ],

  embeddedSearch: {
    title: {
      fi: 'Reittiopas-elementti',
      en: 'Journey Planner component',
      sv: 'Reseplanerare-element',
    },
    infoText: {
      fi: 'Luo Reittiopas-elementti ja lisää se omaan palveluusi. Hakukomponentin Hae reitti -painikkeesta siirrytään Reittioppaaseen.',
      en: 'Create your own Journey Planner component and add it to your own service. The search button of the component will redirect to the Journey Planner',
      sv: 'Skapa din egen Reseplanerare-element och lägg den till din webbtjänst. Sökknappen i element omdirigerar till Reseplaneraren.',
    },
    cookieLink: {
      fi: {
        text: 'Lisätietoa evästeistä',
        url: 'https://www.hsl.fi/hsl/tietosuoja',
      },
      en: {
        text: 'More information about cookies',
        url: 'https://www.hsl.fi/en/hsl/privacy-policy',
      },
      sv: {
        text: 'Mer information om cookies',
        url: 'https://www.hsl.fi/sv/hrt/Dataskydd',
      },
    },
  },

  startSearchFromUserLocation: true,

  navigationLogo: 'hsl/navigator-logo.svg',
  thumbsUpGraphic: 'hsl/thumbs-up.svg',

  // features that should not be deployed to production
  experimental: {
    navigation:
      process.env.RUN_ENV === 'development' ||
      process.env.NODE_ENV !== 'production',
  },
};
