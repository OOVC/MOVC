const sha3 = require('js-sha3').sha3_224;
const utils = require("./utils");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const Vkbot = require("./vk-logger");
let fx = require("money");
const Recaptcha = require('express-recaptcha').RecaptchaV2;
var recaptcha = new Recaptcha(process.env.SICAPTCHA||require("./secure.json").sitecaptcha, process.env.SECAPTCHA||require("./secure.json").secretcaptcha);
module.exports = async (app,db,PASS,filter,skl, VKTOKEN)=>{
	const vklog = new Vkbot(VKTOKEN);
	let cbr = (await (await fetch("https://www.cbr-xml-daily.ru/latest.js")).json());fx.base = cbr.base;fx.rates.USD=cbr.rates.USD;fx.rates.EUR=cbr.rates.EUR;
	let cachedvalutes = {};
    let co = db.collection("countries");
	let pending = db.collection("pending-countries");
	let deleted = db.collection("deleted-countries");
	let geo = db.collection("geo");
	let valutes = db.collection("valutes");
	let ads = db.collection("ads");
	fx.rates = utils.addVirtCurrencies(fx, await valutes.find({}).toArray());

	app.get("/", (req,res)=>{
		res.redirect("/countries")
	});
	app.get("/courses", (req,res)=>{
		res.end(JSON.stringify({
			base:fx.base,
			rates:fx.rates
		}, null, "  "));
	});

	app.get('/ads/:type', (req, res)=>{
        ads.find({type:req.params.type}).toArray((err, ads)=>{
            switch(req.params.type){
				case "ncimg":
					res.render("pages/ads/ncimg", {ads});
			}
        });
    });

	app.get('/currencies', (req, res)=>{
        valutes.find({}).toArray((err, valutes)=>{
            res.render("pages/valutes", {valutes});
        });
    });
	app.get('/currencies/:valute', async (req, res)=>{
        valutes.findOne({idc:req.params.valute}, async (err, valute)=>{
			if(valute.course){
				if(cachedvalutes[req.params.valute]){
					if(valute.idc==="SKL"){
						let courseSKL = skl.collection("course");
						let course = await courseSKL.find({}).toArray()
						valute.course = JSON.stringify(course);
					} else{
						valute.course = cachedvalutes[req.params.valute]
					}
				} else{
					if(valute.idc==="SKL"){
						let courseSKL = skl.collection("course");
						let course = await courseSKL.find({}).toArray()
						valute.course = JSON.stringify(course);
					}else{
						valute.course = await fetch(valute.course);
						valute.course = await valute.course.text();
					}
					cachedvalutes[req.params.valute] = valute.course;
				}
			}
			if(valute.type !== "USD"){
				valute.usd = fx(valute.amount).from(valute.type).to("USD").toFixed(3);
			} else{
				valute.usd = valute.amount
			}
            res.render("pages/valute", valute);
        });
    });
	app.get("/req-country", (req, res)=>{
		res.render("pages/req-country", {query:req.query});
	});
	app.get('/countries/:country', (req, res)=>{
        co.findOne({idc: req.params.country}, (err, val)=>{
			if(val) res.render("pages/country", {country: val});
			else {
				res.render("pages/notfound")
			}
		});
    });
	app.get('/countries', (req, res)=>{
        co.find(req.query.search ? {$or:[{description:{$regex:req.query.search, $options:"gi"}}, {name:{$regex:req.query.search, $options:"gi"}}, {owner:{$regex:req.query.search, $options:"gi"}}, {type:{$regex:req.query.search, $options:"gi"}}]} : {}, {name:1, idc:1, description:1}).sort({rank:-1}).toArray((err, results)=>{
			if(err) throw err;
			co.countDocuments((_,v)=>{
				res.render("pages/countries", {val:results, count:v, req});
			});
		});
    });

	app.get('/pending-countries/:country', (req, res)=>{
        pending.findOne({cidc: req.params.country}, (err, val)=>{
			if(val) res.render("pages/pending-country", {country: val});
			else {
				res.render("pages/notfound")
			}
		});
    });
	app.get('/geo', (req, res)=>{
		res.redirect("https://artegoser.github.io/movc/geo/geo.geojson");
    });
	app.get('/getgeo', async (req, res)=>{
		co.find({}).sort({rank:-1}).toArray((_,arr)=>{
			arr = arr.map((val)=>val.idc)
			res.render("pages/getgeo", {arr});
		});
	});
	app.get('/geojs', async (req, res)=>{
		res.redirect(`https://artegoser.github.io/geoMOVC/#data=data:text/x-url,https://movc.herokuapp.com/geo/${req.query.idc}`);
	});
	app.get('/geo/:country', async (req, res)=>{
		res.header("Access-Control-Allow-Origin", "https://artegoser.github.io");
        let geo = await (await fetch("https://artegoser.github.io/movc/geo/geo.geojson")).json();
		geo.features = geo.features.filter((val)=>{
			if(val.properties.name===req.params.country) return true;
		});
		res.end(JSON.stringify(geo));
    });
	app.get('/pending-countries', (req, res)=>{
        pending.find({}, {name:1, cidc:1, description:1}).toArray((err, results)=>{
			pending.countDocuments((_,v)=>{
				res.render("pages/pending-countries", {val:results, count:v});
			});
		});
    });

	app.get('/map', (req, res)=>{
        res.render("pages/map");
    });
	app.get('/erth2', (req, res)=>{
		co.find({verified:true}).count((_,v)=>{
        	res.render("pages/erth2", {count:v});
		});
    });
	app.get("/admin", (req,res)=>{
		res.render("pages/admin");
	});
	app.get("/admin/currency-token", (req,res)=>{
		res.render("pages/valute-token");
	});
	app.get("/admin/addcountry", (req,res)=>{
		res.render("pages/addcountry");
	});
	app.get("/admin/approve-country", (req,res)=>{
		res.render("pages/approve-country");
	});
	app.get("/admin/bind", (req,res)=>{
		res.render("pages/bind");
	});
	app.get("/admin/delete-country", (req,res)=>{
		res.render("pages/delete-country");
	});
	app.get("/admin/edit-country-map", (req,res)=>{
		res.render("pages/edit-country-map");
	});
	app.post("/delete-country", (req, res)=>{
		let country = req.body || false;
		if(!country){
			res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			res.end("Нет тела запроса");
			return;
		} 
		let pass = req.query.pass || country.pass;
		if(pass && sha3(pass) == PASS){
			pending.findOne({cidc:country.cidc}, (err, val)=>{
				if (err||!val){
					return res.end(JSON.stringify({
						code:2,
						message:"Country is not deleted||nothing to delete",
						err:`${err}`
					}));
				} else{
					res.redirect("/pending-countries");
				}
				delete val._id;
				deleted.insertOne(val);
				pending.deleteOne({cidc:country.cidc});
			});
		} else{
			res.end("Hackerman?")
		}
	});
	app.post("/country-preview", (req, res)=>{
		let country = req.body;
		if(country.verified==="half") {}
		else if(country.verified==="false") country.verified = false;
		else if(country.verified) country.verified = true;
		else if(!country.verified) country.verified = "pending"
		country.description = utils.replacespec(country.description);
		res.render("pages/country", {country})
	});
	app.post("/approve-country", (req, res)=>{
		let country = req.body || false;
		if(!country){
			res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			res.end("Нет тела запроса");
			return;
		} 
		let pass = req.query.pass || country.pass;
		if(pass && sha3(pass) == PASS){
			pending.findOne({idc:country.idc},(err, val)=>{
				if(!val){
					res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
					return res.end("Нечего подтверждать")
				}
				delete val._id;
				delete val.cidc;
				if(country.verified==="half") {}
				else if(country.verified==="false") country.verified = false;
				else if(country.verified) country.verified = true;
				else if(!country.verified) country.verified = "pending"
				val.verified = country.verified;
				co.updateOne({idc: country.idc},{$set: val}, {upsert:true},
				(err)=>{
					if (err){
						res.end(JSON.stringify({
							code:2,
							message:"Country is not added",
							err:`${err}`
						}));
					} else{
						pending.deleteOne({idc: country.idc}, (err)=>{
							if (err){
								res.end(JSON.stringify({
									code:2,
									message:"Country is not added",
									err:`${err}`
								}));
							} else{
								res.redirect(`/countries/${country.idc}`)
								vklog.convsend(`Государство ${val.name} только что появилось в MOVC\n Посмотреть - artegoser.github.io/movc/?url=/countries/${country.idc}`);
							}
						});
					}
				});
			});
		} else{
			res.end("Hackerman?");
		}
	});
	app.get("/currencyedit", (req,res)=>{
		res.render("pages/currencyedit")
	});
	app.post('/addcountry', recaptcha.middleware.verify, (req, res)=>{
		let country = req.body || false;
		if(!country||!country.idc){
			res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			res.end("Нет тела запроса, или не указан id страны");
			return;
		} 
		if(req.recaptcha.error&&!(req.query.pass||country.pass)){
			res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
			res.end("Подтвердите, что вы человек");
			return;
		} 
		let pass = req.query.pass || country.pass;
		country.pass = "";
		
		if(country.verified==="half") {}
		else if(country.verified==="false") country.verified = false;
		else if(country.verified) country.verified = true;
		else if(!country.verified) country.verified = "pending"

		if(country.rank) country.rank = parseInt(country.rank);

		country = filter(country, (val)=>{
			return val !== "";
		});
		country.srcdescription = country.description;
		country.description = utils.replacespec(country.description);
		if(country.description === false) delete country.description;
		if(pass && sha3(pass) == PASS){
			co.updateOne({idc: country.idc},{$set: country}, {upsert:true},
				(err)=>{
					if (err){
						res.end(JSON.stringify({
							code:2,
							message:"Country is not added",
							err:`${err}`
						}));
					} else{
						res.redirect(`/countries/${country.idc}`);
					}
				});
		} else{
			country.cidc = sha3(""+Math.random()+Date.now());
			pending.insertOne(country,(err)=>{
				if (err){
					res.end(JSON.stringify({
						code:2,
						message:"Country is not added",
						err:`${err}`
					}));
				} else{
					res.redirect(`/pending-countries/${country.cidc}`);
					if(country.oovg === "Да"){
						vklog.oovgsend(`Государство ${country.name} хочет вступить в ООВГ\n Ссылка - artegoser.github.io/movc/?url=/pending-countries/${country.cidc}`);
					} else{
						vklog.movcsend(`Государство ${country.name} подало заявку в MOVC\n Ссылка - artegoser.github.io/movc/?url=/pending-countries/${country.cidc}`);
					}
				}
			});
		}
		
    });
	app.get("/api/maingeo", (req,res)=>{
		geo.findOne({type:"main"}, (err, val)=>{
			res.end(JSON.stringify(val.geojson.features, null, "  "));
		});
	});
	app.post("/api/country", (req,res)=>{
		co.findOne({idc:req.body.idc}, (err, val)=>{
			res.end(JSON.stringify(val, null, "  "));
		});
	});
	app.get("/api/countries", (req,res)=>{
		co.find({}).sort({rank:-1}).toArray((err, val)=>{
			res.writeHead(200, {'Content-Type': 'text/json; charset=utf-8'});
			res.end(JSON.stringify(val, null, "  "));
		});
	});
	app.post("/api/currency/token", (req,res)=>{
		pass = req.body.pass;
		if(pass && sha3(pass) == PASS){
			res.end(jwt.sign({valute:req.body.valute}, PASS));
		} else{
			res.end("hackerman")
		}
	});
	app.post("/api/currency/update", (req,res)=>{
		let tokenDec;
		try {
			tokenDec = jwt.verify(req.body.token, PASS);	
		} catch (error) {
			return res.end("invalid token");
		}
		valutes.updateOne({idc:tokenDec.valute}, {$set:{amount:req.body.amount}});
		res.end("updated");
	});
	app.get("/robots.txt", (req,res)=>{
		res.sendFile(__dirname+"/robots.txt");
	});
	app.use((req, res)=>{
		res.status(404);
		res.render("pages/notfound")
	});
}