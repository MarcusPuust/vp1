const express = require("express");
const router = express.Router(); //suur "R" on oluline!!!
const general = require("../generalfnc");

//kõikidele marsruutidele ühine vahevara(middleware)
router.use(general.checkLogin);

//kontrollerid
const {
	newsHome,
	addNews,
	addingNews,
	newsReading} =require("../controllers/newscontrollers");

//igale marsruudile oma osa nagu seni index failis

//app.get("/news", (req, res)=>{
router.route("/").get(newsHome);

router.route("/addnews").get(addNews);

router.route("/addnews").post(addingNews);

router.route("/read").get(newsReading);

module.exports = router;