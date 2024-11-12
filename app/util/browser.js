/**
 * Runs a check to see if the code is currently running in a browser.
 */
export const getIsBrowser = () =>
  typeof window !== 'undefined' && window !== null;

export const isBrowser = getIsBrowser();
export const isIOSApp = isBrowser && navigator.standalone;
export const isIOS =
  isBrowser && !!navigator.platform.match(/iPhone|iPod|iPad/);
export const isWindowsPhone =
  isBrowser && navigator.userAgent.match(/Windows Phone/) != null;
export const isLangMockEn =
  isBrowser && window.location.search.indexOf('enmock') !== -1;
export const isMobile =
  isBrowser && navigator.userAgent.match(/Mobile/) != null;
export const isFirefox =
  isBrowser && navigator.userAgent.match(/Firefox/) != null;
export const isAndroid =
  isBrowser && navigator.userAgent.match(/Android/) != null;
export const isEdge = isBrowser && navigator.userAgent.match(/Edge/) != null;
export const isChrome =
  isBrowser && !isEdge && navigator.userAgent.match(/Chrome/) != null;
export const isSafari =
  isBrowser &&
  !isChrome &&
  !isEdge &&
  navigator.userAgent.match(/Safari/) != null;
export const isSamsungBrowser =
  isBrowser && navigator.userAgent.match(/SamsungBrowser/) != null;
const isIe = isBrowser && navigator.userAgent.match(/Trident/) != null;
export const isImperial = config => {
  if (
    config.imperialEnabled &&
    (String(navigator.userLanguage).toLowerCase() === 'en-us' ||
      String(navigator.language).toLowerCase() === 'en-us')
  ) {
    return true;
  }
  return false;
};

// Returns true if user is using unsupported browser
export const isIeOrOldVersion = () => {
  const browser =
    isBrowser &&
    navigator.userAgent.match(
      /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrom(e|ium)(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([0-9]+)./,
    );
  let version = 0;
  if (isSafari) {
    version = parseInt(
      navigator.userAgent.substring(
        navigator.userAgent.indexOf('Version/') + 8,
      ),
      10,
    );
  } else if (browser) {
    version = parseInt(browser[browser.length - 1], 10);
  }
  if (
    isIe ||
    (isEdge && version < 14) || // Edge version < 14
    (isChrome && version < 60) || // Chrome version < 60
    (isFirefox && version < 50) || // Firefox version < 50
    (isSafari && version < 11)
  ) {
    return true;
  }
  return false;
};
export const isKeyboardSelectionEvent = event => {
  const space = [13, ' ', 'Spacebar'];
  const enter = [32, 'Enter'];
  const key = (event && (event.key || event.which || event.keyCode)) || '';

  if (!key || !space.concat(enter).includes(key)) {
    return false;
  }
  event.preventDefault();
  return true;
};
