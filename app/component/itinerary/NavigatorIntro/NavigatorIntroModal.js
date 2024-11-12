import Modal from '@hsl-fi/modal';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { intlShape } from 'react-intl';
import { configShape } from '../../../util/shapes';
import NavigatorIntro from './NavigatorIntro';

const NavigatorIntroModal = ({ onPrimaryClick, onClose }, context) => {
  const { config } = context;
  const [logo, setLogo] = useState();

  useEffect(() => {
    if (!config.navigationLogo) {
      return;
    }

    const loadLogo = async () => {
      try {
        const importedLogo = await import(
          /* webpackChunkName: "main" */ `../../../configurations/images/${config.navigationLogo}`
        );
        setLogo(importedLogo.default);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  return (
    <Modal
      appElement="#app"
      isOpen
      className="navigator-intro-modal"
      overlayClassName="navigator-intro-modal-overlay"
    >
      <NavigatorIntro
        logo={logo}
        onPrimaryClick={onPrimaryClick}
        onClose={onClose}
      />
    </Modal>
  );
};

NavigatorIntroModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onPrimaryClick: PropTypes.func,
};

NavigatorIntroModal.defaultProps = {
  onPrimaryClick: undefined,
};

NavigatorIntroModal.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default NavigatorIntroModal;
