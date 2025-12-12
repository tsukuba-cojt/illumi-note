import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { findScene } from '../mock/projects.js'

function getLightingInfoText(label) {
  if (!label) return 'このライトの説明です。'
  if (label.startsWith('SS')) return 'このシーンのメインの明るさ（％）を表します。'
  if (label.startsWith('ホリ')) return 'ホリ（背景幕）を照らすライトの色設定です。'
  if (label.startsWith('ピンスポットライト')) return 'ピンスポットライト（前面のスポット）の色設定です。'
  return 'このライトの説明です。'
}

export default function ProjectDetailPage() {
  const { projectId, sceneId } = useParams()

  const { project, scene: foundScene } = findScene(projectId, sceneId)

  const placeholderMatch = sceneId?.match(/^placeholder-(\d+)$/)

  const placeholderIndex = placeholderMatch ? Number(placeholderMatch[1]) : null

  const defaultSceneName =
    foundScene?.sceneName ??
    (placeholderIndex ? `SCENE ${placeholderIndex}` : 'NEW SCENE')

  const scene =
    foundScene ??
    (project && {
      id: sceneId,
      time: '0:00',
      sceneName: defaultSceneName,
      lighting: [],
      memo: '',
    })

  const [activeTab, setActiveTab] = useState('lighting')
  const [lightingControls, setLightingControls] = useState(() => {
    const fromScene = scene?.lighting && scene.lighting.length > 0
    const linesFromScene = fromScene ? scene.lighting : []
    const linesFromLastProjectScene =
      project?.scenes?.length &&
      project.scenes[project.scenes.length - 1]?.lighting?.length
        ? project.scenes[project.scenes.length - 1].lighting
        : []

    const baseLinesRaw = fromScene ? linesFromScene : linesFromLastProjectScene

    const baseLines =
      baseLinesRaw && baseLinesRaw.length > 0 ? baseLinesRaw : ['SS 50%']

    return (
      baseLines.map((line) => {
        const match = line.match(/(.*?)(\d+)\s*%/)
        const baseLabel = match ? match[1].trim() : line
        const initialLevel = match ? Number(match[2]) : 50

        return {
          label: baseLabel,
          level: initialLevel,
          color: '#ffffff',
          isOn: true,
          showInfo: false,
        }
      }) || []
    )
  })
  const [timeText, setTimeText] = useState(scene?.time || '')
  const [sceneNameText, setSceneNameText] = useState(
    scene?.sceneName || defaultSceneName
  )
  const [memoText, setMemoText] = useState(scene?.memo || '')
  const [lastUpdatedText, setLastUpdatedText] = useState(
    project?.updatedAt || ''
  )
  const [hasUserEdited, setHasUserEdited] = useState(false)

  useEffect(() => {
    setTimeText(scene?.time || '')
    setSceneNameText(scene?.sceneName || defaultSceneName)
    setMemoText(scene?.memo || '')
  }, [projectId, sceneId, defaultSceneName])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const key = `projectLastUpdatedAt:${projectId}`
      const saved = window.localStorage.getItem(key)
      if (saved) {
        setLastUpdatedText(saved)
      } else if (project?.updatedAt) {
        setLastUpdatedText(project.updatedAt)
      }
    } catch {}
  }, [projectId, project])

  useEffect(() => {
    if (!scene) return
    if (typeof window === 'undefined') return

    try {
      const key = `sceneSettings:${projectId}:${sceneId}`
      const saved = window.localStorage.getItem(key)
      if (!saved) return

      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.lightingControls) && parsed.lightingControls.length > 0) {
        setLightingControls(parsed.lightingControls)
      }
      if (typeof parsed.memoText === 'string') {
        setMemoText(parsed.memoText)
      }
      if (typeof parsed.time === 'string') {
        setTimeText(parsed.time)
      }
      if (typeof parsed.sceneName === 'string') {
        setSceneNameText(parsed.sceneName)
      }
    } catch {}
  }, [projectId, sceneId])

  useEffect(() => {
    if (!scene) return
    if (typeof window === 'undefined') return
    if (!hasUserEdited) return

    try {
      const key = `sceneSettings:${projectId}:${sceneId}`
      const payload = JSON.stringify({
        lightingControls,
        memoText,
        time: timeText,
        sceneName: sceneNameText,
      })
      window.localStorage.setItem(key, payload)

      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const formatted = `最終更新: ${yyyy}-${mm}-${dd} ${hh}:${min}`

      window.localStorage.setItem(`projectLastUpdatedAt:${projectId}`, formatted)
      setLastUpdatedText(formatted)
    } catch {}
  }, [
    projectId,
    sceneId,
    lightingControls,
    memoText,
    timeText,
    sceneNameText,
    hasUserEdited,
  ])

  if (!project) {
    return (
      <div className="page page-project-detail">
        <header className="projects-header">
          <h1 className="projects-title">シーンが見つかりません</h1>
          <div className="projects-actions">
            <Link to={`/projects/${projectId}`} className="projects-new-button">
              シーン一覧に戻る
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
          <Link to={`/projects/${projectId}`} className="projects-new-button">
            シーン一覧に戻る
          </Link>
        </div>
      </header>

      <section className="project-detail-main">
        <div className="project-detail-meta-row">
          <div className="project-detail-fields">
            <div className="project-detail-field">
              <span className="project-detail-field-label">TIME</span>
              <div className="project-detail-field-box">
                <input
                  type="text"
                  value={timeText}
                  onChange={(e) => {
                    setTimeText(e.target.value)
                    setHasUserEdited(true)
                  }}
                />
              </div>
            </div>
            <div className="project-detail-field">
              <span className="project-detail-field-label">SCENE NAME</span>
              <div className="project-detail-field-box">
                <input
                  type="text"
                  value={sceneNameText}
                  onChange={(e) => {
                    setSceneNameText(e.target.value)
                    setHasUserEdited(true)
                  }}
                />
              </div>
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
              </div>

              {activeTab === 'lighting' && (
                <div className="project-detail-lighting-list">
                  {lightingControls.length === 0 && (
                    <p className="project-detail-lighting-empty">
                      ライティング情報がありません。
                    </p>
                  )}
                  {lightingControls.map((control, index) => (
                    <div
                      key={index}
                      className={`lighting-control-row${
                        !control.isOn ? ' lighting-control-row-off' : ''
                      }`}
                    >
                      <div className="lighting-control-header">
                        <span className="lighting-control-label">
                          {control.label || `Light ${index + 1}`}
                          {typeof control.level === 'number' && (
                            <span className="lighting-control-percent">{` ${control.level}%`}</span>
                          )}
                        </span>
                        <div className="lighting-control-actions">
                          <button
                            type="button"
                            className="lighting-info-button"
                            onClick={() => {
                              setLightingControls((prev) =>
                                prev.map((c, i) =>
                                  i === index ? { ...c, showInfo: !c.showInfo } : c
                                )
                              )
                              setHasUserEdited(true)
                            }}
                          >
                            i
                          </button>
                          <button
                            type="button"
                            className={`lighting-toggle-button${
                              control.isOn
                                ? ' lighting-toggle-on'
                                : ' lighting-toggle-off'
                            }`}
                            onClick={() => {
                              setLightingControls((prev) =>
                                prev.map((c, i) =>
                                  i === index ? { ...c, isOn: !c.isOn } : c
                                )
                              )
                              setHasUserEdited(true)
                            }}
                          >
                            {control.isOn ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>

                      {control.showInfo && (
                        <div className="lighting-info-tooltip">
                          {getLightingInfoText(control.label)}
                        </div>
                      )}

                      <div className="lighting-control-body">
                        <div className="lighting-slider-group">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={control.level}
                            onChange={(e) => {
                              setLightingControls((prev) =>
                                prev.map((c, i) =>
                                  i === index
                                    ? { ...c, level: Number(e.target.value) }
                                    : c
                                )
                              )
                              setHasUserEdited(true)
                            }}
                          />
                          <span className="lighting-level-value">{control.level}</span>
                        </div>

                        <div className="lighting-color-group">
                          <input
                            type="color"
                            value={control.color}
                            onChange={(e) => {
                              setLightingControls((prev) =>
                                prev.map((c, i) =>
                                  i === index ? { ...c, color: e.target.value } : c
                                )
                              )
                              setHasUserEdited(true)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'memo' && (
                <p className="project-detail-memo">
                  {memoText || 'メモはまだありません。'}
                </p>
              )}
            </div>

            <div className="project-detail-panel">
              <div className="project-detail-panel-title">MEMO</div>
              <textarea
                className="project-detail-memo"
                value={memoText}
                onChange={(e) => {
                  setMemoText(e.target.value)
                  setHasUserEdited(true)
                }}
                placeholder="メモを入力してください"
                rows={4}
              />
            </div>
          </div>
        </div>

        <p className="project-card-meta project-detail-updated">
          {lastUpdatedText}
        </p>
      </section>
    </div>
  )
}
