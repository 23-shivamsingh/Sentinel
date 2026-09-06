import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> { 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; 
  children?: React.ReactNode; 
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2", {
      'border-transparent bg-[#161616] text-[#E4E4E7]': variant === 'default',
      'border-[#27272A] bg-[#111111] text-[#A1A1AA]': variant === 'secondary',
      'border-red-500/20 bg-red-500/10 text-red-400': variant === 'destructive',
      'border-green-500/20 bg-green-500/10 text-green-500': variant === 'success',
      'border-orange-500/20 bg-orange-500/10 text-orange-400': variant === 'warning',
      'text-[#A1A1AA] border-[#27272A]': variant === 'outline',
    }, className)} {...props} />
  )
}
export { Badge }
