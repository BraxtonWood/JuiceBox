const {Client} = require('pg');

const client = new Client('postgres://juicebox_xm6n_user:Rqf2vJ5MXZnbP4jjEItlNK8gwR1LEXpD@dpg-cf83k8un6mplr40ufh70-a.oregon-postgres.render.com/juicebox_xm6n');




async function updateUser(id, fields = {}) {
    //build set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');

        // return early if this is called without fields
    if (setString.length === 0) {
        return;
    }
    try {
        const { rows: [user] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
        `, Object.values(fields));
        
        return user;
    } catch (error){
        throw error;
    }
}

async function getAllUsers() {
    const {rows} = await client.query(
        `SELECT id, username, name, location, active
        FROM users;
        `);
    return rows;
}

async function getAllTags() {
    const {rows} = await client.query(
        `SELECT *
        FROM tags;
        `);
    
    return rows;
}

async function createUser({ 
    username,
    password,
    name,
    location
}) {
    try {
        const { rows: [user] } = await client.query(`
            INSERT INTO users (username, password, name, location) 
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [ username, password, name, location ]);
        return user;
    } catch (error) {
        throw error;
    }
}

async function createPost({
    authorId,
    title,
    content,
    tags = []
}) {
    try {
        const {rows: [post] } = await client.query(`
            INSERT INTO posts ("authorId" , title, content)
            VALUES ($1, $2, $3)
            
            RETURNING *;
        `, [ authorId, title, content ]);

        const tagList = await createTags(tags);

        return await addTagsToPost(post.id, tagList);

    } catch (error) {
        throw error;
    }
}

async function createTags(tagList) {
    //console.log("createTags called, tagList", tagList);
    if(tagList.length === 0) {
        return;
    }
    const insertValues = tagList.map(
        (_, index) => `$${index + 1}`).join('), (');
        //$1), ($2), ($3), ($4
    //console.log("insertValues", (insertValues));

    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`).join(', ');
        //$1, $2, $3, $4
    //console.log("selectValues", (selectValues));
    
    try {
        await client.query(`
            INSERT INTO tags (name)
            Values (${insertValues})
            ON CONFLICT (name) DO NOTHING;
              
        `, tagList);
        const {rows} = await client.query(`
            SELECT * FROM tags
            WHERE name
            IN (${selectValues});
        `, tagList);
        return rows;
        
    } catch (error) {
        throw error;
    }
}

async function createPostTag(postId, tagId) {
    //console.log("createPostTag called", "postId:", postId, "tagId:", tagId);
    try {
        await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId]);
    } catch (error) {
        throw error;
    }
}

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );

        await Promise.all(createPostTagPromises);
        return await getPostById(postId);
    } catch (error) {
        throw error;
    }
}

async function getPostById(postId) {
    try {
        const { rows: [ post ] } = await client.query(`
            SELECT *
            FROM posts
            WHERE id=$1;
        `, [postId]);
        if (!post) {
            throw {
                name: "PostNotFoundError",
                message: "Could not find a post with that postId"
            };
        }

        const { rows: tags } = await client.query(`
            SELECT tags.*
            FROM tags
            JOIN post_tags ON tags.id=post_tags."tagId"
            WHERE post_tags."postId"=$1;
        `, [postId]);

        const { rows: [author] } = await client.query(`
            SELECT id, username, name, location
            FROM users
            WHERE id=$1;
        `, [post.authorId]);


    //console.log("tags:",tags);
    const tagArray = tags.map(tag => tag.name);
    //console.log("tagArray:", tagArray);
    post.tags = tagArray;
    post.author = author;
    delete post.authorId;

    return post;
    } catch(error) {
        throw error;
    }
}

async function updatePost(postId, fields = {}) {
    console.log("updatePost id", postId);
    console.log("updatePost fields", fields);

    const { tags } = fields;
    delete fields.tags;



    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1}`
    ).join(', ');
    // if (setString.length === 0){
    //     return;
    // }
    try{
        if (setString.length > 0) {
            await client.query(`
                UPDATE posts
                SET ${ setString }
                WHERE id=${ postId }
                RETURNING *;
            `, Object.values(fields));
        }
        if (tags === undefined){
            return await getPostById(postId);
        }

        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(
            tag => `${ tag.id }`
        ).join(', ');

        await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString} )
        AND "postId" = $1;
        `, [postId]);
        
        await addTagsToPost(postId, tagList);
        return await getPostById(postId);

    } catch (error) {
        throw error;
    }
}

async function getAllPosts() {
    try{
        const  {rows: postIds}  = await client.query(
            `SELECT id
            FROM posts;
            `);
            //console.log(rows)
            const posts = await Promise.all(postIds.map(
                post => getPostById( post.id )
            ));
        return posts;
    } catch (error) {
        throw error;
    }
}

async function getPostsByUser(userId) {
    //console.log("getPostsByUser(",userId);
    try{
        const { rows } = await client.query(`
            SELECT id FROM posts
            WHERE "authorId"=${ userId };
            `);
        //console.log("rows", rows);
        const postIds = rows
        const posts = await Promise.all(postIds.map(
            post => getPostById( post.id )
        ))
        //console.log("posts", posts);
        return posts;
    } catch (error) {
        throw error;
    }
}

async function getUserById(id){
    try{
        const { rows } = await client.query(`
            SELECT * FROM users
            WHERE id=${id}
            `);
        //console.log("query for get UserById", rows)
        if(1 === 0){//rows.length === 0
            return null;
        }else{
           
            const posts = await getPostsByUser(id);
            //console.log("getpostsByUser:", posts)
            
            rows[0].password = "password hidden";
            //console.log("userPosts", posts);
            //onsole.log("user rows", rows);
            //console.log(rows, posts);
            rows.push(posts);
            return rows;
        }
    } catch (error) {
        throw error;
    }
}

async function getUserByUsername(username) {
    try {
        const {rows: [user] } = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
        `, [username]);

        return user;
    } catch (error) {
        throw error;
    }
}

async function getPostsByTagName(tagName) {
    try {
        const { rows: postIds } = await client.query(`
            SELECT posts.id
            FROM posts
            JOIN post_tags ON posts.id=post_tags."postId"
            JOIN tags ON tags.id=post_tags."tagId"
            WHERE tags.name=$1;
            `, [tagName]);
        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
    } catch (error){
        throw error;
    }
}




module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    getUserById,
    addTagsToPost,
    createTags,
    getPostsByTagName,
    getAllTags,
    getUserByUsername,
    getPostById
}
