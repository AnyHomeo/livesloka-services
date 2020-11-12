// check env.
var env = "development";
// fetch env. config
var config = require("./config.json");
var envConfig = config[env];
// add env. config values to process.env
Object.keys(envConfig).forEach((key) => (process.env[key] = envConfig[key]));

// "MONGODB_URI": "mongodb+srv://liveslokaDev:8522p@cluster0.ox8do.mongodb.net/<Livesloka>?retryWrites=true&w=majority",
