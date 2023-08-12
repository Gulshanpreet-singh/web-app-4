/*********************************************************************************

WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

*  Name: Gulshanpreet singh Student ID: 168457216 Date: 11th August, 2023
*
*  Cyclic Web App URL: https://adventurous-ox-sundress.cyclic.app/shop
*
*  GitHub Repository URL:  https://github.com/Gulshanpreet-singh/hello-world 
*
********************************************************************************/

const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const storeService = require("./store-service");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
app.use(express.urlencoded({extended: true}));

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? ' class="nav-link active" '
            : ' class="nav-link" ') +
          'href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function(dateObj){
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
      }    
    },
  })
);

app.set("view engine", ".hbs");
// Cloudinary configuration
cloudinary.config({
  cloud_name: "deppf2r3z",
  api_key: "954325943437465",
  api_secret: "5NeWtUrNwS2DuY0JQrq-MSxAJgY",
  secure: true,
});

// Multer upload variable without disk storage
const upload = multer();

// Serve static files from the 'public' directory
app.use(express.static("public"));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(
  clientSessions({
    cookieName: "session",
    secret: "webapp",
    duration: 2 * 60 * 1000,
    activeDuration: 60 * 1000,
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

// Redirect '/' to '/about'
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// Return the about.html file
app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const userData = {
    userName: req.body.userName,
    password: req.body.password,
    password2: req.body.password2,
    email: req.body.email,
    userAgent: req.headers["user-agent"],
  };

  authData
    .registerUser(userData)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post("/login", function (req, res) {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/items');
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, function (req, res) {
  res.render("userHistory");
});

// Return the addform.html file
app.get("/items/addForm",ensureLogin, (req, res) => {
  res.sendFile(__dirname + "/views/addItem.html");
});

// Return published items

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = items[0];

    // store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});


app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await storeService.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await storeService.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.item = await storeService.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await storeService.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", {data: viewData})
});

//Return items
app.get("/items", ensureLogin, (req, res) => {
  const category = req.query.category;
  const minDate = req.query.minDate;

  if (category) {
    // Filter by category
    storeService
      .getItemsByCategory(category)
      .then((filteredItems) => {
        if (filteredItems.length > 0) {
          res.render("Items", {posts: filteredItems})
        } else {
          res.render('Items', { message: 'No results' });
        }
      })
      .catch((err) => {
        res.render("items", {message: "no results"});
      });
  } else if (minDate) {
    // Filter by minDate
    storeService
      .getItemsByMinDate(minDate)
      .then((filteredItems) => {
        res.render("items", {posts: filteredItems})
      })
      .catch((err) => {
        res.render("items", {message: "no results"});
      });
  } else {
    // No filter, return all items
    storeService
      .getAllItems()
      .then((posts) => {
        res.render("items", {posts: posts})
      })
      .catch((err) => {
        res.render("items", {message: "no results"});
      });
  }
});

//get item by id
app.get("/item/:id", ensureLogin, (req, res) => {
  const itemId = req.params.id;

  storeService
    .getItemById(itemId)
    .then((item) => {
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ message: "Item not found" });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

//Return categories
app.get("/categories", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("categories", {categories: data});
    })
    .catch((error) => {
      res.render("categories", {message: "no results"});
    });
});

app.get('/items/add', ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      res.render('addItem', { categories });
    })
    .catch(() => {
      res.render('addItem', { categories: [] });
    });
});

app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('addCategory');
});

app.post('/categories/add', ensureLogin, (req, res) => {
  const categoryData = {
    category: req.body.category,
  };

  storeService
    .addCategory(categoryData)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Unable to Add Category');
    });
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  const categoryId = req.params.id;

  storeService
    .deleteCategoryById(categoryId)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Unable to Remove Category / Category not found');
    });
});

app.get('/items/delete/:id', ensureLogin, (req, res) => {
  const postId = req.params.id;

  storeService
    .deletePostById(postId)
    .then(() => {
      res.redirect('/items');
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Unable to Remove Post / Post not found');
    });
});

//add new item
app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
  console.log("here");
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      try {
        let result = await streamUpload(req);
        console.log(result);
        return result;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }

    upload(req)
      .then((uploaded) => {
        processItem(uploaded.url);
      })
      .catch((error) => {
        console.error(error);
        processItem("");
      });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    storeService
      .addItem(req.body)
      .then((addedItem) => {
        console.log("New item added:");
        res.redirect("/items");
      })
      .catch((error) => {
        res.json({ message: error });
      });
  }
});

//initiate server
storeService
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log(
        `Express http server listening on port ${process.env.PORT || 8080}`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to initialize store service:", error);
  });

// Handle not found routes
app.use((req, res) => {
  res.render('404')
});
