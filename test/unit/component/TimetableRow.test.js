import React from 'react';
import { expect } from 'chai';
import { describe, it } from 'mocha';

import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import TimetableRow from '../../../app/component/stop/TimetableRow';

import data from '../test-data/dt2720';

describe('<TimetableRow />', () => {
  it('should not show stoptimes whose routes have been filtered out', () => {
    const props = {
      ...data.matchingFilteredRoutes,
    };
    const wrapper = shallowWithIntl(<TimetableRow {...props} />);
    expect(wrapper.find('.timetablerow-linetime')).to.have.lengthOf(2);
  });

  it('should apply style "display: none" when no suitable departure times exist for the filtered routes', () => {
    const props = {
      ...data.nonMatchingFilteredRoutes,
    };
    const wrapper = shallowWithIntl(<TimetableRow {...props} />);
    expect(wrapper.find('.timetable-row').get(0).props.style).to.have.property(
      'display',
      'none',
    );
  });

  it('should apply className canceled if a stoptime has been canceled', () => {
    const props = {
      title: '09',
      stoptimes: [
        {
          id: 'HSL:1070:1:01',
          name: '70',
          scheduledDeparture: 32460,
          serviceDay: 1547071200,
          headsign: 'Kamppi',
          longName: 'Kamppi-Töölö-Pihlajamäki-Pukinmäki-Malmi',
          isCanceled: true,
          duplicate: false,
          mode: 'BUS',
        },
        {
          id: 'HSL:1070:1:01',
          name: '70',
          scheduledDeparture: 33000,
          serviceDay: 1547071200,
          headsign: 'Kamppi',
          longName: 'Kamppi-Töölö-Pihlajamäki-Pukinmäki-Malmi',
          isCanceled: false,
          duplicate: false,
          mode: 'BUS',
        },
      ],
      showRoutes: [],
      timerows: [],
    };
    const wrapper = shallowWithIntl(<TimetableRow {...props} />);
    expect(wrapper.find('.timetablerow-linetime')).to.have.lengthOf(2);
    expect(wrapper.find('.timetablerow-linetime.canceled')).to.have.lengthOf(1);
  });
});
