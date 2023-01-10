// require crypto
const crypto = require("crypto");
// require dotenv
require("dotenv").config();
// configure cookie-parser
const cookieParser = require("cookie-parser");
// configure express-session
const session = require("express-session");
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
// session
app.use(
  session({
    secret: "rahasia",
    resave: false,
    saveUninitialized: true,
  })
);
// cookie
app.use(cookieParser());
// hash password
const bcrypt = require("bcrypt");
const saltRounds = 10;
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
// configure jwt
const jwt = require("jsonwebtoken");

var transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "940952ac4580d7",
    pass: "07ea7987d2fe32",
  },
});
// initialize ejs
app.set("view engine", "ejs");

// route
app.get("/", function (req, res) {
  if (req.cookies.login) {
    res.render("success-login");
  } else {
    res.sendFile(__dirname + "/index.html");
  }
});

app.get("/register", function (req, res) {
  res.sendFile(__dirname + "/register.html");
});

app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.post("/register", function (req, res) {
  const { fName, lName, email, password, privacy } = req.body;
  // console.log(typeof privacy);
  if (privacy !== "on") {
    res.render("not-agree-privacy");
  } else {
    User.findOne({ email: email }, function (err, results) {
      if (err) throw err;
      if (!results) {
        const userPassword = password;
        const hashPassword = bcrypt.hashSync(userPassword, saltRounds);
        const date = new Date();
        User.create({ fName: fName, lName: lName, email: email, password: hashPassword, idUser: userId, verified: false });
        const token = jwt.sign({ userId: userId }, process.env.SECRET_KEY, {
          expiresIn: "15m",
        });
        let mailOption = {
          from: "<ryoreinaldon11@gmail.com>",
          to: `${email}`,
          subject: "email verification",
          html: `<p>Please click this link to verified <a href="http://localhost:3000/verified?token=${token}">Verified email</a> the link will expired in 15 minutes</p>`,
        };
        transporter.sendMail(mailOption, (error, info) => {
          if (error) {
            return console.log(error);
          }
          res.render("send-email-verification");
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
      req.session.email = results.email;
      bcrypt.compare(password, results.password, function (err, results1) {
        if (err) throw err;
        if (results1) {
          const oneWeekInMiliseconds = 7 * 24 * 60 * 60 * 1000;
          const cookieValue = "true";
          const hash = crypto.createHash("sha256").update(cookieValue).digest("hex");
          res.cookie("login", hash, {
            expired: new Date(Date.now() + oneWeekInMiliseconds),
            secure: true,
            httpOnly: true,
            sameSite: "strict",
          });
          res.render("success-login");
        } else {
          res.render("wrong-password", { wrong: "true" });
        }
      });
    }
  });
});

app.get("/verified", function (req, res) {
  let token = req.query.token;

  jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        res.send({ message: "Token sudah expired" });
      } else {
        res.send({ message: "Token tidak valid" });
      }
    } else {
      User.findOneAndUpdate({ idUser: decode.userId }, { verified: true }, function (err, results) {
        if (err) {
          res.render("Failed-verified");
        } else {
          res.render("success-verified");
        }
      });
    }
  });
});

app.get("/completed", function (req, res) {
  const newCookieValue = "true";
  const newHash = crypto.createHash("sha256").update(newCookieValue).digest("hex");
  if (newHash === req.cookies.login) {
    req.session.login = true;
  } else {
    req.session.login = false;
    req.session.email = false;
  }
  if (req.session.login) {
    res.render("completed-feature");
  } else {
    res.redirect("/login");
  }
});

app.get("/forgot", function (req, res) {
  res.render("forget-password");
});

app.post("/forgot", function (req, res) {
  let emailAccount = req.body.email;
  User.findOne({ email: emailAccount }, function (err, resultForgot) {
    if (err) throw err;
    if (resultForgot) {
      res.render("change-password", { emailAccountChange: emailAccount });
    } else {
      res.send("Email tidak ada");
    }
  });
});

app.post("/change-password/:email", function (req, res) {
  let emailUser = req.params.email;
  let { password, passwordConfirm } = req.body;
  if (password != passwordConfirm) {
    res.send("Password konfirmasi salah");
  } else {
    const userPassword = password;
    const hashPassword = bcrypt.hashSync(userPassword, saltRounds);
    User.findOneAndUpdate({ email: emailUser }, { password: hashPassword }, function (err, results) {
      if (err) {
        res.send("Gagal ubah password");
      } else {
        res.send("Ubah password berhasil");
      }
    });
  }
});

app.get("/logout", function (req, res) {
  res.clearCookie("login");
  res.clearCookie("email", { path: "/" });
  res.redirect("/");
});

app.listen(port, function () {
  console.log("App listening on port 3000");
});
