// Purely decorative — a faint calendar motif filling the empty side margins on wide
// screens. Fixed, behind all content, and inert: it never affects layout or interaction.
function CalendarMotif() {
  return (
    <svg viewBox="0 0 240 480" width="100%" height="100%" fill="none">
      {/* calendar body */}
      <rect x="70" y="48" width="10" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="140" y="48" width="10" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <rect
        x="40"
        y="60"
        width="140"
        height="160"
        rx="14"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line x1="40" y1="96" x2="180" y2="96" stroke="currentColor" strokeWidth="1.5" />

      {/* date grid */}
      <g stroke="currentColor" strokeWidth="1.2">
        <rect x="52" y="110" width="20" height="20" rx="3" />
        <rect x="80" y="110" width="20" height="20" rx="3" fill="currentColor" fillOpacity="0.35" />
        <rect x="108" y="110" width="20" height="20" rx="3" />
        <rect x="136" y="110" width="20" height="20" rx="3" />
        <rect x="52" y="138" width="20" height="20" rx="3" />
        <rect x="80" y="138" width="20" height="20" rx="3" />
        <rect x="108" y="138" width="20" height="20" rx="3" fill="currentColor" fillOpacity="0.35" />
        <rect x="136" y="138" width="20" height="20" rx="3" />
        <rect x="52" y="166" width="20" height="20" rx="3" />
        <rect x="80" y="166" width="20" height="20" rx="3" />
        <rect x="108" y="166" width="20" height="20" rx="3" />
        <rect x="136" y="166" width="20" height="20" rx="3" />
      </g>

      {/* connecting flow lines toward the floating tiles */}
      <path
        className="bg-decoration-flow"
        d="M180 90 C 205 70, 200 45, 195 32"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />
      <path
        className="bg-decoration-flow"
        d="M40 190 C 20 210, 20 240, 30 258"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />

      {/* floating appointment tiles */}
      <g className="bg-decoration-float-a">
        <rect
          x="180"
          y="18"
          width="28"
          height="28"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="currentColor"
          fillOpacity="0.12"
        />
      </g>
      <g className="bg-decoration-float-b">
        <rect
          x="16"
          y="256"
          width="28"
          height="28"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="currentColor"
          fillOpacity="0.12"
        />
      </g>
    </svg>
  );
}

export default function BackgroundDecoration() {
  return (
    <div className="bg-decoration" aria-hidden="true">
      <div className="bg-decoration-shape bg-decoration-left">
        <CalendarMotif />
      </div>
      <div className="bg-decoration-shape bg-decoration-right">
        <CalendarMotif />
      </div>
    </div>
  );
}
