import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { configShape } from '../../../../util/shapes';
import { useLogo } from '../hooks/useLogo';
import NavigatorModal from '../NavigatorModal';
import NavigatorIntro from './NavigatorIntro';

const NavigatorIntroModal = ({ onPrimaryClick, onClose }, { config }) => {
  const { logo, loading } = useLogo(config.navigationLogo);

  if (loading) {
    return null;
  }

  return (
    <NavigatorModal isOpen withBackdrop>
      <NavigatorIntro
        logo={logo}
        onPrimaryClick={onPrimaryClick}
        onClose={onClose}
      />
    </NavigatorModal>
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
