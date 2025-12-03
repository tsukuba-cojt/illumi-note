import { Outlet } from 'react-router-dom'
import SideNav from '../components/navigation/SideNav.jsx'

export default function MainLayout() {
  return (
    <div className="layout layout-main">
      <SideNav />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  )
}
