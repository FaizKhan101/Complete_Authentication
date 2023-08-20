const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;
async function connectToDatabase() {
  const client = await MongoClient.connect("mongodb://localhost:27017");
  database = client.db('auth-demo');
  return;
}

function getDb() {
    if (!database) {
        throw ({message: 'Could not connect to database!'})
    }
    return database;
}


exports.connectToDatabase = connectToDatabase;
exports.getDb = getDb;