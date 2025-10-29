"use client"

interface ChartContainerProps {
  children: React.ReactNode
}

export function ChartContainer({ children }: ChartContainerProps) {
  return (
    <div className="w-full h-full">
      {children}
    </div>
  )
}

interface ChartTooltipProps {
  children: React.ReactNode
}

export function ChartTooltip({ children }: ChartTooltipProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-md">
      {children}
    </div>
  )
}