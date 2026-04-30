import { cn } from "@/lib/utils"
import * as React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string
}

/** Issue key badge with dynamic project color */
function Badge({ children, color, className, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center font-mono text-[10px] px-1 py-0.5 rounded-sm whitespace-nowrap flex-shrink-0", className)}
      style={color ? { background: `${color}18`, color, ...style } : style}
      {...props}
    >
      {children}
    </span>
  )
}

/** Amber/primary tinted badge — for issue keys in popup headers */
function AmberBadge({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary", className)}
      {...props}
    >
      {children}
    </span>
  )
}

/** Formatted time/duration badge */
function TimeBadge({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-mono text-xs tabular-nums px-2 py-0.5 rounded bg-primary/12 text-primary", className)}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge, AmberBadge, TimeBadge }
