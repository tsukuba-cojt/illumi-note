import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { findProject } from '../mock/projects.js'

export default function SceneListPage() {
  const { projectId } = useParams()
  const project = findProject(projectId)

  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    // プロジェクトが変わったら表示件数をリセット
    setVisibleCount(3)
  }, [projectId])

  useEffect(() => {
    if (!project?.scenes?.length) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      // 下端から一定距離（ここでは 80px）以内に来たら追加読み込み
      if (distanceFromBottom > 80) return

      setVisibleCount((prev) => {
        const total = project.scenes?.length ?? 0
        if (prev >= total) return prev
        return Math.min(prev + 2, total)
      })
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [projectId, project?.scenes?.length])

  if (!project) {
    return (
      <div className="page page-scene-list">
        <header className="projects-header">
          <h1 className="projects-title">プロジェクトが見つかりません</h1>
          <div className="projects-actions">
            <Link to="/projects" className="projects-new-button">
              一覧に戻る
            </Link>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div className="page page-scene-list">
      <header className="projects-header">
        <h1 className="projects-title">{project.name}</h1>
        <div className="projects-actions">
          <Link to="/projects" className="projects-new-button">
            一覧に戻る
          </Link>
        </div>
      </header>

      <section className="scene-list" aria-label="シーン一覧">
        {project.scenes?.slice(0, visibleCount).map((scene) => (
          <article key={scene.id} className="scene-card">
            <header className="scene-card-header">
              <div className="project-detail-fields">
                <div className="project-detail-field">
                  <span className="project-detail-field-label">TIME</span>
                  <div className="project-detail-field-box">{scene.time}</div>
                </div>
                <div className="project-detail-field">
                  <span className="project-detail-field-label">SCENE NAME</span>
                  <div className="project-detail-field-box">{scene.sceneName}</div>
                </div>
              </div>
            </header>

            <div className="scene-card-body">
              <Link
                to={`/projects/${project.id}/scenes/${scene.id}`}
                className="scene-card-stage"
              >
                <div className="project-detail-stage-placeholder">
                  <span>Stage Preview</span>
                </div>
              </Link>

              <div className="scene-card-side">
                <div className="scene-card-panel" />
                <div className="scene-card-panel" />
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
