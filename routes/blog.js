const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", (req, res, next) => {
  res.render("home");
});

router.get("/home", (req, res, next) => {
  res.redirect("/");
});

router.get("/signup", async function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      confirmEmail: "",
      password: "",
    };
  }
  req.session.inputData = null;
  res.render("signup", { inputData: sessionInputData });
});

router.get("/login", async function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      password: "",
    };
  }
  req.session.inputData = null;
  res.render("login", {inputData: sessionInputData});
});

router.post("/signup", async function (req, res) {
  const enteredEmail = req.body.email;
  const enteredConfirmEmail = req.body["confirm-email"];
  const enteredPassword = req.body.password;

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    !enteredEmail.includes("@") ||
    enteredPassword.trim() < 6 ||
    enteredEmail !== enteredConfirmEmail
  ) {
    req.session.inputData = {
      hasError: true,
      message: "Invalid inputs - Please check your data",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    req.session.save(() => {
      res.redirect("/signup");
    });
    return;
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "User already exist!",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };
    req.session.save(() => {
      res.redirect("/signup");
    })
    return;
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12);

  const user = {
    email: enteredEmail,
    password: hashedPassword,
  };
  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (!existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log you in - Please check your credentials",
      email: enteredEmail,
      password: enteredPassword,
    };
    req.session.save(() => {
      res.redirect("/login");
    })
    return;
  }

  const passwordAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  );

  if (!passwordAreEqual) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log you in - Please check your credentials",
      email: enteredEmail,
      password: enteredPassword,
    };
    req.session.save(() => {
      res.redirect("/login");
    })
    return;
  }

  req.session.user = { id: existingUser._id, email: existingUser.email };
  req.session.isAuthenticated = true;
  req.session.save(() => {
    res.redirect("/profile");
  });
});

router.get("/profile", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }
  res.render("profile");
});

router.get("/admin", async function (req, res) {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }


  if (!res.locals.isAdmin) {
    return res.status(403).render("403");
  }

  res.render("admin");
});

router.post("/logout", async function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect("/");
});

module.exports = router;
