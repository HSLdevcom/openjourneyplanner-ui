/* eslint-disable */
import configMerger from '../util/configMerger';

const CONFIG = 'walttiOpas';
const APP_TITLE = 'Waltti-opas';
const APP_DESCRIPTION = 'Uusi Reittiopas - Waltti-opas';

const walttiConfig = require('./config.waltti').default;

export default configMerger(walttiConfig, {
  CONFIG,

  appBarLink: { name: 'Waltti', href: 'https://waltti.fi/' },

  colors: {
    primary: '#5959a8',
    topBarColor: '#17083b',
    iconColors: {
      'mode-bus': '#5959a8',
    },
  },
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
  },

  socialMedia: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },

  title: APP_TITLE,

  // Navbar logo
  logo: 'walttiOpas/waltti-logo.png',
  secondaryLogo: 'walttiOpas/waltti-logo-secondary.png',
  favicon: './app/configurations/images/walttiOpas/walttiOpas-favicon.png',

  feedIds: ['Salo', 'Kajaani'],

  defaultEndpoint: {
    address: 'Helsinki-Vantaan Lentoasema',
    lat: 60.317429,
    lon: 24.9690395,
  },

  menu: {
    copyright: { label: `© Waltti Solutions Oy ${walttiConfig.YEAR}` },
    content: [
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
          'Waltti-reittiopas on Waltti Solutions Oy:n tarjoama kansallisen tason reittiopaspalvelu. Palvelu paikantaa sinulle sijainnin ja kertoo lähimmät linjat, pysäkit, reitit ja aikataulutiedot. Se suodattaa tarpeettoman tiedon ja kertoo, miten sujuvimmin pääset perille. Reittiopas-palvelu toimii kaikilla päätelaitteilla, mutta on tehty palvelemaan erityisen hyvin mobiilikäyttäjiä. Palvelu perustuu Digitransit-palvelualustaan.',
        ],
      },
    ],

    sv: [
      {
        header: 'Om tjänsten',
        paragraphs: [
          'Waltti-rutguide är en nationell reseplanera som erbjuds av Waltti Solutions Oy. Tjänsten lokaliserar din plats och visar de närmsta linjerna och hållplatserna samt rutter och tidtabeller. Tjänsten filtrerar onödig information och anger hur du lättast kommer dit du ska. Ruttguidetjänsten fungerar på alla dataterminaler men är särskilt ägnad att betjäna dem som använder mobilenheter. Tjänsten är baserad på Digitransit, som är riksomfattande serviceplattform för reseplanerare.',
        ],
      },
    ],

    en: [
      {
        header: 'About this service',
        paragraphs: [
          'Waltti Journey planner is a national journey planner offered by Waltti Solutions Oy. The service finds your location and tells you the closest lines, stops, routes and timetables. It filters out unnecessary information and tells you the smoothest way to get to your destination. The Journey planner service works on all devices but is designed to best serve mobile users. Service is built on Digitransit platform.',
        ],
      },
    ],
  },

  viaPointsEnabled: false,
  showVehiclesOnStopPage: true,
  showVehiclesOnItineraryPage: true,

  sourceForAlertsAndDisruptions: {
    Kajaani: {
      fi: 'Kajaani',
      sv: 'Kajana',
      en: 'Kajaani',
    },
    Salo: {
      fi: 'Salo',
      sv: 'Salo',
      en: 'Salo',
    }
  },

  useSearchPolygon: true,

  areaPolygon: [
    // Kajaani:
    [28.1, 63.8],
    [27.6, 63.9],
    [26.7, 64],
    [26.6, 64.5],
    [28.5, 64.5],
    [29.2, 64.1],
    [28.7, 63.9],
    [28.1, 63.8],
    // Salo:
    [23.1, 60.6],
    [23.7, 60.2],
    [22.8, 59.9],
    [22.7, 60.4],
    [23.1, 60.6],
  ],

  map: {
    minZoom: 6,
  },

  showDisclaimer: true,

});
