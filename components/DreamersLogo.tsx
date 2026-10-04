export default function DreamersLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 250"
      className={className}
      role="img"
      aria-label="Dreamers Matthew 28:19-20"
    >
      <g transform="rotate(-9 260 125)">
        <polygon
          points="104,170 108,46 168,46 410,112 414,188 104,188"
          fill="#d35185"
        />
        <polygon points="40,96 112,90 118,168 46,176" fill="#a0d096" transform="rotate(8 80 130)" />
        <polygon points="316,150 400,96 462,104 400,192 322,192" fill="#8891c3" />
        <circle cx="448" cy="92" r="40" fill="#f6e25a" />
        <circle cx="480" cy="128" r="9" fill="#f6e25a" />
        <circle cx="496" cy="146" r="6" fill="#f6e25a" />
        <g
          fill="#000"
          style={{ fontFamily: "var(--font-point), sans-serif" }}
          fontSize="80"
        >
          <text x="52" y="160">D</text>
          <text x="112" y="150" fontSize="68" textLength="190" lengthAdjust="spacingAndGlyphs">ream</text>
          <text x="318" y="182" fontSize="60" textLength="70" lengthAdjust="spacingAndGlyphs">er</text>
          <text x="428" y="112" fontSize="62">s</text>
        </g>
        <text
          x="140"
          y="214"
          fontSize="15"
          fontWeight="700"
          fill="#dbdad7"
          letterSpacing="2"
          transform="rotate(-2 140 214)"
        >
          Matthew 28:19-20
        </text>
      </g>
    </svg>
  );
}
