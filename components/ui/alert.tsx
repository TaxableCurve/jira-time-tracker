import { cn } from "@/lib/utils"
import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: "error" | "success"
}

const variants = {
  error: "text-destructive bg-destructive/8 border-destructive/20",
  success: "text-green-500 bg-green-500/8 border-green-500/20",
}

function Alert({ variant, children, className, ...props }: AlertProps) {
  return (
    <div
      className={cn("font-mono text-xs px-3 py-2 rounded border", variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Alert }
