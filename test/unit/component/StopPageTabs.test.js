import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';

import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import { Component as StopPageTabs } from '../../../app/component/stop/StopPageTabs';

const context = {
  match: {
    location: {
      pathname: 'foobar',
    },
    params: {
      stopId: 'HSL:2211275',
    },
  },
};

describe('<StopPageTabs />', () => {
  it('should render empty if stop information is missing', () => {
    const props = {
      breakpoint: 'large',
      children: <div />,
      routes: [],
      stop: null,
    };
    const wrapper = shallowWithIntl(<StopPageTabs {...props} />, {
      context,
    });
    expect(wrapper.isEmptyRender()).to.equal(true);
  });
});
