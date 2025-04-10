import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from '@angular/fire/app';
import { environment } from '../../environments/environment.development';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { getFirestore, setDoc, doc, getDoc } from '@angular/fire/firestore';

const app = initializeApp(environment.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

@Component({
  selector: 'app-user-auth',
  standalone: false,
  templateUrl: './user-auth.component.html',
  styleUrl: './user-auth.component.css'
})
export class UserAuthComponent {
  email = "";
  password = "";
  username = "";
  currentUser: User | null = null;

  constructor(private router: Router) {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.router.navigate(['/channels']);
      }
    });
  }

  async signUp() {
    if (this.email.trim() === "" || this.password.trim() === "") {
      alert("Email, username and password are required");
      return;
    }

    const username = prompt("Please enter a username:");
    if (!username || username.trim() === "") {
      alert("Username is required for signup.");
      return;
    }

    this.username = username.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
      console.log("User signed up:", userCredential.user);

      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: this.email,
        username: this.username,
        isAdmin: false,
        isSuperAdmin: false,
        createdAt: new Date()
        
      });

      this.clearFields();
      this.router.navigate(['/channels']);
    } catch (error: any) {
      console.error("Error signing up:", error);
      alert(error.message);
    }
  }

  async logIn() {
    if (this.email.trim() === "" || this.password.trim() === "") {
      alert("Email and password are required");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      console.log("User logged in:", userCredential.user);
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        this.username = userSnapshot.data()['username'];
      }
      this.clearFields();
      this.router.navigate(['/channels']);
    } catch (error: any) {
      console.error("Error logging in:", error);
      alert(error.message);
    }
  }

  logOut() {
    signOut(auth)
      .then(() => {
        console.log("User logged out");
        this.router.navigate(['/login']);
      })
      .catch(error => {
        console.error("Error logging out:", error);
      });
  }

  clearFields() {
    this.email = "";
    this.password = "";
    this.username = "";
  }
  showPassword = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

}
