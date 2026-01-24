'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { Testimonials } from "@/components/ui/twitter-testimonial-cards"

export function InteractiveHero() {
  return (
<Card className="w-full h-auto min-h-[400px] bg-card/40 backdrop-blur-xl relative overflow-hidden border border-border/50 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
<Spotlight
className="-top-40 left-0 md:left-60 md:-top-20"
fill="white"
/>

<div className="flex h-full flex-col lg:flex-row">
{/* Left content: Testimonials */}
<div className="flex-1 p-8 relative z-10 flex flex-col justify-center items-center lg:items-start bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-8 text-center lg:text-left">
      Trusted by the LASA Community
    </h2>
<div className="scale-75 sm:scale-90 md:scale-100 flex items-center justify-center lg:justify-start w-full">
<Testimonials />
</div>
</div>

  {/* Right content: Robot Spline */}
  <div className="flex-1 p-8 relative min-h-[450px] flex flex-col justify-center overflow-visible">
    <div className="flex-1 relative min-h-[350px] overflow-visible">
      <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
      className="w-full h-full transform scale-[1.6] origin-center"
      />
    </div>
  </div>
</div>
</Card>
  )
}
