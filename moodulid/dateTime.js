
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
            partOfDay = 'Trenni aeg';
        } 
        else if(hoursnow >= 19 && hoursnow < 22){
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


module.exports = {dateEt: dateEt, dayEt: dayEt, timeEt: timeEt, partOfDay: partOfDay};