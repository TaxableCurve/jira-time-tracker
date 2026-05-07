import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded font-mono text-xs font-medium whitespace-nowrap transition-all outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        secondary:
          "bg-white/5 text-muted-foreground border border-white/7 hover:bg-white/8 hover:text-foreground active:scale-[0.98]",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15",
        "destructive-solid":
          "bg-destructive text-white font-semibold hover:bg-destructive/90",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent hover:border-white/8 active:scale-[0.98]",
        icon:
          "bg-white/6 text-[#767680] hover:bg-white/10 hover:text-[#D4D4D0] data-[active=true]:bg-primary/20 data-[active=true]:text-primary data-[active=true]:hover:text-primary",
        toggle:
          "uppercase tracking-[0.12em] border bg-white/4 text-muted-foreground border-white/7 hover:bg-white/8 hover:text-foreground data-[active=true]:bg-primary/12 data-[active=true]:text-primary data-[active=true]:border-primary/25 data-[active=true]:hover:bg-primary/12",
      },
      size: {
        xs: "h-6 px-2 text-[10px]",
        sm: "h-7 px-2.5",
        default: "h-8 px-3 py-1.5",
        lg: "h-9 px-4 py-2",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-xs": "size-6 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

type ButtonProps =
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { as?: "button"; isActive?: boolean })
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof buttonVariants> & { as: "a"; isActive?: boolean })

function Button({ className, variant, size, isActive, as, ...props }: ButtonProps & { as?: "button" | "a" }) {
  const cls = cn(buttonVariants({ variant, size, className }))
  if (as === "a") {
    return <a data-slot="button" data-active={isActive} className={cls} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)} />
  }
  return (
    <button
      data-slot="button"
      data-active={isActive}
      className={cls}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  )
}

export { Button, buttonVariants }
