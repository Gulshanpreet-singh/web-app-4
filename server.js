/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

*  Name: Gulshanpreet singh Student ID: 168457216 Date: 5th june 2023
*
*  Cyclic Web App URL: https://dark-gold-panda-cuff.cyclic.app/ 
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

// Redirect '/' to '/about'
app.get("/", (req, res) => {
  res.redirect("/shop");
});

// Return the about.html file
app.get("/about", (req, res) => {
  res.render("about");
});

// Return the addform.html file
app.get("/items/addForm", (req, res) => {
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
app.get("/items", (req, res) => {
  const category = req.query.category;
  const minDate = req.query.minDate;

  if (category) {
    // Filter by category
    storeService
      .getItemsByCategory(category)
      .then((filteredItems) => {
        res.render("items", {posts: filteredItems})
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
app.get("/item/:id", (req, res) => {
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
app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("categories", {categories: data});
    })
    .catch((error) => {
      res.render("categories", {message: "no results"});
    });
});

app.get("/items/add", (req, res) => {
  res.render("addItem");
});

//add new item
app.post("/items/add", upload.single("featureImage"), (req, res) => {
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
