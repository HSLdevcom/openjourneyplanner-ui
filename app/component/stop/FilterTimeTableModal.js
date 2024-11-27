import PropTypes from 'prop-types';
import React from 'react';
import intersection from 'lodash/intersection';
import { FormattedMessage, intlShape } from 'react-intl';
import cx from 'classnames';
import Modal from '@hsl-fi/modal';
import Icon from '../Icon';
import routeCompare from '../../util/route-compare';
import withBreakpoint from '../../util/withBreakpoint';
import { isKeyboardSelectionEvent } from '../../util/browser';
import { getRouteMode } from '../../util/modeUtils';
import { stopShape } from '../../util/shapes';

class FilterTimeTableModal extends React.Component {
  static propTypes = {
    stop: stopShape.isRequired,
    setRoutes: PropTypes.func.isRequired,
    showFilterModal: PropTypes.func.isRequired,
    showRoutesList: PropTypes.arrayOf(PropTypes.string).isRequired,
    breakpoint: PropTypes.string.isRequired,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      showRoutes: this.props.showRoutesList,
      allRoutes: this.props.showRoutesList.length === 0 && true,
    };
  }

  toggleAllRoutes = () => {
    if (this.state.allRoutes === true) {
      this.setState({
        allRoutes: false,
      });
      this.updateParent({ showRoutes: [] });
    } else {
      this.setState({
        allRoutes: true,
        showRoutes: [],
      });
      this.updateParent({ showRoutes: [] });
    }
  };

  handleCheckbox = routesToAdd => {
    const chosenRoutes =
      this.state.showRoutes.length > 0 ? this.state.showRoutes.slice() : [];

    const newChosenRoutes =
      chosenRoutes.indexOf(routesToAdd) < 0
        ? chosenRoutes.concat([routesToAdd]) // concat when handling React state based array to avoid array length being assigned as a value
        : chosenRoutes.map(o => o !== routesToAdd && o).filter(o => o);

    if (newChosenRoutes.length === 0) {
      this.updateParent({ showRoutes: newChosenRoutes, allRoutes: true });
      this.setState({ showRoutes: newChosenRoutes, allRoutes: true });
    } else {
      this.updateParent({ showRoutes: newChosenRoutes });
      this.setState({ allRoutes: false, showRoutes: newChosenRoutes });
    }
  };

  constructRouteDivs = () => {
    const routeDivs = [];
    const LONG_LINE_NAME = 5;
    // Find out which departures are ARRIVING to their final stop, not real departures
    // then remove them
    const routesWithStopTimes = this.props.stop.stoptimesForServiceDate
      .map(
        o =>
          o.stoptimes.length > 0 &&
          o.stoptimes[0].pickupType !== 'NONE' && {
            code: o.pattern.code,
            headsign: o.pattern.headsign,
            shortName: o.pattern.route.shortName,
            mode: o.pattern.route.mode,
            type: o.pattern.route.type,
            agency: o.pattern.route.agency.name,
          },
      )
      .filter(o => o)
      .sort(routeCompare);

    routesWithStopTimes.forEach(o => {
      const mode = getRouteMode(o);
      routeDivs.push(
        <div key={o.code} className="route-row">
          <div className="checkbox-container">
            <input
              type="checkbox"
              aria-label={this.context.intl.formatMessage(
                {
                  id: 'select-route',
                  defaultMessage:
                    'Select {mode} route {shortName} to {headsign}',
                },
                {
                  mode: this.context.intl.formatMessage({
                    id: mode.toLowerCase(),
                  }),
                  shortName: o.shortName,
                  headsign: o.headsign,
                },
              )}
              checked={intersection(this.state.showRoutes, [o.code]).length > 0}
              aria-checked={
                intersection(this.state.showRoutes, [o.code]).length > 0
              }
              id={`input-${o.code}`}
              onChange={() => this.handleCheckbox(o.code)}
              onKeyDown={e => {
                if (isKeyboardSelectionEvent(e)) {
                  this.handleCheckbox(o.code);
                }
              }}
            />
            {/* eslint-disable jsx-a11y/label-has-associated-control */}
            <label
              htmlFor={`input-${o.code}`}
              className={
                intersection(this.state.showRoutes, [o.code]).length > 0
                  ? 'checked'
                  : ''
              }
            >
              {intersection(this.state.showRoutes, [o.code]).length > 0 && (
                <Icon
                  img="icon-icon_checkbox_checked"
                  className="checkbox-icon"
                />
              )}
            </label>
            {/* eslint-enable jsx-a11y/label-has-associated-control */}
          </div>
          <div className="route-mode">
            <Icon
              className={mode.toLowerCase()}
              img={`icon-icon_${mode.toLowerCase()}`}
            />
          </div>
          <div
            className={`route-number ${mode.toLowerCase()} ${cx({
              'overflow-fade':
                (o.shortName ? o.shortName : o.agency) &&
                (o.shortName ? o.shortName : o.agency).length > LONG_LINE_NAME,
            })}`}
          >
            {o.shortName ? o.shortName : o.agency}
          </div>
          <div className="route-headsign">{o.headsign}</div>
        </div>,
      );
    });
    return routeDivs;
  };

  closeModal = () => {
    this.props.showFilterModal(false);
  };

  updateParent(newOptions) {
    this.props.setRoutes({
      showRoutes: newOptions.showRoutes,
    });
  }

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
  render() {
    const routeList = this.constructRouteDivs();
    const { intl } = this.context;
    return (
      <Modal
        appElement="#app"
        contentLabel=""
        closeButtonLabel={intl.formatMessage({ id: 'close' })}
        isOpen
        onCrossClick={this.closeModal}
        className="filter-stop-modal"
        overlayClassName={
          this.props.breakpoint === 'large'
            ? 'filter-stop-modal-overlay'
            : 'mobile mobile-filter-stop-modal-overlay stop-scroll-container'
        }
      >
        <h2 className="filter-stop-modal-header">
          <FormattedMessage id="show-routes" defaultMessage="Show Lines" />
        </h2>
        <div className="all-routes-header">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="input-all-routes"
              aria-label={intl.formatMessage({
                id: 'select-all-routes',
                defaultMessage: 'Select all routes',
              })}
              checked={this.state.allRoutes}
              aria-checked={this.state.allRoutes}
              onClick={e => this.state.allRoutes === true && e.preventDefault()}
              onKeyDown={e => {
                if (isKeyboardSelectionEvent(e)) {
                  this.toggleAllRoutes(e);
                }
              }}
              onChange={e => {
                this.toggleAllRoutes(e);
              }}
            />
            {/* eslint-disable jsx-a11y/label-has-associated-control */}
            <label
              htmlFor="input-all-routes"
              className={this.state.allRoutes ? 'checked' : ''}
            >
              {this.state.allRoutes ? (
                <Icon
                  img="icon-icon_checkbox_checked"
                  className="checkbox-icon"
                />
              ) : null}
            </label>
            {/* eslint-enable jsx-a11y/label-has-associated-control */}
          </div>
          <div className="all-routes-header-title">
            <FormattedMessage id="all-routes" defaultMessage="All lines" />
          </div>
        </div>
        <div className="routes-container">
          {routeList.length > 0 ? routeList : null}
        </div>
      </Modal>
    );
  }
}

export default withBreakpoint(FilterTimeTableModal);
