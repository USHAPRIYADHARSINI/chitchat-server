import express from "express"; // "type": "module"
// https://socket.io/docs/v3/server-initialization/#with-express ----REFER THIS LINK FOR ANY SOCKET DOUBTS
import { MongoClient } from "mongodb";
import * as dotenv from 'dotenv';
dotenv.config()
import cors from 'cors';
// import productRouter from './routes/products.route.js'
import userRouter from './routes/User.routes.js'

import {createServer} from 'http';
// const http = require('http');


// const { Server } = require('socket.io');
import { Server } from 'socket.io';

const app = express();

const server = createServer(app);

const io = new Server(server,{
    cors: {
      origin: [`${process.env.NETLIFY_URL}`],
      credentials: true
    }});

    
app.use(express.json());
app.use(cors());
// app.use("/dailyDress", productRouter);
app.use('/api/users', userRouter);

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL
const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("MongDB connected");


app.get("/", function (request, response) {
  response.send("🙋‍♂️, 🌏 🎊✨🤩");
});


io.on('connection', socket => {
    const id = socket.handshake.auth
    socket.join(id)
    console.log(id,'from backend')
    socket.on('send-message',({ recipients , text }) => {
        recipients.forEach(recipient =>{
            const newRecipients = recipients.filter(r => r !== recipient )
            newRecipients.push(id)
            socket.broadcast.to(recipient).emit('receive-message',{
                recipients: newRecipients , sender: id , text
            })
        })
    })
})


// app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
server.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
export {client}
// server.listen(PORT)


// A FORMAAT FROM SOCKET.IO TO CONNECT TO AN EXISTING HTTP SERVER
// https://socket.io/docs/v3/server-initialization/#with-express ----REFER THIS LINK FOR ANY SOCKET DOUBTS

// const httpServer = require("http").createServer();
// const options = { /* ... */ };
// const io = require("socket.io")(httpServer, options);

// io.on("connection", socket => { /* ... */ });

// httpServer.listen(3000);

// CONNECTION OF SOCKET.IO WITH EXPRESS

// const app = require("express")();
// const httpServer = require("http").createServer(app);
// const options = { /* ... */ }; ----CORS DETAILS SHOULD BE PROVIDED INSTEAD OF OPTIONS
// const io = require("socket.io")(httpServer, options);

// io.on("connection", socket => { /* ... */ });

// httpServer.listen(3000);
// WARNING !!! app.listen(3000); will not work here, as it creates a new HTTP server