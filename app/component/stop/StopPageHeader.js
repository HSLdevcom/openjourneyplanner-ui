import PropTypes from 'prop-types';
import mapProps from 'recompose/mapProps';
import getContext from 'recompose/getContext';
import compose from 'recompose/compose';

import StopCardHeaderContainer from './StopCardHeaderContainer';
import withBreakpoint from '../../util/withBreakpoint';

const StopPageHeader = compose(
  withBreakpoint,
  getContext({
    executeAction: PropTypes.func.isRequired,
  }),
  mapProps(props => ({
    stop: props.stop || props.station,
    className: 'stop-page header',
    headingStyle: 'h3',
    icons: [],
    breakpoint: props.breakpoint,
    isTerminal: props.isTerminal,
  })),
)(StopCardHeaderContainer);

StopPageHeader.displayName = 'StopPageHeader';

export default StopPageHeader;
