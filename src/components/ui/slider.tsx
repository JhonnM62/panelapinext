"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  className?: string
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, max = 100, min = 0, step = 1, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [parseInt(e.target.value, 10)]
      onValueChange?.(newValue)
    }

    return (
      <div className={cn("relative flex w-full items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || 0}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            // Webkit styles
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
            "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500",
            "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
            "[&::-webkit-slider-track]:bg-gray-200 [&::-webkit-slider-track]:rounded-lg [&::-webkit-slider-track]:h-2",
            // Firefox styles
            "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5",
            "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0",
            "[&::-moz-range-track]:bg-gray-200 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:h-2"
          )}
          {...props}
        />
        <div className="ml-3 text-sm text-gray-600 min-w-[3rem] text-right">
          {value[0]}
        </div>
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
