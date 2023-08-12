const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User; 

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "mongodb+srv://lab5:n8fxhOvj1T2rk1u2@cluster0.8vonpbg.mongodb.net/"
    );

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          let newUser = new User({
            userName: userData.userName,
            password: hash,
            email: userData.email,
            loginHistory: [],
          });

          return newUser.save(); // Return the promise returned by save()
        })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          if (err.code === 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err);
          }
        });
    }
  });
};


module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject("Unable to find user: " + userData.userName);
        } else {
          bcrypt
            .compare(userData.password, user.password)
            .then((passwordMatch) => {
              if (passwordMatch) {
                const loginInfo = {
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                };
                user.loginHistory.push(loginInfo);
                user
                  .save()
                  .then(() => {
                    resolve(user);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              } else {
                reject("Incorrect Password for user: " + userData.userName);
              }
            })
            .catch((err) => {
              reject("There was an error verifying the user: " + err);
            });
        }
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};