window.onload = function(){
	let allThumbs = document.querySelector("#gallery").querySelectorAll(".thumbs");
	for (let i = 0; i < allThumbs.length; i ++){
		allThumbs[i].addEventListener("click", openModal);
	}
	document.querySelector("#modalClose").addEventListener("click", closeModal);
}

function openModal(e){
    console.log()
	console.log(e);
	document.querySelector("#modalCaption").innerHTML = e.target.alt;
	document.querySelector("#modalImage").src = "/gallery/normal/" + e.target.dataset.filename;
	document.querySelector("#modal").showModal();
}

function closeModal(){
	document.querySelector("#modal").close();
	document.querySelector("#modalImage").src = "/pics/empty.png";
	document.querySelector("#modalCaption").innerHTML = "galeriipilt";
}