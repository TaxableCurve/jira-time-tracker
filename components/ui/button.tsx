import { Button as ButtonPrimitive } from "@base-ui/react/button"
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
        toggle:
          "uppercase tracking-[0.12em] border bg-white/4 text-muted-foreground border-white/7 data-[active=true]:bg-primary/12 data-[active=true]:text-primary data-[active=true]:border-primary/25",
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

interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  isActive?: boolean
}

function Button({ className, variant, size, isActive, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-active={isActive}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
