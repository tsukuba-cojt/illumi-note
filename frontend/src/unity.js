/**
 * @param {boolean} b
 * @param {string} message
 * @returns {asserts b}
 */
function assert(b, message = "Assertion failed") {
  if (!b) {
    throw new Error(message);
  }
}

const FRAME_READY_EVENT = "UnityFrameReady";

/** @type {Promise<any> | undefined} */
let unityInstancePromise;
export const unityCanvas = document.createElement("canvas");

export function initUnity(config) {
  if (unityInstancePromise !== undefined) {
    return;
  }
  document.body.appendChild(unityCanvas);
  unityCanvas.id = "unity-canvas";
  unityCanvas.width = 900;
  unityCanvas.height = 640;
  unityCanvas.style.width = "900px";
  unityCanvas.style.height = "640px";
  unityInstancePromise = new Promise((resolve, reject) => {
    createUnityInstance(unityCanvas, config)
      .then((instance) => {
        setTimeout(() => resolve(instance), 5000);
      })
      .catch(reject);
  });
  return unityInstancePromise;
}

/**
 * @param {{
 *  channel: string,
 *  level?: number,
 *  isOn?: boolean,
 *  color?: string,
 * }[]} lightingControls
 * @returns {Promise<string>}
 */
export async function renderOnUnity(lightingControls) {
  assert(unityInstancePromise !== undefined, "initUnity has not been called");
  const unityInstance = await unityInstancePromise;
  unityInstance.SendMessage(
    "LightingManager",
    "ApplySceneFromWeb",
    JSON.stringify({ sceneName: "TEST", lightingControls }),
  );
  const frameReady = new Promise((resolve, reject) => {
    window.addEventListener(FRAME_READY_EVENT, resolve, { once: true });
    setTimeout(() => reject(`${FRAME_READY_EVENT} timed out`), 1000);
  });
  unityInstance.SendMessage("RenderManager", "RenderSingleFrame");
  await frameReady;
  return unityCanvas.toDataURL();
}
