"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootPlusPath = exports.convertFHT = exports.filter = exports.addVirtCurrencies = exports.initConfig = void 0;
const path = require("path");
function initConfig() {
    global.movc = {};
    global.movc.PORT = process.env.PORT || 80;
    global.movc.PASS = process.env.PASS || require("../secure.json").pass;
    global.movc.URL = process.env.URL || require("../secure.json").url;
    global.movc.VKTOKEN = process.env.VKTOKEN || require("../secure.json").vk;
    global.movc.GCID = process.env.GCID || require("../secure.json").gcid;
    global.movc.GCS = process.env.GCS || require("../secure.json").gcs;
    global.movc.SICAPTCHA = process.env.SICAPTCHA || require("../secure.json").sitecaptcha,
        global.movc.SECAPTCHA = process.env.SECAPTCHA || require("../secure.json").secretcaptcha;
}
exports.initConfig = initConfig;
function addVirtCurrencies(fx, valutes) {
    for (let valute of valutes) {
        if (valute.type === "RUB") {
            fx.rates[valute.idc] = 1 / valute.amount;
        }
        else {
            fx.rates[valute.idc] = 1 / fx(valute.amount).from(valute.type).to("RUB");
        }
    }
    return fx.rates;
}
exports.addVirtCurrencies = addVirtCurrencies;
function filter(obj, filtercheck) {
    let result = {};
    Object.keys(obj).forEach((key) => {
        if (filtercheck(obj[key]))
            result[key] = obj[key];
    });
    return result;
}
exports.filter = filter;
function convertFHT(val) {
    if (val === "half") {
    }
    else if (val === "false")
        val = false;
    else if ((val = "true"))
        val = true;
    else
        val = "pending";
    return val;
}
exports.convertFHT = convertFHT;
function rootPlusPath(...pathName) {
    return path.join(__dirname, "../", ...pathName);
}
exports.rootPlusPath = rootPlusPath;
