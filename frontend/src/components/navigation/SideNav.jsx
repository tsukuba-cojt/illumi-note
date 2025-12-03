import { NavLink } from 'react-router-dom'

export default function SideNav() {
  return (
    <nav className="side-nav">
      <ul>
        <li>
          <NavLink to="/projects">プロジェクト</NavLink>
        </li>
        <li>
          <NavLink to="/library">ライブラリ</NavLink>
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
    </nav>
  )
}
