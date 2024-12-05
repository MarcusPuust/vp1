const mysql = require("mysql2");
const dbInfo = require ("../../../vp2024config");
const dtEt = require("../moodulid/dateTime.js");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase,
});


//@desc home page for news section 
//@route GET /news 
//@access private 

const newsHome = (req, res)=>{
	console.log("Töötab uudiste router koos kontrolleriga");
	res.render("news");
};

//@desc page for adding news 
//@route GET /news/addnews
//@access private 

const addNews = (req, res)=>{
    let newsTitle = "";
    let newsText = "";
    let expired = "";
    let notice = "";
	
    const today = new Date();
    const tenDaysFromNow = new Date(today);
    tenDaysFromNow.setDate(today.getDate() + 10);

    const year = tenDaysFromNow.getFullYear();
    const month = String(tenDaysFromNow.getMonth() + 1).padStart(2, '0');
    const day = String(tenDaysFromNow.getDate()).padStart(2, '0');
    expired = `${year}-${month}-${day}`;

    res.render("addnews", { newsTitle, newsText, expired, notice });
};

//@desc page for adding news 
//@route POST /news/addnews
//@access private 

const addingNews = (req, res) => {
    let newsTitle = req.body.titleInput;
    let newsText = req.body.newsInput;
    let expired = req.body.expireInput;
    let notice = "";
    let user = 1;

    if (!newsTitle || newsTitle.length < 3) {
        notice = "Uudise pealkiri peab olema vähemalt 3 tähemärki!";
        return res.render("addnews", { newsTitle, newsText, expired, notice });
    }
    if (!newsText || newsText.length < 10) {
        let notice = "Uudise sisu peab olema vähemalt 10 tähemärki!";
        return res.render("addnews", { newsTitle, newsText, expired, notice });
    }

    if (!newsTitle || !newsText || !expired) {
        notice = "Osa andmeid on sisestamata!";
        res.render("addnews", {newsTitle, newsText, expired, notice});
    } else {
        let sqlreq = "INSERT INTO vp1_news (news_title, news_text, expire_date, user_id) VALUES (?, ?, ?, ?)";
        conn.query(sqlreq, [newsTitle, newsText, expired, user], (err) => {
            if (err) {
                throw err;
            } else {
                notice = "Uudis salvestatud!";
                res.render("addnews", {newsTitle: "", newsText: "", expired: "", notice});
            }
        });
    }
};


//@desc page for reading news 
//@route POST /news/read
//@access private 

const newsReading = (req, res) => {
    const today = dtEt.dateEt();
    const todayDay = dtEt.dayEt();
    const currentTime = dtEt.timeEt();

    let sqlReq = "SELECT news_title, news_text, news_date FROM vp1_news WHERE expire_date >= ? ORDER BY id DESC";
    const formattedDate = new Date().toISOString().split('T')[0];
    conn.query(sqlReq, [formattedDate], (err, results) => {
        if (err) {
            throw err;
        } else {
            let newsList = results.map(item => ({
                news_title: item.news_title,
                news_text: item.news_text,
                news_date: dtEt.givenDate(item.news_date)
            }));

            res.render("readnews", { newsList, today, todayDay, currentTime });
        }
    });
};

module.exports ={
	newsHome,
	addNews,
	addingNews,
	newsReading
};