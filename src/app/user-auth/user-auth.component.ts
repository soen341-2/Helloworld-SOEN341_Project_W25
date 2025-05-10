import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { getFirestore, setDoc, doc, getDoc } from '@angular/fire/firestore';

const app = initializeApp(environment.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

@Component({
  selector: 'app-user-auth',
  standalone: false,
  templateUrl: './user-auth.component.html',
  styleUrl: './user-auth.component.css',
})

export class UserAuthComponent {
  loginEmail = "";
  loginPassword = "";
  
  signupUsername = "";
  signupEmail = "";
  signupPassword = "";
  
  currentUser: User | null = null;
  showPassword = false;
  

  constructor(private router: Router) {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.router.navigate(['/channels']);
      }
    });
  }

  /*email and password required to sign up*/
  async signUp() {
    if (
      this.signupEmail.trim() === "" ||
      this.signupPassword.trim() === "" ||
      this.signupUsername.trim() === ""
    ) {
      alert("Email, username and password are required");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        this.signupEmail,
        this.signupPassword
      );
      console.log("User signed up:", userCredential.user);
  
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: this.signupEmail,
        username: this.signupUsername,
        isAdmin: false,
        isSuperAdmin: false,
        createdAt: new Date(),
      });
  
      this.clearFields();
      this.router.navigate(["/channels"]);
    } catch (error: any) {
      console.error("Error signing up:", error);
      alert(error.message);
    }
  }
  

  /*loging in rquires email and password*/
  async logIn() {
    if (this.loginEmail.trim() === "" || this.loginPassword.trim() === "") {
      alert("Email and password are required");
      return;
    }
  
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        this.loginEmail,
        this.loginPassword
      );
      console.log("User logged in:", userCredential.user);
  
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        this.signupUsername = userSnapshot.data()["username"];
      }
  
      this.clearFields();
      this.router.navigate(["/channels"]);
    } catch (error: any) {
      console.error("Error logging in:", error);
      alert(error.message);
    }
  }
  

  /*logout from current account*/
  logOut() {
    signOut(auth)
      .then(() => {
        console.log('User logged out');
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  }

  clearFields() {
      this.loginEmail = "";
      this.loginPassword = "";
      this.signupEmail = "";
      this.signupPassword = "";
      this.signupUsername = "";
    }
  


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

}
