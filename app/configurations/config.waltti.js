const API_URL = process.env.API_URL || 'https://dev-api.digitransit.fi';
const OTP_URL = process.env.OTP_URL || `${API_URL}/routing/v2/waltti/`;
const MAP_URL =
  process.env.MAP_URL || 'https://digitransit-dev-cdn-origin.azureedge.net';
const POI_MAP_PREFIX = `${MAP_URL}/map/v3/waltti`;
const APP_DESCRIPTION = 'Digitransit-reittiopas';
const YEAR = 1900 + new Date().getYear();
const HSLParkAndRideUtils = require('../util/ParkAndRideUtils').default.HSL;

export default {
  YEAR,
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
    REALTIME_RENTAL_VEHICLE_MAP: {
      default: `${POI_MAP_PREFIX}/fi/realtimeRentalVehicles/`,
    },
  },

  stopsMinZoom: 14,

  vehicleRental: {},

  search: {
    minimalRegexp: /.+/,
  },

  agency: {
    show: false,
  },

  meta: {
    description: APP_DESCRIPTION,
  },

  availableLanguages: ['fi', 'sv', 'en'],
  defaultLanguage: 'fi',

  showCO2InItinerarySummary: true,

  transportModes: {
    bus: {
      availableForSelection: true,
      defaultValue: true,
      nearYouLabel: {
        fi: 'Bussit ja lähipysäkit kartalla',
        sv: 'Bussar och hållplatser på kartan',
        en: 'Buses and nearby stops on map',
      },
    },

    rail: {
      availableForSelection: false,
      defaultValue: false,
      nearYouLabel: {
        fi: 'Junat ja lähiasemat kartalla',
        sv: 'Tåg och stationer på kartan',
        en: 'Trains and nearby stations on map',
      },
    },

    tram: {
      availableForSelection: false,
      defaultValue: false,
      nearYouLabel: {
        fi: 'Raitiovaunut ja lähipysäkit kartalla',
        sv: 'Spårvagnar och hållplatser på kartan',
        en: 'Trams and nearby stops on map',
      },
    },

    subway: {
      availableForSelection: false,
      defaultValue: false,
      nearYouLabel: {
        fi: 'Metrot ja lähiasemat kartalla',
        sv: 'Metro och stationer på kartan',
        en: 'Metro and nearby stations on map',
      },
    },

    citybike: {
      availableForSelection: false,
      defaultValue: false,
      nearYouLabel: {
        fi: 'Lähimmät kaupunkipyöräasemat',
        sv: 'Närmaste cykelstationer',
        en: 'The closest city bike stations',
      },
    },

    airplane: {
      availableForSelection: false,
      defaultValue: false,
      nearYouLabel: {
        fi: 'Lähimmät lentoasemat',
        sv: 'Närmaste flygplatser',
        en: 'The closest airports',
      },
    },

    ferry: {
      availableForSelection: false,
      defaultValue: false,
      nearYouLabel: {
        fi: 'Lähimmät lauttalaiturit',
        sv: 'Närmaste färjekajer',
        en: 'The closest ferry piers',
      },
    },

    funicular: {
      availableForSelection: false,
      defaultValue: false,
    },
  },

  nearbyModeSet: 'waltti',

  maxNearbyStopDistance: {
    bus: 30000,
    tram: 30000,
    rail: 50000,
    ferry: 50000,
    citybike: 30000,
  },

  redirectReittiopasParams: true,
  queryMaxAgeDays: 14,

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

  showNearYouButtons: true,
  nearYouButton: {
    borderRadius: '50%',
    color: '#000F94',
  },
  nearYouTitle: {
    fi: 'Aikataulut ja linjat',
    sv: 'Tidtabeller och linjer',
    en: 'Timetables and routes',
  },

  allowLogin: false,

  messageBarAlerts: true,

  includeCarSuggestions: true,
  includeParkAndRideSuggestions: true,
  // Park and ride and car suggestions separated into two switches
  separatedParkAndRideSwitch: true,
  showBikeAndParkItineraries: true,
  parkingAreaSources: ['liipi'],

  parkAndRide: {
    showParkAndRide: false,
    showParkAndRideForBikes: false,
    parkAndRideMinZoom: 13,
    pageContent: {
      default: HSLParkAndRideUtils,
    },
  },

  hostnames: [
    // DEV hostnames
    'https://dev-hameenlinna.digitransit.fi',
    'https://dev-joensuu.digitransit.fi',
    'https://dev-jyvaskyla.digitransit.fi',
    'https://dev-kotka.digitransit.fi',
    'https://dev-kouvola.digitransit.fi',
    'https://dev-kuopio.digitransit.fi',
    'https://dev-lahti.digitransit.fi',
    'https://dev-lappeenranta.digitransit.fi',
    'https://dev-mikkeli.digitransit.fi',
    'https://dev-oulu.digitransit.fi',
    'https://dev-pori.digitransit.fi',
    'https://dev-raasepori.digitransit.fi',
    'https://dev-rovaniemi.digitransit.fi',
    'https://dev-tampere.digitransit.fi',
    'https://dev-turku.digitransit.fi',
    'https://dev-vaasa.digitransit.fi',
    'https://dev-varely.digitransit.fi',
    'https://dev-waltti.digitransit.fi',
    // PROD hostnames
    'https://bosse.digitransit.fi',
    'https://reittiopas.hameenlinna.fi',
    'https://hameenlinna.digitransit.fi',
    'https://joensuu.digitransit.fi',
    'https://jyvaskyla.digitransit.fi',
    'https://kotka.digitransit.fi',
    'https://kouvola.digitransit.fi',
    'https://kuopio.digitransit.fi',
    'https://lahti.digitransit.fi',
    'https://lappeenranta.digitransit.fi',
    'https://mikkeli.digitransit.fi',
    'https://reittiopas.osl.fi',
    'https://pori.digitransit.fi',
    'https://rovaniemi.digitransit.fi',
    'https://reittiopas.tampere.fi',
    'https://repa.tampere.fi',
    'https://reittiopas.tampere.fi',
    'https://tampere.digitransit.fi',
    'https://turku.digitransit.fi',
    'https://reittiopas.foli.fi',
    'https://vaasa.digitransit.fi',
    'https://varely.digitransit.fi',
    'https://reittiopas.seutuplus.fi',
    'https://opas.waltti.fi',
  ],
  showDisclaimer: true,

  // mapping fareId from OTP fare identifiers to human readable form
  fareMapping: function mapFareId(fareId) {
    return fareId && fareId.substring
      ? fareId.substring(fareId.indexOf(':') + 1)
      : '';
  },

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
  ],

  ticketPurchaseLink: function purchaseTicketLink(fare, operatorCode) {
    const fareId = fare.fareProducts[0].product.id;
    const ticket = fareId?.substring
      ? fareId.substring(fareId.indexOf(':') + 1)
      : '';
    let zones = '';
    // Waltti wants zone ids, so map A to 01, B to 02 etc
    for (let i = 0; i < ticket.length; i++) {
      zones += `0${ticket.charCodeAt(i) - 64}`; // eslint-disable
    }
    return `https://waltti.fi/walttiapp/busTicket/?operator=${operatorCode}&ticketType=single&customerGroup=adult&zones=${zones}`;
  },
  ticketButtonTextId: 'buy-in-app',

  analyticsScript: function createAnalyticsScript(hostname) {
    // eslint-disable-next-line no-useless-escape
    return `<script defer data-domain="${hostname}" src="https://plausible.io/js/script.js"><\/script>\n`;
  },

  // features that should not be deployed to production
  experimental: {
    navigation:
      process.env.RUN_ENV === 'development' ||
      process.env.NODE_ENV !== 'production',
  },
};
