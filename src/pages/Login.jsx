import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMessage({ type: 'error', text: error.message })
    if (mode === 'signup' && !data.session) {
      setMessage({ type: 'ok', text: 'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.' })
      setMode('login')
    }
  }

  return (
    <div className="center card narrow">
      <h1>Mi Mangateca</h1>
      <p className="muted">{mode === 'login' ? 'Inicia sesión para ver tu colección.' : 'Crea tu cuenta.'}</p>
      <form onSubmit={submit} className="stack">
        <label>
          Correo
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {message && <p className={message.type === 'error' ? 'error' : 'ok'}>{message.text}</p>}
        <button disabled={busy}>{busy ? '…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>
      <button className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}
