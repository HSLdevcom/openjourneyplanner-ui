/* eslint-disable compat/compat */
/* eslint-disable no-undef */
import StopPageMockData from './mock-data/StopPageContenQueryResponse.json';
import getConfig from './helpers/image-snapshot-config';

const config = process.env.CONFIG || 'hsl';
const customSnapshotsDir = `test/e2e/__image_snapshots__`;
const customDiffDir = `test/e2e/__image_snapshots__/__diff_output__`;

const platform = (process.env.MOBILE === 'true' && 'mobile') || 'desktop';
const isMobile = platform === 'mobile';

const mockRoutes = async page => {
  await page.route('**/gtfs/v1', async (route, request) => {
    if (request.method() === 'POST') {
      if (request.postData().includes('StopPageContentContainerQuery')) {
        await route.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(StopPageMockData),
        });
      }
    }
  });
};

describe(`Stop page with ${config} config`, () => {
  beforeEach(async () => {
    await mockRoutes(page);
  });
  const paths = {
    hsl: '/pysakit/HSL:2434202',
    tampere: '/pysakit/tampere:0536',
    matka: '/pysakit/HSL:2434202',
  };
  test(`departure list on ${platform}`, async () => {
    const snapshotName = `stop-page-departure-list-${platform}`;
    const response = await page.goto(`http://localhost:8080${paths[config]}`);

    // await new Promise(res => setTimeout(res, 2000000));

    expect(response.status()).toBe(200);

    await page.waitForSelector('.departure-list');
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
