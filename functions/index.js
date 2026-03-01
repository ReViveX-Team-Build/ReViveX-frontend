const {setGlobalOptions} = require("firebase-functions")
const {onDocumentCreated} = require("firebase-function/v2/firestore")
const admin = require("firebase-admin")

admin.initializeApp();

exports.evaluateGameSession = functions.firestore
  .onDocument("game_sessions/{sessionId}")
  .onCreate((snap, context) =>{

    const data = snap.data();
    const metrics = data.metrics;
  })