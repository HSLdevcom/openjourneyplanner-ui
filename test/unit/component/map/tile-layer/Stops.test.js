import fetchMock from 'fetch-mock';
import Stops from '../../../../../app/component/map/tile-layer/Stops';

describe('Stops', () => {
  before(() => fetchMock.mockGlobal());
  after(() => fetchMock.unmockGlobal());
  const config = {
    URL: {
      STOP_MAP: { default: 'https://localhost/stopmap/' },
    },
  };

  const tile = {
    coords: {
      x: 1,
      y: 2,
      z: 3,
    },
    props: {},
  };

  describe('fetchStatusAndDrawStop', () => {
    it('should make a get to the correct url', () => {
      fetchMock.get(
        'end:3/1/2.pbf',
        {
          status: 200,
        },
        { repeat: 1 },
      );
      new Stops(tile, config, []).getPromise(); // eslint-disable-line no-new
      expect(fetchMock.callHistory.called('end:/3/1/2.pbf')).to.equal(true);
    });

    it('should add zoom offset to the z coordinate', () => {
      fetchMock.get(
        'end:/4/1/2.pbf',
        {
          status: 200,
        },
        { repeat: 1 },
      );
      new Stops({ ...tile, props: { zoomOffset: 1 } }, config, []).getPromise(); // eslint-disable-line no-new
      expect(fetchMock.callHistory.called('end:/4/1/2.pbf')).to.equal(true);
    });
  });
});
