import PropTypes from 'prop-types';
import React, {
  useRef,
  useLayoutEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { matchShape } from 'found';
import MapBottomsheetContext from './map/MapBottomsheetContext';
import MobileFooter from './MobileFooter';
import { isBrowser } from '../util/browser';

import {
  PREFIX_ROUTES,
  PREFIX_NEARYOU,
  PREFIX_ITINERARY_SUMMARY,
} from '../util/path';

const noBottomSheetResetAtContentChange = [
  PREFIX_ROUTES,
  PREFIX_NEARYOU,
  PREFIX_ITINERARY_SUMMARY,
];

const BOTTOM_SHEET_OFFSET = 20;
const topBarHeight = 64;

function getMiddlePosition() {
  return isBrowser
    ? Math.floor((window.innerHeight - topBarHeight) * 0.45)
    : 400;
}

function slowlyScrollTo(el, to, done) {
  const element = el;
  const duration = 500;
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
    } else {
      done();
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

const MobileView = forwardRef(
  (
    {
      header,
      map,
      content,
      settingsDrawer,
      selectFromMapHeader,
      mapRef,
      searchBox,
      match,
    },
    ref,
  ) => {
    if (settingsDrawer) {
      return <div className="mobile">{settingsDrawer}</div>;
    }
    const scrollRef = useRef(null);
    const pathParts = match.location.pathname.split('/');
    const pagePrefix = pathParts?.length > 1 ? pathParts[1] : undefined;

    // pass these to map according to bottom sheet placement
    const [bottomPadding, setBottomPadding] = useState(getMiddlePosition());

    const onScroll = e => {
      if (e.target.className === 'drawer-container') {
        mapRef?.setBottomPadding(e.target.scrollTop);
        setBottomPadding(e.target.scrollTop);
      }
    };

    const changeBottomPadding = (padding, slowly) => {
      if (slowly) {
        slowlyScrollTo(scrollRef.current, padding, () => {
          mapRef?.forceRefresh();
          mapRef?.setBottomPadding(padding);
          setBottomPadding(padding);
        });
      } else {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = padding;
        }
        mapRef?.setBottomPadding(padding);
        setBottomPadding(padding);
      }
    };

    useImperativeHandle(ref, () => ({
      setBottomSheet: (pos, slowly) => {
        const pad =
          pos === 'middle' ? getMiddlePosition() : BOTTOM_SHEET_OFFSET;
        changeBottomPadding(pad, slowly);
      },
    }));

    /* UI does not have a consistent way to render the map into mobile view.
       Most views don't get a map reference. Itinerary page has the ref and knows
       how to control bottom sheet whenever needed.

       In most page transitions, we can only try to guess from props which view is
       in question and what should happen when props change.
    */

    // effect below triggers when itinerary detail view opens
    useLayoutEffect(() => {
      if (pagePrefix === PREFIX_ITINERARY_SUMMARY) {
        changeBottomPadding(getMiddlePosition());
      }
    }, [header]);

    // always set bottom sheet when component mounts
    useLayoutEffect(() => {
      if (map) {
        changeBottomPadding(getMiddlePosition());
      }
    }, []);

    // set bottom sheet for most views at content change
    useLayoutEffect(() => {
      if (map && !noBottomSheetResetAtContentChange.includes(pagePrefix)) {
        changeBottomPadding(getMiddlePosition());
      }
    }, [content]);

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
  },
);

MobileView.propTypes = {
  header: PropTypes.node,
  map: PropTypes.node,
  content: PropTypes.node,
  settingsDrawer: PropTypes.node,
  selectFromMapHeader: PropTypes.node,
  searchBox: PropTypes.node,
  // eslint-disable-next-line
  mapRef: PropTypes.object,
  match: matchShape.isRequired,
};

MobileView.defaultProps = {
  header: undefined,
  map: undefined,
  content: undefined,
  settingsDrawer: undefined,
  selectFromMapHeader: undefined,
  searchBox: undefined,
  mapRef: undefined,
};

export default MobileView;
