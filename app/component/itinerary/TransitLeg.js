import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import Link from 'found/Link';
import connectToStores from 'fluxible-addons-react/connectToStores';
import LegAgencyInfo from './LegAgencyInfo';
import Icon from '../Icon';
import IntermediateLeg from './IntermediateLeg';
import ItineraryCircleLine from './ItineraryCircleLine';
import ItineraryMapAction from './ItineraryMapAction';
import PlatformNumber from '../PlatformNumber';
import ServiceAlertIcon from '../ServiceAlertIcon';
import StopCode from '../StopCode';
import {
  alertSeverityCompare,
  getActiveAlertSeverityLevel,
  getActiveLegAlerts,
  getActiveLegAlertSeverityLevel,
  getMaximumAlertSeverityLevel,
  hasEntitiesOfType,
  legHasCancelation,
  tripHasCancelationForStop,
} from '../../util/alertUtils';
import {
  PREFIX_DISRUPTION,
  PREFIX_ROUTES,
  PREFIX_STOPS,
} from '../../util/path';
import { durationToString } from '../../util/timeUtils';
import { addAnalyticsEvent } from '../../util/analyticsUtils';
import {
  getHeadsignFromRouteLongName,
  getStopHeadsignFromStoptimes,
  getZoneLabel,
  showBikeBoardingNote,
  showCarBoardingNote,
  legTimeStr,
  legTime,
} from '../../util/legUtils';
import { shouldShowFareInfo } from '../../util/fareUtils';
import { AlertEntityType, AlertSeverityLevelType } from '../../constants';
import { legShape, configShape } from '../../util/shapes';
import ZoneIcon from '../ZoneIcon';
import StopInfo from './StopInfo';
import InterlineInfo from './InterlineInfo';
import AlternativeLegsInfo from './AlternativeLegsInfo';
import LegInfo from './LegInfo';
import ExternalLink from '../ExternalLink';

const stopCode = code => code && <StopCode code={code} />;

/**
 * Some next legs might be for example 24h in the future which seems confusing.
 * Only show alternatives that are less than 12h in the future.
 */
const filterNextLegs = leg => {
  if (!leg.nextLegs) {
    return [];
  }
  return leg.nextLegs.filter(
    nextLeg => legTime(nextLeg.start) - legTime(leg.start) < 12 * 3600 * 1000, // 12 hours
  );
};

class TransitLeg extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showIntermediateStops:
        props.interliningLegs.length >= 1
          ? props.interliningLegs.reduce(
              (sum, leg) => sum + leg.intermediatePlaces.length,
              0,
            ) < 2
          : props.leg.intermediatePlaces.length < 2,
      showAlternativeLegs: false,
    };
  }

  isRouteConstantOperation = () =>
    this.context.config.constantOperationRoutes &&
    !!this.context.config.constantOperationRoutes[this.props.leg.route.gtfsId];

  displayAlternativeLegs = () =>
    !!this.context.config.showAlternativeLegs &&
    filterNextLegs(this.props.leg).length > 0 &&
    !this.isRouteConstantOperation();

  toggleShowIntermediateStops = () => {
    addAnalyticsEvent({
      event: 'sendMatomoEvent',
      category: 'Itinerary',
      action: this.state.showIntermediateStops
        ? 'HideIntermediateStops'
        : 'ShowIntermediateStops',
      name: null,
    });

    this.setState(prevState => ({
      showIntermediateStops: !prevState.showIntermediateStops,
    }));
  };

  getZoneChange() {
    const { leg } = this.props;
    const startZone = leg.from.stop.zoneId;
    const endZone = leg.to.stop.zoneId || leg.to.stop.zoneId;
    const renderZoneIcons = () => {
      return (
        this.context.config.zones.itinerary &&
        leg.from.stop.gtfsId &&
        this.context.config.feedIds.includes(leg.from.stop.gtfsId.split(':')[0])
      );
    };
    if (
      startZone !== endZone &&
      (!this.state.showIntermediateStops ||
        leg.intermediatePlaces.length === 0) &&
      renderZoneIcons()
    ) {
      return (
        <div className="time-column-zone-icons-container">
          <ZoneIcon
            zoneId={getZoneLabel(startZone, this.context.config)}
            showUnknown
          />
          <ZoneIcon
            zoneId={getZoneLabel(endZone, this.context.config)}
            className="zone-delimiter"
            showUnknown
          />
        </div>
      );
    }

    if (startZone === endZone && renderZoneIcons()) {
      return (
        <div className="time-column-zone-icons-container single">
          <ZoneIcon
            zoneId={getZoneLabel(startZone, this.context.config)}
            showUnknown
          />
        </div>
      );
    }
    return null;
  }

  renderIntermediate() {
    const { leg, mode, interliningLegs } = this.props;
    if (
      (leg.intermediatePlaces.length > 0 || interliningLegs.length > 0) &&
      this.state.showIntermediateStops === true
    ) {
      const places = leg.intermediatePlaces.slice();
      if (interliningLegs) {
        let previousLeg = leg;
        interliningLegs.forEach(iLeg => {
          places.push(
            { ...previousLeg.to, arrival: previousLeg.end },
            ...iLeg.intermediatePlaces,
          );
          previousLeg = iLeg;
        });
      }
      const stopList = places.map((place, i, array) => {
        const isFirstPlace = i === 0;
        const isLastPlace = i === array.length - 1;
        const isCanceled = tripHasCancelationForStop(leg.trip, place.stop);

        const previousZoneId =
          (array[i - 1] && array[i - 1].stop.zoneId) ||
          (isFirstPlace && leg.from.stop.zoneId);
        const currentZoneId = place.stop.zoneId;
        const nextZoneId =
          (array[i + 1] && array[i + 1].stop.zoneId) ||
          (isLastPlace &&
            interliningLegs[interliningLegs.length - 1]?.to.stop.zoneId) ||
          leg.to.stop.zoneId;
        const previousZoneIdDiffers =
          previousZoneId && previousZoneId !== currentZoneId;
        const nextZoneIdDiffers = nextZoneId && nextZoneId !== currentZoneId;
        const showCurrentZoneId = previousZoneIdDiffers || nextZoneIdDiffers;
        return (
          <IntermediateLeg
            placesCount={places.length}
            color={leg.route ? `#${leg.route.color}` : 'currentColor'}
            key={place.stop.gtfsId}
            gtfsId={place.stop.gtfsId}
            mode={mode}
            name={place.stop.name}
            arrival={place.arrival}
            realTime={leg.realTime}
            stopCode={place.stop.code}
            focusFunction={this.context.focusFunction({
              lat: place.stop.lat,
              lon: place.stop.lon,
            })}
            showZoneLimits={this.context.config.zones.itinerary}
            showCurrentZoneDelimiter={previousZoneIdDiffers}
            previousZoneId={
              (isFirstPlace &&
                previousZoneIdDiffers &&
                getZoneLabel(previousZoneId, this.context.config)) ||
              undefined
            }
            currentZoneId={
              (showCurrentZoneId &&
                getZoneLabel(currentZoneId, this.context.config)) ||
              undefined
            }
            nextZoneId={
              (isLastPlace &&
                nextZoneIdDiffers &&
                getZoneLabel(nextZoneId, this.context.config)) ||
              undefined
            }
            isViaPoint={place.isViaPoint}
            isLastPlace={isLastPlace}
            isCanceled={isCanceled}
          />
        );
      });
      return <div className="itinerary-leg-container">{stopList}</div>;
    }
    return null;
  }

  renderMain = () => {
    const {
      children,
      focusAction,
      index,
      leg,
      mode,
      lang,
      omitDivider,
      interliningLegs,
      usingOwnCarWholeTrip,
    } = this.props;
    const { config, intl } = this.context;
    const startMs = legTime(leg.start);
    const time = legTimeStr(leg.start);
    const modeClassName = mode.toLowerCase();
    const LegRouteName = leg.from.name.concat(' - ').concat(leg.to.name);

    const textVersionBeforeLink = (
      <FormattedMessage
        id="itinerary-details.transit-leg-part-1"
        values={{
          time,
          realtime: leg.realTime ? intl.formatMessage({ id: 'realtime' }) : '',
        }}
      />
    );
    const textVersionAfterLink = (
      <FormattedMessage
        id="itinerary-details.transit-leg-part-2"
        values={{
          startStop: leg.from.name,
          startZoneInfo: intl.formatMessage(
            { id: 'zone-info' },
            { zone: leg.from.stop.zoneId },
          ),
          endZoneInfo: intl.formatMessage(
            { id: 'zone-info' },
            { zone: leg.to.stop.zoneId },
          ),
          endStop: leg.to.name,
          duration: durationToString(leg.duration * 1000),
          trackInfo: (
            <PlatformNumber
              number={leg.from.stop.platformCode}
              short={false}
              isRailOrSubway={
                modeClassName === 'rail' || modeClassName === 'subway'
              }
            />
          ),
        }}
      />
    );

    const alerts = getActiveLegAlerts(leg, startMs / 1000);
    const alert =
      alerts && alerts.length > 0
        ? alerts.sort(alertSeverityCompare)[0]
        : undefined;
    const alertSeverityLevel = getMaximumAlertSeverityLevel(alerts);
    let alertSeverityDescription = null;
    if (alertSeverityLevel) {
      let id;
      switch (alertSeverityLevel) {
        case AlertSeverityLevelType.Info:
          id = 'itinerary-details.route-has-info-alert';
          break;
        case AlertSeverityLevelType.Warning:
          id = 'itinerary-details.route-has-warning-alert';
          break;
        case AlertSeverityLevelType.Severe:
          id = 'itinerary-details.route-has-severe-alert';
          break;
        case AlertSeverityLevelType.Unknown:
        default:
          id = 'itinerary-details.route-has-unknown-alert';
          break;
      }
      alertSeverityDescription = <FormattedMessage id={id} />;
    }
    const zoneIcons = this.getZoneChange();
    // Checks if route only has letters without identifying numbers and
    // length doesn't fit in the tab view
    const hasNoShortName =
      leg.route.shortName &&
      /^([^0-9]*)$/.test(leg.route.shortName) &&
      leg.route.shortName.length > 3;

    const headsign =
      getStopHeadsignFromStoptimes(leg.from.stop, leg.trip.stoptimesForDate) ||
      leg.trip.tripHeadsign ||
      getHeadsignFromRouteLongName(leg.route);

    let intermediateStopCount = leg.intermediatePlaces.length;
    if (interliningLegs) {
      intermediateStopCount = interliningLegs.reduce(
        (prev, curr) => prev + curr.intermediatePlaces.length + 1,
        leg.intermediatePlaces.length,
      );
    }
    const { showBikeBoardingInformation, showCarBoardingInformation } = leg;

    const createNotification = notification => {
      return (
        <>
          <div className="disruption-icon notification-icon">
            <ServiceAlertIcon
              className="inline-icon"
              severityLevel={AlertSeverityLevelType.Info}
            />
          </div>
          <div
            className={cx('info-notification', {
              'no-header': !notification.header,
            })}
          >
            {notification.header && (
              <h3 className="info-header">{notification.header[lang]}</h3>
            )}
            <div
              className={cx('info-content', {
                'no-header': !notification.header,
              })}
            >
              {notification.content[lang].join(' ')}
            </div>
          </div>
        </>
      );
    };

    const createNotificationWithLink = notification => {
      return (
        <a
          href={`https://www.${notification.link[lang]}`}
          className="disruption-link"
          target="_blank"
          rel="noreferrer"
        >
          {createNotification(notification)}
          <Icon
            img="icon-icon_arrow-collapse--right"
            className="disruption-link-arrow"
            color={config.colors.primary}
          />
        </a>
      );
    };
    const routeNotifications = [];
    if (
      config.NODE_ENV !== 'test' &&
      config.routeNotifications &&
      config.routeNotifications.length > 0
    ) {
      for (let i = 0; i < config.routeNotifications.length; i++) {
        const notification = config.routeNotifications[i];
        if (
          (showBikeBoardingInformation &&
            notification.showForBikeWithPublic &&
            showBikeBoardingNote(leg, config)) ||
          (showCarBoardingInformation &&
            notification.showForCarWithPublic &&
            showCarBoardingNote(leg, config)) ||
          notification.showForRoute?.(leg.route)
        ) {
          routeNotifications.push(
            <div
              className={cx('disruption', {
                'no-header': !notification.header,
              })}
              key={`note-${index}`}
            >
              {notification.link
                ? createNotificationWithLink(notification)
                : createNotification(notification)}
            </div>,
          );
        }
      }
    }

    return (
      <div key={index} className="row itinerary-row">
        <span className="sr-only">{textVersionBeforeLink}</span>
        <div className="small-2 columns itinerary-time-column">
          <span className="sr-only">
            <FormattedMessage
              id={`${this.props.mode}-with-route-number`}
              values={{
                routeNumber: leg.route?.shortName,
                headSign: leg.trip?.tripHeadsign,
              }}
              defaultMessage={`${this.props.mode} {routeNumber} {headSign}`}
            />
          </span>
          <span aria-hidden="true">
            <div className="itinerary-time-column-time">
              <span className={cx({ realtime: leg.realTime })}>
                <span className={cx({ canceled: legHasCancelation(leg) })}>
                  {time}
                </span>
              </span>
            </div>
            {zoneIcons}
          </span>
        </div>
        <span className="sr-only">{textVersionAfterLink}</span>
        <ItineraryCircleLine
          index={index}
          modeClassName={modeClassName}
          color={leg.route ? `#${leg.route.color}` : 'currentColor'}
          renderBottomMarker={
            !this.state.showIntermediateStops ||
            (leg.intermediatePlaces.length === 0 && interliningLegs.length < 1)
          }
        />
        <div
          style={{
            color: leg.route ? `#${leg.route.color}` : 'currentColor',
          }}
          className={cx(
            'small-9 columns itinerary-instruction-column',
            { first: index === 0 },
            modeClassName,
          )}
        >
          <span className="sr-only">
            <FormattedMessage
              id="itinerary-summary.show-on-map"
              values={{ target: leg.from.name || '' }}
            />
          </span>
          <div
            className={cx('itinerary-leg-first-row', 'transit', {
              first: index === 0,
            })}
          >
            <div className="itinerary-leg-row">
              <Link
                aria-label={leg.from.name?.toLowerCase()}
                onClick={e => {
                  e.stopPropagation();
                  addAnalyticsEvent({
                    category: 'Itinerary',
                    action: 'OpenRouteFromItinerary',
                    name: mode,
                  });
                }}
                to={`/${PREFIX_STOPS}/${leg.from.stop.gtfsId}`}
              >
                {leg.from.name}
                {leg.isViaPoint && (
                  <Icon
                    img="icon-icon_mapMarker-via"
                    className="itinerary-mapmarker-icon"
                  />
                )}
                <Icon
                  img="icon-icon_arrow-collapse--right"
                  className="itinerary-arrow-icon"
                  color={config.colors.primary}
                />
              </Link>
              <ServiceAlertIcon
                className="inline-icon"
                severityLevel={getActiveAlertSeverityLevel(
                  leg.from.stop && leg.from.stop.alerts,
                  startMs / 1000,
                )}
              />
              <div className="stop-code-container">
                {stopCode(leg.from.stop && leg.from.stop.code)}
                <PlatformNumber
                  number={leg.from.stop.platformCode}
                  short
                  isRailOrSubway={
                    modeClassName === 'rail' || modeClassName === 'subway'
                  }
                />
              </div>
            </div>
            <ItineraryMapAction
              target={leg.from.name || ''}
              focusAction={focusAction}
            />
          </div>
          <LegInfo
            leg={leg}
            hasNoShortName={hasNoShortName}
            headsign={headsign}
            alertSeverityLevel={alertSeverityLevel}
            isAlternativeLeg={false}
            displayTime={this.displayAlternativeLegs()}
            changeHash={this.props.changeHash}
            tabIndex={this.props.tabIndex}
            isCallAgency={mode === 'call'}
          />

          {this.state.showAlternativeLegs &&
            !this.isRouteConstantOperation() &&
            leg.nextLegs.map(l => (
              <LegInfo
                key={l.route.shortName + legTime(l.start)}
                leg={l}
                hasNoShortName={hasNoShortName}
                headsign={l.trip.tripHeadsign}
                isAlternativeLeg
                alertSeverityLevel={getActiveLegAlertSeverityLevel(
                  l,
                  l.start / 1000,
                )}
                displayTime
                isCallAgency={mode === 'call'}
              />
            ))}
          {this.displayAlternativeLegs() && (
            <AlternativeLegsInfo
              legs={filterNextLegs(leg)}
              showAlternativeLegs={this.state.showAlternativeLegs}
              toggle={() =>
                this.setState(prevState => ({
                  ...prevState,
                  showAlternativeLegs: !prevState.showAlternativeLegs,
                }))
              }
            />
          )}
          {(alertSeverityLevel === AlertSeverityLevelType.Warning ||
            alertSeverityLevel === AlertSeverityLevelType.Severe ||
            alertSeverityLevel === AlertSeverityLevelType.Unknown) && (
            <div className="disruption">
              <div className="disruption-link-container">
                <Link
                  to={
                    (hasEntitiesOfType(alert, AlertEntityType.Route) &&
                      `/${PREFIX_ROUTES}/${leg.route.gtfsId}/${PREFIX_DISRUPTION}/${leg.trip.pattern.code}`) ||
                    (hasEntitiesOfType(alert, AlertEntityType.Stop) &&
                      `/${PREFIX_STOPS}/${alert.entities[0].gtfsId}/${PREFIX_DISRUPTION}/`)
                  }
                  className="disruption-link"
                >
                  <div className="disruption-icon">
                    <ServiceAlertIcon
                      className="inline-icon"
                      severityLevel={alertSeverityLevel}
                    />
                  </div>
                  <div className="description">
                    {config.showAlertHeader
                      ? alert.alertHeaderText
                      : alert.alertDescriptionText}
                  </div>
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="disruption-link-arrow"
                    color={config.colors.primary}
                  />
                </Link>
              </div>
            </div>
          )}
          {interliningLegs?.length > 0 ? (
            <InterlineInfo
              legs={interliningLegs}
              leg={leg}
              usingOwnCarWholeTrip={usingOwnCarWholeTrip}
            />
          ) : (
            !omitDivider &&
            routeNotifications.length === 0 && <div className="divider" />
          )}
          {routeNotifications}
          <LegAgencyInfo leg={leg} />
          {children}
          {intermediateStopCount !== 0 && (
            <div className="intermediate-stops-button-container">
              {(leg.intermediatePlaces.length > 1 ||
                interliningLegs.length >= 1) && (
                <StopInfo
                  toggleFunction={this.toggleShowIntermediateStops}
                  leg={leg}
                  intermediateStopCount={intermediateStopCount}
                  duration={
                    interliningLegs.length > 0
                      ? legTime(
                          interliningLegs[interliningLegs.length - 1].end,
                        ) - legTime(leg.start)
                      : leg.duration * 1000
                  }
                  showIntermediateStops={this.state.showIntermediateStops}
                />
              )}
            </div>
          )}
          {leg.fare?.isUnknown &&
            shouldShowFareInfo(config) &&
            (config.modeDisclaimers?.[mode]?.[lang] ? (
              <div className="disclaimer-container unknown-fare-disclaimer__leg">
                <div className="description-container">
                  {config.modeDisclaimers[mode][lang].disclaimer}
                  <a
                    href={config.modeDisclaimers[mode][lang].link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {config.modeDisclaimers[mode][lang].text}
                  </a>
                </div>
              </div>
            ) : (
              <div className="disclaimer-container unknown-fare-disclaimer__leg">
                <div className="description-container">
                  <span className="accent">
                    {`${intl.formatMessage({ id: 'pay-attention' })} `}
                  </span>
                  {intl.formatMessage({ id: 'separate-ticket-required' })}
                </div>
                <div className="ticket-info">
                  <div className="accent">{LegRouteName}</div>
                  {leg.fare.agency &&
                    !config.hideExternalOperator(leg.fare.agency) && (
                      <React.Fragment>
                        <div>{leg.fare.agency.name}</div>
                        {leg.fare.agency.fareUrl && (
                          <ExternalLink
                            className="agency-link"
                            href={leg.fare.agency.fareUrl}
                          >
                            {intl.formatMessage({ id: 'extra-info' })}
                          </ExternalLink>
                        )}
                      </React.Fragment>
                    )}
                </div>
              </div>
            ))}
        </div>
        <span className="sr-only">{alertSeverityDescription}</span>
      </div>
    );
  };

  render() {
    return (
      <React.Fragment>
        {this.renderMain()}
        {this.renderIntermediate()}
      </React.Fragment>
    );
  }
}

TransitLeg.propTypes = {
  leg: legShape.isRequired,
  interliningLegs: PropTypes.arrayOf(legShape),
  index: PropTypes.number.isRequired,
  mode: PropTypes.string.isRequired,
  focusAction: PropTypes.func.isRequired,
  children: PropTypes.node,
  lang: PropTypes.string.isRequired,
  omitDivider: PropTypes.bool,
  changeHash: PropTypes.func,
  tabIndex: PropTypes.number,
  usingOwnCarWholeTrip: PropTypes.bool,
};

TransitLeg.defaultProps = {
  omitDivider: false,
  interliningLegs: [],
  changeHash: undefined,
  tabIndex: undefined,
  children: undefined,
  usingOwnCarWholeTrip: false,
};

TransitLeg.contextTypes = {
  focusFunction: PropTypes.func.isRequired,
  config: configShape.isRequired,
  intl: intlShape.isRequired,
};

const connectedComponent = connectToStores(
  TransitLeg,
  ['PreferencesStore'],
  context => ({
    lang: context.getStore('PreferencesStore').getLanguage(),
  }),
);

export { connectedComponent as default, TransitLeg as Component };
