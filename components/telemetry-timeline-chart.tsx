"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Area, ComposedChart } from "recharts"

interface TelemetryDataPoint {
  name: string
  power: number
  temperature: number
  communication: number
  voltage: number
  solarPanelEfficiency: number
  attitudeControl: number
  fuelLevel: number
}

interface TelemetryTimelineChartProps {
  data?: TelemetryDataPoint[]
  satelliteName?: string
}

export function TelemetryTimelineChart({ data = [], satelliteName = "Satellite" }: TelemetryTimelineChartProps) {
  const [chartData, setChartData] = useState<TelemetryDataPoint[]>([])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["power", "temperature", "communication"])

  useEffect(() => {
    if (data.length > 0) {
      setChartData(data)
    } else {
      // Generate mock data if none provided
      const mockData: TelemetryDataPoint[] = []
      const now = new Date()
      
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() - (23 - i) * 30 * 60000)
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        
        mockData.push({
          name: timeStr,
          power: 75 + Math.sin(i / 3) * 15 + Math.random() * 5,
          temperature: 22 + Math.cos(i / 4) * 8 + Math.random() * 2,
          communication: 90 + Math.sin(i / 2) * 8 + Math.random() * 3,
          voltage: 11.5 + Math.sin(i / 5) * 1 + Math.random() * 0.5,
          solarPanelEfficiency: 85 + Math.cos(i / 6) * 10 + Math.random() * 3,
          attitudeControl: 95 + Math.sin(i / 8) * 4 + Math.random() * 1,
          fuelLevel: 72 - i * 0.2 + Math.random() * 0.5,
        })
      }
      
      setChartData(mockData)
    }
  }, [data])

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric))
    } else {
      setSelectedMetrics([...selectedMetrics, metric])
    }
  }

  const metricColors: Record<string, string> = {
    power: "#4ade80", // green
    temperature: "#f87171", // red
    communication: "#60a5fa", // blue
    voltage: "#facc15", // yellow
    solarPanelEfficiency: "#c084fc", // purple
    attitudeControl: "#fb923c", // orange
    fuelLevel: "#94a3b8", // slate
  }

  const metricLabels: Record<string, string> = {
    power: "Power (%)",
    temperature: "Temperature (°C)",
    communication: "Comms Signal (%)",
    voltage: "Voltage (V)",
    solarPanelEfficiency: "Solar Panel (%)",
    attitudeControl: "Attitude Control (%)",
    fuelLevel: "Fuel Level (%)",
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 text-white w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Telemetry Timeline</CardTitle>
          <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
            Live Data
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          Historical telemetry data for {satelliteName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(metricLabels).map(([key, label]) => (
            <Badge 
              key={key}
              variant={selectedMetrics.includes(key) ? "default" : "outline"}
              className={`cursor-pointer ${selectedMetrics.includes(key) ? `bg-${metricColors[key].replace('#', '')}` : 'bg-transparent'}`}
              style={{
                backgroundColor: selectedMetrics.includes(key) ? metricColors[key] : 'transparent',
                borderColor: metricColors[key],
                color: selectedMetrics.includes(key) ? '#000' : metricColors[key],
                opacity: selectedMetrics.includes(key) ? 1 : 0.7
              }}
              onClick={() => toggleMetric(key)}
            >
              {label}
            </Badge>
          ))}
        </div>

        <div className="h-[300px] w-full">
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  {Object.entries(metricColors).map(([key, color]) => (
                    <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }} 
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8' }} 
                  tickLine={{ stroke: '#475569' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-md">
                          <p className="text-slate-300 font-medium mb-1">{label}</p>
                          {payload
                            .filter(entry => selectedMetrics.includes(entry.dataKey as string))
                            .map((entry, index) => (
                              <div key={`item-${index}`} className="flex justify-between gap-4">
                                <span style={{ color: entry.color }}>
                                  {metricLabels[entry.dataKey as string]}:
                                </span>
                                <span className="text-slate-300 font-medium">
                                  {entry.value?.toFixed(2)}
                                </span>
                              </div>
                            ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  content={() => null} // Hide default legend since we have custom badges
                />
                
                {selectedMetrics.includes('power') && (
                  <Line 
                    type="monotone" 
                    dataKey="power" 
                    stroke={metricColors.power} 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6, stroke: metricColors.power, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
                
                {selectedMetrics.includes('temperature') && (
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke={metricColors.temperature} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: metricColors.temperature, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
                
                {selectedMetrics.includes('communication') && (
                  <Line 
                    type="monotone" 
                    dataKey="communication" 
                    stroke={metricColors.communication} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: metricColors.communication, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
                
                {selectedMetrics.includes('voltage') && (
                  <Line 
                    type="monotone" 
                    dataKey="voltage" 
                    stroke={metricColors.voltage} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: metricColors.voltage, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
                
                {selectedMetrics.includes('solarPanelEfficiency') && (
                  <Line 
                    type="monotone" 
                    dataKey="solarPanelEfficiency" 
                    stroke={metricColors.solarPanelEfficiency} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: metricColors.solarPanelEfficiency, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
                
                {selectedMetrics.includes('attitudeControl') && (
                  <Line 
                    type="monotone" 
                    dataKey="attitudeControl" 
                    stroke={metricColors.attitudeControl} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: metricColors.attitudeControl, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
                
                {selectedMetrics.includes('fuelLevel') && (
                  <Line 
                    type="monotone" 
                    dataKey="fuelLevel" 
                    stroke={metricColors.fuelLevel} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: metricColors.fuelLevel, strokeWidth: 2, fill: '#1e293b' }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        <div className="mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Real-time telemetry updates every 30 seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}