import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { findScene } from '../mock/projects.js'

export default function ProjectDetailPage() {
  const { projectId, sceneId } = useParams()

  const { project, scene } = findScene(projectId, sceneId)
  const [activeTab, setActiveTab] = useState('lighting')

  if (!project || !scene) {
    return (
      <div className="page page-project-detail">
        <header className="projects-header">
          <h1 className="projects-title">シーンが見つかりません</h1>
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
    <div className="page page-project-detail">
      <header className="projects-header">
        <h1 className="projects-title">{project.name}</h1>
        <div className="projects-actions">
          <Link to="/projects" className="projects-new-button">
            一覧に戻る
          </Link>
        </div>
      </header>

      <section className="project-detail-main">
        <div className="project-detail-meta-row">
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

          <div className="project-detail-members">
            <div className="project-detail-members-title">メンバー</div>
            <div className="project-detail-members-list">
              {scene.members?.map((member) => (
                <div key={member.id} className="project-detail-member-pill">
                  <span className="project-detail-member-name">{member.name}</span>
                  {member.role && (
                    <span className="project-detail-member-role">{member.role}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="project-detail-layout">
          <div className="project-detail-stage">
            <div className="project-detail-stage-placeholder">
              <span>Stage Preview</span>
              <span className="project-detail-stage-note">
                （ここにステージ画像や3Dビューが入ります）
              </span>
            </div>
          </div>

          <div className="project-detail-side">
            <div className="project-detail-panel">
              <div className="project-detail-panel-title-row">
                <div className="project-detail-panel-title">Lighting</div>
                <div
                  className="project-detail-tabs"
                  role="tablist"
                  aria-label="詳細タブ"
                >
                  <button
                    type="button"
                    className={`project-detail-tab${
                      activeTab === 'lighting' ? ' project-detail-tab-active' : ''
                    }`}
                    onClick={() => setActiveTab('lighting')}
                  >
                    Lighting
                  </button>
                </div>
              </div>

              {activeTab === 'lighting' && (
                <ul className="project-detail-lighting-list">
                  {scene.lighting?.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              )}

              {activeTab === 'members' && (
                <div className="project-detail-members-list">
                  {scene.members?.map((member) => (
                    <div key={member.id} className="project-detail-member-pill">
                      <span className="project-detail-member-name">{member.name}</span>
                      {member.role && (
                        <span className="project-detail-member-role">{member.role}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'memo' && (
                <p className="project-detail-memo">
                  {scene.memo || 'メモはまだありません。'}
                </p>
              )}
            </div>

            <div className="project-detail-panel">
              <div className="project-detail-panel-title">MEMO</div>
              <p className="project-detail-memo">
                {scene.memo || 'メモはまだありません。'}
              </p>
            </div>
          </div>
        </div>

        <p className="project-card-meta project-detail-updated">
          {project.updatedAt}
        </p>
      </section>
    </div>
  )
}
