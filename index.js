// configure express
const express = require("express");
const app = express();
const port = 3000;
// const uniquerID
const { v1: uuidv1, v4: uuidv4 } = require("uuid");
const userId = uuidv4();
// use body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
// static file
app.use(express.static("public"));
// hash password
const bcrypt = require("bcrypt");
const saltRounds = 10;
const myPlaintextPassword = "Floren&2022";
const someOtherPlaintextPassword = "not_bacon";
// console.log(hash);
// use mongoose
const mongoose = require("mongoose");

main().catch((err) => console.log(err));

async function main() {
  mongoose.set("strictQuery", false);
  await mongoose.connect("mongodb://127.0.0.1:27017/salonDB", { useNewUrlParser: true });
  console.log("connected to database mongoDB");
}
// user schema
const userSchema = new mongoose.Schema({
  idUser: String,
  fName: String,
  lName: String,
  email: String,
  password: String,
  verified: Boolean,
});
// user model
const User = mongoose.model("User", userSchema);
// create email transport
const nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "940952ac4580d7",
    pass: "07ea7987d2fe32",
  },
});

// route
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/register", function (req, res) {
  res.sendFile(__dirname + "/register.html");
});

app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.post("/register", function (req, res) {
  const { fName, lName, email, password, privacy } = req.body;
  console.log(typeof privacy);
  if (privacy !== "on") {
    res.redirect("/register");
  } else {
    User.findOne({ email: email }, function (err, results) {
      if (err) throw err;
      if (!results) {
        const myPlaintextPassword = password;
        const hash = bcrypt.hashSync(myPlaintextPassword, saltRounds);
        User.create({ fName: fName, lName: lName, email: email, password: hash, idUser: userId, verified: false });
        let mailOption = {
          from: "<ryoreinaldon11@gmail.com>",
          to: `${email}`,
          subject: "email verification",
          html: `<p>Please click this link to verified <a href="http://localhost:3000/verified/?id=${userId}">Verified email</a></p>`,
        };
        transporter.sendMail(mailOption, (error, info) => {
          if (error) {
            return console.log(error);
          }
          res.send("Email verifikasi terkirim");
        });
      } else {
        res.send("email sudah terdaftar");
      }
    });
  }
});

app.post("/login", function (req, res) {
  const { email, password } = req.body;
  User.findOne({ email: email }, function (err, results) {
    if (!results) {
      res.send("Akun tidak ditemukan");
    } else {
      bcrypt.compare(password, results.password, function (err, results1) {
        if (err) throw err;
        if (results1) {
          res.send("berhasil masuk");
        } else {
          res.send("error mongodb");
        }
      });
    }
  });
});

app.get("/verified", function (req, res) {
  let id = req.query.id;
  User.findOneAndUpdate({ idUser: id }, { verified: true }, function (err, results) {
    if (err) {
      console.log(err);
    } else {
      res.send("verifikasi berhasil");
    }
  });
});

app.listen(port, function () {
  console.log("App listening on port 3000");
});
