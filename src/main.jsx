import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { erro: null };
  static getDerivedStateFromError(e) { return { erro: e }; }
  render() {
    if (this.state.erro) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#374151', fontSize: '1rem', fontWeight: 600 }}>Algo deu errado.</p>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', fontFamily: 'monospace', background: '#f3f4f6', padding: '0.75rem 1rem', borderRadius: '8px', maxWidth: '32rem', wordBreak: 'break-all' }}>
            {this.state.erro?.message || String(this.state.erro)}
          </p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.5rem', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            Recarregar
          </button>
          <button onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }} style={{ padding: '0.4rem 1rem', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Limpar dados e recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
