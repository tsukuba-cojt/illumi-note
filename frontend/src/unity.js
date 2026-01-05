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
 * @returns {Promise<void>}
 */
export async function sendCommandToUnity(lightingControls) {
  assert(unityInstancePromise !== undefined, "initUnity has not been called");
  const unityInstance = await unityInstancePromise;
  unityInstance.SendMessage(
    "LightingManager",
    "ApplySceneFromWeb",
    JSON.stringify({ sceneName: "TEST", lightingControls }),
  );
}

/**
 * @returns {string}
 */
export function getImageFromUnity() {
  return unityCanvas.toDataURL();
}
