import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { configShape } from '../../../../util/shapes';
import { useLogo } from '../hooks/useLogo';
import NavigatorModal from '../NavigatorModal';
import NavigatorOutro from './NavigatorOutro';

const NavigatorOutroModal = ({ onClose, destination }, { config }) => {
  const { logo, loading } = useLogo(config.thumbsUpGraphic);

  if (loading) {
    return null;
  }

  return (
    <NavigatorModal isOpen withBackdrop slideUp>
      <NavigatorOutro logo={logo} onClose={onClose} destination={destination} />
    </NavigatorModal>
  );
};

NavigatorOutroModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  destination: PropTypes.string.isRequired,
};

NavigatorOutroModal.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default NavigatorOutroModal;
