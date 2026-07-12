import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h1>Something went wrong</h1>
            <p>
              An unexpected error occurred. Try refreshing the page, or navigate
              back to the home screen.
            </p>
            <button className="btn-reset" onClick={() => window.location.assign("/")}>
              Back to home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
