const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const cloudinary = require("cloudinary").v2;
const TextModel = require("./textSchema");
const port = 5000;
const app = express();
const upload = require("express-fileupload");
const session = require("express-session");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(upload());

app.use( 
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

// Configuration
cloudinary.config({
  cloud_name: "dgsvocf0w",
  api_key: "769681361645176",
  api_secret: "mHZbyzlvJkB7UJgbcixvLXUszCg", 
});

// MongoDB Connection
const connectDB = async () => {
  await mongoose 
    .connect(
      "mongodb+srv://WorkinX:JoPlgIK8JUpjMeuY@cluster0.qm9dld0.mongodb.net/WorkinX"
    )
    .then(() => {
      console.log(`Connected to MongoDB with ${mongoose.connection.host}`);
    })
    .catch((err) => {
      console.log(err);
    });
};

connectDB();

app.get("/", (req, res) => {
  res.render("index");
});


app.post("/", async (req, res) => {
  // Extracting fields from the request body
  const {
    title, 
    bulletPoint01,
    bulletPoint02,
    bulletPoint03, 
    bulletPoint04,
    bulletPoint05,
    bulletPoint06,
    price,
    brandName,
    itemForm,
    manufacture,
    quantity,
    PackageInfo,
  } = req.body;

  // Initialize arrays to store the secure URLs of uploaded images
  const imgPaths = [];
  const APlusImgPaths = [];

  if (req.files) {
    // Handle single or multiple files
    let files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    let files2 = Array.isArray(req.files.APlusFile) ? req.files.APlusFile : [req.files.APlusFile];

    // Sort the files by their filenames in ascending order
    files.sort((a, b) => a.name.localeCompare(b.name));
    files2.sort((a, b) => a.name.localeCompare(b.name));

    // Upload images for imgPaths
    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          public_id: file.name, // Set the public ID to the file name
        }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            imgPaths.push(result.secure_url); // Push the secure URL to imgPaths array
            resolve(result);
          }
        }).end(file.data); // Pass the file buffer to the upload stream
      });
    });

    // Upload images for APlusImgPaths
    const uploadAPlusPromises = files2.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          public_id: file.name, // Set the public ID to the file name
        }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            APlusImgPaths.push(result.secure_url); // Push the secure URL to APlusImgPaths array
            resolve(result);
          }
        }).end(file.data); // Pass the file buffer to the upload stream
      });
    });

    try {
      // Wait for all uploads to complete
      await Promise.all([...uploadPromises, ...uploadAPlusPromises]);

      // Save the document with image URLs to the database
      const textModel = new TextModel({
        title,
        bulletPoint01,
        bulletPoint02,
        bulletPoint03,
        bulletPoint04,
        bulletPoint05,
        bulletPoint06,
        price,
        brandName,
        itemForm,
        manufacture,
        quantity,
        PackageInfo,
        imgPaths,      // Save imgPaths array
        APlusImgPaths, // Save APlusImgPaths array
      });

      await textModel.save(); // Save the document to the database 
      const textId = textModel._id;
      res.render("Preview", { textModel, textId });
    } catch (err) { 
      console.error(err); 
      res.status(500).send("An error occurred while uploading the files.");
    } 
  } else { 
    res.status(400).send("No files uploaded.");
  } 
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
}); 
