import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';
import moment from 'moment-timezone';
import Select from 'react-select';

import { mountWithIntl, shallowWithIntl } from '../helpers/mock-intl-enzyme';
import configureMoment from '../../../app/util/configure-moment';
import DateSelect from '../../../app/component/stop/DateSelect';

describe('<DateSelect />', () => {
  const defaultProps = {
    startDate: '20190101',
    selectedDate: '20190102',
    dateFormat: 'YYYYMMDD',
    onDateChange: event => event.target.value,
  };

  after(() => {
    moment.locale('en');
    moment.tz.setDefault();
  });

  it('should render 60 options', () => {
    const wrapper = shallowWithIntl(<DateSelect {...defaultProps} />);
    expect(wrapper.find(Select).props().options).to.have.lengthOf(60);
  });

  it('should render today and tomorrow as text, others as weekday abbreviation with date', () => {
    const wrapper = mountWithIntl(<DateSelect {...defaultProps} />);
    const { options } = wrapper.find(Select).props();

    expect(options[0].textLabel).to.equal('Today');
    expect(options[1].textLabel).to.equal('Tomorrow');
    // expect(options[2].textLabel).to.equal('Th 3.1.');
    // expect(options[29].textLabel).to.equal('We 30.1.');
  });

  it('should use moment locale for weekday abbreviation', () => {
    const configWithMoment = {
      moment: {
        relativeTimeThreshold: {
          seconds: 55,
          minutes: 59,
          hours: 23,
          days: 26,
          months: 11,
        },
      },
      timezoneData:
        'Europe/Helsinki|EET EEST|-20 -30|01010101010101010101010|1BWp0 1qM0 WM0 1qM0 ' +
        'WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00|35e5',
    };
    configureMoment('fi', configWithMoment);

    const wrapper = mountWithIntl(<DateSelect {...defaultProps} />);
    const { options } = wrapper.find(Select).props();

    expect(options[2].textLabel).to.equal('to 3.1.');
  });

  it('should have selectedDate selected', () => {
    const wrapper = mountWithIntl(<DateSelect {...defaultProps} />);
    const selectValue = wrapper.find(Select).props().value;

    expect(selectValue).to.equal('20190102');
  });
});
