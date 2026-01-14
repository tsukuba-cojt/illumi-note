import { Outlet, Navigate } from 'react-router-dom'

export default function AuthLayout() {
  const isLoggedIn =
    typeof window !== 'undefined' && window.localStorage.getItem('accessToken')

  if (isLoggedIn) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="layout layout-auth">
      <Outlet />
    </div>
  )
}
