/* eslint-disable */
import configMerger from '../util/configMerger';

const CONFIG = 'vaasa';
const APP_TITLE = 'Vaasan reittiopas';
const APP_DESCRIPTION = '';

const walttiConfig = require('./config.waltti').default;

const minLat = 63.005;
const maxLat = 63.152;
const minLon = 21.527;
const maxLon = 22.170;

export default configMerger(walttiConfig, {
  CONFIG,

  appBarLink: { name: 'Vaasa', href: 'https://www.vaasa.fi/' },

  colors: {
    primary: '#000a8c',
    iconColors: {
      'mode-bus': '#000a8c',
    },
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,

    twitter: {
      site: '@vaasavasa',
    },
  },

  title: APP_TITLE,

  logo: 'vaasa/vaasa-favicon.png',
  secondaryLogo: 'vaasa/secondary-logo.png',

  feedIds: ['Vaasa'],

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
    address: 'Kauppatori',
    lat: 63.096,
    lon: 21.616,
  },

  menu: {
    copyright: { label: `© Vaasa ${walttiConfig.YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: { 
          fi: 'https://kartta.vaasa.fi/eFeedback/fi/Feedback/6-Joukkoliikenne',
          sv: 'https://kartta.vaasa.fi/eFeedback/sv/Feedback/6-Kollektivtrafik',
          en: 'https://kartta.vaasa.fi/eFeedback/fi/Feedback/6-Joukkoliikenne',
        }
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
          'Reittiopas-palvelu perustuu Digitransit-palvelualustaan ja tarjoaa Vaasan kaupungin joukkoliikenteen reittisuunnittelun. Palvelu paikantaa sijaintisi ja kertoo lähimmät linjat, pysäkit ja reitit reaaliaikaisesti. Palvelusta löydät paikallisen ja muutaman seudullisen joukkoliikenteen reitit ja aikataulut.',
          'Reittiopas näyttää Vaasan joukkoliikenteen linja-autojen gps-seurantaan perustuvia, reaaliaikaisia aikatauluarvioita sekä aikataulusuunnitelman mukaisia aikataulutietoja. Reaaliaikaisena tieto näkyy silloin, kun vuoro on liikkeellä ja lähettää palveluun seurantatietoa. Reaaliaikaisen tiedon tunnistaa saapumisajan ohessa vilkkuvasta reaaliaikasymbolista.',
          'Huom. Ole ajoissa pysäkillä, sillä välipysäkeille ei jäädä odottamaan arvion mukaista lähtöaikaa, vaan auton matka jatkuu välittömästi.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Tjänsten Reseplaneraren grundar sig på plattformen Digitransit och erbjuder ruttsökning i Vasa stads kollektivtrafik. Tjänstens lokaliserar var du är och berättar var de närmaste linjerna, hållplatserna och rutterna finns i realtid. I tjänsten hittar du rutter och tidtabeller till de lokala bussarna och även några regionala bussar i kollektivtrafiken.',
          'Reseplaneraren visar tidtabellsuppskattningar i realtid, vilka grundar sig på gps-uppföljning av bussarna i Vasas kollektivtrafik samt tidtabellsuppgifter enligt tidtabellsplanen. Informationen kan ses i realtid, då en buss är i rörelse och sänder uppgifter om sin färd till tjänsten. Uppgiften i realtid identifieras utöver av ankomsttiden också av en blinkande realtidssymbol.',
          'Obs! Var i tid på hållplatsen, eftersom bussen inte stannar och väntar på den angivna avgångstiden vid mellanhållplatserna, utan den fortsätter omedelbart sin färd när passagerarna har stigit av och på.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'The journey planner service is based on the Digitransit service platform and shows the City of Vaasa’s public transport route planning. The service finds your location and tells you the nearest routes and stops in real time. In the service you will find routes and timetables for both local and a few regional public transport networks.',
          'The journey planner provides real-time timetable estimates based on GPS monitoring of Vaasa public transport buses as well as timetable information. In real time, the information is displayed when the transport is on the move and sends tracking information to the service. Real-time information is identified by a flashing real-time symbol next to the arrival time.',
          'Note. Be on time at a stop, as there is no waiting time at the intermediate stops according to the estimated departure time. Instead, the vehicle’s journey continues immediately.',
        ],
      },
    ],
  },

  vehicles: true,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,

  stopCard: {
    header: {
      virtualMonitorBaseUrl: 'https://pysakit-vaasa.digitransit.fi/',
    },
  },

  mainMenu: {
    stopMonitor: {
      show: true,
      url: 'https://pysakit-vaasa.digitransit.fi/createview',
    },
  },

  geoJson: {
    layers: [
      {
        name: {
          fi: 'Vyöhykkeet',
          sv: 'Zoner',
          en: 'Zones',
        },
        url: '/assets/geojson/vaasa_zone_lines_20231220.geojson',
      },
    ],
  },
  zoneIdMapping: {
    1: 'A',
    2: 'B',
    3: 'C'
  },
  zones: {
    stops: true,
    itinerary: true,
  }
});
