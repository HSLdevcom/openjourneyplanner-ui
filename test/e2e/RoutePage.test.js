/* eslint-disable compat/compat */
/* eslint-disable no-undef */
import RoutePageStopListMockData from './mock-data/RoutePageStopListQueryResponse.json';
import RoutePageStopListTampereMockData from './mock-data/RoutePageStopListTampereResponse.json';
import getConfig from './helpers/image-snapshot-config';

const config = process.env.CONFIG || 'hsl';
const customSnapshotsDir = `test/e2e/__image_snapshots__`;
const customDiffDir = `test/e2e/__image_snapshots__/__diff_output__`;

const platform = (process.env.MOBILE === 'true' && 'mobile') || 'desktop';
const isMobile = platform === 'mobile';

const mockRoutes = async page => {
  await page.route('**/gtfs/v1', async (route, request) => {
    if (request.method() === 'POST') {
      if (
        request.postData().includes('RoutePatternSelect_similarRoutesQuery')
      ) {
        await route.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { routes: [] } }),
        });
      }
      if (request.postData().includes('MessageBarQuery')) {
        await route.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { alerts: [] } }),
        });
      }
      if (request.postData().includes('RouteStopListContainerQuery')) {
        const mockData =
          config === 'tampere'
            ? RoutePageStopListTampereMockData
            : RoutePageStopListMockData;
        await route.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
        });
      }
    }
  });
};

describe(`Route page with ${config} config`, () => {
  beforeEach(async () => {
    await mockRoutes(page);
  });
  const paths = {
    hsl: '/linjat/HSL:6181/pysakit/HSL:6181:0:01',
    tampere: '/linjat/tampere:66A6957/pysakit/tampere:66A6957:0:01',
    matka: '/linjat/HSL:6181/pysakit/HSL:6181:0:01',
  };
  test(`stop list on ${platform}`, async () => {
    const snapshotName = `route-page-stop-list-${platform}`;
    const response = await page.goto(`http://localhost:8080${paths[config]}`);

    expect(response.status()).toBe(200);
    await page.waitForSelector('.route-stop-list');
    // await new Promise(res => setTimeout(res, 2000000));

    const snapshotConfig = getConfig(
      snapshotName,
      `${customSnapshotsDir}/${browserName}/${config}/`,
      `${customDiffDir}/${browserName}/${config}/`,
    );
    let mainContent;
    if (!isMobile) {
      await page.waitForSelector(
        '#mainContent > .desktop > .main-content > .scrollable-content-wrapper',
      );
      mainContent = await page.$('#mainContent > .desktop > .main-content');
    } else {
      await page.waitForSelector(
        '#app > #mainContent > .mobile > .drawer-container > .drawer-content',
      );
      mainContent = await page.$(
        '#app > #mainContent > .mobile > .drawer-container > .drawer-content',
      );
    }
    const image = await mainContent.screenshot();
    expect(image).toMatchImageSnapshot(snapshotConfig);
  });
});
