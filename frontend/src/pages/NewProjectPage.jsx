import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { projects } from '../mock/projects.js'
import stage1Image from './Stage1.png'

const stageOptions = [
  {
    id: 'stage-1',
    name: 'Stage 1',
    description: '標準的なライティングステージ。すぐに利用できます。',
    available: true,
    image: stage1Image,
  },
  {
    id: 'stage-2',
    name: 'Stage 2',
    description: '準備中。今後のアップデートで利用可能になります。',
    available: false,
  },
  {
    id: 'stage-3',
    name: 'Stage 3',
    description: '準備中。今後のアップデートで利用可能になります。',
    available: false,
  },
  {
    id: 'stage-4',
    name: 'Stage 4',
    description: '準備中。今後のアップデートで利用可能になります。',
    available: false,
  },
]

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  const handleSelectStage = (stageId) => {
    if (isCreating) return
    const stage = stageOptions.find((option) => option.id === stageId)
    if (!stage || !stage.available) return

    const trimmedName = projectName.trim()
    if (!trimmedName) return

    setIsCreating(true)

    const nextIdNumber = projects.reduce((max, project) => {
      const match = String(project.id).match(/^p(\d+)$/)
      if (!match) return max
      const num = Number(match[1])
      if (Number.isNaN(num)) return max
      return Math.max(max, num)
    }, 0)

    const newProjectId = `p${nextIdNumber + 1}`

    const newProject = {
      id: newProjectId,
      name: trimmedName,
      updatedAt: '最終更新: 新規作成',
      scenes: [],
      stageTemplateId: stageId,
    }

    projects.push(newProject)
    navigate(`/projects/${newProjectId}`)
  }

  return (
    <div className="page page-projects">
      <header className="projects-header">
        <h1 className="projects-title">新規プロジェクト</h1>
        <div className="projects-actions">
          <Link to="/projects" className="projects-new-button">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </header>

      <section className="project-detail-main new-project-creation">
        <div className="project-detail-fields">
          <div className="project-detail-field">
            <span className="project-detail-field-label">プロジェクト名</span>
            <div className="project-detail-field-box">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: 新しい公演プロジェクト"
                disabled={isCreating}
              />
            </div>
          </div>
        </div>

        <div className="project-detail-panel">
          <div className="project-detail-panel-title">ステージを選択</div>
          <p className="project-card-meta">
            プロジェクト名を入力したら、利用可能なステージを選んで作成します。
          </p>

          <section className="projects-grid stage-select-grid" aria-label="ステージ選択">
            {stageOptions.map((stage) => (
              <article key={stage.id} className="project-card stage-select-card">
                <div className="project-card-inner stage-select-card-inner">
                  <div className="stage-select-card-media">
                    {stage.image ? (
                      <img src={stage.image} alt={`${stage.name}のプレビュー`} className="stage-select-card-image" />
                    ) : (
                      <div className="project-detail-stage-placeholder stage-select-placeholder">
                        <span>{stage.name}</span>
                        <span className="project-detail-stage-note">プレビューは準備中です。</span>
                      </div>
                    )}
                  </div>
                  <div className="stage-select-card-body">
                    <h2 className="project-card-title">{stage.name}</h2>
                    <p className="project-card-meta">{stage.description}</p>
                    <button
                      type="button"
                      className="projects-new-button"
                      onClick={() => handleSelectStage(stage.id)}
                      disabled={!stage.available || !projectName.trim() || isCreating}
                    >
                      {stage.available ? 'このステージで作成' : '準備中'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </div>
  )
}
