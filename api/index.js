const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
const { JWT_SECRET } = process.env;

const express = require('express');
const apiRouter = express.Router();

apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');

    if(!auth) { //Browser has no saved token, or Authorization header was not set
        next(); 
    }

    else if (auth.startsWith(prefix)) { //Authorization header was set, and has Bearer 
        const token = auth.slice(prefix.length);

        try {
            const { id } = jwt.verify(token, process.env.JWT_SECRET); // decrypt and verify token, 

            if (id) {
                req.user = await getUserById(id);
                //console.log("req.user line 24 index.js/api", req.user) // if valid token, read user from database
                next();
            }
        } catch ({ name, message }) {// if NOT valid token, pass on name and message to next()
            next({ name, message });
        }
    }

     else {
        next({ //If header wasnt formed correctly send error message to next()
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${ prefix }`
        });
    }
});

apiRouter.use((req, res, next) => {
    console.log("apiRouter.use called with req.user");
    if (req.user) {
        console.log("user is set:", req.user);
    }

    next();
});




const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);

apiRouter.use((error, req, res, next) => { //if the parent router (api/index.js) calls next with an object (rather than just next()),
    res.send({                              // we will skip straight to the error handling middleware and send back the object to the front-end.
        name: error.name,
        message: error.message
    });
});



module.exports = apiRouter;