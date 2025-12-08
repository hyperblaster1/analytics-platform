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
      default: "bg-blue-600 text-white hover:bg-blue-700",
      ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
      outline: "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
      destructive: "bg-red-600 text-white hover:bg-red-700",
    }
    
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      icon: "h-10 w-10",
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

