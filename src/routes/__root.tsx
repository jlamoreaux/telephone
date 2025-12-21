import { Component, type ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Get site URL from environment (set in production)
const SITE_URL = process.env.SITE_URL || '';

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Telephone AI',
      },
      // SEO meta tags
      {
        name: 'description',
        content:
          'Play AI Telephone - watch messages transform as they pass through chains of AI image generators and vision models.',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
      },
      // Open Graph meta tags
      {
        property: 'og:title',
        content: 'Telephone AI - The AI Telephone Game',
      },
      {
        property: 'og:description',
        content:
          'Watch messages transform as they pass through chains of AI image generators and vision models. Like telephone, but with AI!',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'Telephone AI',
      },
      // Open Graph image
      {
        property: 'og:image',
        content: SITE_URL ? `${SITE_URL}/og-default.png` : '/og-default.png',
      },
      // Twitter Card meta tags
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Telephone AI - The AI Telephone Game',
      },
      {
        name: 'twitter:description',
        content:
          'Watch messages transform as they pass through chains of AI image generators and vision models.',
      },
      {
        name: 'twitter:image',
        content: SITE_URL ? `${SITE_URL}/og-default.png` : '/og-default.png',
      },
      // URL meta tags (only when SITE_URL is configured)
      ...(SITE_URL
        ? [
            { property: 'og:url', content: SITE_URL },
            { name: 'twitter:url', content: SITE_URL },
          ]
        : []),
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ErrorBoundary>
          <Header />
          {children}
        </ErrorBoundary>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
