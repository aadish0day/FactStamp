import { Component } from "react";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";
import "./ErrorBoundary.css";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
    this.setState({ errorInfo: info });
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.error) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-card">
            <span className="error-boundary-icon"><ShieldAlert size={28} /></span>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-msg">
              An unexpected error occurred. You can try again, or head back to
              the home screen.
            </p>

            {isDev && this.state.error ? (
              <pre className="error-boundary-detail">
                {String(this.state.error.stack || this.state.error.message || this.state.error)}
              </pre>
            ) : null}

            <div className="error-boundary-actions">
              <button className="btn btn-secondary btn-md" onClick={this.handleReset}>
                <RotateCcw size={16} /> Try again
              </button>
              <a className="btn btn-primary btn-md" href="/">
                <Home size={16} /> Back to home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
