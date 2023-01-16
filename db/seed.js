//TO RUN____ npm run seed:dev


const {
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
    getPostsByTagName
} = require('./index');

async function createInitialUsers() {
    try {
        console.log('Starting to ceate users...');

        const albert = await createUser({username: 'albert' , password: 'bertie99', name: 'albert', location: 'alberta, canada' });
        //console.log(albert);
        const sandra = await createUser({username: 'sandra' , password: '2sandy4me', name: 'sandra', location: 'venice beach, california' });
        
        const glamgal= await createUser({username: 'glamgal' , password: 'soglam', name: 'glamladriel', location: 'rivendel, middle earth' });
        
        
        console.log('Finished creating users!');
    } catch(error){
        console.error('Error creating users!');
        throw error;
    }
}

async function createInitialPosts() {
    try {
        console.log('Starting to create posts...');
        const [albert, sandra, glamgal] = await getAllUsers();
        //console.log("albert.id", albert.id);
        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
            tags: ["#happy", "#youcandoanything"]
        });
        await createPost({
            authorId: sandra.id,
            title: "Sandies First Post",
            content: "Wow I'm so excited to be sharing every single thought that appears in my head here.",
            tags: ["#happy","#worst-day-ever"]
        });
        await createPost({
            authorId: glamgal.id,
            title: "Wait wuuuut??",
            content: "I thought this was just for like, just other people's words, like not my own like, words",
            tags: ["#happy","#youcandoanything","#batmandoeverything"]
        });
    }catch (error) {
        throw error;
    }
}

// async function createInitialTags() {
//     try {
//         console.log("Starting to create tags...");

//         const [happy, sad, inspo, batman] = await createTags([
//             '#happy',
//             '#worst-day-ever',
//             '#youcandoanything',
//             '#batmandoeverything'
//         ]);
//         console.log("Tags Created");
//         const [postOne, postTwo, postThree] = await getAllPosts();
//         console.log("fetched init posts")
//         await addTagsToPost(postOne.id, [happy, inspo]);
//         await addTagsToPost(postTwo.id, [sad, inspo]);
//         await addTagsToPost(postThree.id, [happy, batman, inspo]);
//         console.log("Finished creating tags!");
//     } catch (error){
//         throw error;
//     }
// }

async function dropTables() {
    try {
        console.log('Starting to drop tables...');


        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS users;
        `);
        
        console.log('Finished dropping tables!');
    } catch(error){
        console.error("Error dropping tables!");
        throw error; // we pass the error up to the function that class dropTables
    }
}
async function createTables() {
    try {
        console.log('Starting to build tables...');
        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(225) UNIQUE NOT NULL,
            password varchar(225) NOT NULL,
            name VARCHAR(225) NOT NULL,
            location VARCHAR(225) NOT NULL,
            active BOOLEAN DEFAULT true
        );
        `);
        
        await client.query(`
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(225) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        `);

        await client.query(`
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(225) UNIQUE NOT NULL
        );
        `);

        await client.query(`
        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId", "tagId")
        );
        `);


        console.log('Finished building tables!');
    } catch (error){
        console.error('Error building tables!');
        throw error; // we pass the error up to teh function that calls create tables
    }
}
async function rebuildDB() {
    try {
        client.connect();

        await dropTables();
        await createTables();
        
        await createInitialUsers();
        await createInitialPosts();
        //await createInitialTags();

    }catch (error){
        console.error(error);
    }// finally {
    //     client.end();
    // }
}

async function testDB() {
    try {
        console.log('Starting to test database...');
        //console.log('calling getAllUsers:');
        const users = await getAllUsers();
        //console.log("Result:", users);
        
        //console.log('calling updateUser on users[0]');
        // const updateUserResult = await updateUser(users[0].id, {
        //     name: "Newname Sogood",
        //     location: "Lesterville, KY"
        // });
        //console.log("RESULT:", updateUserResult);

        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log("Result:", posts);

        //console.log("posts[0].id", posts[0].authorId);
        //console.log("Calling updatePost on posts[0]");
        console.log("posts[0].id", posts[0].id);
        const updatePostResult = await updatePost((posts[1].id), {
            title: "New Title",
            content: "Updated Content"
        });
        console.log("Result:", updatePostResult);

        console.log("Calling getUserById with 1");
        const albert = await getUserById(1);
        console.log("Result:", albert);

        console.log("Calling updatePost on posts[1], only updating tags");
        const updatePostTagsResult = await updatePost(posts[1].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log("Result", updatePostTagsResult);

        console.log("Calling getPostsByTAgName with #happy");
        const postsWithHappy = await getPostsByTagName("#happy");
        console.log("Result:", postsWithHappy);
        



        console.log('Finished database tests!');
        // queries are promises, so we can await them
        //const {rows} = await client.query(`SELECT * FROM users;`);

        // for now, loggin is a fine way to see whats up
        //console.log({rows});
    } catch (error) {
        console.error("Error testing database!");
        throw error;
   
}

}


rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());