import PropTypes from 'prop-types';
import React from 'react';

import { FormattedMessage } from 'react-intl';
import Icon from './Icon';
import NetworkError from './NetworkError';
import isRelayNetworkError from '../util/relayUtils';

export default class ErrorBoundary extends React.Component {
  static propTypes = { children: PropTypes.node.isRequired };

  state = { error: null, hasRetried: false };

  resetState = () => this.setState({ error: null, hasRetried: true });

  componentDidCatch(error) {
    if (this.state.hasRetried) {
      // Did retry, didn't help
      window.location.reload();
      return;
    }
    this.setState({ error });
  }

  render() {
    if (this.state.error) {
      if (isRelayNetworkError(this.state.error)) {
        return <NetworkError retry={this.resetState} />;
      }
      return (
        <div className="page-not-found">
          <Icon img="icon-icon_error_page_not_found" />
          <p>
            <FormattedMessage
              id="generic-error"
              defaultMessage="There was an error"
            />
          </p>
          <p>
            <button type="button" onClick={this.resetState}>
              <FormattedMessage id="try-again" defaultMessage="Try again ›" />
            </button>
          </p>
        </div>
      );
    }
    // when there's not an error, render children untouched
    return this.props.children || null;
  }
}
