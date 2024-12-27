import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { matchShape, routerShape } from 'found';
import { FormattedMessage } from 'react-intl';
import { configShape } from '../../util/shapes';
import OriginDestinationBar from './OriginDestinationBar';
import SearchSettings from './SearchSettings';
import { isBrowser } from '../../util/browser';
import {
  parseLocation,
  PREFIX_ITINERARY_SUMMARY,
  streetHash,
} from '../../util/path';
import withBreakpoint from '../../util/withBreakpoint';
import BackButton from '../BackButton';

class ItineraryPageControls extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string,
      hash: PropTypes.string,
    }).isRequired,
    breakpoint: PropTypes.string.isRequired,
    toggleSettings: PropTypes.func.isRequired,
  };

  static contextTypes = {
    config: configShape.isRequired,
    router: routerShape,
    match: matchShape.isRequired,
  };

  componentDidMount() {
    this.unlisten = this.context.router.addNavigationListener(location => {
      if (
        this.context.match.location.state?.itinerarySettingsOpen &&
        !location.state?.itinerarySettingsOpen &&
        !this.transitionDone &&
        location.pathname.startsWith(`/${PREFIX_ITINERARY_SUMMARY}/`)
      ) {
        this.transitionDone = true;
        const newLocation = {
          ...this.context.match.location,
          state: {
            ...this.context.match.location.state,
            itinerarySettingsOpen: false,
          },
        };
        setTimeout(() => this.context.router.replace(newLocation), 0);
      } else {
        this.transitionDone = false;
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const className = cx({ 'bp-large': this.props.breakpoint === 'large' });
    const { params } = this.props;
    return (
      <div className="summary-navigation-container">
        {this.props.breakpoint !== 'large' && (
          <BackButton
            title={
              <FormattedMessage
                id="summary-page.title"
                defaultMessage="Itinerary suggestions"
              />
            }
            icon="icon-icon_arrow-collapse--left"
            iconClassName="arrow-icon"
            fallback={
              params.hash === streetHash.bikeAndVehicle ||
              params.hash === streetHash.carAndVehicle ||
              params.hash === streetHash.parkAndRide
                ? 'pop'
                : undefined
            }
          />
        )}
        <span className="sr-only">
          <FormattedMessage
            id="search-fields.sr-instructions"
            defaultMessage="The search is triggered automatically when origin and destination are set. Changing any search parameters triggers a new search"
          />
        </span>
        <OriginDestinationBar
          className={className}
          origin={parseLocation(params.from)}
          destination={parseLocation(params.to)}
          isMobile={this.props.breakpoint !== 'large'}
          modeSet={this.context.config.iconModeSet}
        />
        {isBrowser && (
          <SearchSettings toggleSettings={this.props.toggleSettings} />
        )}
      </div>
    );
  }
}

export default withBreakpoint(ItineraryPageControls);
