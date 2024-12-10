import Modal from '@hsl-fi/modal';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { isBrowser } from '../../../util/browser';
import { configShape } from '../../../util/shapes';

const NavigatorModal = ({ withBackdrop, isOpen, children, slideUp }) => {
  const overlayClass = cx('navigator-modal-container', {
    'navigator-modal-backdrop': withBackdrop,
  });

  const modalClass = cx('navigator-modal', {
    'slide-in': slideUp,
  });

  return (
    <Modal
      appElement={isBrowser ? '#app' : 'body'}
      isOpen={isOpen}
      className={modalClass}
      overlayClassName={overlayClass}
    >
      <div className="navigator-modal-content">{children}</div>
    </Modal>
  );
};

NavigatorModal.propTypes = {
  children: PropTypes.node,
  withBackdrop: PropTypes.bool,
  isOpen: PropTypes.bool,
  slideUp: PropTypes.bool,
};

NavigatorModal.defaultProps = {
  children: undefined,
  withBackdrop: false,
  isOpen: false,
  slideUp: false,
};

NavigatorModal.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default NavigatorModal;
