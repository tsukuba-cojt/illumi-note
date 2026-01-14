import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../api/auth.js'

export default function SideNav() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to logout', error)
    }

    window.localStorage.removeItem('accessToken')
    window.localStorage.removeItem('refreshToken')
    window.localStorage.removeItem('currentUser')
    navigate('/login')
  }

  return (
    <nav className="side-nav">
      <ul className="side-nav-links">
        <li>
          <NavLink to="/projects">プロジェクト</NavLink>
        </li>
        <li>
          <NavLink to="/stage">ステージ</NavLink>
        </li>
        <li>
          <NavLink to="/notifications">通知</NavLink>
        </li>
        <li>
          <NavLink to="/profile">プロフィール</NavLink>
        </li>
      </ul>
      <button type="button" className="side-nav-logout" onClick={handleLogout}>
        ログアウト
      </button>
    </nav>
  )
}
