const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const { requireUser } = require('./utils');

postsRouter.use((req, res, next) => {
    console.log("A request is being made to /posts");

    next();
});

postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;
    //console.log("req.user[0].id", req.user[0].id);
    const id = req.user[0].id;
    const tagArr = tags.trim().split(/\s+/)
    const postData = {};

    if (tagArr.length) {
        postData.tags = tagArr;
    }
    //console.log("title:", title, "id", id);
    try {
        postData.authorId = id;
        postData.title = title;
        postData.content = content;
        //console.log("postData:", postData);
        const post = await createPost(postData);

        res.send({post});
    } catch ({ name, message }) {
        next({name: "CannotCompletePostError", message: "Fields missing or invalid"})
    }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;
    const updateFields = {};

    if ( tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }

    if ( title ) {
        updateFields.title = title;
    }

    if ( content ) {
        updateFields.content = content;
    }

    try {
        //console.log("postId", postId);
        const originalPost = await getPostById(postId);
        //console.log('originalPost', originalPost);
        //console.log(originalPost.author.id);
        //console.log("req.user", req.user[0].id);
        if (originalPost.author.id === req.user[0].id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({ post: updatedPost })
        } else {
            next({
                name: 'UnauthorizedUserError',
                message: 'You cannot update a post that is not yours'
            })
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const post = await getPostById(req.params.postId);
        
        if (post && post.author.id === req.user[0].id) {
            const updatedPost = await updatePost(post.id, { active: false});

            res.send({ post: updatedPost });
        } else {
            next(post ? {
                name: "UnauthorizedUserError",
                message: "You cannot delete a post which is not yours"
            } : {
                name: "PostNotFoundError",
                message: "That post does not exist"
            });
        }
    } catch ({name, message}) {
        next({name, messsage})
    }
});






postsRouter.get('/', async (req, res) => {
    const allPosts = await getAllPosts();
    console.log('req.user',req.user,'allPosts', allPosts, "req.user", req.user);
    const posts = allPosts.filter(post => {
        return post.active || (req.user && post.author.id === req.user[0].id);
    })

    res.send({
        posts
    });
});

module.exports = postsRouter;