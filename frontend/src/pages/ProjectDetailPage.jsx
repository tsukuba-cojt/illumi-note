import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { findScene } from '../mock/projects.js'
import { renderOnUnity } from '../unity.js'
import UnityContainer from '../UnityContainer.jsx'

const DISCRETE_LEVELS = [0, 30, 50, 70, 100]
const SAVE_DEBOUNCE_MS = 500
const DEFAULT_LIGHT_LABELS = [
  '1S',
  '2S',
  '1B',
  '2B',
  'CL D',
  'CL U',
  'FS L',
  'FS R',
  'CL L',
  'CL CTR',
  'CL R',
  'SS D_L',
  'SS D_R',
  'SS M_L',
  'SS M_R',
  'SS U_L',
  'SS U_R',
  'UH',
  'LH',
]

const LIGHTING_INFO_TEXT = {
  '1S': '舞台の手前側を真上から照らす地明かりです',
  '2S': '舞台の奥側を真上から照らす地明かりです',
  '1B': '舞台の手前側全体をフラットに照らし、地明かりや作業灯として使います',
  '2B': '舞台の奥側全体をフラットに照らし、地明かりや作業灯として使います',
  'CL D': '舞台の手前側全体を正面から照らす地明かりです',
  'CL U': '舞台の手前側全体を正面から照らす地明かりです',
  'FS L': '舞台を左斜め前から照らす地明かりです',
  'FS R': '舞台を右斜め前から照らす地明かりです',
  'CL L': '舞台の下手(左)を正面から部分的に照らします',
  'CL CTR': '舞台の中央を正面から部分的に照らします',
  'CL R': '舞台の上手(右)を正面から部分的に照らします',
  'SS D_L': '舞台の手前側を下手(左)舞台袖から横向きに照らします',
  'SS D_R': '舞台の手前側を上手(右)舞台袖から横向きに照らします',
  'SS M_L': '舞台の中央を下手(左)舞台袖から横向きに照らします',
  'SS M_R': '舞台の中央を上手(右)舞台袖から横向きに照らします',
  'SS U_L': '舞台の奥側を下手(左)舞台袖から横向きに照らします',
  'SS U_R': '舞台の奥側を上手(右)舞台袖から横向きに照らします',
  'UH': '舞台奥のホリゾント幕(背景幕)を上から照らします',
  'LH': '舞台奥のホリゾント幕(背景幕)を下から照らします',
}

function normalizeHalfWidthAlphanumerics(value) {
  if (value == null) return ''
  const text = String(value)
  return text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  )
}

function createDefaultLightingControls() {
  return DEFAULT_LIGHT_LABELS.map((channel) => ({
    channel,
    level: 50,
    color: '#ffffff',
    isOn: true,
    showInfo: false,
  }))
}

function normalizeLightingControls(rawControls) {
  if (!Array.isArray(rawControls) || rawControls.length === 0) {
    return createDefaultLightingControls()
  }

  const byLabel = new Map()

  rawControls.forEach((item) => {
    if (!item || typeof item !== 'object') return
    const channel = item.channel
    if (typeof channel !== 'string') return
    if (!DEFAULT_LIGHT_LABELS.includes(channel)) return
    if (byLabel.has(channel)) return

    const level =
      typeof item.level === 'number' ? item.level : 50
    const color =
      typeof item.color === 'string' && item.color
        ? item.color
        : '#ffffff'
    const isOn =
      typeof item.isOn === 'boolean' ? item.isOn : true
    const showInfo = !!item.showInfo

    byLabel.set(channel, {
      channel,
      level,
      color,
      isOn,
      showInfo,
    })
  })

  return DEFAULT_LIGHT_LABELS.map((channel) => {
    const existing = byLabel.get(channel)
    if (existing) return existing
    return {
      channel,
      level: 50,
      color: '#ffffff',
      isOn: true,
      showInfo: false,
    }
  })
}

async function fetchLightSettings(projectId, sceneId) {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/scenes/${encodeURIComponent(sceneId)}/light`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET light failed: ${res.status}`)
  return await res.json()
}

async function putLightSettings(projectId, sceneId, payload) {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/scenes/${encodeURIComponent(sceneId)}/light`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`PUT light failed: ${res.status}`)
}

function getLightingInfoText(channel) {
  if (typeof channel !== 'string') return undefined
  return LIGHTING_INFO_TEXT[channel] || undefined
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
  const [lightingControls, setLightingControls] = useState(() =>
    createDefaultLightingControls()
  )
  const [timeText, setTimeText] = useState(() =>
    normalizeHalfWidthAlphanumerics(scene?.time || '')
  )
  const [sceneNameText, setSceneNameText] = useState(() =>
    normalizeHalfWidthAlphanumerics(scene?.sceneName || defaultSceneName)
  )
  const [memoText, setMemoText] = useState(() =>
    normalizeHalfWidthAlphanumerics(scene?.memo || '')
  )
  const [lastUpdatedText, setLastUpdatedText] = useState(
    project?.updatedAt || ''
  )
  const [hasUserEdited, setHasUserEdited] = useState(false)

  useEffect(() => {
    renderOnUnity(lightingControls);
  }, [lightingControls])

  useEffect(() => {
    setTimeText(normalizeHalfWidthAlphanumerics(scene?.time || ''))
    setSceneNameText(
      normalizeHalfWidthAlphanumerics(scene?.sceneName || defaultSceneName)
    )
    setMemoText(normalizeHalfWidthAlphanumerics(scene?.memo || ''))
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

    let cancelled = false

    ;(async () => {
      // try {
      //   const apiData = await fetchLightSettings(projectId, sceneId)
      //   if (cancelled) return
      //   if (apiData) {
      //     if (
      //       Array.isArray(apiData.lightingControls) &&
      //       apiData.lightingControls.length > 0
      //     ) {
      //       setLightingControls(
      //         normalizeLightingControls(apiData.lightingControls)
      //       )
      //     }
      //     if (typeof apiData.memoText === 'string') {
      //       setMemoText(apiData.memoText)
      //     }
      //     if (typeof apiData.time === 'string') {
      //       setTimeText(apiData.time)
      //     }
      //     if (typeof apiData.sceneName === 'string') {
      //       setSceneNameText(apiData.sceneName)
      //     }
      //     return
      //   }
      // } catch {}

      try {
        const key = `sceneSettings:${projectId}:${sceneId}`
        const saved = window.localStorage.getItem(key)
        if (!saved) return
        const parsed = JSON.parse(saved)
        if (
          Array.isArray(parsed.lightingControls) &&
          parsed.lightingControls.length > 0
        ) {
          setLightingControls(
            normalizeLightingControls(parsed.lightingControls)
          )
        }
        if (typeof parsed.memoText === 'string') {
          setMemoText(normalizeHalfWidthAlphanumerics(parsed.memoText))
        }
        if (typeof parsed.time === 'string') {
          setTimeText(normalizeHalfWidthAlphanumerics(parsed.time))
        }
        if (typeof parsed.sceneName === 'string') {
          setSceneNameText(normalizeHalfWidthAlphanumerics(parsed.sceneName))
        }
      } catch {}
    })()

    return () => {
      cancelled = true
    }
  }, [projectId, sceneId])

  useEffect(() => {
    if (!scene) return
    if (typeof window === 'undefined') return
    if (!hasUserEdited) return

    const payloadObject = {
      lightingControls,
      memoText,
      time: timeText,
      sceneName: sceneNameText,
    }

    try {
      const key = `sceneSettings:${projectId}:${sceneId}`
      window.localStorage.setItem(key, JSON.stringify(payloadObject))
    } catch {}

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const formatted = `最終更新: ${yyyy}-${mm}-${dd} ${hh}:${min}`

    try {
      window.localStorage.setItem(`projectLastUpdatedAt:${projectId}`, formatted)
    } catch {}

    setLastUpdatedText(formatted)

    // let cancelled = false
    // const timer = window.setTimeout(() => {
    //   ;(async () => {
    //     try {
    //       await putLightSettings(projectId, sceneId, payloadObject)
    //     } catch {
    //       if (cancelled) return
    //     }
    //   })()
    // }, SAVE_DEBOUNCE_MS)
    //
    // return () => {
    //   cancelled = true
    //   window.clearTimeout(timer)
    // }
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
                  onBlur={(e) => {
                    setTimeText(
                      normalizeHalfWidthAlphanumerics(e.target.value)
                    )
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
                  onBlur={(e) => {
                    setSceneNameText(
                      normalizeHalfWidthAlphanumerics(e.target.value)
                    )
                  }}
                />
              </div>
            </div>
          </div>

        </div>

        <div className="project-detail-layout">
          <div className="project-detail-stage">
            <UnityContainer />
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
                  {lightingControls.map((control, index) => {
                    const levelIndex =
                      DISCRETE_LEVELS.indexOf(control.level) === -1
                        ? 0
                        : DISCRETE_LEVELS.indexOf(control.level)

                    return (
                    <div
                      key={index}
                      className={`lighting-control-row${
                        !control.isOn ? ' lighting-control-row-off' : ''
                      }`}
                    >
                      <div className="lighting-control-header">
                        <span className="lighting-control-label">
                          {control.channel || `Light ${index + 1}`}
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
                          {getLightingInfoText(control.channel)}
                        </div>
                      )}

                      <div className="lighting-control-body">
                        <div className="lighting-slider-group">
                          <div className="lighting-slider-track">
                            <input
                              type="range"
                              min="0"
                              max={DISCRETE_LEVELS.length - 1}
                              step="1"
                              value={levelIndex}
                              onChange={(e) => {
                                const newIndex = Number(e.target.value)
                                const newLevel =
                                  DISCRETE_LEVELS[newIndex] ?? DISCRETE_LEVELS[0]

                                setLightingControls((prev) =>
                                  prev.map((c, i) =>
                                    i === index
                                      ? { ...c, level: newLevel }
                                      : c
                                  )
                                )
                                setHasUserEdited(true)
                              }}
                            />
                            <div className="lighting-slider-ticks">
                              {DISCRETE_LEVELS.map((value) => (
                                <span
                                  key={value}
                                  className={`lighting-slider-tick${
                                    value === control.level
                                      ? ' lighting-slider-tick-active'
                                      : ''
                                  }`}
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
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
                    )
                  })}
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
                onBlur={(e) => {
                  setMemoText(
                    normalizeHalfWidthAlphanumerics(e.target.value)
                  )
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
