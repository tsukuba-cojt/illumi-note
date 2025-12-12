export default function StageView() {
  const stages = ['Stage1', 'Stage2', 'Stage3', 'Stage4']

  return (
    <div className="page page-stage">
      <header className="projects-header">
        <h1 className="projects-title">ステージ</h1>
      </header>

      <section className="project-detail-stage">
        <div className="project-detail-stage-placeholder">
          <span>Stage View</span>
          <span className="project-detail-stage-note">
            ここにステージのプレビューが表示されます。
          </span>
        </div>
      </section>

      <section className="stageview-buttons" aria-label="ステージの一覧">
        {stages.map((label) => (
          <button key={label} type="button" className="stageview-button">
            {label}
          </button>
        ))}
      </section>
    </div>
  )
}
