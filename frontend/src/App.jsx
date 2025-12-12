import { Routes, Route } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProjectListPage from './pages/ProjectListPage.jsx'
import NewProjectPage from './pages/NewProjectPage.jsx'
import SceneListPage from './pages/SceneListPage.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import StageView from './pages/StageView.jsx'
import StagePage from './pages/StagePage.jsx'
import NotificationsPage from './pages/NotificationsPage.jsx'
import UserProfilePage from './pages/UserProfilePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<NewProjectPage />} />
        <Route path="/projects/:projectId" element={<SceneListPage />} />
        <Route
          path="/projects/:projectId/scenes/:sceneId"
          element={<ProjectDetailPage />}
        />
        <Route path="/stage" element={<StageView />} />
        <Route path="/stage-select" element={<StagePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
