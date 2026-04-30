import { cn } from "@/lib/utils"
import * as React from "react"

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg bg-white/3 border border-white/6", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card }
