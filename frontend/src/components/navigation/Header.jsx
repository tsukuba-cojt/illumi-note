import { NavLink } from "react-router-dom";

export default function Header({ showLinks }) {
  showLinks ??= true;
  return (
    <header className="global">
      <img src="../../../public/img/Illuminote_logo.png" />
      {showLinks && (
        <nav>
          <ul>
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
        </nav>
      )}
    </header>
  );
}
