import fetchMock from 'fetch-mock';
import cloneDeep from 'lodash/cloneDeep';

import GeoJsonStore, {
  MapJSON,
  styleFeatures,
} from '../../../app/store/GeoJsonStore';

describe('GeoJsonStore', () => {
  let store;
  const dispatcher = () => {};
  before(() => fetchMock.mockGlobal());

  beforeEach(() => {
    store = new GeoJsonStore(dispatcher);
  });

  afterEach(() => {
    fetchMock.removeRoutes();
    fetchMock.clearHistory();
  });

  after(() => fetchMock.unmockGlobal());

  describe('getGeoJsonConfig', () => {
    it('should return undefined if the url is falsey', async () => {
      expect(await store.getGeoJsonConfig(undefined)).to.equal(undefined);
    });

    it('should retrieve the configuration from the given url', async () => {
      const url = 'https://localhost/config';
      const response = { geoJson: { layers: [{ name: { en: 'Test' } }] } };
      fetchMock.get(url, response);

      const result = await store.getGeoJsonConfig(url);
      expect(result).to.deep.equal(response.geoJson.layers);
    });

    it('should support lowercase naming', async () => {
      const url = 'https://localhost/config';
      const response = { geojson: { layers: [{ name: { en: 'Test' } }] } };
      fetchMock.get(url, response);

      const result = await store.getGeoJsonConfig(url);
      expect(result).to.deep.equal(response.geojson.layers);
    });

    it('should retrieve the configuration only once', async () => {
      const url = 'https://localhost/config';
      const response = { geoJson: { layers: [{ name: { en: 'Test' } }] } };
      fetchMock.get(url, response);

      const result1 = await store.getGeoJsonConfig(url);
      const result2 = await store.getGeoJsonConfig(url);
      expect(fetchMock.callHistory.calls().length).to.equal(1);
      expect(result1).to.equal(result2);
    });

    it('should ignore a missing configuration', async () => {
      const url = 'https://localhost/config';
      const response = {};
      fetchMock.get(url, response);

      const result = await store.getGeoJsonConfig(url);
      expect(result).equal(undefined);
    });
  });

  describe('getGeoJsonData', () => {
    it('should return undefined if the url is falsey', async () => {
      expect(await store.getGeoJsonData(undefined, 'foo', {})).to.equal(
        undefined,
      );
    });

    it('should retrieve the data only once', async () => {
      const url = 'https://localhost/data';
      const response = {
        type: 'FeatureCollection',
        features: [],
      };
      fetchMock.get(url, response);

      const result1 = await store.getGeoJsonData(url, undefined, undefined);
      const result2 = await store.getGeoJsonData(url, undefined, undefined);
      expect(fetchMock.callHistory.calls().length).to.equal(1);
      expect(result1).to.deep.equal(result2);
    });

    it('should use the given name as the dataset name', async () => {
      const url = 'https://localhost/data';
      const response = {
        type: 'FeatureCollection',
        features: [],
      };
      fetchMock.get(url, response);

      const result = await store.getGeoJsonData(url, 'foo', undefined);
      expect(result.name).to.equal('foo');
    });

    it('should use the url as the dataset name', async () => {
      const url = 'https://localhost/data';
      const response = {
        type: 'FeatureCollection',
        features: [],
      };
      fetchMock.get(url, response);

      const result = await store.getGeoJsonData(url, undefined, undefined);
      expect(result.name).to.equal(url);
    });

    it('should apply metadata mapping', async () => {
      const url = 'https://localhost/data';
      const response = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },
            geometry: {
              type: 'Point',
              coordinates: [60, 25],
            },
          },
        ],
      };
      fetchMock.get(url, response);

      const result = await store.getGeoJsonData(url, undefined, {
        name: 'foo',
      });
      expect(result.data.features[0].properties.name).to.equal(
        response.features[0].properties.foo,
      );
    });
  });

  describe('MapJSON', () => {
    it('should return the given data if no metadata exists', () => {
      const data = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              tekstielementti: 'this-text-is-visible',
            },
            geometry: {
              type: 'Point',
              coordinates: [24, 60],
            },
          },
          {
            type: 'Feature',
            properties: {
              tiedot: 'ponnahdusvalikko',
            },
            geometry: {
              type: 'Point',
              coordinates: [24.5, 60.1],
            },
          },
        ],
      };
      const dataClone = cloneDeep(data);

      MapJSON(data, undefined);
      expect(data).to.deep.equal(dataClone);

      MapJSON(data, {});
      expect(data).to.deep.equal(dataClone);
    });

    it('can map custom properties to known properties', () => {
      const geoJsonSource = [
        {
          name: {
            en: 'external map data source',
          },
          url: '/home.com',
          metadata: {
            // renders point as a plain text element if 'tekstielementti' contains a string
            textOnly: 'tekstielementti',
            // the visible label comes from 'tekstielementti' too
            name: 'tekstielementti',
            // add a popup if feature has 'tiedot'
            popupContent: 'tiedot',
          },
        },
      ];

      const geoJsonResponse = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              tekstielementti: 'this-text-is-visible',
            },
            geometry: {
              type: 'Point',
              coordinates: [24, 60],
            },
          },
          {
            type: 'Feature',
            properties: {
              tiedot: 'ponnahdusvalikko',
            },
            geometry: {
              type: 'Point',
              coordinates: [24.5, 60.1],
            },
          },
        ],
      };
      MapJSON(geoJsonResponse, geoJsonSource[0].metadata);
      const p0 = geoJsonResponse.features[0].properties;
      const p1 = geoJsonResponse.features[1].properties;

      expect(p0.textOnly).to.equal('this-text-is-visible');
      expect(p0.name).to.equal('this-text-is-visible');
      expect(p1.popupContent).to.equal('ponnahdusvalikko');
    });
  });

  describe('styleFeatures', () => {
    it('should duplicate features with different style properties if the original feature has a styles array', () => {
      const input = {
        type: 'FeatureCollection',
        features: [
          {
            geometry: {
              coordinates: [
                [1, 1],
                [2, 2],
                [3, 3],
                [4, 4],
              ],
              type: 'LineString',
            },
            styles: [
              {
                color: 'black',
                weight: 1,
              },
              {
                color: 'gray',
                weight: 5,
              },
            ],
            type: 'Feature',
          },
          {
            style: {
              color: 'green',
              weight: 4,
            },
          },
        ],
      };

      const output = styleFeatures(input);
      expect(output).to.not.equal(input);
      expect(output.features.length).to.equal(3);
      expect(
        output.features.filter(feature => feature.styles),
      ).to.have.lengthOf(0);
      expect(output.features[0].geometry).to.deep.equal(
        output.features[1].geometry,
      );
      expect(output.features[0].style).to.deep.equal({
        color: 'black',
        type: 'line',
        weight: 1,
      });
      expect(output.features[1].style).to.deep.equal({
        color: 'gray',
        type: 'halo',
        weight: 5,
      });
      expect(output.features[0]).to.not.equal(output.features[1]);
    });

    it('should return the same array if no styles exist', () => {
      const input = {
        type: 'FeatureCollection',
        features: [
          {
            style: {
              color: 'green',
              weight: 4,
            },
          },
        ],
      };
      const output = styleFeatures(input);
      expect(output).to.equal(input);
    });
  });
});
