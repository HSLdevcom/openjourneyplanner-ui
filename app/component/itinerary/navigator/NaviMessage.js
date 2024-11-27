import React, { useState } from 'react';
import { intlShape } from 'react-intl';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { configShape } from '../../../util/shapes';

import Icon from '../../Icon';

function NaviMessage({ severity, children, index, handleRemove }, { config }) {
  const [removingIndex, setRemovingIndex] = useState(null);

  const handleRemoveClick = () => {
    setRemovingIndex(index);
    setTimeout(() => {
      handleRemove(index);
      setRemovingIndex(null);
    }, 500);
  };
  let iconId;
  let color;
  switch (severity) {
    case 'INFO':
      iconId = 'icon-icon_info';
      color = '#0074BF';
      break;
    case 'WARNING':
      iconId = 'icon-icon_attention';
      color = '#FED100';
      break;
    case 'ALERT':
      iconId = 'icon-icon_caution_white_exclamation';
      color = '#DC0451';
      break;
    default:
      iconId = 'icon-icon_info';
      color = '#0074BF';
  }
  return (
    <div
      className={cx(
        'info-stack-item',
        removingIndex === index ? 'slide-out-right' : '',
        `${severity.toLowerCase()}`,
      )}
    >
      <Icon
        img={iconId}
        height={1.4}
        width={1.4}
        className="info-icon"
        color={color}
      />
      {children}
      <button
        type="button"
        className="info-close"
        onClick={() => handleRemoveClick()}
      >
        <Icon
          img="icon-icon_close"
          height={0.8}
          width={0.8}
          color={config.colors.primary}
        />
      </button>
    </div>
  );
}

NaviMessage.propTypes = {
  severity: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  index: PropTypes.number.isRequired,
  handleRemove: PropTypes.func.isRequired,
};

NaviMessage.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default NaviMessage;
