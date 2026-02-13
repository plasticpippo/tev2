import React, { Component, ErrorInfo, ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class TableErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Table system error:', error, errorInfo);
  }

  public render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-xs sm:max-w-md">
            <h2 className="text-xl font-bold text-red-100 mb-2">
              {t('tableErrorBoundary.title')}
            </h2>
            <p className="text-red-200 mb-4">
              {t('tableErrorBoundary.description')}
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-red-300 text-sm">
                {t('tableErrorBoundary.errorDetails')}
              </summary>
              <pre className="mt-2 text-xs text-red-200 bg-red-950 p-2 rounded overflow-auto">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition"
            >
              {t('tableErrorBoundary.reloadPage')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(TableErrorBoundary);
