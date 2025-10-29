"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { realTimeInference } from "@/lib/real-time-inference"

interface AnomalyData {
  id: number | string
  lat: number
  lng: number
  severity: "high" | "medium" | "low" | "critical"
  type: string
  satellite: string
  timestamp: string
}

export function SatelliteMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyData | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([])
  const [map, setMap] = useState<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix for default markers in Leaflet with Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (mapRef.current && !map) {
        const leafletMap = L.map(mapRef.current, {
          center: [20, 0],
          zoom: 2,
          zoomControl: true,
          attributionControl: false,
        })

        // Dark theme tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: "© OpenStreetMap contributors © CARTO",
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(leafletMap)

        setMap(leafletMap)
      }
    })

    // Load Leaflet CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
    document.head.appendChild(link)

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [map])

  useEffect(() => {
    const updateAnomalies = () => {
      const mapAnomalies = realTimeInference.getAnomaliesForMap()
      const formattedAnomalies: AnomalyData[] = mapAnomalies.map((anomaly) => ({
        id: anomaly.id,
        lat: anomaly.lat,
        lng: anomaly.lng,
        severity: anomaly.severity as "high" | "medium" | "low" | "critical",
        type: anomaly.type,
        satellite: anomaly.satellite,
        timestamp: anomaly.timestamp,
      }))
      setAnomalies(formattedAnomalies)
    }

    // Initial load
    updateAnomalies()

    // Update more frequently (every 5 seconds) for real-time experience
    const interval = setInterval(updateAnomalies, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!map || anomalies.length === 0) return

    import("leaflet").then((L) => {
      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer)
        }
      })

      // Add anomaly markers
      anomalies.forEach((anomaly) => {
        const severityColors = {
          critical: "#dc2626",
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#10b981",
        }

        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              background-color: ${severityColors[anomaly.severity]};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(0,0,0,0.5);
              animation: pulse 2s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        const marker = L.marker([anomaly.lat, anomaly.lng], { icon: customIcon })
          .addTo(map)
          .on("click", () => {
            setSelectedAnomaly(anomaly)
            // Center map on the selected anomaly with a slight zoom
            map.setView([anomaly.lat, anomaly.lng], Math.max(map.getZoom(), 4))
          })

        // Add popup with enhanced anomaly details
        marker.bindPopup(`
          <div style="color: #1e293b; font-family: system-ui;">
            <h3 style="margin: 0 0 8px 0; color: #0f172a; font-weight: bold;">
              ${anomaly.satellite}
            </h3>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Type:</strong> ${anomaly.type}
            </p>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Severity:</strong> 
              <span style="color: ${severityColors[anomaly.severity]}; font-weight: bold;">
                ${anomaly.severity.toUpperCase()}
              </span>
            </p>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Location:</strong> ${anomaly.lat.toFixed(4)}, ${anomaly.lng.toFixed(4)}
            </p>
            <p style="margin: 4px 0; font-size: 14px;">
              <strong>Detected:</strong> ${new Date(anomaly.timestamp).toLocaleString()}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #64748b;">
              <strong>ML Detection:</strong> Confidence ${anomaly.details?.confidence || 'N/A'}%
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #64748b;">
              Click for more details
            </p>
          </div>
        `, { maxWidth: 300 })
      })
    })
  }, [map, anomalies])

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[600px] w-full rounded-lg overflow-hidden" style={{ background: "#0f172a" }} />

      {anomalies.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="text-slate-400 mb-2">🛰️</div>
            <h3 className="text-slate-200 font-medium mb-2">No Anomalies Detected</h3>
            <p className="text-sm text-slate-400">Real-time ML monitoring active - all satellites operating normally</p>
          </div>
        </div>
      )}

      {selectedAnomaly && (
        <div className="absolute top-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-cyan-400">{selectedAnomaly.satellite}</h3>
            <button onClick={() => setSelectedAnomaly(null)} className="text-slate-400 hover:text-slate-200">
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Type:</span>
              <span className="text-sm text-slate-200">{selectedAnomaly.type}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Severity:</span>
              <Badge
                variant={
                  selectedAnomaly.severity === "critical" || selectedAnomaly.severity === "high"
                    ? "destructive"
                    : selectedAnomaly.severity === "medium"
                      ? "default"
                      : "secondary"
                }
              >
                {selectedAnomaly.severity.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Location:</span>
              <span className="text-sm text-slate-200">
                {selectedAnomaly.lat.toFixed(4)}, {selectedAnomaly.lng.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Detected:</span>
              <span className="text-sm text-slate-200">{new Date(selectedAnomaly.timestamp).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Source:</span>
              <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
                ML Detected
              </Badge>
            </div>
            
            {selectedAnomaly.details?.mlScores && (
              <div className="mt-4 bg-slate-800/50 p-3 rounded-md">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm font-medium text-slate-300">ML Model Scores</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Scores from different ML models used for anomaly detection:</p>
                        <ul className="mt-1 list-disc pl-4">
                          <li><strong>Isolation Forest:</strong> Detects anomalies by isolating observations in feature space (0-1)</li>
                          <li><strong>XGBoost:</strong> Gradient boosting model that evaluates trajectory and maneuver patterns (0-1)</li>
                          <li><strong>CNN:</strong> Convolutional neural network analyzing visual and spectral signatures (0-1)</li>
                        </ul>
                        <p className="mt-1">Higher values indicate stronger anomaly signals.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Isolation Forest</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-2 w-2 text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Detects anomalies by isolating observations in orbital parameter space.</p>
                            <p className="mt-1">Effective at identifying satellites with unusual position or velocity.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-slate-200">{selectedAnomaly.details.mlScores.isolationForest}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">XGBoost</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-2 w-2 text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gradient boosting model that evaluates trajectory and maneuver patterns.</p>
                            <p className="mt-1">Specializes in detecting unusual maneuvers or trajectory changes.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-slate-200">{selectedAnomaly.details.mlScores.xgboost}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">CNN</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-2 w-2 text-slate-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Convolutional neural network analyzing visual and spectral signatures.</p>
                            <p className="mt-1">Identifies anomalies in satellite appearance, reflectivity, or emission patterns.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-slate-200">{selectedAnomaly.details.mlScores.cnn}</span>
                  </div>
                </div>
              </div>
            )}
            
            {selectedAnomaly.details?.affectedSystems && (
              <div className="mt-2">
                <span className="text-sm text-slate-400 block mb-1">Affected Systems:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAnomaly.details.affectedSystems.map((system, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-slate-900 border border-slate-700 rounded-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-slate-300">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-300">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-slate-300">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-300">Low Priority</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Live ML Detection Active</span>
        </div>
      </div>
    </div>
  )
}
