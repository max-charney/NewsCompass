// // Add this to a new file named firebase-config.js
// import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
// import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBOTkbGK4CdSYv5ldpG8MNCvPNEXLBiiFI",
    authDomain: "newscurator.firebaseapp.com",
    projectId: "newscurator",
    storageBucket: "newscurator.appspot.com",
    messagingSenderId: "817346956296",
    appId: "1:817346956296:web:93d736764996f8745615bd"
  };
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

// export { auth };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
