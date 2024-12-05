const mysql = require("mysql2");
const dbInfo = require ("../../../vp2024config");
const dtEt = require("../moodulid/dateTime.js");
const async = require("async");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase,
});


//@desc home page for film section 
//@route GET /eestifilm 
//@access private 


const filmHome = (req, res)=>{
	console.log("Töötab filmide router koos kontrolleriga");
	res.render("eestifilm");
};

//@desc page for reading film actors 
//@route POST /eestifilm/tegelased
//@access private (et oleks sisse logitud)

const actorRead = (req, res)=>{
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
	let persons = [];
	conn.query(sqlReq, (err, sqlres)=>{
		if(err){
			throw err;
		}
		else {
			console.log(sqlres);
			for (let i=0; i<sqlres.length; i++) 
			persons.push({first_name: sqlres[i].first_name, last_name: sqlres[i].last_name, birth_date: dtEt.givenDate(sqlres[i].birth_date)});
			console.log();
			
			res.render("tegelased", {persons: persons});
		}
	});
	//res.render("tegelased");
};


//@desc page for adding film relations 
//@route GET /eestifilm/addRelations
//@access private (et oleks sisse logitud)

const filmRelations = (req, res)=>{
	//võtan kasutusele async mooduli, et korraga teha mitu andmebaasipäringut
	const filmQueries = [
		function(callback){
			let sqlReq1 = "SELECT id, first_name, last_name, birth_date FROM person";
			conn.execute(sqlReq1, (err,result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			}); 
		}, 
		function(callback){
			let sqlReq2 = "SELECT id, title, production_year FROM movie";
			conn.execute(sqlReq2, (err,result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			}); 
		},
		function(callback){
			let sqlReq3 = "SELECT id, position_name FROM position";
			conn.execute(sqlReq3, (err,result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			}); 
		}
	];
	//paneme need päringud ehk siis funktsioonid paralleelselt käima, tulemuseks saame kolme päringu koondi
	async.parallel(filmQueries, (err,results)=>{
		if(err){
			throw err;
		}
		else{
			console.log(results);
			res.render("addRelations", {personList: results[0], movieList: results[1], positionList: results[2]});
		}
	});
    //res.render("addRelations");
};


//@desc page for adding film relations
//@route POST /eestifilm/addRelations
//@access private (et oleks sisse logitud)

const filmAddRelations = (req, res)=>{
	let notice = "";
	console.log(req.body);
	const {personSelect, movieSelect, positionSelect, roleInput} = req.body;
	
	if (!personSelect || !movieSelect || !positionSelect || !roleInput) {
		notice = "Osa andmeid sisestamata!"
		return res.render("addRelations", {notice});
	}
	else {
		let sqlReq = "INSERT INTO person_in_movie (person_id, movie_id, position_id, role) VALUES (?, ?, ?, ?)";
		conn.execute(sqlReq, [personSelect, movieSelect, positionSelect, roleInput || null], (err) => {
			if (err) {
				throw err;
			}
			else {
				res.redirect("addRelations");
			}
		});
	}
	
}; 

module.exports ={
	filmHome,
	actorRead,
	filmRelations,
	filmAddRelations
};