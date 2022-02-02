import * as express from "express";
import { MongoClient } from "mongodb";
import * as http from "http";
import { I18n } from "i18n";
import * as cookieParser from "cookie-parser";
import * as favicon from "serve-favicon";
import { rootPlusPath } from "./utils";
import { initConfig } from "./utils";
initConfig();

const app: express = express();
const server: http.Server = http.createServer(app);

const i18n: I18n = new I18n({
  locales: ["en", "ru", "it"],
  directory: rootPlusPath("locales"),
  cookie: "lang",
});

app.set("view engine", "ejs");
app.set("views", rootPlusPath("views"));

app.use((req, res, next): void => {
  if (
    req.headers.host === "movc.xyz" ||
    req.headers.host === "www.movc.xyz" ||
    req.headers.host === "localhost"
  )
    next();
  else res.redirect(`https://movc.xyz${req.originalUrl}`);
});

app.use(cookieParser());
app.use(i18n.init);
app.use("/public", express.static(rootPlusPath("public")));
app.use(favicon(rootPlusPath("public", "favicon.png")));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const mongoClient: MongoClient = new MongoClient(global.movc.URL, {
  useUnifiedTopology: true,
});

mongoClient.connect((err, client) => {
  let db = client.db("movc");
  let skl = client.db("skl-bank");
  require("./routes")(app, db, skl);
});

server.listen(global.movc.PORT, () => {
  console.log(`Listening https on ${global.movc.PORT}`);
});
