import { sha3_224 as sha3 } from "js-sha3";
import { Collection, Db } from "mongodb";
import { addCountryResp, country } from "./interfaces";
import * as utils from "./utils";
import { Logger as Vkbot } from "./vk-logger";
import * as fetch from "node-fetch";

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
  public addCountry(req): Promise<addCountryResp> {
    return new Promise(async (res, rej) => {
      let country = req.body || false;
      if (!country || !country.idc) {
        res({
          code: "badrequest",
        });
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
      delete country.imgf;

      country.md = true;
      let original = await this.countries.findOne({ idc: country?.idc });
      if (country.description === false) delete country.description;
      if (
        (pass && sha3(pass) === global.movc.PASS) ||
        (original && original?.googid == country?.googid)
      ) {
        this.countries.updateOne(
          { idc: country.idc },
          { $set: country, $unset: { srcdescription: 1 } },
          { upsert: true },
          (err) => {
            if (err) {
              res({
                code: "notadded",
              });
            } else {
              res({
                code: "ok",
                redirect: `/countries/${country.idc}`,
              });
            }
          }
        );
        this.vklog.convsend(
          `Государство ${country.name} обновило своё описание в movc\n Ссылка - https://movc.xyz/countries/${country.idc}`
        );
      } else {
        country.cidc = sha3("" + Math.random() + Date.now());
        if (!req.session?.passport?.user?.id)
          res({
            code: "authreq",
          });
        country.googid = req.session.passport?.user?.id;
        this.pending.insertOne(country, (err) => {
          if (err) {
            res({
              code: "notadded",
            });
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
            res({
              code: "ok",
              redirect: `/pending-countries/${country.cidc}`,
            });
          }
        });
      }
    });
  }
  getCountry(name: string): country {
    return;
  }
}
