import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive"
  size?: "default" | "icon" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variantClasses = {
      default: "bg-primary text-white hover:bg-primary/90",
      ghost: "hover:bg-muted",
      outline: "border border-border hover:bg-muted",
      destructive: "bg-danger text-white hover:bg-danger/90",
    }
    
    const sizeClasses = {
      default: "h-8 px-4 py-2",
      icon: "h-8 w-8",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
    }
    
    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

