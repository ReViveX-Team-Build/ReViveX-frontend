const {setGlobalOptions} = require("firebase-functions")
const {onDocumentCreated} = require("firebase-function/v2/firestore")
const admin = require("firebase-admin")

admin.initializeApp();

exports.evaluateGameSession = functions.firestore
  .onDocument("game_sessions/{sessionId}")
  .onCreate((snap, context) =>{

    const data = snap.data();
    const metrics = data.metrics;

    if (!metrics) return null;

    const strengthScore = Math.min((metrics.peakGripForce / 50) * 100, 100);

    const enduranceScore = 100 - metrics.muscleEnduranceDropPercent;

    let reactionScore = 100 - ((metrics.reactionTimeMs - 200) / 800) * 100;

    reactionScore = Math.max(0, Math.min(reactionScore, 100));

    const accuracyScore = metrics.cognitiveAccuracyPercent;

    const overallScore = (0.30 * strengthScore) + (0.25 * enduranceScore) + 
    (0.25 * reactionScore) + (0.25 * accuracyScore);

    let status = overallScore >= 85 
      ? "Optimal Recovery" 
      : overallScore >= 70 
      ? "Strong Progresss" 
      : overallScore >= 50 
      ? "Moderate" 
      : "Need Attention";

    return snap.ref.update({
      strengthScore,
      enduranceScore,
      reactionScore,
      accuracyScore,
      overallScore,
      status
    });
      
  })