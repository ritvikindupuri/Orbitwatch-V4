"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Area, ComposedChart } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { generateSatelliteTrajectoryData } from "@/lib/sgp4-utils"

interface TrajectoryPoint {
  time: string;
  altitude: number;
  latitude: number;
  longitude: number;
  velocity: number;
}

interface TrajectoryPredictionProps {
  satelliteName: string;
  noradId: number;
  currentAltitude: number;
  currentVelocity: number;
  inclination: number;
  period: number;
  refreshInterval?: number;
}

export function TrajectoryPrediction({
  satelliteName,
  noradId,
  currentAltitude,
  currentVelocity,
  inclination,
  period,
  refreshInterval = 30000,
}: TrajectoryPredictionProps) {
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>([])
  const [historicalData, setHistoricalData] = useState<TrajectoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Generate trajectory data using SGP4 propagator
  const generateTrajectoryData = () => {
    setIsLoading(true)
    
    try {
      // Use the SGP4 utility to generate trajectory data
      const { historicalData, futureData } = generateSatelliteTrajectoryData(
        noradId,
        inclination,
        period,
        24, // past hours
        24, // future hours
        6   // points per hour
      )
      
      setHistoricalData(historicalData)
      setTrajectoryData(futureData)
    } catch (error) {
      console.error("Error generating trajectory data:", error)
      
      // Fallback to simplified model if SGP4 calculation fails
      const historical: TrajectoryPoint[] = []
      const future: TrajectoryPoint[] = []
      const now = new Date()
      
      // Generate simplified historical data
      for (let i = 24; i >= 0; i--) {
        const timePoint = new Date(now.getTime() - i * 3600 * 1000)
        historical.push({
          time: timePoint.toISOString(),
          altitude: currentAltitude + (Math.sin(i / 4) * 5),
          latitude: (Math.sin(i / 12 * Math.PI) * inclination / 2),
          longitude: ((i * 15) % 360) - 180,
          velocity: currentVelocity + (Math.cos(i / 4) * 0.2),
        })
      }
      
      // Generate simplified future data
      for (let i = 0; i <= 24; i++) {
        const timePoint = new Date(now.getTime() + i * 3600 * 1000)
        future.push({
          time: timePoint.toISOString(),
          altitude: currentAltitude - (i * 0.01) + (Math.sin(i / 6) * 3),
          latitude: (Math.sin((i + 24) / 12 * Math.PI) * inclination / 2),
          longitude: (((i + 24) * 15) % 360) - 180,
          velocity: currentVelocity - (i * 0.01 * 0.01),
        })
      }
      
      setHistoricalData(historical)
      setTrajectoryData(future)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    generateTrajectoryData()
    
    // Refresh data periodically if refreshInterval is provided
    if (refreshInterval > 0) {
      const interval = setInterval(generateTrajectoryData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [satelliteName, noradId, currentAltitude, currentVelocity, inclination, period, refreshInterval])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-300">SGP4 Trajectory Prediction</h4>
        <Badge variant="outline" className="text-xs">
          NORAD ID: {noradId}
        </Badge>
      </div>
      
      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center bg-slate-800/40 rounded-lg">
          <div className="text-slate-400 text-sm">Loading trajectory data...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Altitude Prediction Chart */}
          <div className="bg-slate-800/40 rounded-lg p-3">
            <h5 className="text-sm font-medium text-slate-300 mb-2">Altitude Prediction</h5>
            <ChartContainer className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[...historicalData, ...trajectoryData]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickFormatter={formatDate} 
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    domain={['auto', 'auto']}
                    label={{ value: 'Altitude (km)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as TrajectoryPoint
                        const isHistorical = historicalData.some(point => point.time === data.time)
                        
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs">
                            <p className="text-slate-200 font-medium">{new Date(data.time).toLocaleString()}</p>
                            <p className="text-cyan-400">Altitude: {data.altitude.toFixed(2)} km</p>
                            <p className="text-slate-300">Velocity: {data.velocity.toFixed(2)} km/s</p>
                            <p className="text-slate-300">Lat: {data.latitude.toFixed(2)}° Lon: {data.longitude.toFixed(2)}°</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {isHistorical ? "Historical" : "Predicted"}
                            </Badge>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="altitude" 
                    stroke="#0ea5e9" 
                    fill="#0ea5e9" 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#0ea5e9" }}
                    name="Altitude"
                  />
                  {/* Divider line between historical and predicted data */}
                  <Line 
                    type="monotone" 
                    dataKey={() => currentAltitude} 
                    stroke="#f59e0b" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                    dot={false}
                    activeDot={false}
                    name="Current"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          {/* Trajectory Statistics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/40 rounded-lg p-3">
              <h5 className="text-sm font-medium text-slate-300 mb-2">Orbital Decay</h5>
              <div className="text-2xl font-bold text-cyan-400">
                {(trajectoryData[trajectoryData.length - 1].altitude - currentAltitude).toFixed(2)} km
              </div>
              <div className="text-xs text-slate-400 mt-1">Projected over next 24 hours</div>
            </div>
            
            <div className="bg-slate-800/40 rounded-lg p-3">
              <h5 className="text-sm font-medium text-slate-300 mb-2">Velocity Change</h5>
              <div className="text-2xl font-bold text-cyan-400">
                {(trajectoryData[trajectoryData.length - 1].velocity - currentVelocity).toFixed(2)} km/s
              </div>
              <div className="text-xs text-slate-400 mt-1">Projected over next 24 hours</div>
            </div>
          </div>
          
          {/* Historical Data Summary */}
          <div className="bg-slate-800/40 rounded-lg p-3">
            <h5 className="text-sm font-medium text-slate-300 mb-2">Historical Data Summary</h5>
            <div className="text-xs text-slate-400">
              <p>Data points: {historicalData.length}</p>
              <p>Time range: {new Date(historicalData[0].time).toLocaleDateString()} - {new Date(historicalData[historicalData.length - 1].time).toLocaleDateString()}</p>
              <p>Altitude range: {Math.min(...historicalData.map(d => d.altitude)).toFixed(2)} - {Math.max(...historicalData.map(d => d.altitude)).toFixed(2)} km</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}