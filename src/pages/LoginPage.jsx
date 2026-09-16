import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../auth/authStore'
import './login.css'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useAuthStore((s) => s.session)
  const remember = useAuthStore((s) => s.remember)
  const setRemember = useAuthStore((s) => s.setRemember)
  const login = useAuthStore((s) => s.login)
  const error = useAuthStore((s) => s.error)
  const clearError = useAuthStore((s) => s.clearError)

  const [email, setEmail] = useState('rahul.mer@safespaceglobal.ai')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (session) {
    const next = location.state?.from?.pathname || '/restaurant'
    return <Navigate to={next} replace />
  }

  const onSubmit = (event) => {
    event.preventDefault()
    clearError()
    const result = login(email, password)
    if (result.ok) {
      const next = location.state?.from?.pathname || '/restaurant'
      navigate(next, { replace: true })
    }
  }

  return (
    <div className="ss-login">
      <div className="ss-login-geom" aria-hidden="true" />
      <header className="ss-login-brand">
        <img src="/brand/safespace.webp" alt="SafeSpace" />
        <span className="ss-login-tagline">Triton</span>
      </header>

      <main className="ss-login-card">
        <h1>Welcome to Triton</h1>
        <p>Enter your Email Id and Password to Login</p>

        <form className="ss-login-form" onSubmit={onSubmit} noValidate>
          <label className="ss-login-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { clearError(); setEmail(e.target.value) }}
              placeholder="name@safespaceglobal.ai"
              required
            />
          </label>

          <label className="ss-login-field">
            <span>Password</span>
            <div className="ss-login-password">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { clearError(); setPassword(e.target.value) }}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="ss-login-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="ss-login-row">
            <label className="ss-login-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
            <button type="button" className="ss-login-forgot" onClick={() => window.alert('Ask an Admin to reset your password in User Management.')}>
              Forgot password
            </button>
          </div>

          {error ? <p className="ss-login-error" role="alert">{error}</p> : null}

          <div className="ss-login-actions">
            <button type="submit" className="ss-login-submit">Login</button>
          </div>
        </form>
      </main>
    </div>
  )
}
