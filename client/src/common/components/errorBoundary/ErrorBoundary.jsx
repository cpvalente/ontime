import React from 'react';
import { LoggingContext } from '../../../app/context/LoggingContext';

class ErrorBoundary extends React.Component {
  static contextType = LoggingContext;

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
  }

  render() {
    if (this.state.errorMessage) {
      return <p>:/</p>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
