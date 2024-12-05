const express = require("express");
const router = express.Router(); //suur "R" on oluline!!!
const general = require("../generalfnc");
const async = require("async");

const checkLogin = function(req, res, next){
	if(req.session != null){
		if(req.session.userId){
			console.log("Kasutaja on sisselogitud!" + req.session.userId + " " + req.session.firstName + " " + req.session.lastName);
			next();
		}
		else {
			console.log("Login not detected");
			res.redirect("/signin");
		}
	}
	else {
		console.log("Session not detected");
		res.redirect("/signin");
	}
}

//kõikidele marsruutidele ühine vahevara(middleware)
router.use(general.checkLogin);

//kontrollerid
const {
	filmHome,
	actorRead,
	filmRelations,
	filmAddRelations} =require("../controllers/filmcontrollers");

//igale marsruudile oma osa nagu seni index failis

//app.get("/eestifilm", (req, res)=>{
router.route("/").get(filmHome);

router.route("/tegelased").get(actorRead);

router.route("/addRelations").get(filmRelations);

router.route("/addRelations").post(filmAddRelations);

module.exports = router;