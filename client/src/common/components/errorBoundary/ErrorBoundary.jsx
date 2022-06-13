/* eslint-disable react/destructuring-assignment */
import React from 'react';

import { LoggingContext } from '../../../app/context/LoggingContext';

import style from './ErrorBoundary.module.scss';
const appVersion = require('../../../../package.json').version;

class ErrorBoundary extends React.Component {
  static contextType = LoggingContext;
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
      error: error,
      errorInfo: info,
    });
    try {
      this.context.emitError(error.toString());
    } catch {
      console.log('Unable to emit error')
    }
    this.reportContent = `${error} ${info.componentStack}`;
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className={style.errorContainer}>
          <div>
            <p className={style.error}>:/</p>
            <p>Something went wrong</p>
            <p
              className={style.report}
              onClick={() => {
                if (navigator.clipboard) {
                  const copyContent = `ontime version ${appVersion} \n ${this.reportContent}`;
                  navigator.clipboard.writeText(copyContent);
                }
              }}
            >
              Copy error
            </p>
            <p
              className={style.report}
              onClick={() => {
                if (window.process.type === 'renderer') {
                  window.ipcRenderer.send('reload');
                } else {
                  window.location.reload();
                }
              }}
            >
              Reload interface
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
