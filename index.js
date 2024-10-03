const express = require("express");
const dtEt = require("./moodulid/dateTime.js");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

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

app.listen(5125);