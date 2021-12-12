const sha3 = require('js-sha3').sha3_224;
const utils = require("./utils");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const cookieSession = require('cookie-session')
const Vkbot = require("./vk-logger");
let fx = require("money");
const Recaptcha = require('express-recaptcha').RecaptchaV2;
var recaptcha = new Recaptcha(process.env.SICAPTCHA||require("./secure.json").sitecaptcha, process.env.SECAPTCHA||require("./secure.json").secretcaptcha);
module.exports = async (app,db,PASS,filter,skl, VKTOKEN, GCID, GCS)=>{
	const vklog = new Vkbot(VKTOKEN);
	let cbr = (await (await fetch("https://www.cbr-xml-daily.ru/latest.js")).json());fx.base = cbr.base;fx.rates.USD=cbr.rates.USD;fx.rates.EUR=cbr.rates.EUR;
	let cachedvalutes = {};
    let co = db.collection("countries");
	let pending = db.collection("pending-countries");
	let clickwars = db.collection("clickwars");
	let deleted = db.collection("deleted-countries");
	let geo = db.collection("geo");
	let valutes = db.collection("valutes");
	let ads = db.collection("ads");
	let users = db.collection("google-auth-users");
	fx.rates = utils.addVirtCurrencies(fx, await valutes.find({}).toArray());

	passport.use(new GoogleStrategy({
		clientID: GCID,
		clientSecret: GCS,
		callbackURL: "https://movc.xyz/gcallback"
	  },
	  function(accessToken, refreshToken, profile, done) {
			 return done(null, profile);
	  }
	));
	passport.serializeUser(function(user, done) {
		done(null, user);
	  });
	passport.deserializeUser(function(user, done) {
		done(null, user);
	});

	app.use(cookieSession({
		name: 'tuto-session',
		keys: [PASS, VKTOKEN]
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	app.get("/", (req,res)=>{
		res.redirect("/countries")
	});

	app.get("/gauth", passport.authenticate("google", {scope:["profile"]}));
	app.get("/gcallback", passport.authenticate("google", {failureRedirect:"/notfound"}), (req,res)=>{
		res.redirect("/");
	});
	app.get('/logout', (req, res) => {
		req.session = null;
		req.logout();
		res.redirect('/');
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
	
	app.get("/clickwars/:war", (req, res)=>{
		clickwars.findOne({id:req.params.war}, (err, war)=>{
			if(!war) return res.redirect("/notfound");
			co.findOne({idc:Object.keys(war.countries)[0]}, (err, c1)=>{
				co.findOne({idc:Object.keys(war.countries)[1]}, (err, c2)=>{
					res.render("pages/cl-wars", {war, c1, c2});
				});
			});
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
		if(!(req.session?.passport?.user?.id)) return res.redirect("/gauth");
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
				co.findOne({idc:val?.idc}, (err, original)=>{
					if(val){
						if(original&&(original?.googid==val?.googid)) val.authorised = true;
						res.render("pages/pending-country", {country: val});
					} else {
						res.render("pages/notfound")
					}
			});
		});
    });
	app.get('/geo', (req, res)=>{
		res.redirect("https://github.com/artegoser/MOVC-static/raw/main/geo/geo.geojson");
    });
	app.get('/getgeo', async (req, res)=>{
		co.find({}).sort({rank:-1}).toArray((_,arr)=>{
			arr = arr.map((val)=>val.idc)
			res.render("pages/getgeo", {arr});
		});
	});
	app.get('/geojs', async (req, res)=>{
		res.redirect(`https://geo.movc.xyz/#data=data:text/x-url,https://movc.xyz/geo/${req.query.idc}`);
	});
	
	app.get("/stats", (req,res)=>{
		res.render("pages/stats");
	});
	// app.get("/geo.geojson", (req,res)=>res.sendFile("D:/github/artegoser.github.io/movc/geo/geo.geojson"))
	app.get('/geo/:country', async (req, res)=>{
		res.header("Access-Control-Allow-Origin", "https://geo.movc.xyz");
        let geo = await (await fetch("https://github.com/artegoser/MOVC-static/raw/main/geo/geo.geojson")).json();
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
				country.verified = utils.convertFHT(country.verified);
				country.irl = utils.convertFHT(country.irl);
				val.verified = country.verified;
				val.irl = country.irl;
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
								vklog.convsend(`Государство ${val.name} только что появилось в MOVC\n Посмотреть - https://movc.xyz/countries/${country.idc}`);
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

		let pass = country.pass;
		delete country.pass;
		delete country["g-recaptcha-response"];
		
		country.verified = utils.convertFHT(country.verified);
		country.irl = utils.convertFHT(country.irl);

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
			if(!req.session?.passport?.user?.id) return res.redirect("/gauth");
			country.googid = req.session.passport.user.id;
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
						vklog.oovgsend(`Государство ${country.name} хочет вступить в ООВГ\n Ссылка - https://movc.xyz/pending-countries/${country.cidc}`);
					} else{
						vklog.movcsend(`Государство ${country.name} подало заявку в MOVC\n Ссылка - https://movc.xyz/pending-countries/${country.cidc}`);
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
	app.get("/sitemap.xml", (req,res)=>{
		res.sendFile(__dirname+"/sitemap.xml");
	});
	app.get("/ads.txt", (req,res)=>{
		res.sendFile(__dirname+"/ads.txt");
	});
	app.use((req, res)=>{
		res.status(404);
		res.render("pages/notfound")
	});
}
