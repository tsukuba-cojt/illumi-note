import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await register({ name, email, password, confirmPassword })

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
      const details = err?.data?.error?.details

      if (details) {
        const messages = []

        if (details.name?.includes('required')) {
          messages.push('表示名は必須です。')
        }
        if (details.email?.includes('required')) {
          messages.push('メールアドレスは必須です。')
        }
        if (details.password?.includes('required')) {
          messages.push('パスワードは必須です。')
        }
        if (details.password?.includes('min_length_5')) {
          messages.push('パスワードは5文字以上で入力してください。')
        }
        if (details.confirmPassword?.includes('mismatch')) {
          messages.push('パスワードと確認用パスワードが一致しません。')
        }

        const detailMessage = messages.join(' ')
        setError(detailMessage || err?.data?.error?.message || '新規登録に失敗しました')
      } else {
        const message = err?.data?.error?.message || '新規登録に失敗しました'
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-register">
      <h1>新規登録</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="name">表示名</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
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
        <div className="auth-field">
          <label htmlFor="confirmPassword">パスワード（確認）</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>
      <p className="auth-switch">
        すでにアカウントをお持ちの方は <Link to="/login">ログイン</Link>
      </p>
    </div>
  )
}
