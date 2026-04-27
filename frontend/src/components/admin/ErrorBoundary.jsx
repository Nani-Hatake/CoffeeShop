import { Component } from "react";

export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log to console so it shows up in DevTools
    console.error("AdminErrorBoundary caught:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl bg-white border border-outline-variant p-8">
            <span className="material-symbols-outlined text-error text-[32px]">error</span>
            <h2 className="font-serif text-2xl text-primary mt-3">Something went wrong</h2>
            <p className="text-on-surface-variant mt-2 text-sm">
              An error occurred while rendering this page. Open DevTools console for the
              full stack trace.
            </p>
            <pre className="mt-4 p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant overflow-auto max-h-48 font-mono">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={this.reset}
                className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium"
              >
                Try again
              </button>
              <a
                href="/admin"
                className="px-4 h-10 rounded-full border border-outline-variant text-sm inline-flex items-center"
              >
                Back to dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
