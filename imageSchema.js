const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    imgpath:String
});
const imageModel = new mongoose.model("image",userSchema);
module.exports = imageModel; 
