import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import Link from 'found/Link';

import DisruptionInfoButtonContainer from './DisruptionInfoButtonContainer';
import Icon from './Icon';
import LangSelect from './LangSelect';
import MainMenuLinks from './MainMenuLinks';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import LoginButton from './LoginButton';
import UserInfo from './UserInfo';

function MainMenu(props, { config, intl }) {
  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
  return (
    <div aria-hidden={!props.visible} className="main-menu no-select">
      <div className="main-menu-top-section">
        {props.breakpoint === 'large' &&
          config.allowLogin &&
          (!props.user.name ? (
            <LoginButton />
          ) : (
            <UserInfo
              user={props.user}
              list={[
                {
                  key: 'dropdown-item-1',
                  messageId: 'logout',
                  href: '/logout',
                },
              ]}
              isMobile
            />
          ))}
        <button
          onClick={props.toggleVisibility}
          className="close-button cursor-pointer"
          aria-label={intl.formatMessage({
            id: 'main-menu-label-close',
            defaultMessage: 'Close the main menu',
          })}
        >
          <Icon img="icon-icon_close" className="medium" />
        </button>
      </div>
      <section className="menu-section">
        <LangSelect />
      </section>
      <section className="menu-section main-links">
        {config.mainMenu.showFrontPageLink && (
          <div className="offcanvas-section">
            {props.homeUrl !== undefined && (
              <Link
                id="frontpage"
                to={props.homeUrl}
                onClick={() => {
                  addAnalyticsEvent({
                    category: 'Navigation',
                    action: 'Home',
                    name: null,
                  });
                }}
              >
                <FormattedMessage id="frontpage" defaultMessage="Frontpage" />
              </Link>
            )}
          </div>
        )}
        {config.mainMenu.showDisruptions && props.showDisruptionInfo && (
          <div className="offcanvas-section">
            <DisruptionInfoButtonContainer />
          </div>
        )}
        {config.appBarLink && config.appBarLink.name && config.appBarLink.href && (
          <div className="offcanvas-section">
            <Link
              id="appBarLink"
              to={config.appBarLink.href}
              onClick={() => {
                addAnalyticsEvent({
                  category: 'Navigation',
                  action: 'appBarLink',
                  name: null,
                });
              }}
            >
              {config.appBarLink.name}
            </Link>
          </div>
        )}
      </section>
      <section className="menu-section footer">
        <MainMenuLinks
          content={((config.footer && config.footer.content) || []).filter(
            item => item.href || item.route,
          )}
        />
      </section>
      <div className="copyright">© Digitransit 2021</div>
    </div>
  );
}

MainMenu.propTypes = {
  showDisruptionInfo: PropTypes.bool,
  toggleVisibility: PropTypes.func.isRequired,
  visible: PropTypes.bool,
  homeUrl: PropTypes.string.isRequired,
  user: PropTypes.object,
  breakpoint: PropTypes.string.isRequired,
};

MainMenu.defaultProps = {
  visible: true,
};

MainMenu.contextTypes = {
  getStore: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
};

export default MainMenu;
