import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { deleteProject, getProjects, setProjects, subscribe } from '../stores/projectsStore.js'

export default function ProjectListPage() {
  const [projects, setProjectsState] = useState(() => getProjects())
  const [undoPayload, setUndoPayload] = useState(null)
  const [undoCountdown, setUndoCountdown] = useState(0)
  const [draggedProject, setDraggedProject] = useState(null)
  const [isDragOverTrash, setIsDragOverTrash] = useState(false)
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

  const handleDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', project.id)
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
    setIsDragOverTrash(false)
  }

  const handleTrashDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOverTrash(true)
  }

  const handleTrashDragLeave = () => {
    setIsDragOverTrash(false)
  }

  const handleTrashDrop = (e) => {
    e.preventDefault()
    setIsDragOverTrash(false)
    
    if (!draggedProject) return

    const current = getProjects()
    const index = current.findIndex((p) => p && p.id === draggedProject.id)
    if (index === -1) return

    deleteProject(draggedProject.id)
    setUndoPayload({ project: draggedProject, index })
    setDraggedProject(null)
  }

  const handleUndo = () => {
    if (!undoPayload) return

    const current = getProjects()
    const exists = current.some((p) => p && p.id === undoPayload.project.id)
    if (exists) {
      setUndoPayload(null)
      setUndoCountdown(0)
      return
    }

    const next = [...current]
    const insertIndex = Math.min(Math.max(undoPayload.index, 0), next.length)
    next.splice(insertIndex, 0, undoPayload.project)
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
        </div>
      </header>

      <section className="projects-grid" aria-label="プロジェクト一覧">
        {projects.map((project) => (
          <article 
            key={project.id} 
            className={`project-card ${draggedProject?.id === project.id ? 'project-card-dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, project)}
            onDragEnd={handleDragEnd}
          >
            <Link to={`/projects/${project.id}`} className="project-card-inner">
              <h2 className="project-card-title">{project.name}</h2>
              <p className="project-card-meta">{project.updatedAt}</p>
            </Link>
          </article>
        ))}
      </section>

      <div 
        className={`trash-drop-zone ${isDragOverTrash ? 'trash-drop-zone-active' : ''}`}
        onDragOver={handleTrashDragOver}
        onDragLeave={handleTrashDragLeave}
        onDrop={handleTrashDrop}
      >
        <div className="trash-icon">
          <img src="/img/trashbin.png" alt="削除" />
        </div>
        <span className="trash-text">ここにドロップして削除</span>
      </div>

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
