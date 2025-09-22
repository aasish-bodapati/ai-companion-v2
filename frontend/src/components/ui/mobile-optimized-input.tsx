import * as React from "react"
import { cn } from "@/lib/utils"

export interface MobileOptimizedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const MobileOptimizedInput = React.forwardRef<HTMLInputElement, MobileOptimizedInputProps>(
  ({ className, type, label, error, helpText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] touch-manipulation",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
        )}
      </div>
    )
  }
)
MobileOptimizedInput.displayName = "MobileOptimizedInput"

export { MobileOptimizedInput }
