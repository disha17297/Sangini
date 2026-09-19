import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Sangini Uncaught Component Error:", error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF8F5] text-stone-900">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 border-2 border-amber-300 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
                सब कुछ ठीक है, चिंता न करें
              </h1>
              <p className="text-base sm:text-lg text-stone-600">
                एक छोटा तकनीकी रुकावट हुआ है। कृपया नीचे दिए गए बटन को दबाकर पृष्ठ को ताज़ा (Refresh) करें।
              </p>
              <p className="text-sm text-stone-500 italic mt-1">
                Everything is safe. Please tap the button below to reload the app.
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-2xl text-lg font-bold shadow-md cursor-pointer transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
              <span>ऐप पुनः शुरू करें (Reload App)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
