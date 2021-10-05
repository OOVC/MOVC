const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);

const favicon = require('serve-favicon');
app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`)

app.use((req,res,next)=>{
    if(req.headers.host==="movc.xyz"||req.headers.host==="www.movc.xyz"||req.headers.host==="localhost") next();
    else res.redirect(`https://movc.xyz${req.originalUrl}`);
});

app.use("/public",express.static(`${__dirname}/public`));
app.use(favicon(`${__dirname}/public/favicon.ico`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 80;
const PASS = process.env.PASS || require("./secure.json").pass;
const URL = process.env.URL || require("./secure.json").url;
const VKTOKEN = process.env.VKTOKEN || require("./secure.json").vk;
const mongoClient = new MongoClient(URL, { useUnifiedTopology: true });
mongoClient.connect((err, client)=>{
    let db = client.db("movc");
    let skl = client.db("skl-bank");
	require("./routes")(app, db, PASS, filter, skl, VKTOKEN);
	require("./socket")(io,  db, PASS, filter);
});

app.listen(PORT, ()=>{ console.log(`Listening https on ${PORT}`)});

function filter( obj, filtercheck) {
    let result = {}; 
    Object.keys(obj).forEach((key) => { if (filtercheck(obj[key])) result[key] = obj[key]; })
    return result;
};