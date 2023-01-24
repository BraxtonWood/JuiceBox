//npm run start:dev




require('dotenv').config();

//console.log(process.env.JWT_SECRET);

const PORT = 3000;
const express = require('express');
const server = express();


const morgan = require('morgan');
server.use(morgan('dev')); //logs out the incoming request (METHOD, ROUTE, RESPONSE CODE, RESPONSE TIME)

server.use(express.json());

const { client } = require('./db');
client.connect();

server.listen(PORT, () => {
    console.log('The server is up on port:', PORT)
});

server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END______>");

    next();
});

// server.use('/api', (req, res, next) => {
//     console.log("A request was made to /api");
//     next();
//   });
  
// server.get('/api', (req, res, next) => {
//     console.log("A get request was made to /api");
//     res.send({ message: "success" });
//   });

const apiRouter = require('./api');
server.use('/api', apiRouter);



