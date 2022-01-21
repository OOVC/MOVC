"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const mongodb_1 = require("mongodb");
const http = require("http");
const i18n_1 = require("i18n");
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const utils_1 = require("./utils");
const utils_2 = require("./utils");
(0, utils_2.initConfig)();
const app = express();
const server = http.createServer(app);
const i18n = new i18n_1.I18n({
    locales: ["en", "ru", "it"],
    directory: (0, utils_1.rootPlusPath)("locales"),
    cookie: "lang",
});
app.set("view engine", "ejs");
app.set("views", (0, utils_1.rootPlusPath)("views"));
app.use((req, res, next) => {
    if (req.headers.host === "movc.xyz" ||
        req.headers.host === "www.movc.xyz" ||
        req.headers.host === "localhost")
        next();
    else
        res.redirect(`https://movc.xyz${req.originalUrl}`);
});
app.use(cookieParser());
app.use(i18n.init);
app.use("/public", express.static((0, utils_1.rootPlusPath)("public")));
app.use(favicon((0, utils_1.rootPlusPath)("public", "favicon.png")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const mongoClient = new mongodb_1.MongoClient(global.movc.URL, {
    useUnifiedTopology: true
});
mongoClient.connect((err, client) => {
    let db = client.db("movc");
    let skl = client.db("skl-bank");
    require("./routes")(app, db, skl);
});
server.listen(global.movc.PORT, () => {
    console.log(`Listening https on ${global.movc.PORT}`);
});
