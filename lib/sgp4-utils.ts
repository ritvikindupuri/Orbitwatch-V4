// SGP4 Trajectory Prediction Utilities
import * as satellite from 'satellite.js';

// TLE (Two-Line Element) format example:
// 1 25544U 98067A   21336.70218279  .00006056  00000-0  11838-3 0  9992
// 2 25544  51.6448 354.4301 0007333  81.7126 278.4673 15.48860345315580

// Sample TLEs for common satellites
const sampleTLEs: Record<string, string[]> = {
  // International Space Station
  'ISS': [
    '1 25544U 98067A   21336.70218279  .00006056  00000-0  11838-3 0  9992',
    '2 25544  51.6448 354.4301 0007333  81.7126 278.4673 15.48860345315580'
  ],
  // Hubble Space Telescope
  'HUBBLE': [
    '1 20580U 90037B   21336.30339931  .00000361  00000-0  11007-4 0  9995',
    '2 20580  28.4699 287.7342 0002525 321.6826  38.3641 15.09767366118059'
  ],
  // NOAA-19 Weather Satellite
  'NOAA-19': [
    '1 33591U 09005A   21336.50283736  .00000076  00000-0  65128-4 0  9992',
    '2 33591  99.1949 322.1481 0013223 168.4752 191.6697 14.12501980658374'
  ],
  // GPS IIR-21 (USA 206)
  'GPS': [
    '1 35752U 09043A   21336.39270304 -.00000046  00000-0  00000-0 0  9996',
    '2 35752  54.9584 258.9126 0044279  25.1509 335.1255  2.00563275 89644'
  ],
  // Generic LEO satellite (for when no specific TLE is available)
  'GENERIC_LEO': [
    '1 99999U 22001A   22001.00000000  .00001000  00000-0  10000-3 0  9990',
    '2 99999  51.6400   0.0000 0010000   0.0000   0.0000 15.50000000    00'
  ],
};

/**
 * Generate a TLE for a satellite based on its parameters
 * This is a simplified approximation - in a real system, you would use actual TLEs from Space-Track
 */
export function generateApproximateTLE(noradId: number, inclination: number, period: number): string[] {
  // Convert period from minutes to revolutions per day
  const meanMotion = 1440 / period;
  
  // Use the generic LEO TLE as a template and modify key parameters
  const tle1 = `1 ${noradId.toString().padStart(5, '0')}U 22001A   22001.00000000  .00001000  00000-0  10000-3 0  9990`;
  const tle2 = `2 ${noradId.toString().padStart(5, '0')}  ${inclination.toFixed(4)}   0.0000 0010000   0.0000   0.0000 ${meanMotion.toFixed(8)}    00`;
  
  return [tle1, tle2];
}

/**
 * Get a satellite's position at a specific time
 */
export function getSatellitePosition(tle: string[], timestamp: Date) {
  // Initialize a satellite record
  const satrec = satellite.twoline2satrec(tle[0], tle[1]);
  
  // Get position and velocity
  const positionAndVelocity = satellite.propagate(satrec, timestamp);
  
  // Check for errors
  if (typeof positionAndVelocity === 'boolean' || !positionAndVelocity.position) {
    throw new Error('Error calculating satellite position');
  }
  
  // Get the position in km
  const positionEci = positionAndVelocity.position;
  
  // Get the velocity in km/s
  const velocityEci = positionAndVelocity.velocity;
  
  // Convert the position to geographic coordinates (latitude, longitude, altitude)
  const gmst = satellite.gstime(timestamp);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  
  // Calculate velocity magnitude
  const velocityMagnitude = Math.sqrt(
    Math.pow(velocityEci.x, 2) + 
    Math.pow(velocityEci.y, 2) + 
    Math.pow(velocityEci.z, 2)
  );
  
  return {
    // Convert from radians to degrees
    latitude: satellite.degreesLat(positionGd.latitude),
    longitude: satellite.degreesLong(positionGd.longitude),
    // Convert from km to m
    altitude: positionGd.height,
    // Velocity in km/s
    velocity: velocityMagnitude,
  };
}

/**
 * Generate trajectory points for a satellite over a time period
 */
export function generateTrajectoryPoints(
  noradId: number, 
  inclination: number, 
  period: number,
  startTime: Date,
  hours: number,
  pointsPerHour: number = 6
) {
  // Get TLE for the satellite
  let tle: string[];
  
  // Try to use a sample TLE if available, otherwise generate an approximate one
  if (noradId === 25544) {
    tle = sampleTLEs['ISS'];
  } else if (noradId === 20580) {
    tle = sampleTLEs['HUBBLE'];
  } else if (noradId === 33591) {
    tle = sampleTLEs['NOAA-19'];
  } else if (noradId === 35752) {
    tle = sampleTLEs['GPS'];
  } else {
    tle = generateApproximateTLE(noradId, inclination, period);
  }
  
  const trajectoryPoints = [];
  const totalPoints = hours * pointsPerHour;
  const timeStep = (hours * 60 * 60 * 1000) / totalPoints; // time step in milliseconds
  
  for (let i = 0; i <= totalPoints; i++) {
    const pointTime = new Date(startTime.getTime() + i * timeStep);
    
    try {
      const position = getSatellitePosition(tle, pointTime);
      
      trajectoryPoints.push({
        time: pointTime.toISOString(),
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        velocity: position.velocity,
      });
    } catch (error) {
      console.error(`Error calculating position at time ${pointTime}:`, error);
      // Continue with the next point
    }
  }
  
  return trajectoryPoints;
}

/**
 * Generate historical and future trajectory data for a satellite
 */
export function generateSatelliteTrajectoryData(
  noradId: number,
  inclination: number,
  period: number,
  pastHours: number = 24,
  futureHours: number = 24,
  pointsPerHour: number = 6
) {
  const now = new Date();
  
  // Generate past trajectory
  const pastStartTime = new Date(now.getTime() - pastHours * 60 * 60 * 1000);
  const historicalData = generateTrajectoryPoints(
    noradId,
    inclination,
    period,
    pastStartTime,
    pastHours,
    pointsPerHour
  );
  
  // Generate future trajectory
  const futureData = generateTrajectoryPoints(
    noradId,
    inclination,
    period,
    now,
    futureHours,
    pointsPerHour
  );
  
  return {
    historicalData,
    futureData,
  };
}