"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TelemetryGaugeProps {
  value: number
  label: string
  min?: number
  max?: number
  unit?: string
  thresholds?: {
    warning: number
    critical: number
  }
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function TelemetryGauge({
  value,
  label,
  min = 0,
  max = 100,
  unit = "",
  thresholds = { warning: 30, critical: 15 },
  size = 'md',
  animate = true
}: TelemetryGaugeProps) {
  const [currentValue, setCurrentValue] = useState(0)
  
  useEffect(() => {
    if (animate) {
      // Animate the gauge value
      const duration = 1000 // ms
      const startTime = Date.now()
      const startValue = currentValue
      
      const animateValue = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease out
        
        const newValue = startValue + (value - startValue) * easedProgress
        setCurrentValue(newValue)
        
        if (progress < 1) {
          requestAnimationFrame(animateValue)
        }
      }
      
      requestAnimationFrame(animateValue)
    } else {
      setCurrentValue(value)
    }
  }, [value, animate])
  
  // Calculate percentage for the gauge
  const percentage = Math.max(0, Math.min(100, ((currentValue - min) / (max - min)) * 100))
  
  // Determine color based on thresholds
  const getColor = () => {
    const normalizedValue = (currentValue - min) / (max - min) * 100
    const normalizedWarning = (thresholds.warning - min) / (max - min) * 100
    const normalizedCritical = (thresholds.critical - min) / (max - min) * 100
    
    if (normalizedValue <= normalizedCritical) return "#ef4444" // red-500
    if (normalizedValue <= normalizedWarning) return "#f97316" // orange-500
    return "#10b981" // emerald-500
  }
  
  // Size classes
  const sizeClasses = {
    sm: {
      container: "w-24 h-24",
      value: "text-xl",
      label: "text-xs"
    },
    md: {
      container: "w-32 h-32",
      value: "text-2xl",
      label: "text-sm"
    },
    lg: {
      container: "w-40 h-40",
      value: "text-3xl",
      label: "text-base"
    }
  }
  
  // SVG parameters
  const radius = 40
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className={`relative ${sizeClasses[size].container} flex flex-col items-center justify-center`}>
      <svg
        className="absolute top-0 left-0 transform -rotate-90"
        height="100%"
        width="100%"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        {/* Background circle */}
        <circle
          stroke="#1e293b" // slate-800
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Gauge progress */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      <div className="flex flex-col items-center justify-center z-10">
        <div className={`${sizeClasses[size].value} font-bold text-white`}>
          {currentValue.toFixed(1)}{unit}
        </div>
        <div className={`${sizeClasses[size].label} text-slate-400 mt-1`}>
          {label}
        </div>
      </div>
    </div>
  )
}

interface TelemetryGaugeCardProps {
  title: string
  description?: string
  gauges: Array<{
    value: number
    label: string
    min?: number
    max?: number
    unit?: string
    thresholds?: {
      warning: number
      critical: number
    }
  }>
}

export function TelemetryGaugeCard({ title, description, gauges }: TelemetryGaugeCardProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 text-white w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{title}</CardTitle>
          <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
            Live Data
          </Badge>
        </div>
        {description && (
          <CardDescription className="text-slate-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-4">
          {gauges.map((gauge, index) => (
            <TelemetryGauge
              key={index}
              value={gauge.value}
              label={gauge.label}
              min={gauge.min}
              max={gauge.max}
              unit={gauge.unit}
              thresholds={gauge.thresholds}
              size="md"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}