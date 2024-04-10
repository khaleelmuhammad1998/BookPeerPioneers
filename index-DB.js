const express = require('express');
const app = express();
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const bookModel = require("./models/bookModel");
const userModel = require("./models/userModels");

app.use(express.urlencoded({ extended: false }));

mongoose.connect("mongodb://localhost:27017/bookpeer", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/', function (req, res) {
  res.render('home',{session: req.session, loggedIn:false});
});

app.get("/login",async (req, res) => {
  res.render('home',{loginPage:true,loggedIn:false});
})

app.get("/logout", (req, res) => {
  if (req.session?.username) {
    delete req.session.username;
  }
  res.render("home", { logout: true , loginPage:false, loggedIn:false});
  return;
});

app.get("/newuser",async(req,res)=>{
  const user = await new userModel({username:"user",password:"password"}).save();
  return;
})

app.post("/login", async (req, res) => {
  if (req.body.username == "") {
    req.body.loginError = "Please enter your user name";
    req.body.login = true;
    res.render("home", req.body);
    return;
  } else if (req.body.password == "") {
    req.body.loginError = "Please enter your password";
    req.body.login = true;
    res.render("home", req.body);
    return;
  }
  try {
    const user = await userModel.findOne(req.body);
    console.log(user);
    if (user) {
      req.session.username = req.body.username;
      res.redirect("/");
      return;
    } else {
      req.body.loginError = "Please enter valid username and password";
      req.body.login = true;
      res.render("home", req.body);
      return;
    }
    // const user1 = new userModel(req.body);
    // user1.save();
  } catch (error) {}
  //   res.render("home", { login: true });
});
app.post("/login", async (req, res) => {
  console.log(req.body)
  if (req.body.username == "") {
    req.body.loginError = "Please enter your user name";
    req.body.login = true;
    res.render("home", req.body);
    return;
  } else if (req.body.password == "") {
    req.body.loginError = "Please enter your password";
    req.body.login = true;
    res.render("home", req.body);
    return;
  }
  try {
    const user = await userModel.findOne(req.body);
    console.log(user);
    if (user) {
      req.session.username = req.body.username;
      res.json({});
      return;
    } else {
      req.body.loginError = "Please enter valid username and password";
      req.body.login = true;
      return;
    }
    // const user1 = new userModel(req.body);
    // user1.save();
  } catch (error) {
    console.log("123", error.message);
  }
});

app.listen(3000);
