const express=require('express');
const app=express();
const cors=require("cors");
const mongoose=require("mongoose");
require("dotenv").config()
const userRoutes=require("./controllers/usercontrollers")

const bodyParser=require("body-parser");
app.use(bodyParser.json())

app.use(cors());
app.use("/",userRoutes)

mongoose.connect("mongodb+srv://naveen:1234567890@userscluster.f5u9fkr.mongodb.net/?retryWrites=true&w=majority&appName=userscluster").then(()=>{
    app.listen(5000,()=>{
        console.log("running.....")
    });
}).catch((err)=>{
    console.log(err)
});
const connection=mongoose.connection;

