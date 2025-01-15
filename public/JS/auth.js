// IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// DOM ELEMENTS
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
// const accountDetails = document.getElementById('account-details');
var userData;
var userID;

// firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBO2KJaF9rHOLopMEU22F1Es8-qgZNlLM4",
  authDomain: "academic-organizer.firebaseapp.com",
  projectId: "academic-organizer",
  storageBucket: "academic-organizer.appspot.com",
  messagingSenderId: "708999915370",
  appId: "1:708999915370:web:68e25a6f6d2d47b585a713",
  measurementId: "G-5NDDY4FDVL"
};
  
// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ======================================== ACCOUNT MANAGEMENT ========================================
// Signup =============================================================================================
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = signupForm['signup-email'].value;
  const password = signupForm['signup-password'].value;

  createUserWithEmailAndPassword(auth, email, password).then(() => {
    signupForm.reset();
    document.querySelector('.signup-popup').style.display = 'none';
  });

  console.log("User Created");
});

// Login ==============================================================================================
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = loginForm['login-email'].value;
  const password = loginForm['login-password'].value;

  signInWithEmailAndPassword(auth, email, password).then((cred) => {
    loginForm.reset();
    document.querySelector('.login-popup').style.display = 'none';
  });
});
  
// Logout =============================================================================================
const logout = document.getElementById('signout-navbtn');
logout.addEventListener('click', (e) => {
  console.log("User Logged Out");
  e.preventDefault();
  auth.signOut();
  window.location.reload();
});

// Login Status ======================================================================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userID = user.uid;
    const userRef = ref(db, 'users/' + user.uid);

    console.log("User Logged In: ", userRef);

    loggedInLinks.forEach(item => item.style.display = 'block');
    loggedOutLinks.forEach(item => item.style.display = 'none');
    
    // Get realtime user data 
    onValue(userRef, (snapshot) => {
      userData = snapshot.val();
      console.log("User Data before auth load:", userData);
      


      if (userData) {
        console.log("Loading data from database to local storage");

        // Load courses from database to local storage
        if (userData.courses) {
          courses = userData.courses;
          console.log("User Data after auth load:", courses);
          
          const courseContainer = document.querySelector('.course-display');
          courseContainer.innerHTML = ''; // Clear existing courses

          renderallcoursesandassignments();
        }
      }
    });
  } 
  
  else {
    userID = null;
    loggedInLinks.forEach(item => item.style.display = 'none');
    loggedOutLinks.forEach(item => item.style.display = 'block');
    console.log("User Logged Out");
  }
});

// ======================================== DATABASE MANAGEMENT ========================================
// Copy data from local storage to database ============================================================
document.getElementById('cloud-save-navbtn').addEventListener('click', () => {
  console.log("save button pressed");
  var data = {
      courses: courses,
  };
  saveDataToDatabase(data);
});

function saveDataToDatabase(data) {
  console.log("Saving data to database");
  console.log(data);
  userID = auth.currentUser.uid;
  if (userID && data) {
    // Clear existing courses before saving new data
    set(ref(db, 'users/' + userID + '/courses'), null)
      .then(() => {
        // Save new data
        set(ref(db, 'users/' + userID), data)
          .then(() => {
            console.log("Data saved to database");
          })
          .catch((error) => {
            console.error("Error saving data to database: ", error);
          });
      })
      .catch((error) => {
        console.error("Error clearing existing courses: ", error);
      });
  } else {
    console.log("No user logged in or no data provided");
  }
}