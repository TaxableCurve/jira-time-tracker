import { cn } from "@/lib/utils"
import * as React from "react"

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full font-mono text-xs px-2.5 py-1.5 rounded outline-none",
        "bg-white/5 border border-white/8 text-foreground",
        "placeholder:text-muted-foreground/50",
        "transition-all duration-150",
        "focus:border-primary/40 focus:bg-primary/[0.03]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
