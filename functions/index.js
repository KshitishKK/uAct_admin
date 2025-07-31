const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

// Initialize Firebase Admin SDK
initializeApp();

// 🔔 New Function: Auto notification on video upload
exports.notifyOnNewVideo = onDocumentCreated("videos/{videoId}", async (event) => {
  const video = event.data.data();

  if (!video) {
    console.error("No video data found in document.");
    return;
  }

  const message = {
    notification: {
      title: "🎬 New Roleplay Video",
      body: `${video.title} is now available. Try it out!`,
    },
    topic: "all-users",
  };

  try {
    const response = await getMessaging().send(message);
    console.log("Notification sent:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
});


// ✅ Re-export all your existing functions
// exports.fetchYoutubeVideoUrl = require("./fetchYoutubeVideoUrl");
// exports.getCustomToken = require("./getCustomToken");
// exports.getOAuth2RefreshToken = require("./getOAuth2RefreshToken");
// exports.getOAuth2Token = require("./getOAuth2Token");
// exports.helloWorld = require("./helloWorld");
// exports.writeUserContent = require("./writeUserContent");
