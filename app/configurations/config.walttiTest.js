/* eslint-disable prefer-template */
import configMerger from '../util/configMerger';

const CONFIG = 'walttiTest';
const APP_TITLE = 'Waltin testireittiopas';
const API_URL = process.env.API_URL || 'https://dev-api.digitransit.fi';
const OTP_URL = process.env.OTP_URL || `${API_URL}/routing/v2/waltti-alt/`;
const MAP_URL =
  process.env.MAP_URL || 'https://digitransit-dev-cdn-origin.azureedge.net';
const POI_MAP_PREFIX = `${MAP_URL}/map/v3/waltti-alt`;

const ouluConfig = require('./config.oulu').default;

export default configMerger(ouluConfig, {
  CONFIG,

  feedIds: ['WalttiTest'],

  title: APP_TITLE,

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
  },

  staticMessages: [
    {
      id: 'walttitest_msg_17.6.2024',
      priority: -1,
      persistence: 'repeat',
      content: {
        fi: [
          {
            type: 'heading',
            content: 'Käytät Waltin testireittiopasta',
          },
          {
            type: 'text',
            content: '',
          },
        ],
        sv: [
          {
            type: 'heading',
            content: 'Du använder Walttis test reseplanerare',
          },
          {
            type: 'text',
            content: '',
          },
        ],
        en: [
          {
            type: 'heading',
            content: 'You are using Waltti test journey planner',
          },
          {
            type: 'text',
            content: '',
          },
        ],
      },
    },
  ],
});
