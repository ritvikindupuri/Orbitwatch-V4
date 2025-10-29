// Space-Track.org API Integration for Satellite Data

// Define the satellite telemetry data structure
export interface SatelliteTelemetry {
  temperature: number;
  power: number;
  communication: number;
  signalStrength?: number;
  fuelLevel?: number;
  attitudeControl?: number;
  orbitDeviation?: number;
}

// Define the satellite data structure
export interface SatelliteData {
  id: string;
  name: string;
  noradId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  inclination: number;
  eccentricity: number;
  period: number;
  type: string; // Payload object type
  country: string;
  launchDate: string;
  status: "operational" | "non-operational" | "unknown";
  telemetry: SatelliteTelemetry;
  lastUpdated: string;
}

// Mock satellite data for development
const mockSatellites: SatelliteData[] = [
  {
    id: "sat-1",
    name: "Hubble Space Telescope",
    noradId: 20580,
    latitude: 28.5,
    longitude: -80.5,
    altitude: 540,
    velocity: 7.5,
    inclination: 28.5,
    eccentricity: 0.00023,
    period: 95.42,
    type: "Space Telescope",
    country: "USA",
    launchDate: "1990-04-24",
    status: "operational",
    telemetry: {
      temperature: 85,
      power: 92,
      communication: 98,
      signalStrength: 95,
      fuelLevel: 65,
      attitudeControl: 99,
      orbitDeviation: 0.02
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "sat-2",
    name: "International Space Station",
    noradId: 25544,
    latitude: 51.6,
    longitude: -40.2,
    altitude: 408,
    velocity: 7.66,
    inclination: 51.64,
    eccentricity: 0.0004,
    period: 92.68,
    type: "Space Station",
    country: "International",
    launchDate: "1998-11-20",
    status: "operational",
    telemetry: {
      temperature: 72,
      power: 95,
      communication: 99,
      signalStrength: 98,
      fuelLevel: 78,
      attitudeControl: 97,
      orbitDeviation: 0.01
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "sat-3",
    name: "GPS IIR-21",
    noradId: 35752,
    latitude: 55.0,
    longitude: -115.3,
    altitude: 20180,
    velocity: 3.87,
    inclination: 55.0,
    eccentricity: 0.0048,
    period: 718.0,
    type: "Navigation Satellite",
    country: "USA",
    launchDate: "2009-08-17",
    status: "operational",
    telemetry: {
      temperature: 68,
      power: 88,
      communication: 96,
      signalStrength: 92,
      fuelLevel: 82,
      attitudeControl: 98,
      orbitDeviation: 0.03
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "sat-4",
    name: "GOES-16",
    noradId: 41866,
    latitude: 0.0,
    longitude: -75.0,
    altitude: 35786,
    velocity: 3.07,
    inclination: 0.0,
    eccentricity: 0.0001,
    period: 1436.0,
    type: "Weather Satellite",
    country: "USA",
    launchDate: "2016-11-19",
    status: "operational",
    telemetry: {
      temperature: 70,
      power: 90,
      communication: 97,
      signalStrength: 94,
      fuelLevel: 85,
      attitudeControl: 99,
      orbitDeviation: 0.01
    },
    lastUpdated: new Date().toISOString()
  },
  {
    id: "sat-5",
    name: "Sentinel-2A",
    noradId: 40697,
    latitude: -5.2,
    longitude: 130.4,
    altitude: 786,
    velocity: 7.44,
    inclination: 98.62,
    eccentricity: 0.0001,
    period: 100.6,
    type: "Earth Observation Satellite",
    country: "EU",
    launchDate: "2015-06-23",
    status: "operational",
    telemetry: {
      temperature: 75,
      power: 93,
      communication: 95,
      signalStrength: 91,
      fuelLevel: 79,
      attitudeControl: 98,
      orbitDeviation: 0.02
    },
    lastUpdated: new Date().toISOString()
  }
];

// Function to fetch satellite positions from Space-Track.org API
export async function fetchSatellitePositions(): Promise<SatelliteData[]> {
  // Check if we have Space-Track credentials
  const credentials = getSpaceTrackCredentials();
  
  // If we have credentials, make a real API call to Space-Track.org
  if (credentials) {
    console.log("Space-Track credentials found. Making real API call.");
    try {
      // Authenticate with Space-Track.org
      const authResponse = await fetch('https://www.space-track.org/ajaxauth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `identity=${encodeURIComponent(credentials.username)}&password=${encodeURIComponent(credentials.password)}`,
        credentials: 'include' // This is important for cookie-based auth
      });
      
      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.statusText}`);
      }
      
      // Fetch satellite data (using the GP endpoint for general perturbations orbit data)
      const dataResponse = await fetch(
        'https://www.space-track.org/basicspacedata/query/class/gp/ORDINAL/1/EPOCH/>now-30/orderby/NORAD_CAT_ID/format/json',
        { credentials: 'include' } // Include cookies for authenticated request
      );
      
      if (!dataResponse.ok) {
        throw new Error(`Data fetch failed: ${dataResponse.statusText}`);
      }
      
      const satelliteData = await dataResponse.json();
      
      // Transform the Space-Track data to our application format
      return satelliteData.slice(0, 10).map((item: any) => {
        // Extract relevant data from Space-Track response
        return {
          id: `sat-${item.NORAD_CAT_ID}`,
          name: item.OBJECT_NAME || `Satellite ${item.NORAD_CAT_ID}`,
          noradId: parseInt(item.NORAD_CAT_ID),
          latitude: parseFloat(item.INCLINATION) || 0, // Using inclination as a proxy for lat
          longitude: Math.random() * 360 - 180, // Random longitude for visualization
          altitude: parseFloat(item.APOAPSIS) || 500,
          velocity: 7.8, // Typical orbital velocity in km/s
          inclination: parseFloat(item.INCLINATION) || 0,
          eccentricity: parseFloat(item.ECCENTRICITY) || 0,
          period: parseFloat(item.PERIOD) || 90,
          type: item.OBJECT_TYPE || "Unknown",
          country: item.COUNTRY_CODE || "Unknown",
          launchDate: item.LAUNCH_DATE || new Date().toISOString().split('T')[0],
          status: "operational",
          telemetry: {
            temperature: Math.floor(Math.random() * 30) + 60, // 60-90
            power: Math.floor(Math.random() * 20) + 80, // 80-100
            communication: Math.floor(Math.random() * 15) + 85, // 85-100
            signalStrength: Math.floor(Math.random() * 10) + 90, // 90-100
            fuelLevel: Math.floor(Math.random() * 50) + 50, // 50-100
            attitudeControl: Math.floor(Math.random() * 10) + 90, // 90-100
            orbitDeviation: Math.random() * 0.1 // 0-0.1
          },
          lastUpdated: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error("Error fetching data from Space-Track:", error);
      console.log("Falling back to mock data due to API error.");
    }
  } else {
    console.log("No Space-Track credentials found. Using mock data.");
  }
  
  // Fallback to mock data if API call fails or no credentials
  return mockSatellites.map(satellite => {
    // Randomize position slightly to simulate movement
    const latOffset = (Math.random() - 0.5) * 2;
    const lngOffset = (Math.random() - 0.5) * 2;
    
    // Randomize telemetry slightly
    const tempOffset = (Math.random() - 0.5) * 5;
    const powerOffset = (Math.random() - 0.5) * 3;
    const commOffset = (Math.random() - 0.5) * 2;
    
    return {
      ...satellite,
      latitude: satellite.latitude + latOffset,
      longitude: satellite.longitude + lngOffset,
      lastUpdated: new Date().toISOString(),
      telemetry: {
        ...satellite.telemetry,
        temperature: Math.max(0, Math.min(100, satellite.telemetry.temperature + tempOffset)),
        power: Math.max(0, Math.min(100, satellite.telemetry.power + powerOffset)),
        communication: Math.max(0, Math.min(100, satellite.telemetry.communication + commOffset)),
      }
    };
  });
}

// Function to get satellite by ID
export function getSatelliteById(id: string): SatelliteData | undefined {
  return mockSatellites.find(sat => sat.id === id);
}

// Function to get Space Track credentials from localStorage
export function getSpaceTrackCredentials(): { username: string; password: string } | null {
  if (typeof window === 'undefined') return null; // Server-side check
  
  const savedCredentials = localStorage.getItem("spacetrack-credentials");
  if (!savedCredentials) return null;
  
  try {
    return JSON.parse(savedCredentials);
  } catch (error) {
    console.error("Failed to parse saved credentials:", error);
    return null;
  }
}

// Function to get satellite by NORAD ID
export function getSatelliteByNoradId(noradId: number): SatelliteData | undefined {
  return mockSatellites.find(sat => sat.noradId === noradId);
}

// Function to generate anomaly data for testing
export function generateAnomalyData(count: number = 3) {
  const anomalyTypes = [
    "Signal Loss", 
    "Power Fluctuation", 
    "Orbital Deviation", 
    "Temperature Spike",
    "Communication Interference",
    "Attitude Control Failure",
    "Propulsion System Anomaly"
  ];
  
  const severities = ["low", "medium", "high", "critical"];
  
  return Array.from({ length: count }, (_, i) => {
    const satellite = mockSatellites[Math.floor(Math.random() * mockSatellites.length)];
    return {
      id: `anomaly-${Date.now()}-${i}`,
      satellite: satellite.name,
      noradId: satellite.noradId,
      lat: satellite.latitude + (Math.random() - 0.5) * 5,
      lng: satellite.longitude + (Math.random() - 0.5) * 5,
      severity: severities[Math.floor(Math.random() * severities.length)],
      type: anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
      timestamp: new Date().toISOString(),
      details: {
        confidence: Math.floor(Math.random() * 30) + 70,
        detectionMethod: "ML Algorithm",
        affectedSystems: ["Power", "Communication", "Attitude Control"].slice(0, Math.floor(Math.random() * 3) + 1),
        mlScores: {
          isolationForest: Math.floor(Math.random() * 100),
          xgboost: Math.floor(Math.random() * 100),
          cnn: Math.floor(Math.random() * 100)
        }
      }
    };
  });
}