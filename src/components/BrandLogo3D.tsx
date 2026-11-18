interface BrandLogo3DProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
} as const;

export function BrandLogo3D({ size = 'md', className = '' }: BrandLogo3DProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 group ${SIZE_MAP[size]} ${className}`}
      style={{ perspective: '600px' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-xl bg-indigo-500/25 dark:bg-indigo-500/30 blur-md group-hover:blur-lg transition-all duration-300"
      />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(99,102,241,0.38)] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-3"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="vsparkCubeTop" x1="12" y1="8" x2="52" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="55%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="vsparkCubeLeft" x1="8" y1="22" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338CA" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="vsparkCubeRight" x1="56" y1="22" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>
          <linearGradient id="vsparkPulseStroke" x1="20" y1="16" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0E7FF" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
        </defs>

        {/* Isometric Base Cube */}
        <path
          d="M32 6L54 18.7L32 31.4L10 18.7L32 6Z"
          fill="url(#vsparkCubeTop)"
        />
        <path
          d="M10 18.7L32 31.4V57L10 44.3V18.7Z"
          fill="url(#vsparkCubeLeft)"
        />
        <path
          d="M54 18.7L32 31.4V57L54 44.3V18.7Z"
          fill="url(#vsparkCubeRight)"
        />

        {/* Glassmorphic Rim Highlights */}
        <path
          d="M32 6L54 18.7V44.3L32 57L10 44.3V18.7L32 6Z"
          stroke="url(#vsparkPulseStroke)"
          strokeOpacity="0.45"
          strokeWidth="1.25"
        />
        <path
          d="M10 18.7L32 31.4L54 18.7M32 31.4V57"
          stroke="#E0E7FF"
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        {/* Neural Spark & Orbiting Schedule Nodes */}
        <path
          d="M32 13.5L34.4 18.2L39.5 19L35.2 22.1L36.3 26.8L32 24.1L27.7 26.8L28.8 22.1L24.5 19L29.6 18.2L32 13.5Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        <circle cx="21" cy="37" r="2.6" fill="#A5B4FC" />
        <circle cx="43" cy="37" r="2.6" fill="#DDD6FE" />
        <path
          d="M21 37L32 43.5L43 37"
          stroke="#E0E7FF"
          strokeOpacity="0.75"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
