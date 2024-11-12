import { expect } from 'chai';
import { describe, it } from 'mocha';
import React from 'react';

import {
  component as Itinerary,
  ModeLeg,
  RouteLeg,
  ViaLeg,
} from '../../../../../app/component/itinerary/Itinerary';
import RouteNumberContainer from '../../../../../app/component/RouteNumberContainer';
import { AlertSeverityLevelType } from '../../../../../app/constants';
import {
  mockChildContextTypes,
  mockContext,
} from '../../../helpers/mock-context';
import {
  mountWithIntl,
  shallowWithIntl,
} from '../../../helpers/mock-intl-enzyme';
import dcw12 from '../../../test-data/dcw12';

const defaultProps = {
  breakpoint: 'large',
  hash: 1,
  onSelect: () => {},
  onSelectImmediately: () => {},
  refTime: 0,
};

describe('<Itinerary />', () => {
  it('should display both walking legs in the summary view', () => {
    const props = {
      ...defaultProps,
      itinerary: dcw12.walkingRouteWithIntermediatePlace.data,
      intermediatePlaces:
        dcw12.walkingRouteWithIntermediatePlace.intermediatePlaces,
      passive: false,
      refTime: dcw12.walkingRouteWithIntermediatePlace.refTime,
    };
    const wrapper = shallowWithIntl(<Itinerary {...props} />, {
      context: { config: { CONFIG: 'default' } },
    });

    expect(wrapper.find('.itinerary-legs').children()).to.have.lengthOf(3);
    expect(wrapper.find(ModeLeg)).to.have.lengthOf(2);
    expect(wrapper.find(ViaLeg)).to.have.lengthOf(1);
  });

  it('should display all city bike leg start stations in the summary view', () => {
    const props = {
      ...defaultProps,
      itinerary: dcw12.cityBikeRouteWithIntermediatePlaces.data,
      intermediatePlaces:
        dcw12.cityBikeRouteWithIntermediatePlaces.intermediatePlaces,
      passive: false,
      refTime: dcw12.cityBikeRouteWithIntermediatePlaces.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: {
        ...mockContext,
        config: { CONFIG: 'default', vehicleRental: { fewAvailableCount: 3 } },
      },
      childContextTypes: { ...mockChildContextTypes },
    });
    const legs = wrapper.find('.itinerary-legs');
    expect(legs.find(ModeLeg)).to.have.lengthOf.above(3);
    expect(wrapper.find(ViaLeg)).to.have.lengthOf(2);
  });

  it('should hide short legs from the summary view for a non-transit itinerary', () => {
    const props = {
      ...defaultProps,
      itinerary: dcw12.bikingRouteWithIntermediatePlaces.data,
      intermediatePlaces:
        dcw12.bikingRouteWithIntermediatePlaces.intermediatePlaces,
      passive: false,
      refTime: dcw12.bikingRouteWithIntermediatePlaces.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });

    const legs = wrapper.find('.itinerary-legs');
    expect(legs.children()).to.have.lengthOf(5);
    expect(legs.childAt(0).is(ModeLeg)).to.equal(true);
    expect(legs.childAt(1).is(ViaLeg)).to.equal(true);
    expect(legs.childAt(2).is(ModeLeg)).to.equal(true);
    expect(legs.childAt(3).is(ViaLeg)).to.equal(true);
    expect(legs.childAt(4).is(ModeLeg)).to.equal(true);
  });

  it('should show a connecting walk leg between via points for transit itinerary', () => {
    const props = {
      ...defaultProps,
      itinerary: dcw12.transitRouteWithWalkConnectingIntermediatePlaces.data,
      intermediatePlaces:
        dcw12.transitRouteWithWalkConnectingIntermediatePlaces
          .intermediatePlaces,
      passive: false,
      refTime: dcw12.transitRouteWithWalkConnectingIntermediatePlaces.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });

    expect(wrapper.find(ViaLeg)).to.have.lengthOf(2);
    expect(wrapper.find(RouteLeg)).to.have.lengthOf(2);
    expect(wrapper.find(ModeLeg)).to.have.lengthOf.above(0);
  });

  it('should show a connecting walk leg between last via point and end for transit itinerary', () => {
    const props = {
      ...defaultProps,
      itinerary:
        dcw12.transitRouteWithShortWalkAtEndAfterIntermediatePlace.data,
      intermediatePlaces:
        dcw12.transitRouteWithShortWalkAtEndAfterIntermediatePlace
          .intermediatePlaces,
      passive: false,
      refTime:
        dcw12.transitRouteWithShortWalkAtEndAfterIntermediatePlace.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });

    const legs = wrapper.find('.itinerary-legs');
    expect(legs.children()).to.have.lengthOf(4);
    expect(legs.childAt(0).is(RouteLeg)).to.equal(true);
    expect(legs.childAt(legs.length).is(ModeLeg)).to.equal(true);
  });

  it('should show a connecting walk leg between start and first via point for transit itinerary', () => {
    const props = {
      ...defaultProps,
      itinerary:
        dcw12.transitRouteWithShortWalkAtStartBeforeIntermediatePlace.data,
      intermediatePlaces:
        dcw12.transitRouteWithShortWalkAtStartBeforeIntermediatePlace
          .intermediatePlaces,
      passive: false,
      refTime:
        dcw12.transitRouteWithShortWalkAtStartBeforeIntermediatePlace.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });

    const legs = wrapper.find('.itinerary-legs');
    expect(legs.children()).to.have.lengthOf(4);
    expect(legs.childAt(0).is(ModeLeg)).to.equal(true);
    expect(legs.childAt(1).is(ViaLeg)).to.equal(true);
  });

  it('should show a via point for transit itinerary when the via point is at a stop', () => {
    const props = {
      ...defaultProps,
      itinerary: dcw12.transitRouteWithIntermediatePlaceAtStop.data,
      intermediatePlaces:
        dcw12.transitRouteWithIntermediatePlaceAtStop.intermediatePlaces,
      passive: false,
      refTime: dcw12.transitRouteWithIntermediatePlaceAtStop.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });

    expect(wrapper.find(ViaLeg)).to.have.lengthOf(1);
  });

  it('should show the really short first walking leg for a transit itinerary', () => {
    const props = {
      ...defaultProps,
      itinerary: dcw12.shortWalkingFirstLegWithMultipleViaPoints.data,
      intermediatePlaces:
        dcw12.shortWalkingFirstLegWithMultipleViaPoints.intermediatePlaces,
      passive: false,
      refTime: dcw12.shortWalkingFirstLegWithMultipleViaPoints.refTime,
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });

    expect(wrapper.find(ViaLeg)).to.have.lengthOf(3);
    expect(wrapper.find(RouteLeg)).to.have.lengthOf(2);
    expect(wrapper.find(ModeLeg)).to.have.lengthOf.above(2);
  });

  it('should not indicate that there is a disruption if the alert is not in effect', () => {
    const alertEffectiveEndDate = 1553778000;
    const props = {
      ...defaultProps,
      itinerary: {
        start: new Date((alertEffectiveEndDate + 1) * 1000).toISOString(),
        end: new Date((alertEffectiveEndDate + 100) * 1000).toISOString(),
        legs: [
          {
            from: {},
            mode: 'RAIL',
            route: {
              alerts: [
                {
                  alertSeverityLevel: AlertSeverityLevelType.Warning,
                  effectiveEndDate: alertEffectiveEndDate,
                  effectiveStartDate: 1553754595,
                },
              ],
              mode: 'RAIL',
            },
            start: {
              scheduledTime: new Date(
                (alertEffectiveEndDate + 1) * 1000,
              ).toISOString(),
            },
            end: {
              scheduledTime: new Date(
                (alertEffectiveEndDate + 100) * 1000,
              ).toISOString(),
            },
          },
        ],
      },
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });
    expect(
      wrapper.find(RouteNumberContainer).props().alertSeverityLevel,
    ).to.equal(undefined);
  });

  it('should indicate that there is a disruption due to a trip alert', () => {
    const props = {
      ...defaultProps,
      itinerary: {
        start: new Date(1553769600000).toISOString(),
        end: new Date(1553769601000).toISOString(),
        legs: [
          {
            from: {},
            mode: 'RAIL',
            route: {
              alerts: [
                {
                  alertSeverityLevel: AlertSeverityLevelType.Warning,
                  effectiveEndDate: 1553778000,
                  effectiveStartDate: 1553754595,
                  trip: {
                    pattern: {
                      code: 'HSL:3001I:0:01',
                    },
                  },
                },
              ],
              mode: 'RAIL',
            },
            start: { scheduledTime: new Date(1553769600000).toISOString() },
            end: { scheduledTime: new Date(1553769601000).toISOString() },
            trip: {
              pattern: {
                code: 'HSL:3001I:0:01',
              },
            },
          },
        ],
      },
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });
    expect(
      wrapper.find(RouteNumberContainer).props().alertSeverityLevel,
    ).to.equal(AlertSeverityLevelType.Warning);
  });

  it('should indicate that there is a disruption due to a route alert', () => {
    const props = {
      ...defaultProps,
      itinerary: {
        start: new Date(1553769600000).toISOString(),
        end: new Date(1553769601000).toISOString(),
        legs: [
          {
            from: {},
            mode: 'RAIL',
            route: {
              alerts: [
                {
                  alertSeverityLevel: AlertSeverityLevelType.Warning,
                  effectiveEndDate: 1553778000,
                  effectiveStartDate: 1553754595,
                  trip: null,
                },
              ],
              mode: 'RAIL',
            },
            start: { scheduledTime: new Date(1553769600000).toISOString() },
            end: { scheduledTime: new Date(1553769601000).toISOString() },
          },
        ],
      },
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });
    expect(
      wrapper.find(RouteNumberContainer).props().alertSeverityLevel,
    ).to.equal(AlertSeverityLevelType.Warning);
  });

  it('should indicate that there is a disruption due to a stop alert at the "from" stop', () => {
    const props = {
      ...defaultProps,
      itinerary: {
        start: new Date(1553769600000).toISOString(),
        end: new Date(1553769601000).toISOString(),
        legs: [
          {
            from: {
              stop: {
                alerts: [
                  {
                    alertSeverityLevel: AlertSeverityLevelType.Warning,
                    effectiveEndDate: 1553778000,
                    effectiveStartDate: 1553754595,
                  },
                ],
              },
            },
            mode: 'RAIL',
            route: {
              alerts: [],
              mode: 'RAIL',
            },
            start: { scheduledTime: new Date(1553769600000).toISOString() },
            end: { scheduledTime: new Date(1553769601000).toISOString() },
            to: {},
          },
        ],
      },
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });
    expect(
      wrapper.find(RouteNumberContainer).props().alertSeverityLevel,
    ).to.equal(AlertSeverityLevelType.Warning);
  });

  it('should indicate that there is a disruption due to a stop alert at the "to" stop', () => {
    const props = {
      ...defaultProps,
      itinerary: {
        start: new Date(1553769600000).toISOString(),
        end: new Date(1553769601000).toISOString(),
        legs: [
          {
            from: {},
            mode: 'RAIL',
            route: {
              alerts: [],
              mode: 'RAIL',
            },
            start: { scheduledTime: new Date(1553769600000).toISOString() },
            end: { scheduledTime: new Date(1553769601000).toISOString() },
            to: {
              stop: {
                alerts: [
                  {
                    alertSeverityLevel: AlertSeverityLevelType.Warning,
                    effectiveEndDate: 1553778000,
                    effectiveStartDate: 1553754595,
                  },
                ],
              },
            },
          },
        ],
      },
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });
    expect(
      wrapper.find(RouteNumberContainer).props().alertSeverityLevel,
    ).to.equal(AlertSeverityLevelType.Warning);
  });

  it('should not indicate that there is a disruption due to a stop alert at an intermediate stop', () => {
    const props = {
      ...defaultProps,
      itinerary: {
        start: new Date(1553769600000).toISOString(),
        end: new Date(1553769601000).toISOString(),
        legs: [
          {
            from: {},
            intermediatePlaces: [
              {
                stop: {
                  alerts: [],
                },
              },
              {
                stop: {
                  alerts: [
                    {
                      alertSeverityLevel: AlertSeverityLevelType.Warning,
                      effectiveEndDate: 1553778000,
                      effectiveStartDate: 1553754595,
                    },
                  ],
                },
              },
              {
                stop: {},
              },
            ],
            mode: 'RAIL',
            route: {
              alerts: [],
              mode: 'RAIL',
            },
            start: { scheduledTime: new Date(1553769600000).toISOString() },
            end: { scheduledTime: new Date(1553769601000).toISOString() },
          },
        ],
      },
    };
    const wrapper = mountWithIntl(<Itinerary {...props} />, {
      context: { ...mockContext },
      childContextTypes: { ...mockChildContextTypes },
    });
    expect(
      wrapper.find(RouteNumberContainer).props().alertSeverityLevel,
    ).to.equal(undefined);
  });
});
