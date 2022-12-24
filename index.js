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
});
// user model
const User = mongoose.model("User", userSchema);

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
  const { fName, lName, email, password } = req.body;
  User.findOne({ email: email }, function (err, results) {
    if (err) throw err;
    if (!results) {
      //   const hash = bcrypt.hashSync(password, saltRounds);
      //   console.log(hash);
      const myPlaintextPassword = password;
      const hash = bcrypt.hashSync(myPlaintextPassword, saltRounds);
      User.create({ fName: fName, lName: lName, email: email, password: hash, idUser: userId });
      res.send("Ok Berhasil");
    } else {
      res.send("email sudah terdaftar");
    }
  });
});

app.listen(port, function () {
  console.log("App listening on port 3000");
});
