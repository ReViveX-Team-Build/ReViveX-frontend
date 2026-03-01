

// ─── GAME 1: MPX50DP PRESSURE SENSOR METRICS ────────────────────────────

export const calculateCognitiveAccuracy = (correct: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
};

export const calculateEnduranceDrop = (pressures: number[]): number => {
    if (pressures.length < 6) return 0; // Not enough data to compare
    
    // Average peak of first 3 jumps
    const firstThreeAvg = (pressures[0] + pressures[1] + pressures[2]) / 3;
    // Average peak of last 3 jumps
    const len = pressures.length;
    const lastThreeAvg = (pressures[len-1] + pressures[len-2] + pressures[len-3]) / 3;
    
    // Calculate the drop percentage. If it's negative (they got stronger), return 0.
    const drop = ((firstThreeAvg - lastThreeAvg) / firstThreeAvg) * 100;
    return Math.max(0, Math.round(drop));
};

export const getPeakGripForce = (pressures: number[]): number => {
    if (pressures.length === 0) return 0;
    return parseFloat(Math.max(...pressures).toFixed(2));
};

// ─── GAME 2: MPU6050 MOTION SENSOR METRICS (Passive Game) ───────────────

export const calculateTremorAmplitude = (gyroData: {x: number, y: number, z: number}[]): number => {
    if (gyroData.length === 0) return 0;

    // Helper function to calculate Standard Deviation
    const calcSD = (arr: number[]) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
    };

    const sdX = calcSD(gyroData.map(d => d.x));
    const sdY = calcSD(gyroData.map(d => d.y));
    const sdZ = calcSD(gyroData.map(d => d.z));

    // Combined Score: sqrt(SDx^2 + SDy^2 + SDz^2)
    return parseFloat(Math.sqrt(Math.pow(sdX, 2) + Math.pow(sdY, 2) + Math.pow(sdZ, 2)).toFixed(3));
};