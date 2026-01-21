import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { findProject } from "../mock/projects.js";
import { renderOnUnity } from "../unity.js";
import UnityContainer from "../UnityContainer.jsx";

const DEFAULT_LIGHT_LABELS = [
  "1S",
  "2S",
  "1B",
  "2B",
  "CL D",
  "CL U",
  "FS L",
  "FS R",
  "CL R",
  "CL CTR",
  "CL L",
  "SS D_L",
  "SS D_R",
  "SS M_L",
  "SS M_R",
  "SS U_L",
  "SS U_R",
  "UH",
  "LH",
];

function createDefaultLightingControls() {
  return DEFAULT_LIGHT_LABELS.map((channel) => ({
    channel,
    level: 0,
    color: "#FDF7A1",
  }));
}

function normalizeLightingControls(rawControls) {
  if (!Array.isArray(rawControls) || rawControls.length === 0) {
    return createDefaultLightingControls();
  }

  const byLabel = new Map();

  rawControls.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const channel = item.channel;
    if (typeof channel !== "string") return;
    if (!DEFAULT_LIGHT_LABELS.includes(channel)) return;
    if (byLabel.has(channel)) return;

    const level = typeof item.level === "number" ? item.level : 0;
    const color =
      typeof item.color === "string" && item.color ? item.color : "#FDF7A1";

    byLabel.set(channel, {
      channel,
      level,
      color,
    });
  });

  return DEFAULT_LIGHT_LABELS.map((channel) => {
    const existing = byLabel.get(channel);
    if (existing) return existing;
    return {
      channel,
      level: 0,
      color: "#FDF7A1",
    };
  });
}

async function fetchLightSettings(projectId, sceneId) {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/scenes/${encodeURIComponent(
      sceneId
    )}/light`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET light failed: ${res.status}`);
  return await res.json();
}

function getSceneDisplayData(projectId, scene, serverData) {
  const baseFromScene =
    scene.lighting?.map((line) => {
      const match = line.match(/(.*?)(\d+)\s*%/);
      const baseLabel = match ? match[1].trim() : line;
      const initialLevel = match ? Number(match[2]) : 0;

      return {
        channel: baseLabel,
        level: initialLevel,
        color: "#FDF7A1",
      };
    }) || [];

  let lightingControls =
    baseFromScene.length > 0
      ? normalizeLightingControls(baseFromScene)
      : createDefaultLightingControls();
  let memoText = scene.memo || "";
  let timeText = scene.time || "0:00";
  let sceneName = scene.sceneName || "";

  if (serverData) {
    if (Array.isArray(serverData.lightingControls)) {
      lightingControls = normalizeLightingControls(serverData.lightingControls);
    }
    if (typeof serverData.memoText === "string") {
      memoText = serverData.memoText;
    }
    if (typeof serverData.time === "string") {
      timeText = serverData.time;
    }
    if (typeof serverData.sceneName === "string") {
      sceneName = serverData.sceneName;
    }
    return { lightingControls, memoText, timeText, sceneName };
  }

  if (typeof window !== "undefined") {
    try {
      const key = `sceneSettings:${projectId}:${scene.id}`;
      const saved = window.localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.lightingControls)) {
          lightingControls = normalizeLightingControls(parsed.lightingControls);
        }
        if (typeof parsed.memoText === "string") {
          memoText = parsed.memoText;
        }
        if (typeof parsed.time === "string") {
          timeText = parsed.time;
        }
        if (typeof parsed.sceneName === "string") {
          sceneName = parsed.sceneName;
        }
      }
    } catch {}
  }

  return { lightingControls, memoText, timeText, sceneName };
}

function createPlaceholderScene(displayIndex, placeholderId) {
  const id = placeholderId ?? `placeholder-${displayIndex}`;
  return {
    id,
    time: "0:00",
    sceneName: `SCENE ${displayIndex}`,
    lighting: DEFAULT_LIGHT_LABELS,
    memo: "",
    isPlaceholder: true,
  };
}

function fillWithPlaceholders(baseScenes, desiredCount) {
  const next = Array.isArray(baseScenes) ? [...baseScenes] : [];
  for (let index = next.length; index < desiredCount; index += 1) {
    next.push(createPlaceholderScene(index + 1));
  }
  return next;
}

export default function SceneListPage() {
  const { projectId } = useParams();
  const project = findProject(projectId);

  const navigate = useNavigate();

  const isDraggingRef = useRef(false);

  const [scenes, setScenes] = useState(project?.scenes || []);
  const [sceneLightCache, setSceneLightCache] = useState({});
  const [scenePreviews, setScenePreviews] = useState(
    /** @type {Map<string, string>} */ (new Map())
  );

  const [visibleCount, setVisibleCount] = useState(() =>
    Math.max(project?.scenes?.length || 0, 3)
  );
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [undoOpIndex, setUndoOpIndex] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [draggingSceneId, setDraggingSceneId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleExportPdf = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  useEffect(() => {
    if (!project) return;

    let canceled = false;
    const loadPreviews = async () => {
      const newScenePreviews = new Map();

      for (let index = 0; index < visibleCount; index += 1) {
        const scene = scenes[index] || null;
        const sceneIdForLink = scene?.id ?? `placeholder-${index + 1}`;

        const baseSceneForDisplay = scene || {
          id: sceneIdForLink,
          time: "0:00",
          sceneName: `SCENE ${index + 1}`,
          lighting: DEFAULT_LIGHT_LABELS,
          memo: "",
        };

        const display = getSceneDisplayData(
          project.id,
          baseSceneForDisplay,
          scene ? sceneLightCache[scene.id] ?? null : null
        );

        if (canceled) return;
        newScenePreviews.set(
          sceneIdForLink,
          await renderOnUnity(display.lightingControls)
        );
      }

      if (!canceled) {
        setScenePreviews(newScenePreviews);
      }
    };

    loadPreviews();

    return () => {
      canceled = true;
    };
  }, [project?.id, scenes, sceneLightCache, visibleCount]);

  useEffect(() => {
    setSceneLightCache({});
    // プロジェクトが変わったら表示件数と履歴をリセット
    const baseScenesCount = project?.scenes?.length || 0;
    let initialVisibleCount = Math.max(baseScenesCount, 3);

    if (typeof window !== "undefined") {
      try {
        const key = `sceneList:${projectId}`;
        const saved = window.localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.visibleCount === "number") {
            initialVisibleCount = Math.max(
              baseScenesCount,
              parsed.visibleCount
            );
          }
        }
      } catch {}
    }

    setVisibleCount(initialVisibleCount);
    setScenes(fillWithPlaceholders(project?.scenes || [], initialVisibleCount));
    setHistory([]);
    setHistoryIndex(-1);
    setUndoOpIndex(null);
    setUndoCountdown(0);
    setDraggingSceneId(null);
    setDragOverIndex(null);
  }, [projectId, project]);

  // useEffect(() => {
  //   if (typeof window === 'undefined') return
  //   if (!projectId) return
  //
  //   let cancelled = false
  //   const idsToFetch = Array.from({ length: visibleCount })
  //     .map((_, index) => scenes[index]?.id)
  //     .filter(Boolean)
  //
  //   idsToFetch.forEach((sceneId) => {
  //     if (sceneLightCache[sceneId] !== undefined) return
  //
  //     ;(async () => {
  //       try {
  //         const data = await fetchLightSettings(projectId, sceneId)
  //         if (cancelled) return
  //         setSceneLightCache((prev) => ({
  //           ...prev,
  //           [sceneId]: data,
  //         }))
  //       } catch {
  //         if (cancelled) return
  //         setSceneLightCache((prev) => ({
  //           ...prev,
  //           [sceneId]: null,
  //         }))
  //       }
  //     })()
  //   })
  //
  //   return () => {
  //     cancelled = true
  //   }
  // }, [projectId, scenes, visibleCount, sceneLightCache])

  const handleDeleteScene = (scene) => {
    if (!scene) return;
    const sceneIndex = scenes.findIndex((s) => s.id === scene.id);
    if (sceneIndex === -1) return;

    setScenes((prev) =>
      fillWithPlaceholders(
        prev.filter((s) => s && s.id !== scene.id),
        visibleCount
      )
    );

    const op = { type: "deleteScene", scene, index: sceneIndex };

    const baseHistory =
      historyIndex >= 0
        ? history.slice(0, historyIndex + 1)
        : history.slice(0, 0);
    const newHistory = [...baseHistory, op];
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);
    setUndoOpIndex(newIndex);
  };

  const handleAddPlaceholder = () => {
    const prevVisibleCount = visibleCount;
    const nextVisibleCount = prevVisibleCount + 1;

    setVisibleCount(nextVisibleCount);

    setScenes((prev) => fillWithPlaceholders(prev, nextVisibleCount));

    if (typeof window !== "undefined") {
      try {
        const key = `sceneList:${projectId}`;
        const payload = JSON.stringify({ visibleCount: nextVisibleCount });
        window.localStorage.setItem(key, payload);
      } catch {}
    }

    const op = { type: "addPlaceholder", prevVisibleCount };

    const baseHistory =
      historyIndex >= 0
        ? history.slice(0, historyIndex + 1)
        : history.slice(0, 0);
    const newHistory = [...baseHistory, op];
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);
  };

  const handleDeletePlaceholder = (placeholderScene) => {
    if (!placeholderScene) return;
    if (!placeholderScene.isPlaceholder) return;

    const prevVisibleCount = visibleCount;

    const placeholderIndex = scenes.findIndex(
      (s) => s && s.id === placeholderScene.id
    );
    if (placeholderIndex === -1) return;

    const baseRealScenesCount = (project?.scenes?.length || 0) +
      scenes.filter((s) => s && !s.isPlaceholder && !project?.scenes?.some((p) => p.id === s.id)).length;

    const nextVisibleCount = Math.max(prevVisibleCount - 1, baseRealScenesCount, 3);

    if (nextVisibleCount === prevVisibleCount) return;

    setVisibleCount(nextVisibleCount);

    setScenes((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => s && s.id === placeholderScene.id);
      if (idx === -1) return next;
      next.splice(idx, 1);
      return next;
    });

    if (typeof window !== "undefined") {
      try {
        const key = `sceneList:${projectId}`;
        const payload = JSON.stringify({ visibleCount: nextVisibleCount });
        window.localStorage.setItem(key, payload);
      } catch {}
    }

    const op = {
      type: "deletePlaceholder",
      prevVisibleCount,
      scene: placeholderScene,
      index: placeholderIndex,
    };

    const baseHistory =
      historyIndex >= 0
        ? history.slice(0, historyIndex + 1)
        : history.slice(0, 0);
    const newHistory = [...baseHistory, op];
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);
    setUndoOpIndex(newIndex);
  };

  useEffect(() => {
    if (undoOpIndex == null) return;
    setUndoCountdown(10);
    const intervalId = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setUndoOpIndex(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [undoOpIndex]);

  const handleUndo = () => {
    if (historyIndex < 0) return;
    const op = history[historyIndex];
    if (!op) return;

    if (op.type === "deleteScene") {
      setScenes((prev) => {
        const next = [...prev];
        next.splice(op.index, 0, op.scene);
        if (next.length <= visibleCount) return fillWithPlaceholders(next, visibleCount);
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i]?.isPlaceholder) {
            next.splice(i, 1);
            break;
          }
        }
        return next.slice(0, visibleCount);
      });
    } else if (op.type === "reorderScene") {
      setScenes((prev) => {
        const next = [...prev];
        const currentIndex = next.findIndex((s) => s && s.id === op.sceneId);
        if (currentIndex === -1) return next;
        const [moved] = next.splice(currentIndex, 1);
        const target = Math.min(Math.max(op.fromIndex, 0), next.length);
        next.splice(target, 0, moved);
        return next;
      });
    } else if (op.type === "deletePlaceholder") {
      setVisibleCount(op.prevVisibleCount);

      setScenes((prev) => {
        const next = [...prev];
        const targetIndex = Math.min(Math.max(op.index, 0), next.length);
        next.splice(targetIndex, 0, op.scene);
        return next.slice(0, op.prevVisibleCount);
      });

      if (typeof window !== "undefined") {
        try {
          const key = `sceneList:${projectId}`;
          const payload = JSON.stringify({ visibleCount: op.prevVisibleCount });
          window.localStorage.setItem(key, payload);
        } catch {}
      }
    } else if (op.type === "addPlaceholder") {
      setVisibleCount(op.prevVisibleCount);

      setScenes((prev) => prev.slice(0, op.prevVisibleCount));

      if (typeof window !== "undefined") {
        try {
          const key = `sceneList:${projectId}`;
          const payload = JSON.stringify({ visibleCount: op.prevVisibleCount });
          window.localStorage.setItem(key, payload);
        } catch {}
      }
    }

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    if (undoOpIndex === historyIndex) {
      setUndoOpIndex(null);
      setUndoCountdown(0);
    }
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const op = history[nextIndex];
    if (!op) return;

    if (op.type === "deleteScene") {
      setScenes((prev) =>
        fillWithPlaceholders(
          prev.filter((s) => s && s.id !== op.scene.id),
          visibleCount
        )
      );
      setUndoOpIndex(nextIndex);
    } else if (op.type === "reorderScene") {
      setScenes((prev) => {
        const next = [...prev];
        const currentIndex = next.findIndex((s) => s && s.id === op.sceneId);
        if (currentIndex === -1) return next;
        const [moved] = next.splice(currentIndex, 1);
        const target = Math.min(Math.max(op.toIndex, 0), next.length);
        next.splice(target, 0, moved);
        return next;
      });
    } else if (op.type === "deletePlaceholder") {
      const nextVisibleCount = Math.max(op.prevVisibleCount - 1, 3);
      setVisibleCount(nextVisibleCount);
      setScenes((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s && s.id === op.scene.id);
        if (idx === -1) return next.slice(0, nextVisibleCount);
        next.splice(idx, 1);
        return next.slice(0, nextVisibleCount);
      });
      if (typeof window !== "undefined") {
        try {
          const key = `sceneList:${projectId}`;
          const payload = JSON.stringify({ visibleCount: nextVisibleCount });
          window.localStorage.setItem(key, payload);
        } catch {}
      }
      setUndoOpIndex(nextIndex);
    } else if (op.type === "addPlaceholder") {
      const nextVisibleCount = op.prevVisibleCount + 1;
      setVisibleCount(nextVisibleCount);
      setScenes((prev) => fillWithPlaceholders(prev, nextVisibleCount));
      if (typeof window !== "undefined") {
        try {
          const key = `sceneList:${projectId}`;
          const payload = JSON.stringify({ visibleCount: nextVisibleCount });
          window.localStorage.setItem(key, payload);
        } catch {}
      }
    }

    setHistoryIndex(nextIndex);
  };

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSceneContextMenu = (event, scene, index) => {
    event.preventDefault();
    if (scene) {
      if (scene.isPlaceholder) {
        const confirmed = window.confirm("この空のシーンを削除しますか？");
        if (confirmed) {
          handleDeletePlaceholder(scene);
        }
      } else {
        const confirmed = window.confirm("このシーンを削除しますか？");
        if (confirmed) {
          handleDeleteScene(scene);
        }
      }
    } else {
      // 空のシーン（プレースホルダー）
      if (index < scenes.length || index >= visibleCount) return;
      const confirmed = window.confirm("この空のシーンを削除しますか？");
      if (confirmed) {
        handleDeletePlaceholder(createPlaceholderScene(index + 1));
      }
    }
  };

  const handleDragStart = (event, sceneId) => {
    if (!sceneId) return;
    isDraggingRef.current = true;
    setDraggingSceneId(sceneId);
    setDragOverIndex(null);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      try {
        event.dataTransfer.setData("text/plain", sceneId);
      } catch {}
    }
  };

  const handleDragOver = (event, index) => {
    if (!draggingSceneId) return;
    event.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (event, index) => {
    if (!draggingSceneId) return;
    event.preventDefault();

    const fromIndex = scenes.findIndex((s) => s && s.id === draggingSceneId);
    const toIndex = index;
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      isDraggingRef.current = false;
      setDraggingSceneId(null);
      setDragOverIndex(null);
      return;
    }

    setScenes((prev) => {
      const next = [...prev];
      const currentFrom = next.findIndex((s) => s && s.id === draggingSceneId);
      if (currentFrom === -1) return next;
      const [moved] = next.splice(currentFrom, 1);
      const target = Math.min(Math.max(toIndex, 0), next.length);
      next.splice(target, 0, moved);
      return next;
    });

    const op = {
      type: "reorderScene",
      sceneId: draggingSceneId,
      fromIndex,
      toIndex,
    };

    const baseHistory =
      historyIndex >= 0
        ? history.slice(0, historyIndex + 1)
        : history.slice(0, 0);
    const newHistory = [...baseHistory, op];
    setHistory(newHistory);
    const newIndex = newHistory.length - 1;
    setHistoryIndex(newIndex);

    isDraggingRef.current = false;
    setDraggingSceneId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setDraggingSceneId(null);
    setDragOverIndex(null);
  };

  if (!project) {
    return (
      <div className="page page-scene-list">
        <header className="projects-header">
          <h1 className="projects-title">プロジェクトが見つかりません</h1>
          <div className="projects-actions">
            <Link to="/projects" className="projects-new-button">
              一覧に戻る
            </Link>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="page page-scene-list">
      <header className="projects-header">
        <div className="projects-header-main">
          <h1 className="projects-title">{project.name}</h1>
        </div>
        <div className="projects-actions scene-list-header-actions">
          <button
            type="button"
            className="projects-new-button"
            onClick={handleExportPdf}
          >
            保存（PDF）
          </button>
          <Link to="/projects" className="projects-new-button">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </header>

      <section className="scene-list" aria-label="シーン一覧">
        {Array.from({ length: visibleCount }).map((_, index) => {
          const scene = scenes[index];
          const isPlaceholder = !scene || !!scene.isPlaceholder;
          const sceneIdForLink = scene?.id ?? `placeholder-${index + 1}`;
          const key = scene?.id ?? sceneIdForLink;

          const baseSceneForDisplay =
            scene || createPlaceholderScene(index + 1, sceneIdForLink);

          const display = getSceneDisplayData(
            project.id,
            baseSceneForDisplay,
            scene ? sceneLightCache[scene.id] : null
          );
          const timeText =
            display.timeText || baseSceneForDisplay.time || "0:00";
          const sceneName =
            display.sceneName ||
            baseSceneForDisplay.sceneName ||
            `SCENE ${index + 1}`;
          const isDragOver = dragOverIndex === index && !!draggingSceneId;

          const previewKey = scene?.id ?? sceneIdForLink;
          const previewSrc = scenePreviews.get(previewKey) ?? null;

          const card = (
            <article
              className={`scene-card${
                isDragOver ? " scene-card-drop-target" : ""
              }`}
              draggable={!!scene}
              onDragStart={
                scene ? (e) => handleDragStart(e, scene.id) : undefined
              }
              onDragEnd={scene ? handleDragEnd : undefined}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              <header className="scene-card-header">
                <div className="project-detail-fields">
                  <div className="project-detail-field">
                    <span className="project-detail-field-label">TIME</span>
                    <div className="project-detail-field-box">{timeText}</div>
                  </div>
                  <div className="project-detail-field">
                    <span className="project-detail-field-label">
                      SCENE NAME
                    </span>
                    <div className="project-detail-field-box">{sceneName}</div>
                  </div>
                </div>
              </header>

              <div className="scene-card-body">
                <div className="scene-card-stage">
                  {previewSrc ? (
                    <img
                      className="scene-preview"
                      src={previewSrc}
                      alt="Scene preview"
                    />
                  ) : (
                    <div className="project-detail-stage-placeholder">
                      <span>
                        {isPlaceholder ? "New Scene" : "Stage Preview"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="scene-card-side">
                  <div className="scene-card-panel">
                    <div className="project-detail-panel-title">Lighting</div>
                    {display.lightingControls.length > 0 ? (
                      <ul className="scene-card-lighting-list">
                        {display.lightingControls.map((light, i) => (
                          <li key={i} className="scene-card-lighting-item">
                            <span className="scene-card-lighting-label">
                              {light.channel || `Light ${i + 1}`}
                            </span>
                            <span className="scene-card-lighting-level">
                              {typeof light.level === "number"
                                ? `${light.level}%`
                                : ""}
                            </span>
                            <svg
                              className="scene-card-lighting-color"
                              viewBox="0 0 1 1"
                              aria-label="lighting color"
                            >
                              <rect
                                width="1"
                                height="1"
                                fill={light.color ?? "#FDF7A1"}
                              />
                            </svg>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="scene-card-memo">
                        ライティング情報がありません。
                      </p>
                    )}
                  </div>
                  <div className="scene-card-panel">
                    <div className="project-detail-panel-title">MEMO</div>
                    {display.memoText ? (
                      <p className="scene-card-memo">{display.memoText}</p>
                    ) : (
                      <p className="scene-card-memo scene-card-memo-placeholder">
                        ここにメモを入力してください
                      </p>
                    )}
                  </div>
                  
                </div>
              </div>
              <div className="page-number">{index + 1}</div>
            </article>
          );

          return (
            <div
              key={key}
              className="scene-card-link"
              onClick={() => {
                if (isDraggingRef.current || draggingSceneId) return;
                navigate(`/projects/${project.id}/scenes/${sceneIdForLink}`);
              }}
              onContextMenu={(e) => handleSceneContextMenu(e, scene, index)}
            >
              {card}
            </div>
          );
        })}
      </section>

      {undoOpIndex != null && (
        <div className="scene-undo-toast">
          <span>シーンを削除しました。</span>
          <button
            type="button"
            className="scene-undo-button"
            onClick={handleUndo}
          >
            削除を取り消す ({undoCountdown})
          </button>
        </div>
      )}

      <div className="scene-history-controls">
        <button
          type="button"
          className="scene-history-button scene-add-button"
          onClick={handleAddPlaceholder}
        >
          ＋
        </button>
        <div className="scene-history-buttons-row">
          <button
            type="button"
            className="scene-history-button"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            ◀
          </button>
          <button
            type="button"
            className="scene-history-button"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            ▶
          </button>
        </div>
      </div>
      <UnityContainer visible={false} />
    </div>
  );
}
