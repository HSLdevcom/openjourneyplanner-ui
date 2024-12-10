import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import Store from 'fluxible/addons/BaseStore';

import { getJson } from '../util/xhrPromise';

// these are metadata mappable properties
const metaTags = ['textOnly', 'name', 'popupContent'];
const MapJSON = (data, meta) => {
  if (isEmpty(meta)) {
    return data;
  }
  const tagMap = metaTags.filter(t => !!meta[t]);

  data.features.forEach(feature => {
    const { properties } = feature;
    if (properties) {
      tagMap.forEach(t => {
        if (properties[meta[t]]) {
          properties[t] = properties[meta[t]];
        }
      });
    }
  });
  return data;
};

const styleFeatures = data => {
  if (!data.features.some(feature => Array.isArray(feature.styles))) {
    return data;
  }
  const output = {
    type: 'FeatureCollection',
    features: [],
  };
  data.features.forEach(feature => {
    if (!Array.isArray(feature.styles)) {
      output.features.push(cloneDeep(feature));
      return;
    }
    const size = feature.styles.length;
    feature.styles.forEach((style, index) => {
      const clone = cloneDeep(feature);
      delete clone.styles;
      clone.style = cloneDeep(style);
      if (size === 2) {
        clone.style.type = index === 1 ? 'halo' : 'line';
      }
      output.features.push(clone);
    });
  });
  return output;
};

class GeoJsonStore extends Store {
  geoJsonData = {};

  static storeName = 'GeoJsonStore';

  get layers() {
    return this.geoJsonLayers;
  }

  set layers(value) {
    this.geoJsonLayers = value;
  }

  getGeoJsonConfig = async url => {
    if (!url) {
      return undefined;
    }
    if (!this.layers) {
      try {
        const response = await getJson(url);
        const root = response.geoJson || response.geojson;
        if (root && Array.isArray(root.layers)) {
          this.layers = root.layers;
        }
      } catch (error) {
        this.layers = [];
      }
    }

    return this.layers;
  };

  getGeoJsonData = async (url, name, metadata) => {
    if (!url) {
      return undefined;
    }
    let id;
    let urlArr;
    if (Array.isArray(url)) {
      id = `${url[0]}-array`;
      urlArr = url;
    } else {
      id = url;
      urlArr = [url];
    }
    if (this.geoJsonData[id] === 'pending') {
      for (let i = 0; i < 30; i++) {
        /* eslint-disable no-await-in-loop, no-promise-executor-return */
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.geoJsonData[id] !== 'pending') {
          break;
        }
      }
    }
    if (!this.geoJsonData[id]) {
      this.geoJsonData[id] = 'pending';
      try {
        const responses = await Promise.all(urlArr.map(u => getJson(u)));

        let mapped;
        responses.forEach(r => {
          const styled = styleFeatures(r);
          if (!mapped) {
            mapped = MapJSON(styled, metadata);
          } else {
            mapped.features.push(...styled.features);
          }
        });
        const data = {
          name: name || id,
          data: mapped,
        };
        this.geoJsonData[id] = data;
      } catch (error) {
        // store non falsy value to avoid new fetch
        this.geoJsonData[id] = {};
      }
    }
    return this.geoJsonData[id].name ? { ...this.geoJsonData[id] } : null;
  };
}

export { GeoJsonStore as default, MapJSON, styleFeatures };
