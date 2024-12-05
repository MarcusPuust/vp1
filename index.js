const express = require("express");
const app = express();
const dtEt = require("./moodulid/dateTime.js");
const fs = require("fs");
const dbInfo = require ("../../vp2024config");
const mysql = require("mysql2");
//Päringu lahti harutamiseks POST päringute puhul
const bodyparser = require("body-parser");
//failide üleslaadimiseks
const multer = require("multer");
//pildimanipulatsiooniks (suuruse muutmine)
const sharp = require("sharp");
//parooli krüpteerimiseks
const bcrypt = require("bcrypt");
//sessioonide haldamiseks
const session = require("express-session");
const async = require("async");

app.use(session({secret:"Salavoti", saveUninitialized: true, resave: true}));

app.use((req, res, next) => {
    res.locals.user = req.session.userId
        ? {
            id: req.session.userId,
            firstName: req.session.firstName,
            lastName: req.session.lastName
        }
        : null;
    next();
});


app.set("view engine", "ejs");
app.use(express.static("public"));
//Päringu URL-i parsimine, false kui ainult tekst, true, kui muud ka
app.use(bodyparser.urlencoded({extended: true}));
//Seadistame vahevara multer fotode laadimiseks kindlasse kataloogi
const upload = multer({dest: "./public/gallery/orig/"});


//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase,
});

//PROOVIEKSAMI ALGUS ------------------------------------------------------------------------------------------------------- 

app.get("/eksam", (req, res) => {
    
    res.render("eksam");
});


app.get("/sisestamine", (req, res) => {
    let notice = "";
    let truckInput = "";
    let weightIn = "";
    let weightOut = "";
    res.render("sisestamine", { notice: notice, truckInput: truckInput, weightIn: weightIn, weightOut: weightOut});
});

app.post("/sisestamine", (req, res) => {
    let notice = "";
    let truckInput = req.body.truckInput || "";
    let weightIn = req.body.weightIn || "";
    let weightOut = req.body.weightOut || "";

    if (!truckInput || !weightIn || !weightOut) {
        notice = "Osa andmeid on sisestamata!";
        res.render("sisestamine", { notice: notice, truckInput: truckInput, weightIn: weightIn, weightOut: weightOut });
    } else {
        let reqsql = "INSERT INTO vp1viljavedu (truck, weight_in, weight_out) VALUES (?, ?, ?)";
        conn.query(reqsql, [truckInput, weightIn, weightOut], (err) => {
            if (err) {
                throw err;
            } else {
                notice = "Andmed sisestatud!";
                res.render("sisestamine", { notice: notice, truckInput: truckInput, weightIn: weightIn, weightOut: weightOut});
            }
        });
    }
});

app.get("/kokkuvote", (req, res) => {
    let sqlReq = "SELECT truck, weight_in, weight_out FROM vp1viljavedu";
    
    // Kui on määratud kaubik, siis filtrime selle järgi
    if (req.query.truck) {
        sqlReq += " WHERE truck = ?";
    }

    conn.query(sqlReq, [req.query.truck], (err, sqlres) => {
        if (err) {
            throw err;
        } else {
            // Kui on andmed, siis arvutame viljamassi
            sqlres.forEach(item => {
                item.viljamass = item.weight_in - item.weight_out;  // Arvutame viljamassi
            });

            // Saadame andmed EJS-le ainult siis, kui kaubik on valitud
            res.render("kokkuvote", { 
                visits: sqlres, 
                selectedTruck: req.query.truck || null // Kui kaubik pole valitud, siis ei saadeta midagi
            });
        }
    });
});

//PROOVIEKSAMI LÕPP --------------------------------------------------------------------------------------------







// app.get("/visitlogdb", (req, res) => {
//     let sqlReq = "SELECT first_name, last_name, visit_time FROM vp1texting";
//     let visits = [];
//     conn.query(sqlReq, (err, sqlres) => {
//         if (err) {
//             throw err;
//         } else {
//             console.log(sqlres);
//             visits = sqlres;
//             res.render("visitlogdb", { visits: visits });
//         }
//     });
// });



app.get("/", (req, res) => {
    const [daysPast, daysLeft] = dtEt.dateDiff();
    
    const sqlReq = "SELECT news_title, news_text, news_date FROM vp1_news ORDER BY news_date DESC LIMIT 1";
    
    conn.query(sqlReq, (err, results) => {
        if (err) {
            throw err;
        }
        const latestNews = results.length > 0 ? {
            news_title: results[0].news_title,
            news_text: results[0].news_text,
            news_date: dtEt.givenDate(results[0].news_date)
        } : null;

        res.render("index", { daysPast: daysPast, daysLeft: daysLeft, latestNews: latestNews });
    });
});

app.get("/signin", (req, res)=>{
	let notice = "";
	res.render("signin",{notice: notice});
});

app.post("/signin", (req, res) => {
    let notice = "";

    if (!req.body.emailInput || !req.body.passwordInput) {
        notice = "E-mail või parool on sisestamata!";
        return res.render("signin", { notice: notice });
    }
    else{
        let sqlReq = "SELECT id, password, first_name, last_name FROM vp1users WHERE email = ?";
        conn.execute(sqlReq, [req.body.emailInput], (err, result) => {
            if(err){
                console.log("Viga andmebaasist lugedes!" + err);
                notice = "Tehniline viga, sisselogimine ebaoõnestus!";
                res.render("signin", { notice: notice});
            }
            else{
                if(result[0] != null){
                    //kasutaja leiti
                    bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult) => {
                        if(err){
                            notice = "Tehniline viga, sisselogimine ebaõnnestus!";
                            res.render("signin", { notice: notice});
                        }
                        else{
                            if(compareresult){
                                //notice = "Sisselogimine õnnestus!";
                                //res.render("signin", { notice: notice});
                                req.session.userId = result[0].id;
                                req.session.firstName = result[0].first_name;
                                req.session.lastName = result[0].last_name;
                                res.redirect("/home");
                            }
                            else{
                                notice = "Kasutajatunnus ja/või parool on vale!";
                                res.render("signin", { notice: notice });
                            }
                        }
                    });
                }
                else{
                    notice = "Kasutajatunnus ja/või parool on vale!";
                    res.render("signin", { notice: notice });
                }

            }
        });
    }
});

const checkLogin = function(req, res, next){
    if(req.session != null){
        if(req.session.userId){
            console.log("Kasutaja on sisselogitud!" + req.session.userId + " " + req.session.firstName + " " + req.session.lastName);
            next();
        }
        else{
            console.log("Login not detected!");
            res.redirect("/signin");
        }
    }
    else{
        console.log("session not detected!");
        res.redirect("/signin");
    }
};

app.get("/home", checkLogin, (req, res) => {
    console.log("Sees on kasutaja: " + req.session.userId + " " + req.session.firstName + " " + req.session.lastName);
    res.render("home");
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	console.log("Välja logitud");
	res.redirect("/");
});


app.get("/signup", (req, res)=>{
    res.render("signup");
});

app.post("/signup", (req, res) => {
    let notice = "Ootan andmeid!";
    const { firstNameInput, lastNameInput, birthDateInput, genderInput, emailInput, passwordInput, confirmPasswordInput } = req.body;
    console.log(req.body);

    if (!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput ||
        req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput) {
        console.log("Osa andmeid on sisetamata või paroolid ei kattu!");
        notice = "Osad andmed on puudu, parool on liiga lühike voi paroolid ei kattu!";
        res.render("signup", {notice: notice, firstNameInput: firstNameInput, lastNameInput: lastNameInput, birthDateInput: birthDateInput, genderInput: genderInput, emailInput: emailInput});
    } else {
        // Kontrollime, kas sellise e-mailiga kasutaja on juba olemas
        const checkEmail = "SELECT id FROM vp1users WHERE email = ?";
        conn.execute(checkEmail, [req.body.emailInput], (err, result) => {
            if (err) {
                notice = "Tehniline viga, kasutajat ei loodud!";
                res.render("signup", {notice: notice, firstNameInput: firstNameInput, lastNameInput: lastNameInput, birthDateInput: birthDateInput, genderInput: genderInput, emailInput: emailInput});
            } else if (result[0] != null) {
                notice = "Sellise e-mailiga kasutaja on juba olemas!";
                res.render("signup", {notice: notice, firstNameInput: firstNameInput, lastNameInput: lastNameInput, birthDateInput: birthDateInput, genderInput: genderInput, emailInput: emailInput});
            } else {
                notice = "Andmed sisestatud!";
                // Loome parooli räsi jaoks "soola"
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        notice = "Tehniline viga, kasutajat ei loodud!";
                        res.render("signup", {notice: notice, firstNameInput: firstNameInput, lastNameInput: lastNameInput, birthDateInput: birthDateInput, genderInput: genderInput, emailInput: emailInput});
                    } else {
                        // Krüpteerime parooli
                        bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash) => {
                            if (err) {
                                notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud!";
                                res.render("signup", {notice: notice, firstNameInput: firstNameInput, lastNameInput: lastNameInput, birthDateInput: birthDateInput, genderInput: genderInput, emailInput: emailInput});
                            } else {
                                let sqlReq = "INSERT INTO vp1users (first_name, last_name, birth_date, gender, email, password) VALUES (?, ?, ?, ?, ?, ?)";
                                conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result) => {
                                    if (err) {
                                        notice = "Tehniline viga andmebaasi kirjutamisel, kasutajat ei loodud!";
                                        res.render("signup", {notice: notice, firstNameInput: firstNameInput, lastNameInput: lastNameInput, birthDateInput: birthDateInput, genderInput: genderInput, emailInput: emailInput});
                                    } else {
                                        notice = "Kasutaja loodud!";
                                        res.render("signup", {notice: notice});
                                    }
                                });//conn.execute loppeb
                            }
                        });//hash loppeb
                    }
                });//genSalt loppeb
            }
        });//kui andmed on korras, loppeb
        //res.render("signup");
    }
});

app.get("/timenow", (req,res)=>{
	const weekdayNow = dtEt.dayEt();
	const dateNow = dtEt.dateEt();
	const timeNow = dtEt.timeEt();
	res.render("timenow", {nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req,res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
		//throw err;
		res.render("justlist", {h2: "Vanasõnad", listData: ["Ei leidnud ühtegi vanasõna"]});
		}
		else {
			folkWisdom = data.split(";");
			res.render("justlist", {h2: "Vanasõnad", listData: folkWisdom});
		}
	});
});

app.get("/reqvisit", (req, res)=>{
    res.render("reqvisit");
});



app.post("/reqvisit", (req, res)=>{
    //console.log(req.body);
    const weekdayNow = dtEt.dayEt();
	const dateNow = dtEt.dateEt();
	const timeNow = dtEt.timeEt();

    fs.open("public/textfiles/visitorlog.txt", "a", (err, file)=>{
        if(err){
            throw err;
        }
        else {
            fs.appendFile("public/textfiles/visitorlog.txt", req.body.firstNameInput + " " + req.body.lastNameInput + ", " +  weekdayNow + ", " + dateNow + ", " + timeNow + ";", (err)=>{
                if(err){
                    throw err;
                }
                else {
                    console.log("Faili kirjutati!");
                    res.render("reqvisit");
                }
            });

        }
    });
});

app.get("/visitlog", (req, res)=>{
    let log = [];
    fs.readFile("public/textfiles/visitorlog.txt", "utf-8", (err, data)=>{
        if(err || data.length === 0){
            //throw err;
            res.render("visitlog", {visit: "Külastuslogi", listData: ["Ei leidnud ühtegi külastust"]});
        }
        else {
            log = data.split(";").filter(item => item.trim() !== "");
            res.render("visitlog", {visit: "Külastuslogi", listData: log});
        }
    });
});

//uudiste osa eraldi marsruutide failiga
const filmRouter = require("./routes/filmroutes");
app.use("/eestifilm", filmRouter);

// app.get("/eestifilm", (req, res)=>{
//     res.render("eestifilm");
// });

// app.get("/eestifilm/addRelations", (req, res)=>{
// 	//võtan kasutusele async mooduli, et korraga teha mitu andmebaasipäringut
// 	const filmQueries = [
// 		function(callback){
// 			let sqlReq1 = "SELECT id, first_name, last_name, birth_date FROM person";
// 			conn.execute(sqlReq1, (err,result)=>{
// 				if(err){
// 					return callback(err);
// 				}
// 				else {
// 					return callback(null, result);
// 				}
// 			}); 
// 		}, 
// 		function(callback){
// 			let sqlReq2 = "SELECT id, title, production_year FROM movie";
// 			conn.execute(sqlReq2, (err,result)=>{
// 				if(err){
// 					return callback(err);
// 				}
// 				else {
// 					return callback(null, result);
// 				}
// 			}); 
// 		},
// 		function(callback){
// 			let sqlReq3 = "SELECT id, position_name FROM position";
// 			conn.execute(sqlReq3, (err,result)=>{
// 				if(err){
// 					return callback(err);
// 				}
// 				else {
// 					return callback(null, result);
// 				}
// 			}); 
// 		}
// 	];
// 	//paneme need päringud ehk siis funktsioonid paralleelselt käima, tulemuseks saame kolme päringu koondi
// 	async.parallel(filmQueries, (err,results)=>{
// 		if(err){
// 			throw err;
// 		}
// 		else{
// 			console.log(results);
// 			res.render("addRelations", {personList: results[0], movieList: results[1], positionList: results[2]});
// 		}
// 	});
//     //res.render("addRelations");
// });


// app.post("/eestifilm/addRelations", checkLogin, (req, res)=>{
// 	let notice = "";
// 	console.log(req.body);
// 	const {personSelect, movieSelect, positionSelect, roleInput} = req.body;
	
// 	if (!personSelect || !movieSelect || !positionSelect || !roleInput) {
// 		notice = "Osa andmeid sisestamata!"
// 		return res.render("addRelations", {notice});
// 	}
// 	else {
// 		let sqlReq = "INSERT INTO person_in_movie (person_id, movie_id, position_id, role) VALUES (?, ?, ?, ?)";
// 		conn.execute(sqlReq, [personSelect, movieSelect, positionSelect, roleInput || null], (err) => {
// 			if (err) {
// 				throw err;
// 			}
// 			else {
// 				res.redirect("addRelations");
// 			}
// 		});
// 	}
	
// }); 

app.get("/eestifilm/tegelased", (req, res)=>{
	let sqlReq = "SELECT first_name,last_name,birth_date FROM person";
	let persons = [];
	conn.query(sqlReq, (err, sqlres)=>{
		if (err){
			throw err;
		}
		else {
			console.log(sqlres);
			//persons = sqlres;
			//for  i algab 0 piiriks sqlres.length
			 for (let i = 0; i < sqlres.length; i++){
        persons.push({first_name:sqlres[i].first_name,last_name: sqlres[i].last_name,birth_date: dtEt.givenDate(sqlres[i].birth_date)});
			 }
    
			//Tsükli sees lisame persons listile uue elemendi, mis on ise "objekt" {first_name: sqlres[i].first_name} 
			//listi lisamiseks on käsk 
			//push.persons(lisatav element);
			res.render("tegelased", {persons: persons});
	}
	});
});

//Proovieksami jaoks kommenteerin välja, kasutan sarnast asja.

// app.get("/visitlogdb", (req, res) => {
//     let sqlReq = "SELECT first_name, last_name, visit_time FROM vp1texting";
//     let visits = [];
//     conn.query(sqlReq, (err, sqlres) => {
//         if (err) {
//             throw err;
//         } else {
//             console.log(sqlres);
//             visits = sqlres;
//             res.render("visitlogdb", { visits: visits });
//         }
//     });
// });

app.get("/reqvisitdb", (req, res)=>{
    let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("reqvisitdb", {notice: notice, firstName, lastName: lastName});
});

app.post("/reqvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		notice = "Osa andmeid sisestamata!";
		res.render("reqvisitdb", {notice: notice, firstName, lastName: lastName});
	}
	else {
		let sqlreq = "INSERT INTO vp1texting (first_name, last_name) VALUES (?, ?)";
		conn.query(sqlreq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlres)=>{
			if(err){
				throw err;
			}
			else {
				notice = "Külastus registreeritud!";
				res.render("reqvisitdb", {notice: notice, firstName, lastName: lastName});
			}
		});
	}
});

app.get("/moviedatadb", (req, res) => {
    let notice = "";
    res.render("moviedatadb", { notice });
});

app.get("/add-person", (req, res) => {
    let notice = "";
    let firstName = "";
    let lastName = "";
    let birthDate = "";
    res.render("moviedatadb", {notice, firstName, lastName, birthDate });
});

app.get("/add-movie", (req, res) => {
    let notice = "";
    let title = "";
    let productionYear = "";
    let duration = "";
    let description = "";
    res.render("moviedatadb", {notice, title, productionYear, duration, description});
});


app.get("/add-position", (req, res) => {
    let notice = "";
    let positionName = "";
    let description = "";
    res.render("moviedatadb", { notice, positionName, description });
});


app.post("/add-position", (req, res) => {
    let notice = "";
    let positionName = req.body.position_name;
    let description = req.body.description;

    if (!positionName) {
        notice = "Osa andmeid on sisestamata!";
        return res.render("moviedatadb", { notice, positionName });
    }
    else {
        let sqlreq = "INSERT INTO `position` (position_name, description) VALUES (?, ?)";
        conn.query(sqlreq, [positionName, description], (err) => {
            if(err){
                console.log("Position:", positionName);
                console.log("Description:", description);
                throw err;
            }
            else{
                notice = "Positsioon lisatud!";
                res.render("moviedatadb", { notice, positionName: "", description: "" });
            }
        });
    }
});

// Tegelaste lisamine
app.post("/add-person", (req, res) => {
    let notice = "";
    let firstName = req.body.first_name;
    let lastName = req.body.last_name;
    let birthDate = req.body.birth_date;

    if (!firstName || !lastName || !birthDate) {
        notice = "Osa andmeid on sisestamata!";
        res.render("moviedatadb", { notice, firstName, lastName, birthDate });
    } else {
        let sqlreq = "INSERT INTO person (first_name, last_name, birth_date) VALUES (?, ?, ?)";
        conn.query(sqlreq, [firstName, lastName, birthDate], (err) => {
            if(err){
                throw err;
            }
            else{
                notice = "Tegelane lisatud!";
                res.render("moviedatadb", { notice, firstName: "", lastName: "", birthDate: "" });
            }
        });
    }
});

// Filmide lisamine
app.post("/add-movie", (req, res) => {
    let notice = "";
    let title = req.body.title;
    let productionYear = req.body.production_year;
    let duration = req.body.duration;
    let description = req.body.description;

    if (!title || !productionYear || !duration || !description) {
        notice = "Osa andmeid on sisestamata!";
        res.render("moviedatadb", { notice, title, productionYear, duration, description });
    } else {
        let sqlreq = "INSERT INTO movie (title, production_year, duration, description) VALUES (?, ?, ?, ?)";
        conn.query(sqlreq, [title, productionYear, duration, description], (err) => {
            if(err){
                throw err;
            }
            else{
                notice = "Film lisatud!";
                res.render("moviedatadb", { notice, title: "", productionYear: "", duration: "", description: "" });
            }
        });
    }
});

//uudiste osa eraldi marsruutide failiga
const newsRouter = require("./routes/newsroutes");
app.use("/news", newsRouter);



app.get("/photoupload", (req, res) => {
    let notice = "";

    res.render("photoupload", { notice });
});
	
app.post("/photoupload", upload.single("photoInput"), (req, res) => {
    let notice = "";
    console.log(req.body);
    console.log(req.file);
    //genereerime oma failinime
    const fileName = "vp_" + Date.now() + ".jpg";
    //nimetame uleslaetud faili umber
    if (!req.file) {
        notice = "Pildifail on sisestamata!";
        return res.render("photoupload", { notice });
    }
    fs.rename(req.file.path, req.file.destination + fileName,(err)=>{
        console.log(err);

    });
    //teeme pildi kahes erisuuruses
    sharp(req.file.destination + fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/" + fileName);
    sharp(req.file.destination + fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/" + fileName);
    //salvestame andmebaasi
    let sqlReq = "INSERT INTO vp1photos (file_name, orig_name, alt_text, privacy, user_id) VALUES (?, ?, ?, ?, ?)";
    const user_id = 1;

    conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, user_id], (err, result)=>{
        if(err) {
            throw err;
        }
        else {
            notice = "Pilt laeti üles!";
            res.render("photoupload", { notice });
        }
    });
});

app.get("/gallery", (req, res) => {
    res.redirect("/gallery/1");
});

app.get("/gallery/:page", (req, res) => {
    let galleryLinks = "";
    let page = parseInt(req.params.page);
    if (page < 1){
        page = 1;
    }
    const photoLimit = 5;
    let skip = 0;
    const privacy = 3;

    //Teeme päringud, mida tuleb kindlalt üksteise järel teha.
    const galleryPageTasks = [
        function(callback){
            conn.execute("SELECT COUNT(id) as photos FROM vp1photos WHERE privacy = ? AND deleted IS NULL", [privacy] , (err, result) =>{
                if(err){
                    return callback(err);
                }
                else {
                    return callback(null, result);
                }
            });
        },
        function(photoCount, callback){
			console.log("Fotosid on: " + photoCount[0].photos);
			if((page - 1) * photoLimit >= photoCount[0].photos){
				page = Math.ceil(photoCount[0].photos / photoLimit);
			}
			console.log("Lehekülg on: " + page);
			//lingid oleksid
//<a href="/gallery/1">eelmine leht</a>  |  <a href="/gallery/3">järgmine leht</a>
			if(page == 1){
				galleryLinks = "eelmine leht &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;&nbsp;";
			}
			else {
				galleryLinks = '<a href="/gallery/' + (page - 1) + '"> eelmine leht</a> &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;&nbsp;';
			}
			if(page * photoLimit > photoCount[0].photos){
				galleryLinks += "järgine leht";
			}
			else {
				galleryLinks += '<a href="/gallery/' + (page + 1) + '"> järgmine leht</a>';
			}
			return callback(null, page);
		}
	];


    //async waterfall
    async.waterfall(galleryPageTasks, (err, results)=>{
        if(err){
            throw err
        }
        else {
            console.log(results);
        }
    });
    //Kui aadressis toodud lk on muudetud, oli vigane, siis ....
    //console.log(req.params.page);
    // if(page != parseInt(req.params.page)){
    //     console.log("LK MUUTUS!!");
    //     res.redirect("gallery/" + page);
    // }
    skip = (page -1) * photoLimit;
    let sqlReq = "SELECT id, file_name, alt_text FROM vp1photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC LIMIT ?,?";
    let photoList = [];
    conn.execute(sqlReq, [privacy,skip,  photoLimit], (err, results) => {
        if (err) {
            throw err;
        }
        else{
            for(let i = 0; i < results.length; i++){
                photoList.push({id: results[i].id, href: "/gallery/thumb/", filename: results[i].file_name, alt: results[i].alt_text});
            }
            res.render("gallery", { listData: photoList, links: galleryLinks });
        }
    });
});

	
app.listen(5125);

