 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
 import{ getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
 import { getFirestore, setDoc, doc} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
 
 
 const firebaseConfig = {
   apiKey: "AIzaSyAlTf3yC19fy2ncvyDE0ZoW5ypHQD752sY",
   authDomain: "soen341-login.firebaseapp.com",
   projectId: "soen341-login",
   storageBucket: "soen341-login.firebasestorage.app",
   messagingSenderId: "161449613416",
   appId: "1:161449613416:web:04932a9c6b6cea0f6643dd"
 };

 // Initialize Firebase
 const app = initializeApp(firebaseConfig);

const auth=getAuth(app);
const db=getFirestore(app);

 function showMessage(message, divId){
    var messageDiv=document.getElementById(divId);
    messageDiv.style.display="block";
    messageDiv.innerHTML=message;
    messageDiv.style.opacity=1;
    setTimeout(function(){
        messageDiv.style.opacity=1;
    }, 5000);
    
 }
 const signUp=document.getElementById('submitSignUp');
 signUp.addEventListener('click', (event)=> {
    event.preventDefault();
    const email=document.getElementById('rEmail').value;
    const password=document.getElementById('rPassword').value;
    const firstName=document.getElementById('fName').value;
    const lastName=document.getElementById('lName').value;

    

    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential)=>{
        const user=userCredential.user;
        const userData={
            email: email,
            firstName: firstName,
            lastName: lastName
        };
        showMessage('Account has been created successfully!', 'signUpMessage');
        const docRef=doc(db, "users", user.uid);
        setDoc(docRef, userData)
        .then(()=>{
            window.location.href='index.html';
        })
        .catch((error)=>{
            console.error("error", error)
        });

    })
    .catch((error) => {
        console.error("Firebase Auth Error:", error);
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use') {
            showMessage('Account with this email already exists', 'signUpMessage');
        } else {
            showMessage('Unable to create account: ' + error.message, 'signUpMessage');
        }
    });
});
