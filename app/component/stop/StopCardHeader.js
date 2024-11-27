import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import { matchShape } from 'found';
import { stopShape, stationShape } from '../../util/shapes';
import CardHeader from '../CardHeader';
import { getJson } from '../../util/xhrPromise';
import { saveSearch } from '../../action/SearchActions';
import { isIOS } from '../../util/browser';
import LazilyLoad, { importLazy } from '../LazilyLoad';

const modules = {
  FavouriteStopContainer: () => importLazy(import('../FavouriteStopContainer')),
};

class StopCardHeader extends React.Component {
  componentDidMount() {
    // update localStorage searches if necessary
    const { stop, isPopUp } = this.props;
    if (!isIOS || !stop || isPopUp || !this.context.match.location.query.save) {
      return;
    }
    const layer = this.props.isTerminal ? 'station' : 'stop';
    let id = `GTFS:${stop.gtfsId}`;
    let { name } = stop;
    if (stop.code) {
      id = `${id}#${stop.code}`;
      name = `${name} ${stop.code}`;
    }

    const searchParams = {
      'point.lat': stop.lat,
      'point.lon': stop.lon,
      'boundary.circle.radius': 0.2,
      size: 1,
    };
    if (this.context.config.searchParams['boundary.country']) {
      searchParams['boundary.country'] =
        this.context.config.searchParams['boundary.country'];
    }

    getJson(this.context.config.URL.PELIAS_REVERSE_GEOCODER, searchParams).then(
      data => {
        if (data.features != null && data.features.length > 0) {
          const match = data.features[0].properties;
          const city = match.localadmin;

          this.context.executeAction(saveSearch, {
            item: {
              geometry: { coordinates: [stop.lon, stop.lat] },
              properties: {
                name,
                id,
                gid: `gtfs:${layer}:${id}`,
                layer,
                label: `${stop.name}, ${city}`,
                localadmin: city,
              },
              type: 'Feature',
            },
            type: 'endpoint',
          });
        }
      },
    );
  }

  get headerConfig() {
    return this.context.config.stopCard.header;
  }

  getDescription() {
    let description = '';

    if (this.headerConfig.showDescription && this.props.stop.desc) {
      description += this.props.stop.desc;
    }

    if (this.headerConfig.showDistance && this.props.distance) {
      description += ` // ${Math.round(this.props.distance)} m`;
    }

    if (this.props.isTerminal && this.props.stop.stops) {
      description = this.props.stop.stops[0].desc;
    }

    return description;
  }

  render() {
    const { className, headingStyle, icons, stop, breakpoint, isTerminal } =
      this.props;
    if (!stop) {
      return false;
    }

    return (
      <CardHeader
        className={className}
        headingStyle={headingStyle}
        description={this.getDescription()}
        code={this.headerConfig.showStopCode && stop.code ? stop.code : null}
        icons={icons}
        showBackButton={breakpoint === 'large'}
        stop={stop}
        headerConfig={!!this.headerConfig}
        isTerminal={isTerminal}
        favouriteContainer={
          <LazilyLoad modules={modules}>
            {({ FavouriteStopContainer }) => (
              <FavouriteStopContainer stop={stop} isTerminal={isTerminal} />
            )}
          </LazilyLoad>
        }
      />
    );
  }
}

StopCardHeader.propTypes = {
  stop: PropTypes.oneOfType([stopShape, stationShape]),
  distance: PropTypes.number,
  className: PropTypes.string,
  headingStyle: PropTypes.string,
  icons: PropTypes.arrayOf(PropTypes.node),
  isPopUp: PropTypes.bool,
  breakpoint: PropTypes.string,
  isTerminal: PropTypes.bool,
};

StopCardHeader.defaultProps = {
  stop: undefined,
  isTerminal: false,
  distance: undefined,
  className: undefined,
  headingStyle: undefined,
  icons: undefined,
  isPopUp: false,
  breakpoint: undefined,
};

StopCardHeader.contextTypes = {
  config: PropTypes.shape({
    stopCard: PropTypes.shape({
      header: PropTypes.shape({
        showDescription: PropTypes.bool,
        showDistance: PropTypes.bool,
        showStopCode: PropTypes.bool,
        virtualMonitorBaseUrl: PropTypes.string,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  intl: intlShape.isRequired,
  executeAction: PropTypes.func.isRequired,
  match: matchShape.isRequired,
};

StopCardHeader.displayName = 'StopCardHeader';

export default StopCardHeader;
