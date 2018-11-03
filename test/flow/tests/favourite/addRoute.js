module.exports = {
  tags: ['favourite'],
  'Add route 615 as favourite': browser => {
    const homeUrl =
      'http://127.0.0.1:8080/Opastinsilta%206,%20Helsinki::60.199437,24.940472/-';
    browser.url(homeUrl);

    browser.page.searchFields().selectFirstRouteSuggestion('615');

    const route = browser.page.route();
    route.addRouteAsFavourite();
    browser.url(homeUrl);

    const myFavourites = browser.page.myFavourites();
    myFavourites.clickFavourites();
    myFavourites.verifyFavouriteRoute(615);

    browser.end();
  },
};
