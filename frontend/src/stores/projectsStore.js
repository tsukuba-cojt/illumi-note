import { projects as initialProjects } from '../mock/projects.js'

const STORAGE_KEY = 'illuminote:projects'
const EVENT_NAME = 'illuminote:projects:changed'

function safeJsonParse(text) {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function cloneProjects(value) {
  if (!Array.isArray(value)) return []
  return value.map((project) => ({
    ...project,
    scenes: Array.isArray(project?.scenes)
      ? project.scenes.map((scene) => ({
          ...scene,
          members: Array.isArray(scene?.members)
            ? scene.members.map((member) => ({ ...member }))
            : scene?.members,
        }))
      : project?.scenes,
  }))
}

function readStoredProjects() {
  if (typeof window === 'undefined') return cloneProjects(initialProjects)
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const parsed = safeJsonParse(raw)
  if (Array.isArray(parsed)) return parsed
  return cloneProjects(initialProjects)
}

function writeStoredProjects(projects) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {}
}

function emitChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function getProjects() {
  return readStoredProjects()
}

export function setProjects(nextProjects) {
  const normalized = Array.isArray(nextProjects) ? nextProjects : []
  writeStoredProjects(normalized)
  emitChanged()
}

export function subscribe(listener) {
  if (typeof window === 'undefined') return () => {}

  const handler = () => {
    listener()
  }

  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)

  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

export function addProject(project) {
  const current = getProjects()
  setProjects([...current, project])
}

export function deleteProject(projectId) {
  const current = getProjects()
  setProjects(current.filter((p) => p && p.id !== projectId))
}

export function findProject(projectId) {
  return getProjects().find((project) => project.id === projectId)
}

export function findScene(projectId, sceneId) {
  const project = findProject(projectId)
  if (!project) {
    return { project: null, scene: null }
  }
  const scene = project.scenes?.find((s) => s.id === sceneId)
  return { project, scene }
}
