const mongoose=require("mongoose");
const Schema = mongoose.Schema;

const userSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    username:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
type:String,
required:true,
    },
    isEmailAuthenticated:{
        type:Boolean,
        required:true,
        default:false,
    },
});

module.exports=mongoose.model("user",userSchema);