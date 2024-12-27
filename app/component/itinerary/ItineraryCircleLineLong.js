import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import Icon from '../Icon';
import RouteNumber from '../RouteNumber';
import { legShape } from '../../util/shapes';

const ItineraryCircleLineLong = props => {
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    import(
      /* webpackChunkName: "dotted-line" */ `../../configurations/images/default/dotted-line.svg`
    ).then(imageUrl => {
      setImgUrl(`url(${imageUrl.default})`);
    });
  }, []);

  const isFirstChild = () => {
    return props.index === 0;
  };

  const getMarker = top => {
    if (isFirstChild() && top) {
      return (
        <div className="itinerary-icon-container start">
          <Icon
            img="icon-icon_mapMarker-from"
            className="itinerary-icon from from-it"
          />
        </div>
      );
    }
    return null;
  };

  let firstModeClassName;
  let secondModeClassName;
  let positionRelativeToTransit;
  if (
    props.boardingLeg.to.stop !== null &&
    props.boardingLeg.from.stop !== null
  ) {
    positionRelativeToTransit = 'between-transit';
    firstModeClassName = props.boardingLeg.mode.toLowerCase();
    secondModeClassName = props.modeClassName.toLowerCase();
  } else if (props.boardingLeg.to.stop !== null) {
    positionRelativeToTransit = 'before-transit';
    firstModeClassName = props.modeClassName.toLowerCase();
    secondModeClassName = props.boardingLeg.mode.toLowerCase();
  } else {
    // props.boardingLeg.from.stop !== undefined
    positionRelativeToTransit = 'after-transit';
    firstModeClassName = props.boardingLeg.mode.toLowerCase();
    secondModeClassName = props.modeClassName.toLowerCase();
  }

  const topMarker = getMarker(true);
  const bottomMarker = getMarker(false);
  const legBeforeLineStyle = { color: props.color };
  const carBoardingRouteNumber = (
    <RouteNumber mode="car" icon="icon-icon_car-withoutBox" vertical />
  );
  // eslint-disable-next-line global-require
  legBeforeLineStyle.backgroundImage = imgUrl;
  return (
    <div
      className={cx('leg-before long', props.modeClassName, {
        first: props.index === 0,
      })}
      aria-hidden="true"
    >
      {topMarker}
      <div
        style={legBeforeLineStyle}
        className={cx(
          'leg-before-line top',
          positionRelativeToTransit,
          firstModeClassName,
        )}
      />
      <div
        className={cx(
          'itinerary-route-number',
          'first',
          positionRelativeToTransit,
        )}
      >
        {props.modeClassName === 'bicycle' ? (
          <RouteNumber mode={firstModeClassName} vertical />
        ) : (
          positionRelativeToTransit === 'before-transit' &&
          carBoardingRouteNumber
        )}
      </div>
      <div
        style={legBeforeLineStyle}
        className={cx(
          'leg-before-line middle',
          positionRelativeToTransit,
          props.modeClassName,
        )}
      />
      <div
        className={cx(
          'itinerary-route-number',
          'second',
          positionRelativeToTransit,
        )}
      >
        {props.modeClassName === 'bicycle' ? (
          <RouteNumber mode={secondModeClassName} vertical />
        ) : (
          (positionRelativeToTransit === 'after-transit' ||
            positionRelativeToTransit === 'between-transit') &&
          carBoardingRouteNumber
        )}
      </div>
      {positionRelativeToTransit === 'between-transit' && (
        <div
          style={legBeforeLineStyle}
          className={cx(
            'leg-before-line second-middle',
            positionRelativeToTransit,
            props.modeClassName,
          )}
        />
      )}
      {positionRelativeToTransit === 'between-transit' &&
        props.modeClassName === 'bicycle' && (
          <div
            className={cx(
              'itinerary-route-number',
              'third',
              positionRelativeToTransit,
            )}
          >
            <RouteNumber mode={firstModeClassName} vertical />
          </div>
        )}

      <div
        style={legBeforeLineStyle}
        className={cx(
          'leg-before-line bottom',
          positionRelativeToTransit,
          positionRelativeToTransit === 'between-transit'
            ? firstModeClassName
            : secondModeClassName,
        )}
      />
      {props.renderBottomMarker && bottomMarker}
    </div>
  );
};

ItineraryCircleLineLong.propTypes = {
  index: PropTypes.number.isRequired,
  color: PropTypes.string,
  renderBottomMarker: PropTypes.bool,
  modeClassName: PropTypes.string.isRequired,
  boardingLeg: legShape.isRequired,
};

ItineraryCircleLineLong.defaultProps = {
  color: undefined,
  renderBottomMarker: false,
};

export default ItineraryCircleLineLong;
