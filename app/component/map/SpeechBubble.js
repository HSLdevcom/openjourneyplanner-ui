import React from 'react';
import PropTypes from 'prop-types';
import { isBrowser } from '../../util/browser';

let L;
let Marker;
/* eslint-disable global-require */
if (isBrowser) {
  L = require('leaflet');
  Marker = require('react-leaflet/es/Marker').default;
}

export default function SpeechBubble({
  position,
  text,
  zIndexOffset,
  speechBubbleStyle,
}) {
  return (
    <Marker
      key="_text"
      position={{
        lat: position.lat,
        lng: position.lon,
      }}
      interactive={false}
      icon={L.divIcon({
        html: `<div>${text}</div>`,
        className: `legmarker speech-bubble-${speechBubbleStyle}`,
        iconSize: null,
      })}
      keyboard={false}
      zIndexOffset={zIndexOffset}
    />
  );
}

SpeechBubble.propTypes = {
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
  }).isRequired,
  text: PropTypes.string,
  speechBubbleStyle: PropTypes.string,
  zIndexOffset: PropTypes.number,
};

SpeechBubble.defaultProps = {
  speechBubbleStyle: 'topRight',
  text: '',
  zIndexOffset: 400,
};
