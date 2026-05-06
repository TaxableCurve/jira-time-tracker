interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 24, className }: LogoMarkProps) {
  const id = `logo-glow-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className}>
      <defs>
        <filter id={id}>
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Outer track */}
      <circle cx="60" cy="60" r="38" stroke="rgba(6,182,212,0.12)" strokeWidth="2.5"/>
      {/* Outer arc 270° */}
      <circle cx="60" cy="60" r="38" stroke="#06B6D4" strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="239"
        strokeDashoffset="60"
        transform="rotate(-225 60 60)" />
      {/* Inner track */}
      <circle cx="60" cy="60" r="24" stroke="rgba(6,182,212,0.08)" strokeWidth="2"/>
      {/* Inner arc 180° */}
      <circle cx="60" cy="60" r="24" stroke="#06B6D4" strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="150"
        strokeDashoffset="75"
        opacity="0.5"
        transform="rotate(-180 60 60)" />
      {/* End dot */}
      <circle cx="87" cy="33" r="5.5" fill="#06B6D4" filter={`url(#${id})`}/>
      <circle cx="87" cy="33" r="2" fill="#0C0C0E"/>
    </svg>
  )
}
