import { Outlet } from 'react-router-dom'
import UnityRoot from '../UnityRoot.jsx'
import SideNav from '../components/navigation/SideNav.jsx'

export default function MainLayout() {
  return (
    <div className="layout layout-main">
      <UnityRoot />
      <SideNav />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  )
}
