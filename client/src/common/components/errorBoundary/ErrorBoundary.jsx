import React from 'react';

class ErrorBoundary extends React.Component {
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
    // TODO: Log the error to an error reporting service
    this.logErrorToServices(error.toString(), info.componentStack);
  }

  // A fake logging service.
  logErrorToServices = console.log;

  render() {
    if (this.state.errorMessage) {
      // You can render any custom fallback UI
      return <p>:/</p>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
