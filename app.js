// Récupérer les éléments du DOM
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupButton = document.getElementById("signup");
const loginButton = document.getElementById("login");
const logoutButton = document.getElementById("logout");
const messageDisplay = document.getElementById("message");

// 🔹 Inscription (Sign UP)
signupButton.addEventListener("click", function () {
    const email = emailInput.value;
    const password = passwordInput.value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Ajouter l'utilisateur à Firestore avec le rôle "user"
            db.collection("users").doc(user.uid).set({
                role: "user"
            }).then(() => {
                messageDisplay.innerText = "Compte créé avec succès !";
                redirectUser(user); // Rediriger après inscription
            });

        })
        .catch((error) => {
            messageDisplay.innerText = error.message;
        });
});

// 🔹 Connexion (Sign In)
loginButton.addEventListener("click", function () {
    const email = emailInput.value;
    const password = passwordInput.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            messageDisplay.innerText = "Connexion réussie !";
            redirectUser(user); // Rediriger après connexion
        })
        .catch((error) => {
            messageDisplay.innerText = error.message;
        });
});

// 🔹 Déconnexion
logoutButton.addEventListener("click", function () {
    auth.signOut().then(() => {
        messageDisplay.innerText = "Déconnecté !";
        logoutButton.style.display = "none";
        window.location.href = "index.html"; // Retour à la page de connexion
    });
});

// 🔹 Vérifier le rôle de l'utilisateur et rediriger
function redirectUser(user) {
    if (!user) return;

    db.collection("users").doc(user.uid).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;
            if (role === "admin") {
                window.location.href = "admin.html";  // Redirection vers la page admin
            } else {
                window.location.href = "user.html";   // Redirection vers la page user
            }
        }
    });
}

// 🔹 Vérifier l'état de connexion au chargement de la page
auth.onAuthStateChanged((user) => {
    if (user) {
        messageDisplay.innerText = `Connecté en tant que ${user.email}`;
        logoutButton.style.display = "block";
        redirectUser(user);
    } else {
        messageDisplay.innerText = "Non connecté";
        logoutButton.style.display = "none";
    }
});
