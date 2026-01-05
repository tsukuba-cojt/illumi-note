import { useEffect, useRef } from "react";
import { initUnity } from "./unity";

export default function UnityRoot() {
  const ref = useRef();
  useEffect(() => {
    initUnity({
      arguments: [],
      dataUrl: "/WebGLBuild/Build/WebGLBuild.data",
      frameworkUrl: "/WebGLBuild/Build/WebGLBuild.framework.js",
      codeUrl: "/WebGLBuild/Build/WebGLBuild.wasm",
      streamingAssetsUrl: "/StreamingAssets",
      companyName: "DefaultCompany",
      productName: "Illuminote_new",
      productVersion: "0.1.0",
      devicePixelRatio: 1,
      webglContextAttributes: {
        preserveDrawingBuffer: true,
      },
    });
  }, []);
  return <div style={{ display: "none" }} ref={ref} id="unity-container" />;
}
