import * as firebase from "firebase";
import "@firebase/firestore";

// need to run: npm install --save firebase
// We will use the JS SDK with React Native

const firebaseConfig = {
    apiKey: "AIzaSyD8pt1BOWWxUWEtnGOYwCfsU4kqVhWAZCI",
    authDomain: "mobilefinalproject-f7a0f.firebaseapp.com",
    projectId: "mobilefinalproject-f7a0f",
    storageBucket: "mobilefinalproject-f7a0f.appspot.com",
    messagingSenderId: "1016297030078",
    appId: "1:1016297030078:web:435a4c152583929ab079ef",
};

let app = firebase.initializeApp(firebaseConfig);

export const db = app.database();
export const firestore = firebase.firestore(app);
export const auth = app.auth();
