"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-arcane-dark flex items-center justify-center p-6">
          <GlassCard variant="elevated" className="max-w-2xl w-full p-8">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
              </div>

              <h1 className="text-3xl font-black text-white mb-3">
                Oups! Quelque chose s'est mal passé
              </h1>

              <p className="text-arcane-grey mb-8 max-w-md mx-auto">
                Une erreur inattendue s'est produite. Notre équipe a été automatiquement notifiée
                et travaille déjà à résoudre le problème.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-8 text-left">
                  <summary className="cursor-pointer text-arcane-accent hover:text-arcane-accent/80 mb-2">
                    Détails de l'erreur (développement uniquement)
                  </summary>
                  <div className="bg-arcane-darkBorder/30 rounded-lg p-4 overflow-auto">
                    <pre className="text-xs text-arcane-grey whitespace-pre-wrap">
                      {this.state.error.toString()}
                      {"\n\n"}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>

              <p className="text-xs text-arcane-grey mt-6">
                Si le problème persiste, contactez-nous à support@arcane-football.com
              </p>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for function components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    Sentry.captureException(error, {
      contexts: errorInfo ? {
        react: {
          componentStack: errorInfo.componentStack,
        },
      } : undefined,
    });
  }, []);
}
