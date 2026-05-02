import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ErrorBoundary extends (Component as any) {
  declare props: Props;
  declare state: State;
  declare setState: (s: State) => void;

  constructor(props: Props) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    const self = this as any;
    if (self.state.hasError) {
      if (self.props.fallback) return self.props.fallback;
      return React.createElement('div', {
        className: 'p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 text-center'
      },
        React.createElement('p', { className: 'text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2' }, '렌더링 오류'),
        React.createElement('p', { className: 'text-xs text-rose-500 dark:text-rose-400 font-mono break-all' }, self.state.error?.message),
        React.createElement('button', {
          onClick: () => self.setState({ hasError: false, error: null }),
          className: 'mt-4 px-4 py-2 text-xs font-black uppercase tracking-widest bg-rose-600 text-white rounded-lg hover:bg-rose-700'
        }, '재시도')
      );
    }
    return self.props.children;
  }
}
