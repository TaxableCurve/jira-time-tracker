import { cn } from "@/lib/utils"
import * as React from "react"

interface PopupContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  positionStyle?: React.CSSProperties
}

const PopupContainer = React.forwardRef<HTMLDivElement, PopupContainerProps>(
  ({ className, positionStyle, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("animate-fade-up rounded-lg overflow-hidden", className)}
        style={{
          ...positionStyle,
          background: "var(--color-surface-2)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopupContainer.displayName = "PopupContainer"

export { PopupContainer }
