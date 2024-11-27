import Button from '@hsl-fi/button';
import { connectToStores } from 'fluxible-addons-react';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { configShape } from '../../../../util/shapes';
import Icon from '../../../Icon';
import NavigatorIntroFeature from './NavigatorIntroFeature';

const NavigatorIntro = (
  { logo, onPrimaryClick, onClose, isLoggedIn },
  context,
) => {
  const { config, intl } = context;

  const primaryColor =
    config.colors?.accessiblePrimary || config.colors?.primary || 'black';

  return (
    <div className="navigator-intro-modal-content">
      <div className="body">
        {logo && <img src={logo} alt="navigator logo" />}
        <FormattedMessage tagName="h2" id="navigation-intro-header" />
        <div className="navigation-intro-body">
          <NavigatorIntroFeature
            icon="icon-icon_future-route"
            iconColor={primaryColor}
            iconBackgroundColor={config.colors?.backgroundInfo}
            header="navigation-intro-help-header"
            body="navigation-intro-help-body"
          />
          <NavigatorIntroFeature
            icon="icon-icon_comment"
            iconColor={primaryColor}
            iconBackgroundColor={config.colors?.backgroundInfo}
            header="navigation-intro-notifications-header"
            body="navigation-intro-notifications-body"
          />
        </div>
        {config.allowLogin && !isLoggedIn && (
          <div className="login-tip">
            <Icon img="icon-icon_idea" iconColor="black" height={1} width={1} />
            <FormattedMessage tagName="p" id="navigation-intro-login-prompt" />
          </div>
        )}
      </div>
      <div className="buttons">
        <Button
          size="large"
          fullWidth
          variant="blue"
          value={intl.formatMessage({ id: 'navigation-intro-begin' })}
          onClick={onPrimaryClick || onClose}
          style={{ backgroundColor: primaryColor }}
        />
        <Button
          size="large"
          fullWidth
          variant="white"
          value={intl.formatMessage({ id: 'cancel' })}
          onClick={onClose}
          style={{ borderColor: 'transparent' }}
        />
      </div>
    </div>
  );
};

NavigatorIntro.propTypes = {
  logo: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onPrimaryClick: PropTypes.func,
  isLoggedIn: PropTypes.bool,
};

NavigatorIntro.defaultProps = {
  logo: undefined,
  onPrimaryClick: undefined,
  isLoggedIn: false,
};

NavigatorIntro.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default connectToStores(
  NavigatorIntro,
  ['UserStore'],
  ({ config, getStore }) => ({
    isLoggedIn:
      config?.allowLogin && getStore('UserStore')?.getUser()?.sub !== undefined,
  }),
);
