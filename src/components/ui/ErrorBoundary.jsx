import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 99999,
                    backgroundColor: '#110000', color: '#ff4444',
                    padding: '2rem', fontFamily: 'monospace', overflow: 'auto'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'white' }}>React Tree Crashed</h1>
                    <p style={{ marginBottom: '2rem', color: '#ffaaaa' }}>The application hit a fatal error and unmounted to protect the browser. Here is the exact stack trace:</p>

                    <h2 style={{ color: 'white' }}>{this.state.error && this.state.error.toString()}</h2>
                    <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}
