/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { LoggingContext } from '../../../app/context/LoggingContext';
import style from './ErrorBoundary.module.scss';

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
    this.context.emitError(error.toString());
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
              onClick={() => navigator.clipboard.writeText(this.reportContent)}
            >
              Copy error
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
