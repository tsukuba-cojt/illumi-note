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

  const [scenes, setScenes] = useState(project?.scenes || [])

  const projectMembers =
    project?.scenes
      ?.flatMap((scene) => scene.members || [])
      .reduce((unique, member) => {
        if (!unique.some((m) => m.id === member.id)) {
          unique.push(member)
        }
        return unique
      }, []) || []

  const [visibleCount, setVisibleCount] = useState(() =>
    Math.max(project?.scenes?.length || 0, 3)
  )
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [undoOpIndex, setUndoOpIndex] = useState(null)
  const [undoCountdown, setUndoCountdown] = useState(0)
  const [draggingSceneId, setDraggingSceneId] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  useEffect(() => {
    setScenes(project?.scenes || [])
    // プロジェクトが変わったら表示件数と履歴をリセット
    setVisibleCount(Math.max(project?.scenes?.length || 0, 3))
    setHistory([])
    setHistoryIndex(-1)
    setUndoOpIndex(null)
    setUndoCountdown(0)
    setDraggingSceneId(null)
    setDragOverIndex(null)
  }, [projectId, project])

  const handleDeleteScene = (scene) => {
    if (!scene) return
    const sceneIndex = scenes.findIndex((s) => s.id === scene.id)
    if (sceneIndex === -1) return

    setScenes((prev) => prev.filter((s) => s.id !== scene.id))

    const op = { type: 'deleteScene', scene, index: sceneIndex }

    const baseHistory =
      historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history.slice(0, 0)
    const newHistory = [...baseHistory, op]
    setHistory(newHistory)
    const newIndex = newHistory.length - 1
    setHistoryIndex(newIndex)
    setUndoOpIndex(newIndex)
  }

  const handleAddPlaceholder = () => {
    const prevVisibleCount = visibleCount
    const nextVisibleCount = prevVisibleCount + 1

    setVisibleCount(nextVisibleCount)

    const op = { type: 'addPlaceholder', prevVisibleCount }

    const baseHistory =
      historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history.slice(0, 0)
    const newHistory = [...baseHistory, op]
    setHistory(newHistory)
    const newIndex = newHistory.length - 1
    setHistoryIndex(newIndex)
  }

  const handleDeletePlaceholder = () => {
    const prevVisibleCount = visibleCount
    if (prevVisibleCount <= scenes.length) return

    setVisibleCount((prev) => Math.max(prev - 1, scenes.length))

    const op = { type: 'deletePlaceholder', prevVisibleCount }

    const baseHistory =
      historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history.slice(0, 0)
    const newHistory = [...baseHistory, op]
    setHistory(newHistory)
    const newIndex = newHistory.length - 1
    setHistoryIndex(newIndex)
    setUndoOpIndex(newIndex)
  }

  useEffect(() => {
    if (undoOpIndex == null) return
    setUndoCountdown(10)
    const intervalId = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          setUndoOpIndex(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [undoOpIndex])

  const handleUndo = () => {
    if (historyIndex < 0) return
    const op = history[historyIndex]
    if (!op) return

    if (op.type === 'deleteScene') {
      setScenes((prev) => {
        const next = [...prev]
        next.splice(op.index, 0, op.scene)
        return next
      })
    } else if (op.type === 'reorderScene') {
      setScenes((prev) => {
        const next = [...prev]
        const currentIndex = next.findIndex(
          (s) => s && s.id === op.sceneId
        )
        if (currentIndex === -1) return next
        const [moved] = next.splice(currentIndex, 1)
        const target = Math.min(Math.max(op.fromIndex, 0), next.length)
        next.splice(target, 0, moved)
        return next
      })
    } else if (op.type === 'deletePlaceholder') {
      setVisibleCount(op.prevVisibleCount)
    } else if (op.type === 'addPlaceholder') {
      setVisibleCount(op.prevVisibleCount)
    }

    const newIndex = historyIndex - 1
    setHistoryIndex(newIndex)
    if (undoOpIndex === historyIndex) {
      setUndoOpIndex(null)
      setUndoCountdown(0)
    }
  }

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    const op = history[nextIndex]
    if (!op) return

    if (op.type === 'deleteScene') {
      setScenes((prev) => prev.filter((s) => s.id !== op.scene.id))
      setUndoOpIndex(nextIndex)
    } else if (op.type === 'reorderScene') {
      setScenes((prev) => {
        const next = [...prev]
        const currentIndex = next.findIndex(
          (s) => s && s.id === op.sceneId
        )
        if (currentIndex === -1) return next
        const [moved] = next.splice(currentIndex, 1)
        const target = Math.min(Math.max(op.toIndex, 0), next.length)
        next.splice(target, 0, moved)
        return next
      })
    } else if (op.type === 'deletePlaceholder') {
      setVisibleCount(Math.max(op.prevVisibleCount - 1, scenes.length))
      setUndoOpIndex(nextIndex)
    } else if (op.type === 'addPlaceholder') {
      setVisibleCount(op.prevVisibleCount + 1)
    }

    setHistoryIndex(nextIndex)
  }

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  const handleSceneContextMenu = (event, scene, index) => {
    event.preventDefault()
    if (scene) {
      const confirmed = window.confirm('このシーンを削除しますか？')
      if (confirmed) {
        handleDeleteScene(scene)
      }
    } else {
      // 空のシーン（プレースホルダー）
      if (index < scenes.length || index >= visibleCount) return
      const confirmed = window.confirm('この空のシーンを削除しますか？')
      if (confirmed) {
        handleDeletePlaceholder()
      }
    }
  }

  const handleDragStart = (event, sceneId) => {
    if (!sceneId) return
    setDraggingSceneId(sceneId)
    setDragOverIndex(null)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      try {
        event.dataTransfer.setData('text/plain', sceneId)
      } catch {}
    }
  }

  const handleDragOver = (event, index) => {
    if (!draggingSceneId) return
    event.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (event, index) => {
    if (!draggingSceneId) return
    event.preventDefault()

    const fromIndex = scenes.findIndex((s) => s && s.id === draggingSceneId)
    const toIndex = index
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      setDraggingSceneId(null)
      setDragOverIndex(null)
      return
    }

    setScenes((prev) => {
      const next = [...prev]
      const currentFrom = next.findIndex((s) => s && s.id === draggingSceneId)
      if (currentFrom === -1) return next
      const [moved] = next.splice(currentFrom, 1)
      const target = Math.min(Math.max(toIndex, 0), next.length)
      next.splice(target, 0, moved)
      return next
    })

    const op = {
      type: 'reorderScene',
      sceneId: draggingSceneId,
      fromIndex,
      toIndex,
    }

    const baseHistory =
      historyIndex >= 0 ? history.slice(0, historyIndex + 1) : history.slice(0, 0)
    const newHistory = [...baseHistory, op]
    setHistory(newHistory)
    const newIndex = newHistory.length - 1
    setHistoryIndex(newIndex)

    setDraggingSceneId(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggingSceneId(null)
    setDragOverIndex(null)
  }

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
        <div className="projects-header-main">
          <h1 className="projects-title">{project.name}</h1>
        </div>
        <div className="projects-actions scene-list-header-actions">
          <div className="project-detail-members-list scene-list-project-members">
            {projectMembers.slice(0, 4).map((member) => {
              const familyName = member.name?.split(' ')[0] || member.name
              return (
                <div key={member.id} className="project-detail-member-pill">
                  <span className="project-detail-member-name">{familyName}</span>
                </div>
              )
            })}
            {projectMembers.length > 4 && (
              <div className="project-detail-member-pill">
                <span className="project-detail-member-name">
                  +{projectMembers.length - 4}
                </span>
              </div>
            )}
          </div>
          <Link to="/projects" className="projects-new-button">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </header>

      <section className="scene-list" aria-label="シーン一覧">
        {Array.from({ length: visibleCount }).map((_, index) => {
          const scene = scenes[index]
          const isPlaceholder = !scene
          const sceneIdForLink = scene?.id ?? `placeholder-${index + 1}`
          const key = scene?.id ?? sceneIdForLink
          const display = scene ? getSceneDisplayData(project.id, scene) : null
          const sceneName = scene?.sceneName ?? `SCENE ${index + 1}`

          const isDragOver = dragOverIndex === index && !!draggingSceneId

          const card = (
            <article
              className={`scene-card${
                isDragOver ? ' scene-card-drop-target' : ''
              }`}
              draggable={!!scene}
              onDragStart={scene ? (e) => handleDragStart(e, scene.id) : undefined}
              onDragEnd={scene ? handleDragEnd : undefined}
              onDragOver={scene ? (e) => handleDragOver(e, index) : undefined}
              onDrop={scene ? (e) => handleDrop(e, index) : undefined}
            >
              <header className="scene-card-header">
                <div className="project-detail-fields">
                  <div className="project-detail-field">
                    <span className="project-detail-field-label">TIME</span>
                    <div className="project-detail-field-box">{scene?.time ?? ''}</div>
                  </div>
                  <div className="project-detail-field">
                    <span className="project-detail-field-label">SCENE NAME</span>
                    <div className="project-detail-field-box">
                      {sceneName}
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

          return (
            <Link
              key={key}
              to={`/projects/${project.id}/scenes/${sceneIdForLink}`}
              className="scene-card-link"
              onClick={(e) => {
                if (draggingSceneId) {
                  e.preventDefault()
                }
              }}
              onContextMenu={(e) => handleSceneContextMenu(e, scene, index)}
            >
              {card}
            </Link>
          )
        })}
      </section>

      {undoOpIndex != null && (
        <div className="scene-undo-toast">
          <span>シーンを削除しました。</span>
          <button
            type="button"
            className="scene-undo-button"
            onClick={handleUndo}
          >
            削除を取り消す ({undoCountdown})
          </button>
        </div>
      )}

      <div className="scene-history-controls">
        <button
          type="button"
          className="scene-history-button scene-add-button"
          onClick={handleAddPlaceholder}
        >
          ＋
        </button>
        <div className="scene-history-buttons-row">
          <button
            type="button"
            className="scene-history-button"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            ◀
          </button>
          <button
            type="button"
            className="scene-history-button"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
