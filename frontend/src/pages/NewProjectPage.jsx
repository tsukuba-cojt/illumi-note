import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function NewProjectPage() {
  const [projectName, setProjectName] = useState('')
  const navigate = useNavigate()

  const handleStageSelectClick = () => {
    navigate('/stage-select', {
      state: {
        from: 'new-project',
        projectName: projectName || '新規プロジェクト',
      },
    })
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

      <section className="project-detail-main">
        <div className="project-detail-fields">
          <div className="project-detail-field">
            <span className="project-detail-field-label">プロジェクト名</span>
            <div className="project-detail-field-box">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例: 新しい公演プロジェクト"
              />
            </div>
          </div>
        </div>

        <div className="project-detail-panel">
          <div className="project-detail-panel-title">ステージ</div>
          <button
            type="button"
            className="projects-new-button"
            onClick={handleStageSelectClick}
            disabled={!projectName}
          >
            ステージを選択
          </button>
          <p className="project-card-meta">
            ステージを選択すると、新しいプロジェクトのシーン一覧に移動します。
          </p>
        </div>
      </section>
    </div>
  )
}
