'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Unable to load 3D scene</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 text-xs underline hover:text-primary"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
