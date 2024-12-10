/* 'eslint-disable prefer-template */
import configMerger from '../util/configMerger';

const CONFIG = 'jyvaskyla';
const APP_TITLE = 'Reittiopas Jyväskylä';
const APP_DESCRIPTION = 'Jyväskylän uusi reittiopas';

const walttiConfig = require('./config.waltti').default;

const minLat = 61.835318;
const maxLat = 62.603473;
const minLon = 25.230388;
const maxLon = 26.358237;

export default configMerger(walttiConfig, {
  CONFIG,

  feedIds: ['LINKKI'],

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
    address: 'Jyväskylän paikallisliikenneterminaali',
    lat: 62.241015674,
    lon: 25.7485345616,
  },

  appBarLink: {
    name: 'Jyväskylän seudun joukkoliikenne',
    href: 'http://linkki.jyvaskyla.fi/',
  },

  colors: {
    primary: '#7DC02D',
    iconColors: {
      'mode-bus': '#7DC02D',
    },
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },

  title: APP_TITLE,

  favicon: './app/configurations/images/jyvaskyla/jyvaskyla-favicon.png',

  // Navbar logo
  logo: 'jyvaskyla/jyvaskyla-favicon.png',

  vehicles: true,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,

  mainMenu: {
    stopMonitor: {
      show: true,
      url: 'https://pysakit.jyvaskyla.fi/createview',
    },
  },

  menu: {
    copyright: { label: `© Jyvaskyla ${walttiConfig.YEAR}` },
    content: [
      {
        name: 'menu-feedback',
        href: {
          fi: 'https://s-asiointi.jkl.fi/eFeedback/fi/Feedback/38-Joukkoliikenne',
          sv: 'https://s-asiointi.jkl.fi/eFeedback/fi/Feedback/38-Joukkoliikenne',
          en: 'https://s-asiointi.jkl.fi/eFeedback/en/Feedback/38-Public%20transport',
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
          'Tämä palvelu on tarkoitettu helpottamaan suunnittelua, kun teet matkoja Jyväskylän, Laukaan ja Muuramen alueella. Esitetyt joukkoliikenteen aikataulut ja reitit perustuvat Linkki-paikallisliikenteen osalta voimassa olevaan aikatauludataan. Seutuliikenteen aikataulu- ja reittitiedot perustuvat liikennöitsijöiden ilmoittamiin aikataulutietoihin. Voit tutkia palvelun avulla myös kävelyn, pyöräilyn ja yksityisautoilun reittejä, mutta nämä eivät kaikilta osin ole ajantasaisia. Palvelu perustuu valtakunnallisessa käytössä olevaan Digitransit-palvelualustaan.',
          'Reittiopas näyttää Linkki-liikenteestä sekä linja-autojen gps-seurantaan perustuvia, reaaliaikaisia aikatauluarvioita että aikataulusuunnitelman mukaisia aikataulutietoja. Reaaliaikaisena tieto näkyy silloin, kun vuoro on liikkeellä ja lähettää palveluun seurantatietoa. Reaaliaikaisen tiedon tunnistaa saapumisajan ohessa vilkkuvasta reaaliaikasymbolista. Ole pysäkillä ajoissa, sillä välipysäkeille ei jäädä odottamaan arvion mukaista lähtöaikaa, vaan auton matka jatkuu välittömästi.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Denna tjänst är avsedd att underlätta planeringen, när du reser i Jyväskylä, Laukaa och Muurame. Utvalda kollektivtrafikens tidtabeller och rutter är baserad på Linkki-lokaltrafikens giltiga tidtabellsdata. Regiontrafikens tidtabeller och ruttinformationer är baserad på tidtabellsinformationen från kollektivtrafikföretag. Med hjälp av reseplaneraren kan du också utforska gång-, cyklingsrutten samt rutter för privatbilismen. Tjänsten är baserad på Digitransit, som är riksomfattande serviceplattform för reseplanerare.',
          'Reseplaneraren visar Linkki-lokaltrafikens tidtabell både i realtid baserad på GPS-spårning av bussar såväl som schemalagd tidtabellsinformation. Informationen visas i realtid när en busstur är i rörelse och skickar spårningsinformation till tjänsten. Realtidsinformation identifieras med en blinkande realtidsymbol vid sidan av ankomsttiden. Det lönar sig att vara på hållplatsen i tid, eftersom på mellanliggande hållplats väntar bussen inte för att kunna avgå enligt tidtabellen utan fortsätter resan omedelbart.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'This service is intended to facilitate planning when traveling in the Jyväskylä, Laukaa and Muurame areas. The public transport timetables and routes shown are based on the current data for local traffic (Linkki). Regional transport timetables and route information are based on the timetable information from transport service provider. With the help of the journey planner you can also explore the walking and cycling route as well routes for private motoring. The service is based on Digitransit, which is a nationwide service platform for journey planner.',
          'The journey planner shows both estimated real-time timetables for Linkki based on GPS tracking of buses as well as scheduled timetable information. The information is displayed in real time when a bus shift is in motion and sends tracking information to the service. Real-time information is identified by a flashing real-time symbol beside the arrival time.',
          'It is important for the passengers to arrive early at the bus stop because at the intermediate bus stop the bus does not wait to be able to depart according to the timetable but continues the journey immediately.',
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
        url: '/assets/geojson/jkl_zone_lines_20240531.geojson',
      },
      {
        name: {
          fi: 'Myyntipisteet',
          sv: 'Servicekontorer',
          en: 'Service points',
        },
        url: 'https://jakoon.jkl.fi/reittiopas/Asiakaspalvelupisteet/myyntipisteet.geojson',
      },
    ],
  },

  geoJsonSvgSize: 30,

  zoneIdMapping: {
    1: 'A',
    2: 'B',
    3: 'C',
  },

  showTicketInformation: true,
  useTicketIcons: true,
  ticketLink: 'https://linkki.jyvaskyla.fi/liput-ja-hinnat',
  // showTicketPrice: true,

  ticketLinkOperatorCode: 50209,

  stopCard: {
    header: {
      virtualMonitorBaseUrl: 'https://pysakit.jyvaskyla.fi/',
    },
  },
  zones: {
    stops: true,
    itinerary: true,
  },
  // Notice! Turning on this setting forces the search for car routes (for the CO2 comparison only).
  showCO2InItinerarySummary: true,
});
