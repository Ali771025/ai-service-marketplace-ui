import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function RegisterPage() {
  const { register, isAuthenticated, homePath } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to={homePath} replace />
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const result = register({ displayName, email, username, password })
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate('/account', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>پلتفرم نمونه</h1>
          <p>ثبت‌نام (mock)</p>
        </div>

        <div className="banner banner-info">
          با یک ثبت‌نام وارد <strong>میز کار حساب</strong> می‌شوید: هم می‌توانید پلن سرویس بخرید و
          مدل بسازید، هم مدل دیگران را مصرف کنید. اپراتور پلتفرم حساب ویژه است.
        </div>

        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="name">نام نمایشی</label>
            <input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">ایمیل</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="username">نام کاربری</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">رمز عبور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error ? <div className="banner banner-danger">{error}</div> : null}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            ثبت‌نام و ورود
          </button>
        </form>

        <p className="meta" style={{ textAlign: 'center' }}>
          قبلاً حساب دارید؟ <Link to="/login">ورود</Link>
        </p>
      </div>
    </div>
  )
}
