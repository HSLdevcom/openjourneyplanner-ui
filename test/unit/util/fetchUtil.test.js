import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import { describe, it } from 'mocha';
import { retryFetch } from '../../../app/util/fetchUtils';

// retryFetch retries fetch requests (url, options, retry count, delay) where total number or calls is initial request + retry count

const testUrl =
  'https://dev-api.digitransit.fi/timetables/v1/hsl/routes/routes.json';

const testJSONResponse = '{"test": 3}';

describe('retryFetch', () => {
  before(() => fetchMock.mockGlobal());

  afterEach(() => {
    fetchMock.removeRoutes();
    fetchMock.clearHistory();
  });

  after(() => fetchMock.unmockGlobal());

  it('fetching something that does not exist with 5 retries should give Not Found error and 6 requests in total should be made ', async () => {
    fetchMock.get(testUrl, 404);

    try {
      await retryFetch(testUrl, 5, 10);
    } catch (err) {
      expect(err).to.equal(`${testUrl}: Not Found`);
    }

    const calls = fetchMock.callHistory.calls(
      'https://dev-api.digitransit.fi/timetables/v1/hsl/routes/routes.json',
    );
    expect(calls.length).to.equal(6);
  });

  it('fetch with larger fetch timeout should take longer', async () => {
    async function measureFetchDuration(retries, delay) {
      const start = performance.now();
      try {
        await retryFetch(testUrl, retries, delay);
      } catch (err) {
        // Expected error due to 404
      }
      return performance.now() - start;
    }
    // because test system can be slow, requests should take between 40-200ms when retry delay is 20ms and 2 retries
    const firstDuration = await measureFetchDuration(2, 20);
    expect(firstDuration).to.be.above(40);
    expect(firstDuration).to.be.below(200);

    // because test system can be slow, requests should take between 200-360ms when retry delay is 100ms and 2 retries
    const secondDuration = await measureFetchDuration(2, 100);
    expect(secondDuration).to.be.above(200);
    expect(secondDuration).to.be.below(360);

    // because of longer delay between requests, the difference between 2 retries with 20ms delay
    // and 2 retries with 100ms delay should be 160ms but because performance slightly varies, there is a 100ms threshold for test failure
    const expectedDifference = 100;
    const allowedVariance = 100;
    const durationDifference = secondDuration - firstDuration;

    expect(durationDifference).to.be.within(
      expectedDifference - allowedVariance,
      expectedDifference + allowedVariance,
    );
  });

  it('fetch that gives 200 should not be retried', async () => {
    fetchMock.get(testUrl, testJSONResponse);
    try {
      await retryFetch(testUrl, 5, 10);
    } catch (err) {
      assert.fail('No error should have been thrown');
    }
    const calls = fetchMock.callHistory.calls(
      'https://dev-api.digitransit.fi/timetables/v1/hsl/routes/routes.json',
    );
    expect(calls.length).to.equal(1);
  });

  it('fetch that gives 200 should have correct result data', async () => {
    fetchMock.get(testUrl, testJSONResponse);

    try {
      const res = await retryFetch(testUrl, 5, 10);
      const data = await res.json();

      expect(data).to.have.property('test', 3);
    } catch (err) {
      assert.fail(`Request failed unexpectedly: ${err.message}`);
    }
  });
});
