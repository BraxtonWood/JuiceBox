//TO RUN____ npm run seed:dev


const {
    client,
    getAllUsers,
    createUser
} = require('./index');

async function createInitialUsers() {
    try {
        console.log('Starting to ceate users...');

        const albert = await createUser({username: 'albert' , password: 'bertie99' });
        //console.log(albert);
        const sandra = await createUser({username: 'sandra' , password: '2sandy4me' });
        
        const glamgal= await createUser({username: 'glamgal' , password: 'soglam' });
        
        
        console.log('Finished creating users!');
    } catch(error){
        console.error('Error creating users!');
        throw error;
    }
}

async function dropTables() {
    try {
        console.log('Starting to drop tables...');


        await client.query(`
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
            password varchar(225) NOT NULL
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

    }catch (error){
        console.error(error);
    }// finally {
    //     client.end();
    // }
}

async function testDB() {
    try {
        console.log('Starting to test database...');
        //connect the client to the database, finally
        //client.connect();
        const users = await getAllUsers();
        console.log('getAllUsers:', users);
        console.log('Finished database tests!');
        // queries are promises, so we can await them
        //const {rows} = await client.query(`SELECT * FROM users;`);

        // for now, loggin is a fine way to see whats up
        //console.log({rows});
    } catch (error) {
        console.error("Error testing database!");
        throw error;
    // } finally {
    //     // it's important to close out the client connection
    //     client.end();
    // }
}

}


rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());