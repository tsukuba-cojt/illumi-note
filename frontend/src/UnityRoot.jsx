import { useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { initUnity, unityCanvas } from './unity'

export default function UnityRoot() {
  const location = useLocation()

  const shouldDisplay =
    matchPath('/projects/:projectId', location.pathname) ||
    matchPath('/projects/:projectId/scenes/:sceneId', location.pathname)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const unblockFormFieldKeys = (event) => {
      const target = event.target
      if (!target) return

      const isFormField =
        ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
          !target.readOnly &&
          !target.disabled) ||
        (target instanceof HTMLElement && target.isContentEditable)

      if (!isFormField) return

      event.stopImmediatePropagation()
      event.stopPropagation()
    }

    const events = ['keydown', 'keypress', 'keyup']
    events.forEach((type) => {
      window.addEventListener(type, unblockFormFieldKeys, true)
    })

    return () => {
      events.forEach((type) => {
        window.removeEventListener(type, unblockFormFieldKeys, true)
      })
    }
  }, [])

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
    unityCanvas.classList.add('hidden')
  }, [shouldDisplay])

  if (!shouldDisplay) {
    return null
  }

  return <div id="unity-container" style={{ display: 'none' }} />
}
