// configure express
const express = require("express");
const app = express();
const port = 3000;
// static file
app.use(express.static("public"));

// route
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.listen(port, function () {
  console.log("App listening on port 3000");
});
