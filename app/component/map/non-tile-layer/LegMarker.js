import PropTypes from 'prop-types';
import React from 'react';
import Icon from '../../Icon';
import { isBrowser } from '../../../util/browser';
import { legShape, configShape } from '../../../util/shapes';

/* eslint-disable global-require */

const Marker = isBrowser && require('react-leaflet/es/Marker').default;
const L = isBrowser && require('leaflet');

/* eslint-enable global-require */

class LegMarker extends React.Component {
  static propTypes = {
    leg: legShape.isRequired,
    mode: PropTypes.string.isRequired,
    color: PropTypes.string,
    zIndexOffset: PropTypes.number,
    wide: PropTypes.bool,
    style: PropTypes.string,
  };

  static defaultProps = {
    color: 'currentColor',
    zIndexOffset: undefined,
    wide: false,
    style: undefined,
  };

  static contextTypes = {
    config: configShape.isRequired,
  };

  // An arrow marker will be displayed if the normal marker can't fit
  getLegMarker() {
    const color = this.props.color ? this.props.color : 'currentColor';
    const className = this.props.wide ? 'wide' : '';
    // Do not display route number if it is an external route and the route number is empty.
    const displayRouteNumber = !(
      this.context.config.externalFeedIds !== undefined &&
      this.props.mode.includes('external') &&
      this.props.leg.name === ''
    );
    const routeNumber = displayRouteNumber
      ? `<span class="map-route-number ${this.props.mode}" aria-hidden="true">${
          this.props.leg.name
        }</span>
         <span class="sr-only">${this.props.leg.name.toLowerCase()}</span>`
      : '';
    return (
      <Marker
        key={`${this.props.leg.name}_text`}
        position={{
          lat: this.props.leg.lat,
          lng: this.props.leg.lon,
        }}
        interactive={false}
        icon={L.divIcon({
          html: `
            <div class="${className}" style="--background-color: ${color}">
            ${Icon.asString({
              img: `icon-icon_${this.props.mode}`,
              className: 'map-route-icon',
              color,
            })}
              ${routeNumber}
            </div>`,
          className: `${
            this.props.style ? `arrow-${this.props.style}` : 'legmarker'
          } ${this.props.mode} ${displayRouteNumber ? '' : 'only-icon'}`,
          iconSize: null,
        })}
        zIndexOffset={this.props.zIndexOffset}
        keyboard={false}
      />
    );
  }

  render() {
    if (!isBrowser) {
      return '';
    }

    return <div>{this.getLegMarker()}</div>;
  }
}

export default LegMarker;
