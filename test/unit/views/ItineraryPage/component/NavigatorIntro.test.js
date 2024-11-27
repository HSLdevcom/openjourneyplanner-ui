import { assert } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';

import NavigatorIntro from '../../../../../app/component/itinerary/navigator/navigatorintro/NavigatorIntro';
import {
  mockChildContextTypes,
  mockContext,
} from '../../../helpers/mock-context';
import { mountWithIntl } from '../../../helpers/mock-intl-enzyme';

const defaultProps = {
  onClose: () => {},
};

describe('<NavigatorIntro />', () => {
  it('should render logo if prop is present', () => {
    const wrapper = mountWithIntl(
      <NavigatorIntro logo="foobar" {...defaultProps} />,
      {
        context: {
          ...mockContext,
        },
        childContextTypes: { ...mockChildContextTypes },
      },
    );

    expect(
      wrapper.find('div.navigator-intro-modal-content img'),
    ).to.have.lengthOf(1);
  });

  it('should not render logo if prop is missing', () => {
    const wrapper = mountWithIntl(<NavigatorIntro {...defaultProps} />, {
      context: {
        ...mockContext,
      },
      childContextTypes: { ...mockChildContextTypes },
    });

    assert(wrapper.find('div.navigator-intro-modal-content img'), undefined);
  });

  it('should render login tip if login is allowed and user is not logged in', () => {
    const wrapper = mountWithIntl(
      <NavigatorIntro {...defaultProps} isLoggedIn={false} />,
      {
        context: {
          ...mockContext,
          config: { CONFIG: 'default', allowLogin: true },
        },
        childContextTypes: { ...mockChildContextTypes },
      },
    );

    expect(wrapper.find('div.login-tip')).to.have.lengthOf(1);
  });

  it('should not render login tip if login is not allowed and user is not logged in', () => {
    const wrapper = mountWithIntl(
      <NavigatorIntro {...defaultProps} isLoggedIn={false} />,
      {
        context: {
          ...mockContext,
          config: { CONFIG: 'default', allowLogin: true },
        },
        childContextTypes: { ...mockChildContextTypes },
      },
    );

    assert(wrapper.find('div.login-tip'), undefined);
  });

  it('should not render login tip if login is allowed and user logged in', () => {
    const wrapper = mountWithIntl(
      <NavigatorIntro {...defaultProps} isLoggedIn />,
      {
        context: {
          ...mockContext,
          config: { CONFIG: 'default', allowLogin: true },
        },
        childContextTypes: { ...mockChildContextTypes },
      },
    );

    assert(wrapper.find('div.login-tip'), undefined);
  });
});
