import PropTypes from 'prop-types';
import React from 'react';
import Icon from './Icon';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
function ToggleMapTracking(props) {
  return (
    <div
      className="toggle-positioning-container"
      onClick={props.handleClick}
      role="button"
      tabIndex={0}
      aria-label={props.ariaLabel}
    >
      <Icon img={props.img} className={props.className} />
    </div>
  );
}

ToggleMapTracking.propTypes = {
  handleClick: PropTypes.func.isRequired,
  className: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
};

export default ToggleMapTracking;
