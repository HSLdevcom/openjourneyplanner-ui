import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';
import { mockContext } from '../helpers/mock-context';
import { shallowWithIntl } from '../helpers/mock-intl-enzyme';
import {
  AlertSeverityLevelType,
  AlertEntityType,
} from '../../../app/constants';
import AlertList from '../../../app/component/AlertList';
import StopAlerts from '../../../app/component/stop/StopAlerts';

describe('<StopAlerts />', () => {
  it("should indicate that there are no alerts if the stop's routes have no alerts and the stop has no canceled stoptimes", () => {
    const props = {
      stop: {
        gtfsId: 'feed:bar',
        locationType: 'STOP',
        code: '321',
        alerts: [],
        routes: [],
        stoptimes: [
          {
            headsign: 'Kamppi',
            realtimeState: 'SCHEDULED',
            trip: {
              tripHeadsign: 'Kamppi',
              route: {
                gtfsId: 'feed:63',
                alerts: [],
                mode: 'BUS',
                shortName: '63',
              },
              stops: [
                {
                  name: 'Saramäentie',
                },
              ],
            },
          },
        ],
      },
    };
    const wrapper = shallowWithIntl(<StopAlerts {...props} />, {
      context: { ...mockContext },
    });
    expect(wrapper.find(AlertList).props()).to.deep.equal({
      cancelations: [],
      serviceAlerts: [],
      showLinks: false,
    });
  });

  it('should indicate that there is a direct service alert on a route', () => {
    const props = {
      stop: {
        gtfsId: 'feed:bar',
        locationType: 'STOP',
        code: '321',
        alerts: [
          {
            entities: [
              {
                __typename: AlertEntityType.Route,
                gtfsId: 'feed:101',
              },
            ],
          },
        ],
        stoptimes: [],
        routes: [
          {
            gtfsId: 'feed:101',
          },
        ],
      },
    };
    const wrapper = shallowWithIntl(<StopAlerts {...props} />, {
      context: { ...mockContext },
    });
    expect(wrapper.find(AlertList).prop('serviceAlerts')).to.have.lengthOf(1);
  });

  it('should indicate that there is a canceled stoptime on a route', () => {
    const props = {
      stop: {
        gtfsId: 'feed:bar',
        locationType: 'STOP',
        code: '431',
        alerts: [],
        routes: [],
        stoptimes: [
          {
            headsign: 'Kamppi',
            realtimeState: 'CANCELED',
            trip: {
              tripHeadsign: 'Kamppi',
              route: {
                gtfsId: 'feed:63',
                alerts: [],
                mode: 'BUS',
                shortName: '63',
              },
              stops: [
                {
                  name: 'Saramäentie',
                },
              ],
            },
          },
        ],
      },
    };
    const wrapper = shallowWithIntl(<StopAlerts {...props} />, {
      context: { ...mockContext },
    });
    expect(wrapper.find(AlertList).prop('cancelations')).to.have.lengthOf(1);
  });

  it('should indicate that the stop itself has a service alert', () => {
    const props = {
      stop: {
        gtfsId: 'feed:bar',
        locationType: 'STOP',
        code: '321',
        alerts: [
          {
            alertSeverityLevel: AlertSeverityLevelType.Warning,
            entities: [
              {
                __typename: AlertEntityType.Stop,
                gtfsId: 'feed:bar',
              },
            ],
          },
        ],
        routes: [],
        stoptimes: [],
      },
    };
    const wrapper = shallowWithIntl(<StopAlerts {...props} />, {
      context: { ...mockContext },
    });
    expect(wrapper.find(AlertList).prop('serviceAlerts')).to.have.lengthOf(1);
  });
});
