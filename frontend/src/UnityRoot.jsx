import { useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { initUnity, unityCanvas } from './unity'

export default function UnityRoot() {
  const location = useLocation()

  const shouldDisplay =
    matchPath('/projects/:projectId', location.pathname) ||
    matchPath('/projects/:projectId/scenes/:sceneId', location.pathname) ||
    matchPath('/stage', location.pathname)

  useEffect(() => {
    if (!shouldDisplay) {
      unityCanvas.classList.add('hidden')
      return
    }

    initUnity({
      arguments: [],
      dataUrl: '/WebGLBuild/Build/WebGLBuild.data',
      frameworkUrl: '/WebGLBuild/Build/WebGLBuild.framework.js',
      codeUrl: '/WebGLBuild/Build/WebGLBuild.wasm',
      streamingAssetsUrl: '/StreamingAssets',
      companyName: 'DefaultCompany',
      productName: 'Illuminote_new',
      productVersion: '0.1.0',
      devicePixelRatio: 1,
      webglContextAttributes: {
        preserveDrawingBuffer: true,
      },
    })
    unityCanvas.classList.remove('hidden')
  }, [shouldDisplay])

  if (!shouldDisplay) {
    return null
  }

  return <div id="unity-container" style={{ display: 'none' }} />
}
