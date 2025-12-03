import { Link } from 'react-router-dom'
import { projects } from '../mock/projects.js'

export default function ProjectListPage() {
  return (
    <div className="page page-projects">
      <header className="projects-header">
        <h1 className="projects-title">プロジェクト</h1>
        <div className="projects-actions">
          <button className="projects-new-button">＋ 新規プロジェクト</button>
        </div>
      </header>

      <section className="projects-grid" aria-label="プロジェクト一覧">
        {projects.map((project) => (
          <article key={project.id} className="project-card">
            <Link to={`/projects/${project.id}`} className="project-card-inner">
              <h2 className="project-card-title">{project.name}</h2>
              <p className="project-card-meta">{project.updatedAt}</p>
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}
