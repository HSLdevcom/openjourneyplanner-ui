import Button from '@hsl-fi/button';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { configShape } from '../../../../util/shapes';
import NavigatorIntroFeature from './NavigatorIntroFeature';

const NavigatorIntro = ({ logo, onPrimaryClick, onClose }, context) => {
  const { config, intl } = context;

  const primaryColor =
    config.colors?.accessiblePrimary || config.colors?.primary || 'black';

  return (
    <>
      <div className="intro-body">
        {logo && <img src={logo} alt="navigator logo" />}
        <FormattedMessage tagName="h2" id="navigation-intro-header" />
        <div className="content">
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
      </div>
      <div className="intro-buttons">
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
    </>
  );
};

NavigatorIntro.propTypes = {
  logo: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onPrimaryClick: PropTypes.func,
};

NavigatorIntro.defaultProps = {
  logo: undefined,
  onPrimaryClick: undefined,
};

NavigatorIntro.contextTypes = {
  intl: intlShape.isRequired,
  config: configShape.isRequired,
};

export default NavigatorIntro;
