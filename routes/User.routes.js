import express from 'express';
import { client } from '../server.js';
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import * as dotenv from 'dotenv'
import { CreateUser, getUserByEmail, getUserByName } from '../service/User.service.js';
dotenv.config();
import nodemailer from "nodemailer";
import {auth} from '../middleware/auth.js'


async function genHashedPassword(password){
    const NO_OF_ROUND = 10;
    const salt = await bcrypt.genSalt(NO_OF_ROUND);
    const hashedPassword = await bcrypt.hash(password,salt);
    console.log(salt);
    console.log(hashedPassword);
    return hashedPassword;
  }
  
    router.post('/signup', async function(request, response){
      const {name,email,password,mobile} = request.body; 
      console.log(request.body)
  
      const userFromDb = await getUserByName(email);
  
      if(userFromDb){
        response.status(400).send({msg:"User Already Exist"})
      }else{
        const hashedPassword = await genHashedPassword(password);
        console.log(password, hashedPassword)
        const result = await CreateUser({
          name:name, 
          email:email,
          password:hashedPassword,
          mobile:mobile
        });
        response.send(result)
      }
    })

    router.post('/login', async function(request, response){ //done
        const {email,password} = request.body;  
        const userFromDb = await getUserByName(email);
        if(!userFromDb){
          response.status(400).send({msg:"Invalid Credentials or user doesnot exist"})
        }
        else{
        const storedPassword = userFromDb.password;
        const isPasswordMatch = await bcrypt.compare(password, storedPassword); 
        console.log(password,storedPassword)
        if(isPasswordMatch){
          const token = jwt.sign({id:userFromDb._id,email}, process.env.SECRET_KEY)
          response.send({msg:"Login Successfully",token:token,userDetail:userFromDb})
          console.log(token)
        }else{
          response.status(400).send({msg:"Invalid Credentials"})
        }
        }
      })

      router.post('/forgotPassword', async function(request,response){ //done
        const { email } = request.body;
        try {
          if (!email) {
            response.status(400).send({msg:"Invalid Credentials"})
          } else {
            if (email) {
              const userFromDb = await getUserByName(email); 
              const token = jwt.sign({id:userFromDb._id},process.env.SECRET_KEY,{
                expiresIn:120000
              }); // continue from here
    
              const setuserToken = await client.db('chatapp').collection('users').findOneAndUpdate({email:userFromDb.email},{ $set:{verifyToken:token}},{returnDocument:"after"}); 
              if(setuserToken){
                var transporter = await nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD
                  }
                });
                var mailOptions = {
                  from:process.env.EMAIL,
                  to:email,
                  subject:"mail to reset Password",
                  text:`This Link valid for 2 minutes - "${process.env.NETLIFY_URL}/${email}/${setuserToken.value.verifyToken}"`
                }
                transporter.sendMail(mailOptions,(error,info) => {
                  if(error){
                    response.status(401).send({msg:"Email Not Send"})
                  }else{
                    response.status(201).send({msg:"Email Sent Successfully"})
                  }
                })
              }
              
            }else{
              response.status(400).send({msg:"Invalid Credentials"})
            }
          }
    
        }catch(error){
          response.status(400).send({msg:"Invalid Credentials"})
        }
    
      })
    
      router.post("/:email/:token", async function(request,response){
        const {email,token} = request.params;
        const {password} = request.body;
        try{
          const validuser = await client.db('chatapp').collection('users').findOne({email:email,verifyToken:token});
          if(validuser){
            const newhashedPassword = await genHashedPassword(password);

            console.log(newhashedPassword,"hashed password in reset password");

            const setnewuserPassword = await client.db('chatapp').collection('users').updateOne({email:email},{ $set:{password:newhashedPassword}},{ $unset: {verifyToken:1}})  
            const removeToken = await client.db('chatapp').collection('users').updateOne({email:email},{ $unset: {verifyToken:1}})  
            console.log(setnewuserPassword, removeToken)
            response.send({
              msg:"Success"
            })
          }else{
            response.send({
              msg:"User not exist"
            })
          }
        }catch(error){
          response.status(400).send({msg:"User not exist"})
        }
      }) // done
    

      router.get('/getDetails/:email', async function(request,response){
        let {email} = request.params
        console.log(request.params)
        const result = await getUserByEmail(email);
        console.log(result)
        response.send(result)
      })


  export default router