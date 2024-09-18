import PropTypes from 'prop-types';
import React, { useRef, useLayoutEffect, useState } from 'react';
import { configShape } from '../util/shapes';
import MapBottomsheetContext from './map/MapBottomsheetContext';
import MobileFooter from './MobileFooter';

const BOTTOM_SHEET_OFFSET = 20;

function slowlyScrollTo(el, to = BOTTOM_SHEET_OFFSET, duration = 1000) {
  const element = el;
  const start = element.scrollTop;
  const change = to - start;
  const increment = 20;
  let currentTime = 0;

  const animateScroll = () => {
    currentTime += increment;

    const val = Math.easeInOutQuad(currentTime, start, change, duration);

    element.scrollTop = val;

    if (currentTime < duration) {
      setTimeout(animateScroll, increment);
    }
  };

  animateScroll();
}

Math.easeInOutQuad = function easeInOutQuad(a, b, c, d) {
  let t = a;
  t /= d / 2;
  if (t < 1) {
    return (c / 2) * t * t + b;
  }
  t -= 1;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};

export default function MobileView({
  header,
  map,
  content,
  settingsDrawer,
  selectFromMapHeader,
  expandMap,
  searchBox,
}) {
  if (settingsDrawer) {
    return <div className="mobile">{settingsDrawer}</div>;
  }
  const scrollRef = useRef(null);
  const topBarHeight = 64;
  // pass this to map according to bottom sheet placement
  const [bottomPadding, setBottomPadding] = useState(0);

  useLayoutEffect(() => {
    if (map) {
      const newSheetPosition = (window.innerHeight - topBarHeight) * 0.45;
      scrollRef.current.scrollTop = newSheetPosition;
      setBottomPadding(newSheetPosition);
    }
  }, [header]);

  useLayoutEffect(() => {
    if (map && expandMap) {
      slowlyScrollTo(scrollRef.current);
      setBottomPadding(0);
    }
  }, [expandMap]);

  const onScroll = e => {
    if (map) {
      if (e.target.className === 'drawer-container') {
        const scroll = e.target.scrollTop;
        setBottomPadding(scroll);
      }
    }
  };

  return (
    <div className="mobile">
      {selectFromMapHeader}
      {searchBox}
      {map ? (
        <>
          <MapBottomsheetContext.Provider value={bottomPadding}>
            {map}
          </MapBottomsheetContext.Provider>
          <div
            className="drawer-container"
            onScroll={onScroll}
            ref={scrollRef}
            role="main"
          >
            <div className="drawer-padding" />
            <div className="drawer-content">
              <div className="drag-line" />
              <div className="content-container">
                {header}
                {content}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div role="main" className="mobile-main-container">
          <div className="mobile-main-content-container">
            {header}
            {content}
          </div>

          <MobileFooter />
        </div>
      )}
    </div>
  );
}

MobileView.propTypes = {
  header: PropTypes.node,
  map: PropTypes.node,
  content: PropTypes.node,
  settingsDrawer: PropTypes.node,
  selectFromMapHeader: PropTypes.node,
  searchBox: PropTypes.node,
  expandMap: PropTypes.number,
};

MobileView.defaultProps = {
  header: undefined,
  map: undefined,
  content: undefined,
  settingsDrawer: undefined,
  selectFromMapHeader: undefined,
  searchBox: undefined,
  expandMap: undefined,
};

MobileView.contextTypes = {
  config: configShape.isRequired,
};
