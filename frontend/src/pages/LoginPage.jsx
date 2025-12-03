import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await login({ email, password, rememberMe })

      if (result?.accessToken) {
        window.localStorage.setItem('accessToken', result.accessToken)
      }
      if (result?.refreshToken) {
        window.localStorage.setItem('refreshToken', result.refreshToken)
      }
      if (result?.user) {
        window.localStorage.setItem('currentUser', JSON.stringify(result.user))
      }

      navigate('/projects')
    } catch (err) {
      const message = err?.data?.error?.message || 'ログインに失敗しました'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-login">
      <h1>ログイン</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="auth-field auth-remember">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            ログイン状態を保持する
          </label>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      <p className="auth-switch">
        初めての方は <Link to="/register">新規登録</Link>
      </p>
    </div>
  )
}
