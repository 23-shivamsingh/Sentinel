import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'; size?: 'default' | 'sm' | 'lg' | 'icon'; }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#27272A] disabled:pointer-events-none disabled:opacity-50", {
      'bg-blue-600 text-white hover:bg-blue-500 border-0': variant === 'default',
      'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20': variant === 'destructive',
      'border border-[#27272A] bg-transparent hover:bg-[#161616] text-[#E4E4E7]': variant === 'outline',
      'bg-[#161616] text-[#E4E4E7] hover:bg-[#27272A] border border-[#27272A]': variant === 'secondary',
      'hover:bg-[#161616] hover:text-[#E4E4E7] text-[#A1A1AA]': variant === 'ghost',
      'text-blue-400 underline-offset-4 hover:underline': variant === 'link',
      'h-9 px-4 py-2': size === 'default',
      'h-8 rounded-md px-3 text-xs': size === 'sm',
      'h-10 rounded-md px-8': size === 'lg',
      'h-9 w-9': size === 'icon',
    }, className)} {...props} />
  )
})
Button.displayName = "Button"
export { Button }
