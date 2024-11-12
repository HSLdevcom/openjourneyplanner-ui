/**
 * This file contains functions for UI analytics.
 * Contains code used in both client and server
 */

/**
 * Add an analytics event to be sent to analytics server
 * Currently events have fields { event, category, action, name }
 *
 * @param {object} event
 *
 * @return void
 */
export function addAnalyticsEvent(event) {
  let newEvent = event;
  const config = window.state?.context?.plugins['extra-context-plugin'].config;
  if (event.event === undefined) {
    // this is the default event field if none is defined
    newEvent = { event: 'sendMatomoEvent', ...event };
  }

  if (
    (config?.useCookiesPrompt &&
      window.CookieInformation?.getConsentGivenFor('cookie_cat_statistic')) ||
    !config?.useCookiesPrompt
  ) {
    window.dataLayer.push(newEvent);
  }
}

/**
 * Get code to initialize UI analytics in server side
 *
 * @param {number|string} GTMid Google Tag Manager id
 *
 * @return string
 */
export function getAnalyticsInitCode(config, hostname) {
  if (
    config.analyticsScript &&
    hostname &&
    (!hostname.match(/dev|test/) || config.devAnalytics)
  ) {
    return config.analyticsScript(hostname);
  }

  if (config.GTMid) {
    // Google Tag Manager script
    return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${config.GTMid}');</script>\n`;
  }
  return '';
}
const handleChange = () => {
  if (!window.CookieInformation) {
    return false;
  }
  return window.CookieInformation.getConsentGivenFor('cookie_cat_statistics');
};
/**
 * Client side intialization for UI analytics
 *
 * @return void
 */
export function initAnalyticsClientSide(config) {
  window.dataLayer = window.dataLayer || [];
  if (config?.useCookiesPrompt) {
    window.addEventListener(
      'CookieInformationConsentGiven',
      handleChange,
      false,
    );
  }
}

/**
 * Handle user analytics
 * @param {object} user - user object
 * @param {object} config - configuration object
 */
export function handleUserAnalytics(user, config) {
  if (config.loginAnalyticsEventName && user?.sub) {
    addAnalyticsEvent({
      event: config.loginAnalyticsEventName,
      [config.loginAnalyticsKey]: user.sub,
    });
  }
}
