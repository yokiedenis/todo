const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const todoSchema=new Schema({
    todo:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required:true,
    }
});

//if the model is sharing with another model
module.exports = mongoose.models['todo'] || mongoose.model("todo",todoSchema);