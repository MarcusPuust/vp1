exports.checkLogin = function(req, res, next){
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