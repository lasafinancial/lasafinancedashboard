import { Play } from "lucide-react";

// Market Times TV reels featuring Dheeraj Sogani. Each card opens the reel on Instagram in a new tab.
// Cover images are saved copies in public/reels/ (Instagram's own image URLs expire).
export const REELS = [
  { id: "Dd6WD01tb_h", title: "MRPL में BIG SHOCK!" },
  { id: "Dd6VWQHtjk5", title: "SUZLON का शेयर टूटा!" },
  { id: "Dd6WmRHNh1P", title: "WIND ENERGY में BIG MOVE!" },
];

export function InstagramReels() {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {REELS.map((reel) => (
        <a
          key={reel.id}
          href={`https://www.instagram.com/reel/${reel.id}/`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch "${reel.title}" on Instagram`}
          className="group relative block aspect-[4/5] rounded-[10px] overflow-hidden border border-white/10 hover:border-pink-500/50 transition-colors bg-white/[0.03]"
        >
          <img
            src={`/reels/${reel.id}.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
          {/* Darken the bottom so the title stays readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          {/* Corner badge (the cover images already carry a centred play button) */}
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 border border-white/30 backdrop-blur-sm group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:via-pink-500 group-hover:to-purple-600 group-hover:border-transparent transition-colors">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </span>
          <span className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 drop-shadow">
            {reel.title}
          </span>
        </a>
      ))}
    </div>
  );
}

export default InstagramReels;
