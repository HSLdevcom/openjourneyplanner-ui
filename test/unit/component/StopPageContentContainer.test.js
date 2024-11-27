import React from 'react';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { mockMatch, mockRouter } from '../helpers/mock-router';
import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import { Component as StopPageContentContainer } from '../../../app/component/stop/StopPageContentContainer';

describe('<StopPageContentContainer />', () => {
  it("should show a 'no departures' indicator", () => {
    const props = {
      currentTime: 0,
      params: {
        stopId: '1234',
      },
      relay: {
        refetch: () => {},
        environment: {},
      },
      stop: {},
      router: mockRouter,
      match: mockMatch,
    };
    const wrapper = shallowWithIntl(<StopPageContentContainer {...props} />, {
      context: { config: { CONFIG: 'default' } },
    });

    expect(wrapper.find('.stop-no-departures-container')).to.have.lengthOf(1);
  });
});
