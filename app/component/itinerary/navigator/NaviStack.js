import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import NaviMessage from './NaviMessage';

const NaviStack = ({ messages, handleRemove }) => {
  return (
    <div className={cx('info-stack', 'slide-in')}>
      {messages.map((notification, index) => (
        <NaviMessage
          key={notification.id}
          severity={notification.severity}
          index={index}
          handleRemove={handleRemove}
          hideClose={notification.hideClose}
        >
          {notification.content}
        </NaviMessage>
      ))}
    </div>
  );
};

NaviStack.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      severity: PropTypes.string.isRequired,
    }),
  ).isRequired,
  handleRemove: PropTypes.func.isRequired,
};

export default NaviStack;
