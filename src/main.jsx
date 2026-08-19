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
  // Detalhe técnico só no console (pra quando alguém do time for investigar)
  // — a tela em si mostra uma mensagem que uma pessoa leiga entende.
  componentDidCatch(e, info) { console.error('[listamo] erro não tratado:', e, info); }
  render() {
    if (this.state.erro) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#374151', fontSize: '1rem', fontWeight: 600 }}>Algo deu errado por aqui.</p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: '24rem' }}>
            Seus dados já salvos continuam seguros. Tente recarregar a página — se o problema continuar, fale com a gente em saaslistamo@gmail.com.
          </p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1.5rem', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            Recarregar
          </button>
          <button
            onClick={() => {
              // Ação de último recurso: apaga tudo que só existe neste
              // aparelho, incluindo qualquer edição feita e ainda não
              // confirmada no servidor — por isso o aviso explícito antes.
              const confirmado = window.confirm(
                'Isso vai apagar os dados salvos só neste aparelho (o que já foi sincronizado com sua conta continua seguro). Alguma edição recente feita ainda não confirmada pode se perder. Quer continuar?'
              );
              if (!confirmado) return;
              try { localStorage.clear(); } catch {}
              window.location.reload();
            }}
            style={{ padding: '0.4rem 1rem', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Limpar dados deste aparelho e recarregar
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
