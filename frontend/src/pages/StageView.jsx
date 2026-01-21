import stage1Image from './Stage1.png'

const stages = [
  { id: 'stage-1', label: 'Stage 1', image: stage1Image },
  { id: 'stage-2', label: 'Stage 2' },
  { id: 'stage-3', label: 'Stage 3' },
  { id: 'stage-4', label: 'Stage 4' },
]

export default function StageView() {
  return (
    <div className="page page-stage">
      <header className="projects-header">
        <h1 className="projects-title">ステージ</h1>
      </header>

      <section className="stageview-grid" aria-label="ステージの一覧">
        {stages.map((stage) => (
          <article key={stage.id} className="stageview-card">
            <div className="stageview-card-media">
              {stage.image ? (
                <img src={stage.image} alt={`${stage.label}のプレビュー`} className="stageview-card-image" />
              ) : (
                <div className="project-detail-stage-placeholder">
                  <span>{stage.label}</span>
                  <span className="project-detail-stage-note">
                    ここにステージのプレビューが表示されます。
                  </span>
                </div>
              )}
            </div>
            <div className="stageview-card-footer">
              <span className="stageview-card-title">{stage.label}</span>
              <span className="project-detail-stage-note">
                {stage.image ? 'このステージのプレビュー画像です。' : 'プレビューは準備中です。'}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
