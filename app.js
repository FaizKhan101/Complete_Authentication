const express = require("express");
const session = require("express-session");
const mongodbStore = require("connect-mongodb-session");

const blog = require("./routes/blog");
const db = require("./data/database");
const { ObjectId } = require("mongodb");

const MongoDBStore = mongodbStore(session);

const app = express();

const sessionStore = new MongoDBStore({
  uri: "mongodb://localhost:27017",
  databaseName: "auth-demo",
  collection: "session",
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "super-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

app.use(async function (req, res, next) {
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;

  if (!user || !isAuth) {
    return next();
  }


  const userDoc = await db
    .getDb()
    .collection("users")
    .findOne({ _id: new ObjectId(user.id) });
 
  const isAdmin = userDoc.isAdmin;

  res.locals.isAuth = isAuth;
  res.locals.isAdmin = isAdmin;

  next();
});

app.use(blog);

db.connectToDatabase().then(() => {
  app.listen(5000);
});
