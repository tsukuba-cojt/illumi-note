import { useEffect, useRef } from "react";
import { unityCanvas } from "./unity";

export default function ({ visible }) {
  visible ??= true;
  const containerRef = useRef();

  useEffect(() => {
    const div = containerRef.current;
    div.appendChild(unityCanvas);
    let width;
    let height;
    if (visible) {
      const rect = div.getBoundingClientRect();
      width = Math.round(rect.width);
      height = Math.round(rect.width * (640 / 900));
    } else {
      width = 900;
      height = 640;
    }
    unityCanvas.width = width;
    unityCanvas.height = height;
    unityCanvas.style.width = `${width}px`;
    unityCanvas.style.height = `${height}px`;
  }, []);

  useEffect(() => {
    if (visible) {
      unityCanvas.classList.remove("hidden");
      containerRef.current.appendChild(unityCanvas);
    } else {
      unityCanvas.classList.add("hidden");
      document.body.appendChild(unityCanvas);
    }
  }, [visible]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", pointerEvents: "none" }} />;
}
