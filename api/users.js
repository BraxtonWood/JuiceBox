require('dotenv').config()
const express = require('express');
const usersRouter = express.Router();
const { getAllUsers, getUserByUsername, createUser } = require('../db');
const jwt = require('jsonwebtoken');

//const token = jwt.sign({ username:`${username}` }, process.env.JWT_SECRET)
//usersRouter.use(express.json())



usersRouter.post('/login', async (req, res, next) => {
    
    const { username, password } = req.body;

    console.log(username, password);
    
    
    //console.log("token:", token);
    //const recoveredData = jwt.verify(token, 'server secret');
    //console.log("recoveredData:", recoveredData);


    //requests must have both
    if ( !username || !password ) {
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }
    
    try {
        console.log("attempting to get User")
        const user = await getUserByUsername(username);
        console.log("user:", user);
        if (user && user.password == password) {
            const id = user.id;
            const token = jwt.sign({ id: id, username: username }, process.env.JWT_SECRET)
            console.log("token:", token);
            // create token & return to user
            res.send({ message: "you're logged in!", "token":`${token}` });
        } else {
            next({
                name: 'IncorrectCredentialsError',
                message: 'Username or password is incorrect'
            });
        }

    } catch(error) {
        console.error(error);
        next(error);
    }
});

usersRouter.post('/register', async (req, res, next) => {
    const {username, password, name, location } = req.body;

    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists'
            });
        }
        
        const user = await createUser({
            username,
            password,
            name,
            location
        });

        const token = jwt.sign({
            id: user.id,
            username
        }, process.env.JWT_SECRET, {
            expiresIn: '1w'
        });

        res.send({
            message: "thank you for signing up",
            token
        });
    } catch ({ name, message }) {
        next({name, message})
    }
});


// usersRouter.use((req, res, next) => {
//     console.log("A request is being made to /users");

//     next();
// });



usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();
    
    
    res.send({
        users
    });
});


module.exports = usersRouter;