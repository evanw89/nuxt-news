import firebase from "firebase/app";
import "firebase/firestore";

if (!firebase.apps.length) {
  var config = {
    apiKey: "AIzaSyB1X99UPrNfDqMMNHK-S-udz9g_gTmS4T8",
    authDomain: "nuxt-news-feed-2a633.firebaseapp.com",
    databaseURL: "https://nuxt-news-feed-2a633.firebaseio.com",
    projectId: "nuxt-news-feed-2a633",
    storageBucket: "nuxt-news-feed-2a633.appspot.com",
    messagingSenderId: "430818891274"
  };
  firebase.initializeApp(config);
  firebase.firestore().settings({
    // timestampsInSnapshots: true
  });
}
const db = firebase.firestore();

export default db;
