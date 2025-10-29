"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TelemetryTimelineChart } from "./telemetry-timeline-chart"
import { TelemetryGaugeCard } from "./telemetry-gauge"
import { Activity, BarChart2, Cpu, Thermometer, Battery, Zap, Compass, Droplet } from "lucide-react"

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

interface TelemetryDashboardProps {
  telemetryData?: TelemetryDataPoint[]
  satelliteName?: string
  refreshInterval?: number
}

export function TelemetryDashboard({ 
  telemetryData = [], 
  satelliteName = "Satellite",
  refreshInterval = 30000 
}: TelemetryDashboardProps) {
  const [data, setData] = useState<TelemetryDataPoint[]>([])
  const [currentValues, setCurrentValues] = useState({
    power: 0,
    temperature: 0,
    communication: 0,
    voltage: 0,
    solarPanelEfficiency: 0,
    attitudeControl: 0,
    fuelLevel: 0
  })

  useEffect(() => {
    // Initialize with provided data or generate mock data
    if (telemetryData.length > 0) {
      setData(telemetryData)
      // Set current values from the latest data point
      const latest = telemetryData[telemetryData.length - 1]
      setCurrentValues({
        power: latest.power,
        temperature: latest.temperature,
        communication: latest.communication,
        voltage: latest.voltage,
        solarPanelEfficiency: latest.solarPanelEfficiency,
        attitudeControl: latest.attitudeControl,
        fuelLevel: latest.fuelLevel
      })
    } else {
      generateMockData()
    }

    // Set up refresh interval
    const intervalId = setInterval(() => {
      if (telemetryData.length === 0) {
        // Only update mock data if real data wasn't provided
        updateMockData()
      }
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [telemetryData, refreshInterval])

  const generateMockData = () => {
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
    
    setData(mockData)
    
    // Set current values from the latest data point
    const latest = mockData[mockData.length - 1]
    setCurrentValues({
      power: latest.power,
      temperature: latest.temperature,
      communication: latest.communication,
      voltage: latest.voltage,
      solarPanelEfficiency: latest.solarPanelEfficiency,
      attitudeControl: latest.attitudeControl,
      fuelLevel: latest.fuelLevel
    })
  }

  const updateMockData = () => {
    const newData = [...data]
    
    // Remove oldest data point
    if (newData.length > 0) {
      newData.shift()
    }
    
    // Add new data point
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    // Generate new values with small variations from previous values
    const prev = newData[newData.length - 1] || {
      power: 85,
      temperature: 25,
      communication: 95,
      voltage: 12,
      solarPanelEfficiency: 90,
      attitudeControl: 98,
      fuelLevel: 70
    }
    
    const newPoint: TelemetryDataPoint = {
      name: timeStr,
      power: Math.max(0, Math.min(100, prev.power + (Math.random() - 0.5) * 5)),
      temperature: Math.max(-10, Math.min(50, prev.temperature + (Math.random() - 0.5) * 2)),
      communication: Math.max(0, Math.min(100, prev.communication + (Math.random() - 0.5) * 3)),
      voltage: Math.max(8, Math.min(14, prev.voltage + (Math.random() - 0.5) * 0.3)),
      solarPanelEfficiency: Math.max(0, Math.min(100, prev.solarPanelEfficiency + (Math.random() - 0.5) * 4)),
      attitudeControl: Math.max(0, Math.min(100, prev.attitudeControl + (Math.random() - 0.5) * 2)),
      fuelLevel: Math.max(0, Math.min(100, prev.fuelLevel - 0.05 + (Math.random() - 0.5) * 0.1)),
    }
    
    newData.push(newPoint)
    setData(newData)
    
    // Update current values
    setCurrentValues({
      power: newPoint.power,
      temperature: newPoint.temperature,
      communication: newPoint.communication,
      voltage: newPoint.voltage,
      solarPanelEfficiency: newPoint.solarPanelEfficiency,
      attitudeControl: newPoint.attitudeControl,
      fuelLevel: newPoint.fuelLevel
    })
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 text-white w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <CardTitle className="text-lg text-white">Telemetry Dashboard</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
            Live Data
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          Real-time telemetry monitoring for {satelliteName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <BarChart2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="power">
              <Zap className="h-4 w-4 mr-2" />
              Power Systems
            </TabsTrigger>
            <TabsTrigger value="sensors">
              <Cpu className="h-4 w-4 mr-2" />
              Sensors & Control
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4 space-y-4">
            <TelemetryTimelineChart data={data} satelliteName={satelliteName} />
          </TabsContent>
          
          <TabsContent value="power" className="mt-4 space-y-4">
            <TelemetryGaugeCard
              title="Power Systems"
              description="Current power system telemetry readings"
              gauges={[
                {
                  value: currentValues.power,
                  label: "Power",
                  unit: "%",
                  thresholds: { warning: 40, critical: 20 }
                },
                {
                  value: currentValues.voltage,
                  label: "Voltage",
                  min: 8,
                  max: 14,
                  unit: "V",
                  thresholds: { warning: 10, critical: 9 }
                },
                {
                  value: currentValues.solarPanelEfficiency,
                  label: "Solar Panel",
                  unit: "%",
                  thresholds: { warning: 50, critical: 30 }
                },
              ]}
            />
            
            <div className="bg-slate-800/40 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-slate-300 mb-3">Power System Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Battery className="h-4 w-4 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300">Battery Health: Excellent</p>
                    <p className="text-slate-400 text-xs">Estimated 8.5 years remaining lifespan</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300">Power Consumption: {(currentValues.power * 0.85).toFixed(1)} W</p>
                    <p className="text-slate-400 text-xs">Within normal operational parameters</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sensors" className="mt-4 space-y-4">
            <TelemetryGaugeCard
              title="Sensors & Control Systems"
              description="Current sensor and control system readings"
              gauges={[
                {
                  value: currentValues.temperature,
                  label: "Temperature",
                  min: -10,
                  max: 50,
                  unit: "°C",
                  thresholds: { warning: 35, critical: 40 }
                },
                {
                  value: currentValues.communication,
                  label: "Comms",
                  unit: "%",
                  thresholds: { warning: 60, critical: 40 }
                },
                {
                  value: currentValues.attitudeControl,
                  label: "Attitude",
                  unit: "%",
                  thresholds: { warning: 70, critical: 50 }
                },
                {
                  value: currentValues.fuelLevel,
                  label: "Fuel",
                  unit: "%",
                  thresholds: { warning: 30, critical: 15 }
                },
              ]}
            />
            
            <div className="bg-slate-800/40 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-slate-300 mb-3">Sensor System Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Thermometer className="h-4 w-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300">Thermal Regulation: {currentValues.temperature < 30 ? 'Nominal' : 'Active Cooling'}</p>
                    <p className="text-slate-400 text-xs">Operating within safe temperature range</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Compass className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300">Attitude Adjustments: {(Math.random() * 5).toFixed(1)} per orbit</p>
                    <p className="text-slate-400 text-xs">Last adjustment: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Droplet className="h-4 w-4 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-slate-300">Fuel Consumption Rate: {(0.05 + Math.random() * 0.02).toFixed(3)}% per day</p>
                    <p className="text-slate-400 text-xs">Estimated {Math.floor(currentValues.fuelLevel / (0.05 + Math.random() * 0.02))} days remaining</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}