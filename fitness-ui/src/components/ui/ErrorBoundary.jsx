import { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_0_32px_rgba(220,20,60,0.12)]">
            <p className="section-label text-[var(--accent)]">Tactical alert</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">System anomaly detected</h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              A module failed to render. The rest of FitTrack remains operational.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--text-secondary)]">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={this.handleReset}>Retry module</Button>
              <Button variant="outline" onClick={() => window.location.assign('/dashboard')}>
                Return to command center
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
