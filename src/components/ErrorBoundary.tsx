import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: '12px',
          color: '#585878', fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <div style={{ fontSize: '1.8rem', opacity: 0.25 }}>◈</div>
          <p style={{ fontSize: '0.85rem' }}>Something went wrong. Try refreshing the page.</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
