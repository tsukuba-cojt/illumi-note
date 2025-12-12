import { useLocation, useNavigate } from 'react-router-dom'
import { projects } from '../mock/projects.js'

const stageTemplates = [
  {
    id: 'stage-a',
    name: 'ステージA',
    description: '標準的なプロセニアム型ステージ',
  },
  {
    id: 'stage-b',
    name: 'ステージB',
    description: '小劇場向けのコンパクトなステージ',
  },
  {
    id: 'stage-c',
    name: 'ステージC',
    description: 'ライブイベント向けのステージ',
  },
  {
    id: 'stage-d',
    name: 'ステージD',
    description: '実験的なライティング向けステージ',
  },
]

export default function StagePage() {
  const location = useLocation()
  const navigate = useNavigate()

  const fromNewProject = location.state?.from === 'new-project'
  const draftProjectName = location.state?.projectName || '新規プロジェクト'

  const handleSelectStage = (stageId) => {
    if (!fromNewProject) return

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
      name: draftProjectName,
      updatedAt: '最終更新: 新規作成',
      scenes: [],
      stageTemplateId: stageId,
    }

    projects.push(newProject)
    navigate(`/projects/${newProjectId}`)
  }

  return (
    <div className="page page-stage">
      <h1>ステージテンプレート選択</h1>
      {fromNewProject ? (
        <p>新規プロジェクト「{draftProjectName}」のステージを選択してください。</p>
      ) : (
        <p>ここでステージのテンプレートを選択できるようにします。</p>
      )}

      <section className="projects-grid" aria-label="ステージテンプレート一覧">
        {stageTemplates.map((template) => (
          <article key={template.id} className="project-card">
            <div className="project-card-inner">
              <h2 className="project-card-title">{template.name}</h2>
              <p className="project-card-meta">{template.description}</p>
              <button
                type="button"
                className="projects-new-button"
                onClick={() => handleSelectStage(template.id)}
                disabled={!fromNewProject}
              >
                このステージを選択
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
