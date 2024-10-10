const express = require("express");
const dtEt = require("./moodulid/dateTime.js");
const fs = require("fs");
const dbInfo = require ("../../vp2024config");
const mysql = require("mysql2");
//Päringu lahti harutamiseks POST päringute puhul
const bodyparser = require("body-parser");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
//Päringu URL-i parsimine, false kui ainult tekst, true, kui muud ka
app.use(bodyparser.urlencoded({extended: false}));

//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase,
});

app.get("/", (req,res)=>{
	//res.send("Express läks täiesti käima!");
	res.render("index.ejs");
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
    console.log(req.body);
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

app.get("/eestifilm", (req, res)=>{
    res.render("filmindex");
});

app.get("/eestifilm/tegelased", (req, res)=>{
	let sqlReq = "SELECT first_name,last_name,birth_date FROM person";
	let persons = [];
	conn.query(sqlReq, (err, sqlres)=>{
		if (err){
			throw err;
		}
		else {
			console.log(sqlres);
			persons = sqlres;
			res.render("tegelased", {persons: persons});
		}
	});
   //res.render("tegelased");
});

app.listen(5125);