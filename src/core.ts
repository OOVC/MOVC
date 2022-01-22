import { sha3_224 as sha3 } from "js-sha3";
import { Collection, Db } from "mongodb";
import { addCountryResp } from "./interfaces";
import * as utils from "./utils";
import { Logger as Vkbot } from "./vk-logger";

export class Core {
  db: Db;
  countries: Collection;
  pending: Collection;
  deleted: Collection;
  currencies: Collection;
  vklog: Vkbot;
  constructor(db) {
    this.countries = db.collection("countries");
    this.pending = db.collection("pending-countries");
    this.deleted = db.collection("deleted-countries");
    this.currencies = db.collection("currencies");
    this.vklog = new Vkbot(global.movc.VKTOKEN);
  }
  public checkCaptcha(req, res, next): void {
    if (req?.recaptcha?.error && !(req.query.pass || req.body.pass)) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("Подтвердите, что вы человек");
      return;
    } else next();
  }
  public checkPass() {}
  public async addCountry(req): Promise<addCountryResp> {
    let country = req.body || false;
    if (!country || !country.idc) {
      return {
        code: "badrequest",
      };
    }

    let pass = country.pass;
    delete country.pass;
    delete country["g-recaptcha-response"];

    country.verified = utils.convertFHT(country.verified);
    country.irl = utils.convertFHT(country.irl);

    if (country.rank) country.rank = parseInt(country.rank);

    country = utils.filter(country, (val) => {
      return val !== "";
    });

    country.md = true;
    if (country.description === false) delete country.description;
    if (pass && sha3(pass) == global.movc.PASS) {
      this.countries.updateOne(
        { idc: country.idc },
        { $set: country, $unset: { srcdescription: 1 } },
        { upsert: true },
        (err) => {
          if (err) {
            return {
              code: "notadded",
            };
          } else {
            return {
              code: "ok",
              redirect: `/countries/${country.cidc}`,
            };
          }
        }
      );
    } else {
      country.cidc = sha3("" + Math.random() + Date.now());
      if (!req.session?.passport?.user?.id)
        return {
          code: "authreq",
        };
      country.googid = req.session.passport.user.id;
      this.pending.insertOne(country, (err) => {
        if (err) {
          return {
            code: "notadded",
          };
        } else {
          if (country.oovg === "Да") {
            this.vklog.oovgsend(
              `Государство ${country.name} хочет вступить в ООВГ\n Ссылка - https://movc.xyz/pending-countries/${country.cidc}`
            );
          } else {
            this.vklog.movcsend(
              `Государство ${country.name} подало заявку в MOVC\n Ссылка - https://movc.xyz/pending-countries/${country.cidc}`
            );
          }
          return {
            code: "ok",
            redirect: `/pending-countries/${country.cidc}`,
          };
        }
      });
    }
  }
}
