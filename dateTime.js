const monthNamesEt = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
const dayNamesEt = ['esmaspäev', 'teisipäev', 'kolmapäev', 'neljapäev', 'reede', 'laupäev', 'pühapäev'];
const dateEt = function(){
    let timenow = new Date(); 
    let datenow = timenow.getDate();
    let monthnow = timenow.getMonth();
    let yearnow = timenow.getFullYear();
    let dateNowEt = datenow + '.' + monthNamesEt[monthnow] + ' ' + yearnow;

    return dateNowEt;
}

const daysBetween = function(gDate){
	notice = "teadmata";
	let today = new Date();
	let anotherDay = new Date(gDate);
	let diff = today - anotherDay;
	let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
	if(today == anotherDay){
		notice = "tÃ¤na";
	}
	else if(today < anotherDay){
		notice = Math.abs(diffDays) + " pÃ¤eva pÃ¤rast";
	}
	else {
		notice = diffDays + " pÃ¤eva tagasi";
	}
	return notice;
}

const givenDate = function(gDate){
    //formaatida kuupaevad eesti paraseks
    let date = new Date(gDate);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let dateEt = day + '. ' + monthNamesEt[month] + ' ' + year;

    return dateEt;
}

const givenDateTime = function(gDate){
    //formaatida kuupaevad eesti paraseks
    let date = new Date(gDate);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    let dateEt = day + '. ' + monthNamesEt[month] + ' ' + year + ' ' + hours + ':' + minutes + ':' + seconds;

    return dateEt;
}

const dayEt = function(){
    let timenow = new Date(); 
    let daynow = timenow.getDay();
    let dayNow = (daynow === 0) ? 6 : daynow - 1;
    
    let dayNowEt = dayNamesEt[dayNow];

    return dayNowEt;
}

const timeEt = function(){
    let timenow = new Date(); 
    let hoursnow = timenow.getHours();
    let minutesnow = timenow.getMinutes();
    let secondsnow = timenow.getSeconds();
    
    let timeNowEt = hoursnow + ':' + minutesnow + ':' + secondsnow;

    return timeNowEt;
}

const dateDiff = function(){
    let semesterStart = new Date("09/02/2024");
    let semesterEnd = new Date("01/26/2025");
    let currentDate = new Date(); 

    let pastTimeDiff = currentDate.getTime() - semesterStart.getTime();
    let daysPast = Math.floor(pastTimeDiff / (1000 * 3600 * 24));

    let remainingTimeDiff = semesterEnd.getTime() - currentDate.getTime();
    let daysLeft = Math.ceil(remainingTimeDiff / (1000 * 3600 * 24));

    return [daysPast, daysLeft];
}

const partOfDay = function(){
    let timenow = new Date();
    let hoursnow = timenow.getHours();
    let daynow = timenow.getDay();
    //let dayNow = (daynow === 0) ? 6 : daynow - 1;
    let partOfDay;

    if (daynow >= 1 && daynow <= 5){
        if(hoursnow >= 8 && hoursnow < 16){
            partOfDay = 'kooliaeg';
        }
        else if(hoursnow >= 16 && hoursnow < 18){
            partOfDay = 'kodutööde aeg';
        } 
        else if(hoursnow >= 18 && hoursnow < 22){
            partOfDay = 'vaba aeg';
        }
        else {
            partOfDay = 'uneaeg';
        }
    }
    else {
        if(hoursnow >= 9 && hoursnow < 23){
            partOfDay = 'vaba päev';
        }
        else {
            partOfDay = 'uneaeg';
        }
    }
    
    return partOfDay;
}


module.exports = {dateEt: dateEt, dayEt: dayEt, timeEt: timeEt, partOfDay: partOfDay, givenDate: givenDate, dateDiff: dateDiff, givenDateTime: givenDateTime, daysBetween: daysBetween};