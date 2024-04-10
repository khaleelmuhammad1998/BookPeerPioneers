const express = require("express");
const app = express();
app.use(express.static("public"));
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

const userModel = require("./models/userModels");

const session = require("express-session");
var fs = require("fs");
var path = require("path");
const bookModel = require("./models/bookModel");
const resourceModel = require("./models/resourceModel");
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/bookpeer");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var multer = require("multer");
const transactionModel = require("./models/transactionModel");
const registrationModel = require("./models/registrationModel");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", function (req, res) {
  res.redirect("/signin");
});

app.get("/signin", function (req, res) {
  res.render("signin");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/signin", function (req, res) {
  res.render("signin");
});

app.post("/signin", async (req, res) => {
  const user = await userModel.findOne({ username: req.body.username });
  console.log(req.body);
  console.log(user);
  if (user) {
    console.log(user.toJSON());
    console.log(req.body.password);
    if (user.toJSON().password !== req.body.password) {
      res.json({ error: "Password Incorrect!" });
      return;
    } else {
      req.session.username = req.body.username;
      res.redirect("/home");
    }
    return;
  } else {
    // const newUSER = req.body;
    // newUSER.img = {
    //   data: fs.readFileSync(
    //     path.join(__dirname + "/uploads/" + req.file.filename)
    //   ),
    //   contentType: "image/png",
    // };
    // console.log("newUser", newUSER);
    // userModel.create(newUSER).then((err, item) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     // item.save();
    //     res.redirect("/");
    //   }
    // });
    // const newUserDb = await newUser.save();
    // console.log(newUserDb.toJSON());
    // req.session.username = newUserDb.toJSON().username;
    // res.redirect("home");
  }
});

app.post("/signup", upload.single("image"), async (req, res) => {
  const user = await userModel.findOne({ username: req.body.username });
  console.log("req,bofy", req.body);
  console.log(user);
  if (user) {
    req.session.username = req.body.username;
    const abc = await userModel.findOneAndUpdate(
      { username: req.body.username },
      req.body
    );
    console.log(abc);
    res.redirect("/home");
    return;
  } else {
    const newUSER = req.body;
    newUSER.img = {
      data: fs.readFileSync(
        path.join(__dirname + "/uploads/" + req.file.filename)
      ),
      contentType: "image/png",
    };
    console.log("newUser", newUSER);
    const newUser = userModel(newUSER);
    const userdb = await newUser.save();
    console.log(userdb);
    /* userModel.create(newUSER).then(async (err, item) => {
      if (err) {
        console.log(err);
      } else {
        console.log("new user");
        req.session.username = req.body.username;
        // item.save();
        console.log("-----------------------------------",{
          userId: item._id,
          registrationDate: new Date(),
        });
        const registration = new registrationModel({
          userId: item._id,
          registrationDate: new Date(),
        });
        await registration.save();
        res.redirect("/");
      }
    });*/

    // const newuser = await userModel.findOne({ username: req.body.username });
    const registration = new registrationModel({
      userId: userdb._id,
      registrationDate: new Date(),
    });
    await registration.save();
    req.session.username = req.body.username;
    res.redirect("home");
  }
});

app.get("/getUser", async (req, res) => {
  console.log(req.session);
  //   res.json({ abc: "kjan" });
  if (req.session.username) {
    const user = await userModel.findOne({ username: req.session.username });

    // user[0].img.data.toString("base64");
    console.log("user", { user });
    res.json({ user });
  } else {
    res.json({ redirect: "signin" });
  }
});

app.get("/signout", function (req, res) {
  res.render("signout");
});

app.post("/checkoutComplete", async (req, res) => {
  console.log(req.query.id);
  const id = req.query.id;
  if (req.query.type === "resource") {
    const resource = await resourceModel.findById(req.query.id);
    const user = await userModel.findById(resource.studentId);
    const transaction = req.body;
    transaction.id = req.query.id;
    transaction.price = resource.price;
    transaction.type = "resource";
    const transactiondata = new transactionModel(transaction);
    const transactionDB = await transactiondata.save();
    res.render("checkout-complete", {
      transaction: transactionDB,
      item: resource,
      seller: user.username,
      type: "resource",
    });
  } else {
    const book = await bookModel.findById(req.query.id);
    const user = await userModel.findById(book.studentId);
    const transaction = req.body;
    transaction.id = req.query.id;
    transaction.price = book.price;
    transaction.type = "resource";
    const transactiondata = new transactionModel(transaction);
    const transactionDB = await transactiondata.save();

    res.render("checkout-complete", {
      transaction: transactionDB,
      item: book,
      type: "book",
      seller: user.username,
    });
  }
  req.body;
});

app.post("/signout", (req, res) => {
  delete req.session["username"];
});

app.get("/ascendeing", async (req, res) => {
  // const books = await bookModel.find({});
  const resources = await resourceModel.find({}).sort({ title: 1 });
  bookModel
    .find({})
    .sort({ title: 1 })
    .then((data, err) => {
      if (err) {
        console.log(err);
      }

      let sortedData = [];
      // let previous;
      let i = 0,
        j = 0;
      for (let k = 0; k <= data.length + resources.length - 1; k++) {
        if (i == data.length) {
          resources[j].type = "resource";
          sortedData.push(resources[j]);
          j++;
        } else if (j == resources.length) {
          data[i].type = "book";
          sortedData.push(data[i]);
          i++;
        } else if (data[i].title < resources[j].title) {
          data[i].type = "book";
          sortedData.push(data[i]);
          i++;
        } else {
          resources[j].type = "resource";
          sortedData.push(resources[j]);
          j++;
        }
      }
      console.log("Ascending");
      console.log(sortedData);
      // for
      res.render("home", { listings: data, resources: resources, sortedData });
      return;
    });
  // console.log({ listings: books })
  //   res.render("home", { listings: books, resources });
});

app.get("/descending", async (req, res) => {
  // const books = await bookModel.find({});
  const resources = await resourceModel.find({}).sort({ title: -1 });
  bookModel
    .find({})
    .sort({ title: -1 })
    .then((data, err) => {
      if (err) {
        console.log(err);
      }
      // data.sort();
      let sortedData = [];
      // let previous;
      let i = 0,
        j = 0;
      for (let k = 0; k <= data.length + resources.length - 1; k++) {
        if (i == data.length) {
          resources[j].type = "resource";
          sortedData.push(resources[j]);
          j++;
        } else if (j == resources.length) {
          data[i].type = "book";
          sortedData.push(data[i]);
          i++;
        } else if (data[i].title > resources[j].title) {
          data[i].type = "book";
          sortedData.push(data[i]);
          i++;
        } else {
          resources[j].type = "resource";
          sortedData.push(resources[j]);
          j++;
        }
      }
      console.log(sortedData);
      // console.log(data[data.length - 1]);
      res.render("home", { listings: data, resources: resources, sortedData });
      return;
    });
  // console.log({ listings: books })
  //   res.render("home", { listings: books, resources });
});

app.get("/home", async (req, res) => {
  // const books = await bookModel.find({});
  const resources = await resourceModel.find({});
  bookModel.find({}).then((data, err) => {
    if (err) {
      console.log(err);
    }
    console.log(data.length);
    console.log(data[data.length - 1]);
    res.render("home", { listings: data, resources: resources });
    return;
  });
  // console.log({ listings: books })
  //   res.render("home", { listings: books, resources });
});

app.get("/search", async (req, res) => {
  // const books = await bookModel.find({});
  const searchparam = req.query.search;
  const resources = await resourceModel.find({
    title: new RegExp(searchparam, "i"),
  });
  bookModel
    .find({
      title: new RegExp(searchparam, "i"),
    })
    .then((data, err) => {
      if (err) {
        console.log(err);
      }
      // console.log(data.length);
      // console.log(data[data.length - 1]);
      res.render("home", { listings: data, resources: resources });
      return;
    });
  // console.log({ listings: books })
  //   res.render("home", { listings: books, resources });
});

app.get("/addpost", async (req, res) => {
  if (!req.session.username) {
    res.redirect("signin");
    return;
  }
  if (req.session.book) {
    const book = await bookModel.findById(req.session.book);
    res.render("addpost", { book });
    return;
  }

  res.render("addpost");
});

app.post(
  "/addpost",
  upload.fields([{ name: "coverImage" }, { name: "frontPage" }]),
  async (req, res) => {
    const postData = req.body;

    const user = await userModel.findOne({ username: req.session.username });
    console.log("add post");
    postData.studentId = user._id;
    console.log("file name", req.files);
    postData.coverImage = {
      data: fs.readFileSync(
        path.join(__dirname + "/uploads/" + req.files.coverImage[0].filename)
      ),
      contentType: "image/png",
    };
    postData.frontPage = {
      data: fs.readFileSync(
        path.join(__dirname + "/uploads/" + req.files.frontPage[0].filename)
      ),
      contentType: "image/png",
    };
    const post = new bookModel(postData);
    await post.save();

    res.redirect("listings");
  }
);

app.post(
  "/addresource",
  upload.fields([{ name: "coverImage" }, { name: "pdfFile" }]),
  async (req, res) => {
    const resourceData = req.body;

    const user = await userModel.findOne({ username: req.session.username });

    resourceData.studentId = user._id;
    resourceData.coverImage = {
      data: fs.readFileSync(
        path.join(__dirname + "/uploads/" + req.files.coverImage[0].filename)
      ),
      contentType: "image/png",
    };
    const pdfData = fs.readFileSync(req.files.pdfFile[0].path);
    resourceData.pdfFile = {
      data: pdfData,
      contentType: req.files.pdfFile[0].mimetype,
      filename: req.files.pdfFile[0].originalname,
    };
    const resource = new resourceModel(resourceData);
    await resource.save();

    res.redirect("academic-resources");
  }
);

app.get("/getListings", async (req, res) => {
  const listings = bookModel.find({}).then((data, err) => {
    if (err) {
      console.log(err);
    }
    console.log(data);
    res.json({ listings: data });
  });
});

app.get("/upload", async (req, res) => {
  if (!req.session.username) {
    res.redirect("signin");
    return;
  }
  if (req.session.resource) {
    const resource = await resourceModel.findById(req.session.resource);
    console.log("resources", resource);
    res.render("upload", { resource });
    return;
  }
  res.render("upload");
});

app.get("/checkout", async (req, res) => {
  console.log(req.query);
  if (req.query.type === "resource") {
    const resource = await resourceModel.findById(req.query.id);
    const user = await userModel.findById(resource.studentId);
    console.log(user);
    res.render("checkout", {
      item: resource,
      seller: user.username,
      type: "resource",
    });
  } else {
    const book = await bookModel.findById(req.query.id);
    const user = await userModel.findById(book.studentId);

    res.render("checkout", {
      item: book,
      seller: user.username,
      type: "book",
    });
  }
});

app.get("/profile", async (req, res) => {
  let user;
  console.log(req.session.username);
  if (req.session.username) {
    // await userModel.findOne({  }).then((data, err) => {
    await userModel
      .findOne({ username: req.session.username })
      .then((data, err) => {
        if (err) {
          console.log(err);
        }
        console.log("userModel", data);
        res.render("profile", { items: data });
      });
  } else {
    res.render("signup");
  }
});

app.get("/profile-edit/:id", async (req, res) => {
  const user = await userModel.findById(req.params.id);
  res.render("profile-edit", { user: user });
});

app.get("/academic-resources", async (req, res) => {
  if (!req.session.username) {
    res.redirect("signin");
    return;
  }
  const user = await userModel.findOne({ username: req.session.username });
  resourceModel.find({ studentId: user._id }).then((data, err) => {
    if (err) {
      console.log(err);
    }
    console.log(data);
    res.render("academic-resources", { resources: data });
  });
});

app.get("/listings", async (req, res) => {
  if (!req.session.username) {
    res.redirect("signin");
    return;
  }
  const user = await userModel.findOne({ username: req.session.username });
  bookModel.find({ studentId: user._id }).then((data, err) => {
    if (err) {
      console.log(err);
    }
    res.render("listings", { listings: data });
  });
});

app.get("/resource/delete/:id", async (req, res) => {
  const id = req.params.id;
  await resourceModel.deleteOne({ _id: id });
  res.redirect("/academic-resources");
});

app.get("/post/delete/:id", async (req, res) => {
  const id = req.params.id;
  await bookModel.deleteOne({ _id: id });
  res.redirect("/listings");
});

app.get("/post/update/:id", async (req, res) => {
  const id = req.params.id;
  //   const book = await bookModel.findOne({ _id: id });
  req.session.book = id;
  res.redirect("./../../addpost");
});

app.post("/post/update/:id", async (req, res) => {
  delete req.session["book"];
  const id = req.params.id;
  const book = await bookModel.findOneAndUpdate({ _id: id }, req.body);
  res.redirect("../../listings");
});

app.get("/resource/update/:id", async (req, res) => {
  const id = req.params.id;
  //   const resource = await resourceModel.findOne({ _id: id });
  req.session.resource = id;
  res.redirect("./../../upload");
});

app.post("/resource/update/:id", async (req, res) => {
  delete req.session["resource"];

  const id = req.params.id;
  const book = await resourceModel.findOneAndUpdate({ _id: id }, req.body);
  res.redirect("../../academic-resources");
});
app.get("/resource/download/:id", async (req, res) => {
  const id = req.params.id;
  const resource = await resourceModel.findOne({ _id: id });
  // res.redirect("../../academic-resources");
  res.set({
    "Content-Type": resource.pdfFile.contentType,
    "Content-Disposition": "attachment; filename=" + resource.pdfFile.filename,
  });
  res.send(resource.pdfFile.data);
});

app.listen(3000);
