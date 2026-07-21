import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"

import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/libs/utils"
import { cloneElement, isValidElement, type ReactElement } from "react"

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }))
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, { className: cn(classes, child.props.className) })
  }
  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      {...props}
    >{children}</ButtonPrimitive>
  )
}

export { Button }
