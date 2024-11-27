import React from 'react';

import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import ZoneIcon from '../../../app/component/ZoneIcon';

import StopCardHeader from '../../../app/component/stop/StopCardHeader';
import ExternalLink from '../../../app/component/ExternalLink';
import { mockContext, mockChildContextTypes } from '../helpers/mock-context';

describe('<StopCardHeader />', () => {
  it('should not render the zone icon if zoneId is missing', () => {
    const props = {
      stop: {
        code: '1270',
        desc: 'Hietaniemenkatu',
        gtfsId: 'HSL:1130181',
        name: 'Hietaniemi',
        zoneId: null,
      },
    };
    const wrapper = shallowWithIntl(<StopCardHeader {...props} />, {
      context: {
        ...mockContext,
        config: {
          stopCard: { header: {} },
          zones: {
            stops: true,
          },
          colors: {
            primary: '#000000',
          },
        },
      },
      childContextTypes: {
        ...mockChildContextTypes,
      },
    });
    expect(wrapper.find(ZoneIcon)).to.have.lengthOf(0);
  });

  it('should not render the virtual monitor if so configured', () => {
    const props = {
      stop: {
        code: '1270',
        desc: 'Hietaniemenkatu',
        gtfsId: 'HSL:1130181',
        name: 'Hietaniemi',
        zoneId: 'A',
      },
      className: 'stop-page header',
    };
    const wrapper = shallowWithIntl(<StopCardHeader {...props} />, {
      context: {
        ...mockContext,
        config: {
          stopCard: {
            header: {
              virtualMonitorBaseUrl: '',
            },
          },
          zones: {
            stops: false,
          },
          colors: {
            primary: '#000000',
          },
          allowLogin: false,
        },
      },
      childContextTypes: {
        ...mockChildContextTypes,
      },
    });

    expect(wrapper.find(ExternalLink)).to.have.lengthOf(0);
  });

  it('should not render the zone icon if so configured', () => {
    const props = {
      stop: {
        code: '1270',
        desc: 'Hietaniemenkatu',
        gtfsId: 'HSL:1130181',
        name: 'Hietaniemi',
        zoneId: 'A',
      },
    };
    const wrapper = shallowWithIntl(<StopCardHeader {...props} />, {
      context: {
        ...mockContext,
        config: {
          stopCard: { header: {} },
          zones: {
            stops: false,
          },
          colors: {
            primary: '#000000',
          },
        },
      },
      childContextTypes: {
        ...mockChildContextTypes,
      },
    });
    expect(wrapper.find(ZoneIcon)).to.have.lengthOf(0);
  });
});
