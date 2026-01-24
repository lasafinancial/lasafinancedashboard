'use client'

import { Suspense } from 'react'

interface SplineSceneProps {
  scene: string
  className?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': any;
    }
  }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  if (!scene) return null

  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-secondary/10 rounded-xl">
          <span className="loader border-2 border-primary border-t-transparent rounded-full w-8 h-8 animate-spin"></span>
        </div>
      }
    >
          <div className={className}>
            <div className="w-full h-full overflow-hidden relative">
              <spline-viewer 
                url={scene}
                style={{ 
                  width: '100%', 
                  height: 'calc(100% + 50px)', 
                  marginBottom: '-50px' 
                }}
                loading-anim-type="none"
                hint="pixel-ratio"
              />
            </div>
          </div>
    </Suspense>
  )
}
