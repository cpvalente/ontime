/* eslint-disable react/destructuring-assignment */
import React from 'react';
// skipcq: JS-C1003 - sentry does not expose itself as an ES Module.
import * as Sentry from '@sentry/react';

import { hasConnected, reconnectAttempts } from '../../../common/utils/socket';
import { runtimeStore } from '../../stores/runtime';

import style from './ErrorBoundary.module.scss';

class ErrorBoundary extends React.Component {
  reportContent = '';

  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI.
    return { errorMessage: error.toString() };
  }

  componentDidCatch(error, info) {
    this.setState({
      error,
      errorInfo: info,
    });

    Sentry.withScope((scope) => {
      scope.setExtras({
        error,
        store: runtimeStore.getState(),
        hasSocket: { hasConnected, reconnectAttempts },
      });
      const eventId = Sentry.captureException(error);
      this.setState({ eventId, info });
    });
    this.reportContent = `${error} ${info.componentStack}`;
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className={style.errorContainer} data-testid='error-container'>
          <div>
            <p className={style.error}>:/</p>
            <p>Something went wrong</p>
            <div
              role='button'
              className={style.report}
              onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
            >
              Report error
            </div>
            <div
              role='button'
              className={style.report}
              onClick={() => {
                if (window?.process?.type === 'renderer') {
                  window.ipcRenderer.send('reload');
                } else {
                  window.location.reload();
                }
              }}
            >
              Reload interface
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
