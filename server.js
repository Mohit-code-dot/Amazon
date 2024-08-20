const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const fs = require("fs");
const util = require("util");
// const unlinkFile = util.promisify(fs.unlink);
const unlinkFile = util.promisify(fs.unlink);
const cloudinary = require("cloudinary").v2;
const ImageModel = require("./imageSchema");     
const TextModel = require("./textSchema");    
const port = 5000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));    
app.set("view engine", "ejs");
app.use(express.static("public")); 
app.use(express.static(path.join(__dirname,"public")));

 
// Configuration
cloudinary.config({ 
  cloud_name: 'dgsvocf0w', 
  api_key: '769681361645176', 
  api_secret: 'mHZbyzlvJkB7UJgbcixvLXUszCg' // Click 'View API Keys' above to copy your API secret
});


const storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
      cb(null, './public/uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + path.extname(file.originalname))
    }
  })

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
  
  const upload = multer({ 
    storage: storage,
    limits : {fileSize:100000000},
    fileFilter: function(req,file,cb){
        checkFiletype(file,cb);
    }
 }).any()
 function checkFiletype (file, cb) {
    const fileType = /jpeg|png|jpg/
    const extname = fileType.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileType.test(file.mimetype)

    if(mimetype && extname){
        return cb(null, true)
    }else{
        cb("Please Upload Image Only"); 
    }
}

app.get("/", (req,res)=>{
    let images = [];
    fs.readdir("./public/uploads",async(err,files)=>{
      if(!err){ 
        files.forEach((file)=>{
          images.push(file); 
          }); 
          res.render("index",{images:images});
      }else{
        console.log(err)   
      }
    })
})

app.post("/upload", async (req, res) => {
  upload(req, res, (err) => {
    if (!err && req.files != "") {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i]; 
        const filePath = `./public/uploads/${file.filename}`;
        const cloudinaryOptions = {
          folder: 'your_folder_name', // optional
          public_id: file.filename,  
          overwrite: true,
        }; 

        cloudinary.uploader.upload(filePath, cloudinaryOptions)
          .then(async(result) => { 
            console.log(result);
            const image = new ImageModel({ 
              imgpath: result.secure_url
              });
               await image.save();
              res.send("Image uploaded successfully");
              unlinkFile(filePath);
          }) 
          .catch((error) => { 
            console.log(error);
          });
      }
      res.status(200).send();
    } else if (!err && req.files == "") {
      res.statusMessage = "Please Select An Image To Upload";
      res.status(400).end();
    } else {
      res.statusMessage = (err === "Please Select An Image To Upload") ? err : "Photo Exceed Limit Of 1MB";
      res.status(400).end();
    }
  });
})

app.post("/",async(req,res)=>{
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

  const user = new TextModel({
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
  });
  await user.save();
  res.send("SuccessFull");
})


app.put("/deleteImage",(req,res)=>{
    const deleteImages = req.body.deleteImages;
    if(deleteImages == ""){
        res.statusMessage = "Please Select An Image To Delete"
        res.status(400).end() 
    } else{ 
      deleteImages.forEach((image)=>{
        unlinkFile("./public/uploads/"+image);
      })
        res.statusMessage = "Successfully Deleted"  
        res.status(200).end()
    }
})

app.listen(port,()=>{  
    console.log(`server is running on port ${port}`)
}) 
 