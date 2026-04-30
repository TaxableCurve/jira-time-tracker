import { cn } from "@/lib/utils"
import * as React from "react"

type Tag = "p" | "h1" | "h2" | "h3" | "h4" | "span"

interface SectionLabelProps extends React.HTMLAttributes<HTMLElement> {
  as?: Tag
}

function SectionLabel({ as: Tag = "p", children, className, ...props }: SectionLabelProps) {
  return (
    <Tag
      className={cn("font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground", className)}
      {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
    >
      {children}
    </Tag>
  )
}

function FieldLabel({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5", className)}
      {...props}
    >
      {children}
    </label>
  )
}

export { SectionLabel, FieldLabel }
