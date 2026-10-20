// Homepage hero: the GYAN emblem on a light medallion, with "GYAN INDIA" set along the
// top of the circle, inside softly animated orbit rings.

const CX = 260;
const CY = 282;
const DISC_R = 178;
const TEXT_R = 200; // baseline radius of the arched title

const EMBLEM_W = 318;
const EMBLEM_H = (EMBLEM_W * 858) / 900; // public/brand/gyan-emblem.png aspect ratio

function Sparkle({ x, y, s = 1, className }: { x: number; y: number; s?: number; className?: string }) {
  return (
    <path
      className={className}
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-10L2.4-2.4 10 0 2.4 2.4 0 10-2.4 2.4-10 0-2.4-2.4z"
      fill="#D4A83F"
    />
  );
}

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 520" className={className} role="img" aria-labelledby="hero-art-title">
      <title id="hero-art-title">GYAN India emblem: a graduation cap, golden laurels and an open book</title>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#174EA6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="disc" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F3EEE2" />
        </radialGradient>
        {/* Upper semicircle, drawn left → right so the text reads upright. */}
        <path id="hero-title-arc" d={`M${CX - TEXT_R} ${CY} A${TEXT_R} ${TEXT_R} 0 0 1 ${CX + TEXT_R} ${CY}`} />
      </defs>

      <circle cx={CX} cy={CY - 10} r="250" fill="url(#glow)" />

      {/* Orbits */}
      <g fill="none" stroke="#D4A83F" strokeOpacity="0.28">
        <circle cx={CX} cy={CY} r="238" strokeDasharray="2 7" />
      </g>
      <g className="hero-orbit" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <circle cx={CX + 238} cy={CY} r="5" fill="#D4A83F" />
        <circle cx={CX - 168} cy={CY + 168} r="3.5" fill="#FFFFFF" fillOpacity="0.8" />
      </g>

      {/* Medallion */}
      <circle cx={CX} cy={CY} r={DISC_R + 8} fill="none" stroke="#D4A83F" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r={DISC_R} fill="url(#disc)" />
      <circle cx={CX} cy={CY} r={DISC_R - 7} fill="none" stroke="#D4A83F" strokeOpacity="0.35" />

      <g className="hero-float">
        <image
          href="/brand/gyan-emblem.png"
          x={CX - EMBLEM_W / 2}
          y={CY - EMBLEM_H / 2 + 4}
          width={EMBLEM_W}
          height={EMBLEM_H}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>

      {/* Arched title */}
      <text
        fill="#D4A83F"
        fontFamily="var(--font-jakarta), 'Plus Jakarta Sans', sans-serif"
        fontSize="34"
        fontWeight="800"
        letterSpacing="7"
      >
        <textPath href="#hero-title-arc" startOffset="50%" textAnchor="middle">
          GYAN INDIA
        </textPath>
      </text>

      {/* Sparkles */}
      <Sparkle x={CX - 214} y={98} s={1} className="hero-twinkle" />
      <Sparkle x={CX + 210} y={92} s={0.8} className="hero-twinkle-2" />
      <Sparkle x={CX + 226} y={430} s={0.6} className="hero-twinkle" />
      <Sparkle x={CX - 232} y={400} s={0.55} className="hero-twinkle-2" />
    </svg>
  );
}
