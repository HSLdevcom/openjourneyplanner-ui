import PropTypes from 'prop-types';
import React from 'react';
import ReactSwipe from 'react-swipe';
import { intlShape } from 'react-intl';
import cx from 'classnames';
import Icon from './Icon';
import { isKeyboardSelectionEvent } from '../util/browser';
import ScrollableWrapper from './ScrollableWrapper';

const setFocusables = () => {
  // Set inactive tab focusables to unfocusable and for active tab set previously made unfocusable elements to focusable
  const focusableTags =
    'a, button, input, textarea, select, details, [tabindex="0"]';
  const unFocusableTags =
    'a, button, input, textarea, select, details, [tabindex="-2"]';
  const swipeableTabs = document.getElementsByClassName('swipeable-tab');

  for (let i = 0; i < swipeableTabs.length; i++) {
    const focusables = swipeableTabs[i].querySelectorAll(focusableTags);
    const unFocusables = swipeableTabs[i].querySelectorAll(unFocusableTags);
    if (swipeableTabs[i].className === 'swipeable-tab inactive') {
      focusables.forEach(focusable => {
        // eslint-disable-next-line no-param-reassign
        focusable.tabIndex = '-2';
      });
    } else {
      unFocusables.forEach(unFocusable => {
        // eslint-disable-next-line no-param-reassign
        unFocusable.tabIndex = '0';
      });
    }
  }
};

const setDecreasingAttributes = tabBalls => {
  const newTabBalls = tabBalls;
  for (let i = 0; i < tabBalls.length; i++) {
    const prev = tabBalls[i - 1];
    const current = tabBalls[i];
    const next = tabBalls[i + 1];
    if (prev && prev.hidden && !current.hidden) {
      current.smaller = true;
      next.small = true;
      newTabBalls[i] = current;
      newTabBalls[i + 1] = next;
      break;
    }
  }
  return newTabBalls;
};

const handleKeyPress = (e, reactSwipeEl) => {
  switch (e.keyCode) {
    case 37:
      reactSwipeEl.prev();
      break;
    case 39:
      reactSwipeEl.next();
      break;
    default:
      break;
  }
};

export default class SwipeableTabs extends React.Component {
  static propTypes = {
    tabIndex: PropTypes.number.isRequired,
    tabs: PropTypes.arrayOf(PropTypes.node).isRequired,
    onSwipe: PropTypes.func.isRequired,
    hideArrows: PropTypes.bool,
    navigationOnBottom: PropTypes.bool,
    classname: PropTypes.string,
    ariaFrom: PropTypes.string.isRequired,
    ariaFromHeader: PropTypes.string.isRequired,
  };

  static defaultProps = {
    hideArrows: false,
    navigationOnBottom: false,
    classname: undefined,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
  };

  componentDidMount() {
    window.addEventListener('resize', setFocusables);
    setFocusables();
  }

  componentDidUpdate() {
    setFocusables();
  }

  tabBalls = tabsLength => {
    const tabIndex = parseInt(this.props.tabIndex, 10);
    const onLeft = tabIndex;
    const onRight = tabsLength - tabIndex - 1;
    let tabBalls = [];

    for (let i = 0; i < tabsLength; i++) {
      const ballObj = { hidden: false };
      const distanceFromSelected = Math.abs(i - tabIndex);
      let n = 7;
      for (let j = -1; j <= 7; j++) {
        let maxDistance = 0;
        if ((onLeft > 7 && onRight > -1) || (onLeft > -1 && onRight > 7)) {
          maxDistance = 6;
        }
        if ((onLeft > 6 && onRight > 0) || (onLeft > 0 && onRight > 6)) {
          maxDistance = 5;
        }
        if ((onLeft > 5 && onRight > 1) || (onLeft > 1 && onRight > 5)) {
          maxDistance = 4;
        }
        if (
          (onLeft > 4 && onRight > 2) ||
          (onLeft > 3 && onRight > 3) ||
          (onLeft > 2 && onRight > 4)
        ) {
          maxDistance = 3;
        }
        if (onLeft > n && onRight > j && distanceFromSelected > maxDistance) {
          ballObj.hidden = true;
        }
        n -= 1;
      }

      if (tabIndex === i) {
        ballObj.selected = true;
        ballObj.hidden = false;
      }

      tabBalls.push(ballObj);
    }

    tabBalls = setDecreasingAttributes(tabBalls);
    tabBalls = setDecreasingAttributes(tabBalls.reverse());
    tabBalls.reverse();
    const ballDivs = tabBalls.map((ball, index) => {
      const key = ball.toString().length + index;
      return (
        <div
          key={key}
          role="button"
          aria-label={this.context.intl.formatMessage(
            {
              id: 'move-to-tab',
              defaultMessage: 'Move to tab {number}',
            },
            {
              number: index + 1,
            },
          )}
          tabIndex={0}
          className={`swipe-tab-ball ${
            index === this.props.tabIndex ? 'selected' : ''
          } ${ball.smaller ? 'decreasing-small' : ''} ${
            ball.small ? 'decreasing' : ''
          } ${ball.hidden ? 'hidden' : ''}`}
          onClick={() => {
            this.props.onSwipe(index);
          }}
          onKeyDown={e => {
            if (isKeyboardSelectionEvent(e)) {
              this.props.onSwipe(index);
            }
          }}
        />
      );
    });

    return ballDivs;
  };

  constructAriaMessage = (from, position) => {
    const fromMessage = this.context.intl
      .formatMessage({
        id: from,
        defaultMessage: 'Swipe results tabs.',
      })
      .concat(' ');
    switch (position) {
      case 'header':
        return fromMessage.concat(
          this.context.intl.formatMessage({
            id: 'swipe-result-tabs',
            defaultMessage: 'Switch tabs using arrow keys.',
          }),
        );
      case 'left':
        return fromMessage.concat(
          this.context.intl.formatMessage({
            id: 'swipe-result-tab-left',
            defaultMessage:
              'Swipe result tabs left arrow. Press Enter or Space to show the previous tab.',
          }),
        );
      case 'right':
        return fromMessage.concat(
          this.context.intl.formatMessage({
            id: 'swipe-result-tab-right',
            defaultMessage:
              'Swipe result tabs right arrow. Press Enter or Space to show the next tab.',
          }),
        );
      default:
        return null;
    }
  };

  render() {
    const { tabs, hideArrows, navigationOnBottom, ariaFrom, ariaFromHeader } =
      this.props;
    const { intl } = this.context;
    const tabBalls = this.tabBalls(tabs.length);
    const disabled = tabBalls.length < 2;
    let reactSwipeEl;
    const ariaHeader = this.constructAriaMessage(ariaFromHeader, 'header');
    const ariaLeft = this.constructAriaMessage(ariaFrom, 'left');
    const ariaRight = this.constructAriaMessage(ariaFrom, 'right');
    return (
      <div
        className={
          this.props.classname === 'swipe-desktop-view'
            ? 'swipe-scroll-wrapper'
            : ''
        }
      >
        {navigationOnBottom && (
          <ScrollableWrapper>
            <div className="swipe-scroll-container scroll-target">
              <ReactSwipe
                swipeOptions={{
                  startSlide: this.props.tabIndex,
                  stopPropagation: true,
                  continuous: false,
                  callback: i => {
                    // force transition after animation should be over because animation can randomly fail sometimes
                    setTimeout(() => {
                      this.props.onSwipe(i);
                    }, 300);
                  },
                }}
                childCount={tabs.length}
                ref={el => {
                  reactSwipeEl = el;
                }}
              >
                {tabs}
              </ReactSwipe>
            </div>
          </ScrollableWrapper>
        )}
        <div className={`swipe-header-container ${this.props.classname}`}>
          {this.props.classname === 'swipe-desktop-view' && (
            <div className="desktop-view-divider" />
          )}
          <button
            className="sr-only"
            type="button"
            onKeyDown={e => handleKeyPress(e, reactSwipeEl)}
            aria-label={ariaHeader}
          >
            {ariaHeader}
          </button>
          <div className={`swipe-header ${this.props.classname}`}>
            {!hideArrows && (
              <div
                className={cx('swipe-button-container', {
                  active: !(disabled || this.props.tabIndex <= 0),
                })}
              >
                <div
                  className="swipe-button"
                  onClick={() => reactSwipeEl.prev()}
                  onKeyDown={e => {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                      e.preventDefault();
                      reactSwipeEl.prev();
                    }
                  }}
                  role="button"
                  tabIndex="0"
                  aria-label={ariaLeft}
                >
                  <Icon
                    img="icon-icon_arrow-collapse--left"
                    className={`itinerary-arrow-icon ${
                      disabled || this.props.tabIndex <= 0 ? 'disabled' : ''
                    }`}
                  />
                </div>
              </div>
            )}
            <div className="swipe-tab-indicator">
              <span className="sr-only" aria-live="polite">
                {intl.formatMessage(
                  {
                    id: 'swipe-sr-new-tab-opened',
                    defaultMessage: 'Tab {number} opened.',
                  },
                  { number: this.props.tabIndex + 1 },
                )}
              </span>
              {disabled ? null : tabBalls}
            </div>
            {!hideArrows && (
              <div
                className={cx('swipe-button-container', {
                  active: !(disabled || this.props.tabIndex >= tabs.length - 1),
                })}
              >
                <div
                  className="swipe-button"
                  onClick={() => reactSwipeEl.next()}
                  onKeyDown={e => {
                    if (e.keyCode === 13 || e.keyCode === 32) {
                      e.preventDefault();
                      reactSwipeEl.next();
                    }
                  }}
                  role="button"
                  tabIndex="0"
                  aria-label={ariaRight}
                >
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className={`itinerary-arrow-icon ${
                      disabled || this.props.tabIndex >= tabs.length - 1
                        ? 'disabled'
                        : ''
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {!navigationOnBottom && (
          <ScrollableWrapper>
            <div className="swipe-scroll-container scroll-target">
              <ReactSwipe
                swipeOptions={{
                  startSlide: this.props.tabIndex,
                  continuous: false,
                  callback: i => {
                    // force transition after animation should be over because animation can randomly fail sometimes
                    setTimeout(() => {
                      this.props.onSwipe(i);
                    }, 300);
                  },
                }}
                childCount={tabs.length}
                ref={el => {
                  reactSwipeEl = el;
                }}
              >
                {tabs}
              </ReactSwipe>
            </div>
          </ScrollableWrapper>
        )}
      </div>
    );
  }
}
