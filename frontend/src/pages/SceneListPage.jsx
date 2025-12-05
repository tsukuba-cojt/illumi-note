import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { findProject } from '../mock/projects.js'

function getSceneDisplayData(projectId, scene) {
  const baseLightingControls =
    scene.lighting?.map((line) => {
      const match = line.match(/(.*?)(\d+)\s*%/)
      const baseLabel = match ? match[1].trim() : line
      const initialLevel = match ? Number(match[2]) : 50

      return {
        label: baseLabel,
        level: initialLevel,
        color: '#ffffff',
      }
    }) || []

  let lightingControls = baseLightingControls
  let memoText = scene.memo || ''

  if (typeof window !== 'undefined') {
    try {
      const key = `sceneSettings:${projectId}:${scene.id}`
      const saved = window.localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed.lightingControls)) {
          lightingControls = parsed.lightingControls
        }
        if (typeof parsed.memoText === 'string') {
          memoText = parsed.memoText
        }
      }
    } catch {}
  }

  return { lightingControls, memoText }
}

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
        // 上限は設けず、スクロールのたびに 2 件ずつ増やす
        return prev + 2
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
        {Array.from({ length: visibleCount }).map((_, index) => {
          const scene = project.scenes?.[index]
          const isPlaceholder = !scene
          const key = scene?.id ?? `placeholder-${index}`
          const display = scene ? getSceneDisplayData(project.id, scene) : null

          const card = (
            <article className="scene-card">
              <header className="scene-card-header">
                <div className="project-detail-fields">
                  <div className="project-detail-field">
                    <span className="project-detail-field-label">TIME</span>
                    <div className="project-detail-field-box">{scene?.time ?? ''}</div>
                  </div>
                  <div className="project-detail-field">
                    <span className="project-detail-field-label">SCENE NAME</span>
                    <div className="project-detail-field-box">
                      {scene?.sceneName ?? ''}
                    </div>
                  </div>
                </div>
              </header>

              <div className="scene-card-body">
                <div className="scene-card-stage">
                  <div className="project-detail-stage-placeholder">
                    <span>{isPlaceholder ? 'New Scene' : 'Stage Preview'}</span>
                  </div>
                </div>

                <div className="scene-card-side">
                  {scene ? (
                    <>
                      <div className="scene-card-panel">
                        <div className="project-detail-panel-title">Lighting</div>
                        <ul className="scene-card-lighting-list">
                          {display.lightingControls.map((light, i) => (
                            <li key={i} className="scene-card-lighting-item">
                              <span className="scene-card-lighting-label">
                                {light.label || `Light ${i + 1}`}
                              </span>
                              <span className="scene-card-lighting-level">
                                {typeof light.level === 'number' ? `${light.level}%` : ''}
                              </span>
                              <span
                                className="scene-card-lighting-color"
                                style={{ backgroundColor: light.color || '#ffffff' }}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="scene-card-panel">
                        <div className="project-detail-panel-title">MEMO</div>
                        <p className="scene-card-memo">
                          {display.memoText || 'メモはまだありません。'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="scene-card-panel" />
                      <div className="scene-card-panel" />
                    </>
                  )}
                </div>
              </div>
            </article>
          )

          if (isPlaceholder) {
            return (
              <div key={key} className="scene-card-link-disabled">
                {card}
              </div>
            )
          }

          return (
            <Link
              key={key}
              to={`/projects/${project.id}/scenes/${scene.id}`}
              className="scene-card-link"
            >
              {card}
            </Link>
          )
        })}
      </section>
    </div>
  )
}
