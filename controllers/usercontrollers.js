const express=require("express");
const router=express.Router();
const { ObjectId } = require('mongoose').Types;
const bcrypt=require("bcrypt");
const mongoose=require("mongoose");
const crypto = require('crypto');
const jwt=require("jsonwebtoken");
require("dotenv").config()
const nodemailer=require("nodemailer")

const connection = mongoose.connection;

const transporter = nodemailer.createTransport({
    service: 'gmail', // Your email service provider
    auth: {
        user:process.env.EMAIL_USER, // Your email address from environment variable
        pass:process.env.EMAIL_PASS,// Your email password from environment variable
    }
    ,debug:true,
});


const db = connection.useDb("users");

const users = db.collection("user");
function verifyToken(req, res, next) {
    let token = req.headers.authorization;
    const tokenParts = token.split(' ');
    token=tokenParts[1];



    console.log(token);
    if (!token) {
        return res.status(401).json({ message: 'Token is missing' });
    }

    // Get the user from token (assuming the user object is stored in token)
    const decoded = jwt.decode(token);
    console.log(decoded);
    
    if (!decoded || !decoded.username) {
        console.log("here////")
        return res.status(401).json({ message: 'Invalid' });
    }

    // No need to generate secret key again, use the one obtained during token creation

    jwt.verify(token,process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("here.")
            return res.status(401).json({ message: 'Invalid' });
        }
        console.log(Date.now());
        console.log(decoded.exp*1000);

        // Check token expiration
        if (Date.now() >= (decoded.exp) * 1000) {
            return res.status(401).json({ message: 'Invalid' });
        }

        // Token is valid, move to the next middleware
        next();
    });
}




function generateSecretKey(user) {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');

    // Use the salt and the user's username to create the secret key
    return crypto.pbkdf2Sync(user.username, salt, 1000, 64, 'sha512').toString('hex');
}



router.post("/Signup",async (req,res,next)=>{
    
    console.log("in function");
    try{
       const {username,email,password}=req.body;
       const existinguser=await users.findOne({email});
       if(existinguser){
        return res.json({msg:"email already exists",status:400})
       } 
       
       const hashedpassword=await bcrypt.hash(password,10);
       const user= await users.insertOne({
        username,
        email,
        password:hashedpassword,
        setavatar:false,
        avatarimage:"",
       
       })
       const insertedData={
        username,
        email,
        _id: user.insertedId,
        setavatar:false,
        avatarimage:"",
        
        


       }
       console.log("insert")
       console.log(insertedData);
       console.log(user);
       delete user.password;
       const secretKey =process.env.SECRET_KEY;
       console.log(secretKey)
    

       // Generate JWT token with 15 minutes expiration
       const token =await jwt.sign(insertedData, secretKey, { expiresIn: '15s' });
        if(token)     { 
            console.log(insertedData)
            const mailOptions = {
                from: '"Naveen" naveenkumar171837@gmail.com', // Sender address
                to: `${email}`, // List of receivers
                subject: 'successfull login into new social media', // Subject line
                text: 'hello hope this email finds you well', // Plain text body
                html: '<b>thank you for signing for our website .Explore more !! </b>' // HTML body
            };
            
            // Send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            });
       return res.json({user:insertedData,token,status:200}
        )}
    }
    catch(err){
  next(err);
    }

});
router.get("/posts",verifyToken,(req,res,next)=>{
   res.json({message:"valid"});
})

router.post("/Login",async (req,res,next)=>{
    try{
    
    const {email,password}=req.body;
    console.log(email,password)
    const existinguser=await users.findOne({email});
 
 if(!existinguser){
    return res.json({msg:"email is not registered",status:400})
}
   
    const passwordvalidity= await bcrypt.compare(password,existinguser.password);
    
    console.log(passwordvalidity)
   
    if(existinguser && !passwordvalidity){
        
        return res.json({msg:"invalid credentials",status:400})
    }
    if(existinguser && passwordvalidity){
        console.log(existinguser)
        const secretKey =process.env.SECRET_KEY;

    // Generate JWT token with 15 minutes expiration
    const token =await jwt.sign(existinguser, secretKey, { expiresIn: '15s' });
             if(token){
            

               return res.json({user:existinguser,token,status:200})
            }
    }}
    catch(err){
        next(err)
    }
})

module.exports=router;