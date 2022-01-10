const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const http = require('http');
const server = http.createServer(app);
const { I18n } = require('i18n');
const path = require('path');
const cookieParser = require('cookie-parser');

const i18n = new I18n({
    locales: ['en', 'ru', 'it'],
    directory: path.join(__dirname, 'locales'),
    cookie: "lang"
});

const { Server } = require("socket.io");
const io = new Server(server);

const favicon = require('serve-favicon');
app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`)

app.use((req,res,next)=>{
    if(req.headers.host==="movc.xyz"||req.headers.host==="www.movc.xyz"||req.headers.host==="localhost") next();
    else res.redirect(`https://movc.xyz${req.originalUrl}`);
});

app.use(cookieParser());
app.use(i18n.init);
app.use("/public",express.static(`${__dirname}/public`));
app.use(favicon(`${__dirname}/public/favicon.png`));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 80;
const PASS = process.env.PASS || require("./secure.json").pass;
const URL = process.env.URL || require("./secure.json").url;
const VKTOKEN = process.env.VKTOKEN || require("./secure.json").vk;
const GCID = process.env.GCID || require("./secure.json").gcid;
const GCS = process.env.GCS || require("./secure.json").gcs;
const mongoClient = new MongoClient(URL, { useUnifiedTopology: true });
mongoClient.connect((err, client)=>{
    let db = client.db("movc");
    let skl = client.db("skl-bank");
	require("./routes")(app, db, PASS, filter, skl, VKTOKEN, GCID, GCS);
	require("./socket")(io,  db, PASS, filter);
});

server.listen(PORT, ()=>{ console.log(`Listening https on ${PORT}`)});

function filter( obj, filtercheck) {
    let result = {}; 
    Object.keys(obj).forEach((key) => { if (filtercheck(obj[key])) result[key] = obj[key]; })
    return result;
};