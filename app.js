const express = require('express');
const app = express();
const admin = require('firebase-admin');
const serviceAccount = require("./formkey.json");
const bcrypt = require('bcrypt');

app.use(express.static('public'));


app.set('view engine', 'ejs');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(express.urlencoded({ extended: true }));

async function userExists(email) {
    const usersRef = admin.firestore().collection("appusers");
    const snapshot = await usersRef.where("Email", "==", email).get();
    return !snapshot.empty;
}

app.get('/signup_page', function (req, res) {
    res.render('signup_page', { message: null });
});

app.post('/submit_signup', async function (req, res) {
    const { name, email, password } = req.body;

    try {
        const exists = await userExists(email);

        if (exists) {
            return res.render('signup_page', { message: "User already exists. Please login." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await admin.firestore().collection("appusers").add({
            FullName: name,
            Email: email,
            Password: hashedPassword,
        });

        return res.redirect('/login_page');
    } catch (error) {
        return res.send("Error: " + error.message);
    }
});

app.get('/login_page', function (req, res) {
    res.render('login_page', { message: null });
});

app.post('/submit_login', async function (req, res) {
    const { email, password } = req.body;

    try {
        const snapshot = await admin.firestore().collection("appusers")
            .where("Email", "==", email)
            .get();

        if (snapshot.size === 0) {
            return res.render('login_page', { message: "Invalid credentials." });
        } else {
            const user = snapshot.docs[0].data();
            const passwordMatch = await bcrypt.compare(password, user.Password);

            if (passwordMatch) {
                return res.redirect('/dashboard');
            } else {
                return res.render('login_page', { message: "Invalid credentials." });
            }
        }
    } catch (error) {
        return res.send("Error: " + error.message);
    }
});

app.get('/home', function (req, res) {
    res.render('home');
});

app.get('/dashboard', function (req, res) {
    res.render('dashboard', { message: null });
});

const port = process.env.PORT || 5050;
app.listen(port, function () {
    console.log('App listening on port ' + port + '!');
});
