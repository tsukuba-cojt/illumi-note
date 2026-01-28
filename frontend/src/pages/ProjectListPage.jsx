import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { deleteProject, getProjects, setProjects, subscribe } from '../stores/projectsStore.js'

export default function ProjectListPage() {
  const [projects, setProjectsState] = useState(() => getProjects())
  const [undoPayload, setUndoPayload] = useState(null)
  const [undoCountdown, setUndoCountdown] = useState(0)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState(() => new Set())
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    return subscribe(() => {
      setProjectsState(getProjects())
    })
  }, [])

  useEffect(() => {
    if (!undoPayload) return

    setUndoCountdown(5)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    intervalRef.current = window.setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    timeoutRef.current = window.setTimeout(() => {
      setUndoPayload(null)
      setUndoCountdown(0)
      timeoutRef.current = null
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 5000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [undoPayload])

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => {
      const next = !prev
      if (!next) {
        setSelectedProjectIds(new Set())
      }
      return next
    })
  }

  const toggleSelected = (projectId) => {
    if (!projectId) return
    setSelectedProjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedProjectIds)
    if (ids.length === 0) return

    const current = getProjects()
    const deleted = ids
      .map((id) => {
        const index = current.findIndex((p) => p && p.id === id)
        if (index === -1) return null
        return { project: current[index], index }
      })
      .filter(Boolean)

    if (deleted.length === 0) return

    ids.forEach((id) => deleteProject(id))
    setUndoPayload({ deleted })
    setSelectedProjectIds(new Set())
    setIsSelectMode(false)
  }

  const handleUndo = () => {
    if (!undoPayload) return

    const current = getProjects()
    const deleted = Array.isArray(undoPayload.deleted)
      ? undoPayload.deleted
      : undoPayload.project
        ? [{ project: undoPayload.project, index: undoPayload.index }]
        : []

    if (deleted.length === 0) {
      setUndoPayload(null)
      setUndoCountdown(0)
      return
    }

    const sorted = [...deleted].sort((a, b) => a.index - b.index)
    const next = [...current]
    sorted.forEach((item, offset) => {
      if (!item?.project) return
      const exists = next.some((p) => p && p.id === item.project.id)
      if (exists) return
      const insertIndex = Math.min(Math.max(item.index + offset, 0), next.length)
      next.splice(insertIndex, 0, item.project)
    })
    setProjects(next)

    setUndoPayload(null)
    setUndoCountdown(0)
  }

  return (
    <div className="page page-projects">
      <header className="projects-header">
        <h1 className="projects-title">プロジェクト</h1>
        <div className="projects-actions">
          <Link to="/projects/new" className="projects-new-button">
            ＋ 新規プロジェクト
          </Link>
          <button
            type="button"
            className="projects-new-button"
            onClick={toggleSelectMode}
          >
            {isSelectMode ? 'キャンセル' : '選択'}
          </button>
          {isSelectMode ? (
            <button
              type="button"
              className="projects-new-button"
              onClick={handleDeleteSelected}
              disabled={selectedProjectIds.size === 0}
            >
              削除
            </button>
          ) : null}
        </div>
      </header>

      <section className="projects-grid" aria-label="プロジェクト一覧">
        {projects.map((project) => (
          <article 
            key={project.id} 
            className={`project-card ${isSelectMode ? 'project-card-selectable' : ''} ${selectedProjectIds.has(project.id) ? 'project-card-selected' : ''}`}
          >
            {isSelectMode ? (
              <button
                type="button"
                className="project-card-select-toggle"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleSelected(project.id)
                }}
                aria-label="プロジェクトを選択"
                aria-pressed={selectedProjectIds.has(project.id)}
              >
                <span className="project-card-select-check" aria-hidden="true">
                  {selectedProjectIds.has(project.id) ? (
                    <img
                      src="/img/check.png"
                      alt=""
                      aria-hidden="true"
                      className="project-card-select-check-image"
                    />
                  ) : null}
                </span>
              </button>
            ) : null}
            {isSelectMode ? (
              <button
                type="button"
                className="project-card-inner project-card-select-button"
                onClick={() => toggleSelected(project.id)}
                aria-pressed={selectedProjectIds.has(project.id)}
              >
                <h2 className="project-card-title">{project.name}</h2>
                <p className="project-card-meta">{project.updatedAt}</p>
              </button>
            ) : (
              <Link to={`/projects/${project.id}`} className="project-card-inner">
                <h2 className="project-card-title">{project.name}</h2>
                <p className="project-card-meta">{project.updatedAt}</p>
              </Link>
            )}
          </article>
        ))}
      </section>

      {undoPayload != null && (
        <div className="project-undo-toast">
          <span>プロジェクトを削除しました。</span>
          <button
            type="button"
            className="project-undo-button"
            onClick={handleUndo}
          >
            削除を取り消す ({undoCountdown})
          </button>
        </div>
      )}
    </div>
  )
}
