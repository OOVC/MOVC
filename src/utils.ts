import * as path from "path";

interface fxrates {
  [key: string]: number;
}

export function initConfig(): void {
  global.movc = {};
  global.movc.PORT = process.env.PORT || 81;
  global.movc.PASS = process.env.PASS || require("../secure.json").pass;
  global.movc.URL = process.env.URL || require("../secure.json").url;
  global.movc.VKTOKEN = process.env.VKTOKEN || require("../secure.json").vk;
  global.movc.GCID = process.env.GCID || require("../secure.json").gcid;
  global.movc.GCS = process.env.GCS || require("../secure.json").gcs;
  (global.movc.SICAPTCHA =
    process.env.SICAPTCHA || require("../secure.json").sitecaptcha),
    (global.movc.SECAPTCHA =
      process.env.SECAPTCHA || require("../secure.json").secretcaptcha);
}

export function addVirtCurrencies(fx, valutes): fxrates {
  for (let valute of valutes) {
    if (valute.type === "RUB") {
      fx.rates[valute.idc] = 1 / valute.amount;
    } else {
      fx.rates[valute.idc] = 1 / fx(valute.amount).from(valute.type).to("RUB");
    }
  }
  return fx.rates;
}

export function filter(obj, filtercheck): any {
  let result = {};
  Object.keys(obj).forEach((key) => {
    if (filtercheck(obj[key])) result[key] = obj[key];
  });
  return result;
}

export function convertFHT(val): boolean {
  if (val === "half") {
  } else if (val === "false") val = false;
  else if ((val = "true")) val = true;
  else val = "pending";
  return val;
}

export function rootPlusPath(...pathName): string {
  return path.join(__dirname, "../", ...pathName);
}
