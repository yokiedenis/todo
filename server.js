const express=require("express");
const mongoose= require("mongoose");
require("dotenv").config();
const validator=require("validator")
const bcrypt=require("bcrypt");
const session=require("express-session")
const mongoDbsession=require("connect-mongodb-session")(session);
const jwt =require("jsonwebtoken");
const path = require('path'); 




//constants
const app=express();
//use dotenv port for purposes of deployment.
//don't forget to create the .env file
const PORT=process.env.PORT;
const store=new mongoDbsession({
    uri:process.env.MONGO_URI,
    //note its sessions cause its like that stored in mongoDb
    collection:"sessions",
});
//to make image background in banner in html 
//enable static image work in node
app.use(express.static('images'));
app.use(express.static("public"));

//file-import
const userModel=require("./models/userModel")
const {isAuth}=require("./middlewares/authMiddleware");
const todoModel=require("./models/todoModel");
const rateLimiting=require("./middlewares/rateLimiting")
const {
    userDataValidation,
    generateJWTToken,
    sendVerificationEmail,
}=require("./utils/authUtil");

//middlewares
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(
    session({
        secret:process.env.SECRET_KEY,
        resave:false,
        saveUninitialized:false,
        store:store,
    })
);

//db connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("MongoDb connected successfully");
    })
    .catch((err)=>{
        console.log(err)
    });



//apis
app.get("/",(req,res)=>{
    return res.render("homePage")
})
app.get("/register",(req,res)=>{
    return res.render("registerPage")
})

app.post("/register",async(req,res)=>{
    const{name,email,username,password}=req.body;


    //data validation
    try{
        await userDataValidation({name,password,email,username});
    }catch(error){
        return res.send({
            status:400,
            message:"user data errorr",
            error:error,
        })
    }

     //check if email and username already exist or not
     const userEmailExist=await userModel.findOne({email});
     if(userEmailExist){
        return res.send({
            status:400,
            message:"Email already exist",
        })
     }

     const userUsernameExist=await userModel.findOne({username})
     if(userUsernameExist){
        return res.send({
            status:400,
            message:"username already exist",
        })
     }

     //hashed password
     const hashedpassword=await bcrypt.hash(
        password,
        parseInt(process.env.SALT)
     );

  //store the data in Db
  const userObj=new userModel({
    //schema : client
    name:name,
    email:email,
    username:username,
    // password:password,
    password:hashedpassword,
  });
  try{
    const userDb=await userObj.save();

    //generate a token
    const verifiedToken=generateJWTToken(email);

    //send a mail to user
    sendVerificationEmail(email,verifiedToken)

     // return res.send({
    //   status: 201,
    //   message: "Registeration successfull",
    //   data: userDb,
    // });
    return res.status(200).render("popup");
}catch(error){
    return res.send({
            status:900,
            message:"Database error",
            error:error,
        });
  }
});

app.get("/verifytoken/:token",async(req,res)=>{
    const token =req.params.token;
    const userEmail=jwt.verify(token,process.env.SECRET_KEY);
    console.log(userEmail);
    
    try{
        await userModel.findOneAndUpdate(
            {email:userEmail},
            {isEmailAuthenticated:true}
        );
        return res.redirect("/login");
    }catch(error){
        return res.send({
            status:500,
            message:"Database error",
            error:error,
        });
    }
});


app.get("/login",(req,res)=>{
    return res.render("loginPage");
})
app.post("/login",async(req,res)=>{
    const {loginId,password}=req.body;
    if(!loginId || !password){
        return res.send({
            status:400,
            message:"Missing credentials",
        })
    }

    //find the user from DB with loginId
    try{
        let userDb;
        if(validator.isEmail(loginId)){
            userDb=await userModel.findOne({email:loginId});
        }else{
            userDb=await userModel.findOne({username:loginId});
        }
        if(!userDb){
            return res.send({
                status:400,
                message:"user not found, please register",
            })
    }
    //if email is authenticated
    if(!userDb.isEmailAuthenticated){
        return res.send({
            status:400,
            message:"Please verify your email before login, check email app"
        })
    }

    //compare password
    const isMatched = await bcrypt.compare(password,userDb.password);

    if(!isMatched){
        return res.send({
            status:400,
            message:"password does not matched"
        });
    }
    //session based auth
    req.session.isAuth=true;
    req.session.user={
        userId:userDb.id,
        email:userDb.email,
        username:userDb.username,
    };
     // return res.send({
    //   status: 200,
    //   message: "Login successfull",
    // });
    return res.redirect("/dashboard")
    }catch(error){
        return send.res({
            status:500,
            message:"Database error",
            error:error,
        });
     
    }
});
app.get("/dashboard",isAuth,(req,res)=>{
    return res.render("dashboardPage")
});
app.post("/logout",isAuth,(req,res)=>{
    // id = req.session.id
  // sessionModel.findOneAndDelete({_id : id})
    req.session.destroy((err)=>{
        if(err){
            return res.status(500).json("logout unsucessful");
        }else{
            return res.status(200).redirect("/login");
        }
    });
});
app.post("/logout_from_all_devices",isAuth,async(req,res)=>{
    const username=req.session.user.username;

    //session Schema
    const sessionSchema=new mongoose.Schema({_id:String},{strict:false});
    const sessionModel=mongoose.model("session",sessionSchema);

    try{
        const deleteDb=await sessionModel.deleteMany({
            "session.user.username":username,
        });
        console.log(deleteDb);
        return res.status(200).redirect("/login");
    }catch(error){
        return res.status(500).json(error);
    }
});

//TODO api's
app.post("/create-item",isAuth,rateLimiting,async(req,res)=>{
    //todoText, username
    const todoText=req.body.todo;
    const username=req.session.user.username;

    //data validation
    if(!todoText){
        return res.status(400).json("Missing todo text.");
    }else if(typeof todoText !=="string"){
        return res.status(400).json("Todo is not a text");
    }else if(todoText.length<3 || todoText.length>200){
        return res.send({
            status: 400,
            message: "Todo length should be 3-200",
          });
    }

    const todoObj=new todoModel({
        todo:todoText,
        username:username,
    });
    
    try{
        const todoDb=await todoObj.save();
        return res.status(200).redirect("/dashboard")
    }catch(error){
        return res.send({
            status:500,
            message:"Database error",
            error:error,
        });
    }
});

app.get("/read-item",isAuth,async(req,res)=>{
    const username=req.session.user.username;
    const SKIP =Number(req.query.skip) || 0;
    const LIMIT=5;

    //mongoDb aggregate, skip, limit, match
    try{
        const todos=await todoModel.aggregate([
            {
                $match:{username:username},
            },
            {
                $facet:{
                    data:[{$skip:SKIP},{$limit:LIMIT}],
                },
            },
        ]);
        if(todos[0].data.length===0){
            return res.send({
                status:400,
                message:SKIP===0?"No todos found":"No more todos",
            });
        }
        return res.send({
            status:200,
            message:"Read success",
            data:todos[0].data,
        });
    }catch(error){
        return res.send({
            status:500,
            message:"Database error",
            error:error,
        });
    }
    // try{
    //     const todos=await todoModel.find({username});
    //     if(todos.length===0){
    //         return res.send({
    //             status:400,
    //             message:"No Todos found",
    //         });
    //     }
    //     return res.send({
    //         status:200,
    //         message:"Read success",
    //         data:todos,
    //     });
    // }catch(error){
    //     return res.send({
    //         status:500,
    //         message:"Database error",
    //         error:error,
    //     });
    // }
});

//id
//newData
app.post("/edit-item",isAuth,rateLimiting,async(req,res)=>{
    //id,todo,username
    const {id,newData}=req.body;
    const username =req.session.user.username;
    //find the todo
    try{
    const todoDb=await todoModel.findOne({_id:id});

        if(!todoDb)
            return res.send({
                status: 400,
                message: "Todo not found",
              }); 


    //check the ownership
    if(username!==todoDb.username)
        return res.send({
            status: 403,
            message: "Not authorized to edit the todo",
          });
    
        const prevTodo=await todoModel.findOneAndUpdate(
            {_id:id},
            {todo:newData},//{key1:val1,key2:val2}
        );
        return res.send({
            status:200,
            message:"Todo edited successfully",
            data:prevTodo,
        });
    }catch(error){
        return res.send({
            status:500,
            message:"Database error",
            error:error,
        });
    }
});

app.post("/delete-item",isAuth,rateLimiting,async(req,res)=>{
    const id =req.body.id;
    const username=req.session.user.username;

    if(!id) return res.status(400).json("Missing todo id");

    //find, compare, delete
    try{
        const todoDb=await todoModel.findOne({_id:id});

        if(!todoDb) return res.status(404).json(`todo not found with id :${id}`);

        if(todoDb.username!==username) 
            return res.status(403).json("Not allowed to delete, authorization failed");

        const deletedTodo=await todoModel.findOneAndDelete({_id:id});

        return res.send({
            status:200,
            message:"Todo deleted successfully",
            data:deletedTodo,
        });
    }catch(error){
        return res.send({
            status:500,
            message:"Database error",
            error:error,
        })
    }
});

app.listen(PORT,()=>{
    console.log("Server is running")
})