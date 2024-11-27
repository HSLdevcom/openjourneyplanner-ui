import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';
import { mockContext } from '../helpers/mock-context';

import Timetable from '../../../app/component/stop/Timetable';
import TimetableRow from '../../../app/component/stop/TimetableRow';
import SecondaryButton from '../../../app/component/SecondaryButton';
import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import * as timetables from '../../../app/configurations/timetableConfigUtils';

const stopIdNumber = '1140199';

const props = {
  startDate: '20190110',
  onDateChange: () => {},
  stop: {
    gtfsId: `HSL:${stopIdNumber}`,
    locationType: 'STOP',
    name: 'Ooppera',
    stoptimesForServiceDate: [
      {
        pattern: {
          code: 'HSL:1070:1:01',
          headsign: 'Kamppi',
          route: {
            agency: {
              name: 'Helsingin seudun liikenne',
            },
            longName: 'Kamppi-Töölö-Pihlajamäki-Pukinmäki-Malmi',
            mode: 'BUS',
            shortName: '70',
          },
        },
        stoptimes: [
          {
            headsign: 'Kamppi via Töölö',
            pickupType: 'SCHEDULED',
            realtimeState: 'CANCELED',
            scheduledDeparture: 32460,
            serviceDay: 1547071200,
          },
        ],
      },
    ],
  },
  date: '20231031',
  language: 'en',
};

describe('<Timetable />', () => {
  it('should set isCanceled to true for rows that have RealtimeState CANCELED', () => {
    const wrapper = shallowWithIntl(<Timetable {...props} />, {
      context: {
        ...mockContext,
        config: {
          CONFIG: 'default',
          URL: {},
        },
      },
    });
    expect(wrapper.find(TimetableRow)).to.have.lengthOf(1);
    expect(wrapper.find(TimetableRow).prop('stoptimes')[0].isCanceled).to.equal(
      true,
    );
  });

  it('should set valid stopPDFURL for StopPageActionBar', () => {
    const baseTimetableURL = 'https://timetabletest.com/stops/';
    const wrapper = shallowWithIntl(<Timetable {...props} />, {
      context: {
        ...mockContext,
        config: {
          CONFIG: 'default',
          URL: { STOP_TIMETABLES: { HSL: baseTimetableURL } },
          timetables: { HSL: timetables.default.HSL },
        },
      },
    });
    expect(wrapper.find(SecondaryButton)).to.have.lengthOf(2);
  });
});
