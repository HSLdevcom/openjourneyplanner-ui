import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import { configShape } from '../../util/shapes';

import { isBrowser } from '../../util/browser';

let Polyline;

/* eslint-disable global-require */
if (isBrowser) {
  Polyline = require('react-leaflet/es/Polyline').default;
}
/* eslint-enable global-require */

export default class Line extends React.Component {
  static propTypes = {
    thin: PropTypes.bool,
    opaque: PropTypes.bool,
    passive: PropTypes.bool,
    color: PropTypes.string,
    mode: PropTypes.string.isRequired,
    geometry: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.number),
      ]),
    ).isRequired,
  };

  static defaultProps = {
    thin: false,
    opaque: false,
    passive: false,
    color: undefined,
  };

  static contextTypes = {
    config: configShape.isRequired,
  };

  componentDidMount() {
    // If we accidently draw the thin line over a normal one,
    // the halo will block it completely and we only see the thin one.
    // So we send the thin line layers (Leaflet calls every polyline its
    // own layer) to bottom. Note that all polylines do render inside the
    // same SVG, so CSS z-index can't be used.
    if (this.props.thin) {
      if (this.line) {
        this.line.leafletElement.bringToBack();
      }
      if (this.halo) {
        this.halo.leafletElement.bringToBack();
      }
    }
  }

  componentDidUpdate() {
    if (!(this.props.passive && this.props.thin) && this.line) {
      if (!this.props.opaque) {
        this.line.leafletElement.bringToFront();
      }
    }
  }

  // https://github.com/Leaflet/Leaflet/issues/2662
  // updating className does not work currently :(

  render() {
    const className = cx([
      this.props.mode,
      { thin: this.props.thin },
      { opaque: this.props.opaque },
      'map-line',
    ]);
    let filteredPoints;
    if (this.props.geometry) {
      filteredPoints = this.props.geometry.filter(
        point =>
          (typeof point.lat === 'number' && typeof point.lon === 'number') ||
          (typeof point[0] === 'number' && typeof point[1] === 'number'),
      );
    }

    if (!filteredPoints || filteredPoints.length === 0) {
      return null;
    }

    const lineConfig = this.context.config.map.line;

    let color = this.props.color ? this.props.color : 'currentColor';
    let haloWeight = this.props.thin
      ? lineConfig.halo.thinWeight
      : lineConfig.halo.weight;
    let legWeight = this.props.thin
      ? lineConfig.leg.thinWeight
      : lineConfig.leg.weight;

    if (this.props.mode === 'walk') {
      legWeight *= 0.8;
    }
    if (this.props.mode === 'ferry-external') {
      haloWeight *= 0.6;
      legWeight *= 0.6;
    }
    if (this.props.passive) {
      haloWeight *= 0.5;
      legWeight *= 0.5;
      if (lineConfig.passiveColor) {
        color = lineConfig.passiveColor;
      }
    }
    if (this.props.opaque) {
      haloWeight *= 0.65;
      legWeight *= 0.5;
    }

    return (
      <div style={{ display: 'none' }}>
        <Polyline
          key="halo"
          ref={el => {
            this.halo = el;
          }}
          positions={filteredPoints}
          className={`leg-halo ${className}`}
          weight={haloWeight}
          interactive={false}
        />
        <Polyline
          key="line"
          ref={el => {
            this.line = el;
          }}
          positions={filteredPoints}
          className={`leg ${className}`}
          color={color}
          weight={legWeight}
          interactive={false}
        />
      </div>
    );
  }
}
