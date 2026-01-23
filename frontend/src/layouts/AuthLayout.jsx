import { Outlet, Navigate } from 'react-router-dom'
import Header from '../components/navigation/header.jsx';

export default function AuthLayout() {
  const isLoggedIn =
    typeof window !== 'undefined' && window.localStorage.getItem('accessToken')

  if (isLoggedIn) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="layout layout-auth">
      <Header showLinks={false} />
      <Outlet />
    </div>
  )
}
