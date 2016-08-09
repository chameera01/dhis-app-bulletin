var bulletin = bulletin || {};
var baseURL = "http://localhost:8080/dhisv220/";

// Login - if OK, call the setLinks function

/*Ext.onReady( function() {
  Ext.Ajax.request({
	url: base + "/dhis-web-commons/security/login.action",
	method: "POST",
	params: { j_username: "akash", j_password: "Akash@123" },
	success: setLinks
  });
});*/


function drag_start(event) {
	var style = window.getComputedStyle(event.target, null);
	event.dataTransfer.setData("application/x-moz-node", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY) + ',' + event.target.getAttribute('data-item'));
//console.log(event.DataTransfer.mozItemCount );
}

function drag_over(event) {
//console.log(event.DataTransfer.mozItemCount );
	event.preventDefault();
	return false;
}

function drop(event) {
//console.log(event.DataTransfer.mozItemCount );
	var offset = event.dataTransfer.getData("application/x-moz-node").split(',');
	var mv = document.getElementsByClassName('moveable');
	mv[parseInt(offset[2])].style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
	mv[parseInt(offset[2])].style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
	event.preventDefault();
	return false;
}

/*
var mv = document.getElementsByClassName('moveable');
console.log("hello..*.");
for (var i = 0; i < mv.length; i++) {
	mv[i].addEventListener('dragstart', drag_start, false);
	document.body.addEventListener('dragover', drag_over, false);
	document.body.addEventListener('drop', drop, false);
}*/


var apiCall = function( url, filter ){
	var def = $.Deferred();

	$.ajax({
		url: url,
		type: 'GET',
		data: filter
	}).done( function( response ){
		console.log("api call done");
		def.resolve(response);
	}).fail(function(){
		console.log("api call fail");
		def.resolve();
	});

	return def.promise();
};

var loadDBsInfo = function(){

	var def = $.Deferred();

	apiCall('../api/dashboards.json?fields=:all,dashboardItems[:all]','dummy filter').then(function(response){

		bulletin.DBs = response.dashboards;

		def.resolve();
	});


	return def.promise();
};

var generateDBPages = function(DBs){

	/* declare an array to store all page IDs
	 * use this basically to hide and visible pages
	*/
	bulletin.pageIDs = [];

	var DBPagesContent = '';

	$.each(DBs, function (index, DB) {
		DBPagesContent += generateDBPage(index,DB);
	});

	document.getElementById("dhisBulletin").innerHTML = DBPagesContent;

	displayOnePage("dbPage-5");
};

var generateDBPage = function(pageNo,DB){

	var DBPageContent = '';
	DBPageContent += '<div id="dbPage-'+pageNo+'" class="page">';

	$.each(DB.dashboardItems, function (index, DBItem) {
		DBPageContent += generateDBItem(pageNo,index,DBItem);
	});

	DBPageContent += '<div class="inline">'+
						'<textarea rows="4" cols="50">'+
							'this is a text area template...'+
						'</textarea>'+
					'</div>';

	DBPageContent += '</div>';

	bulletin.pageIDs.push("dbPage-"+pageNo+"");

	return DBPageContent;
};

var generateDBItem = function(pageNo,itemNo,DBItem){

	var DBItemContent = '';
	var itemType = getDBItemType(DBItem);

	switch(itemType) {
		case "reportTable":
			DBItemContent = '<h4>reportTable</h4>';
			break;
		case "chart":
			var itemID = DBItem.chart.id;
			DBItemContent = '<div id="dbItem-'+pageNo+'-'+itemNo+'" class="dbItem inline">' +
				'<img src="'+ getDBItemLink(itemType,itemID) +'" alt="db item">' +
				'</div>';
			break;
		default:
			DBItemContent = "invalid item";
	}

	return DBItemContent;
};

var getDBItemType = function(item){
	var type = "invalid";

	switch(item.type) {
		case "reportTable":
			type = "reportTable";
			break;
		case "chart":
			type = "chart";
			break;
		default:
		type = "invalid";
	}

	return type;
};

var getDBItemID = function(DBItem){
	return DBItem.id;
};

var getDBItemLink = function(itemType,itemID){
	var link = "";

	switch(itemType) {
		case "reportTable":
			type = "reportTable";
			break;
		case "chart":
			link = baseURL + "api/charts/" +itemID + "/data?width=410&height=275";
			break;
		default:
			type = "invalid";
	}

	return link;
};

var displayOnePage = function(visibleID){

	/*$.each(bulletin.pageIDs, function (index, pageID) {
		if(pageID == visibleID)
			$("#"+pageID+"").attr("style","display:initial");
		else
			$("#"+pageID+"").attr("style","display:none");
	});*/

	$(".page").addClass("hidden");
	$("#"+visibleID+"").removeClass("hidden");

};

var renderPage

$(document).ready(function(){

	var def = $.Deferred();
	var promise = def.promise();

	promise = promise.then(loadDBsInfo);
	promise = promise.then(function(){
		console.log(bulletin.DBs);
		generateDBPages(bulletin.DBs);
	});

	def.resolve();

/*	$(window).on('hashchange', function(){
		// On every hash change the render function is called with the new hash.
		// This is how the navigation of our app happens.
		loadPage(decodeURI(window.location.hash));
		displayOnePage();
	});*/


});