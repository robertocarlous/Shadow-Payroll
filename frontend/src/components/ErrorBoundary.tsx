import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dashboard crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#05030e',
            color: '#f4f2fb',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              padding: '32px',
              borderRadius: '20px',
              border: '1px solid rgba(242,102,139,0.4)',
              background: 'rgba(19,15,36,0.8)',
            }}
          >
            <h1 style={{ margin: '0 0 12px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 22 }}>
              Something went wrong
            </h1>
            <p style={{ margin: '0 0 16px', color: '#bdb7d4', fontSize: 14, lineHeight: 1.6 }}>
              The dashboard hit an unexpected error. Refresh the page to get back on track.
            </p>
            <pre
              style={{
                maxHeight: 160,
                overflow: 'auto',
                padding: 12,
                borderRadius: 12,
                background: 'rgba(5,3,14,0.6)',
                border: '1px solid rgba(255,255,255,0.09)',
                fontSize: 12,
                color: '#f2668b',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
            <button
              onClick={() => {
                this.setState({ error: null });
              }}
              style={{
                marginTop: 16,
                padding: '10px 18px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #ffe08a, #f2c94c 45%, #e8a13a)',
                color: '#241a00',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}