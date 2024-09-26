const express = require("express");
const app = express();

app.get("/", (req,res)=>{
	res.send("Express läks täiesti käima!");
});

app.listen(5125);