const express = require('express');
const utilsRouter = express.Router();
const jwt = require('jsonwebtoken');

function requireUser(req, res, next) {
    if (!req.user) {
        next({
            name: "missingUserError",
            message: "You must be logged in to perform this action"
        });
    }
    next();
}
module.exports = {
    requireUser
};



