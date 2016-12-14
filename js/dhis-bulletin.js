var bulletin = bulletin || {};
var baseURL = "http://hospdev.hispindia.org/uphmis_testing/";

/* contain all DBs and DB item details */
bulletin.DBs = {};

/* contain all page IDs in an order */
bulletin.pageIDs = [];

/* contain indexes of pages in bulletin.pageIDs
 * which are ignored from downloading or printing
 */
bulletin.pagesIgnored = [];

/* contain index of current page in bulletin.pageIDs */
bulletin.currentPage = -1;

/*  an array of objects {tableID,elementID}
 *  contain all pivot table's ID and element ID
 *  have to use this approach bcz pivot tables are generated using dhis2 plugin
 */
bulletin.pivotTables = [];

/* global attribute of bulletin */
bulletin.districtName = "Varanasi";
bulletin.volume = 1;
bulletin.timePeriod = {strMonth:"April",endMonth:"June",strYr:2016,endYr:2017};

var callAPI = function( url, filter ){
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

/* retrieve all dashboards info */
var loadDBsInfo = function(){

	var def = $.Deferred();

	callAPI('../../../api/dashboards.json?fields=:all,dashboardItems[:all]','dummy filter').then(function(response){

		bulletin.DBs = response.dashboards;

		def.resolve();
	});


	return def.promise();
};

/*
 * generate html content related to all Dashbord pages and
 * write to a div
 * @param DBs - bulletin.DBs
 */
var generateDBPages = function(DBs){

	var DBPagesContent = '';

	/* navigation UI component */
	DBPagesContent += '<nav aria-label="...">'+
		'<ul class="pager">'+
		'<li id="preBtn" class="previous" onclick="return navigatePagesByDir(-1);"><a href="#"><span aria-hidden="true">&larr;</span> previous</a></li>'+

		'<li class="" onclick="downloadPage(bulletin.currentPage)"><a href="#downloadPage">download page</a></li>'+
		'<li class="" onclick="downloadBulletin()"><a href="#downloadBulletin">download bulletin</a></li>'+
		'<li class="" onclick="printBulletin()"><a href="#printBulletin">print bulletin</a></li>'+
		'<li id="settingsBtn" class=""><a href="#settings">settings</a></li>'+

		'<li id="nextBtn" class="next" onclick="return navigatePagesByDir(+1);"><a href="#">Next <span aria-hidden="true">&rarr;</span></a></li>'+
		'</ul>'+
		'</nav>'+
		'';

	/* front pages 1 */
	DBPagesContent += '<div id="frontPage-1" class="page front-page">'+
					'<section class="center" style="position:relative;top:40px;">'+
					'<div class="text-center">'+
					'<img class="" src="img/nrhm-logo.png" alt="NRHM Logo" height="200" width="200">'+
					'</div>'+
					'</section>'+
					'<section class="center" style="position:relative;top:50px;">'+
					'<div class="text-center">'+
					'<h1 style="color:purple;font-size:300%;"> HMIS Bulletin - <span class="districtName">Varanasi</span></h1>'+
					'<p>Volume - <span class="volume">1</span>, FY '+bulletin.timePeriod.strYr+'-'+bulletin.timePeriod.endYr+' ('+bulletin.timePeriod.strMonth+'-'+bulletin.timePeriod.endMonth+')</p>'+
					'<p style="color:red;font-size:200%;">National Health Mission</p>'+
					'<p>Government of Uttar Pradesh</p>'+
					'</div>'+
					'</section>'+
					'<section style="position:relative;top:240px;">'+
					'<div class="text-center">'+
					'<p>*************</p>'+
					'<p>Prepared By : MIS Division</p>'+
					'<p>State Program Management Unit, Uttar Pradesh.</p>'+
					'</div>'+
					'</section>'+
					'</div>';

	bulletin.pageIDs.push("frontPage-1");

	/* table of content page */
	DBPagesContent += '<div id="frontPage-2" class="page">'+
					'<section class="center" style="position:relative;top:10px;">'+
					'<div class="text-center">'+
					'<p style="color:red;font-size:200%;font-weight:800;">HMIS</p>'+
					'<p style="color:green;font-size:200%;font-weight:800;"><span class="districtName">Varanasi</span> - Uttar Pradesh</p>'+
					'<p style="color:purple;font-size:200%;font-weight:800;">'+bulletin.timePeriod.strMonth+'-'+bulletin.timePeriod.endMonth+' '+bulletin.timePeriod.strYr+'-'+bulletin.timePeriod.endYr+'</p>'+
					'</div>'+
					'</section>'+
					'<section style="position:relative;top:70px;">'+
					'<div id="tableOfContentDiv" class="">'+

						'<table id="content-table" style="width:60%;" align="center">'+
						'<tr style="background-color:#99ffbb;">'+
						'<th>S.No</th>'+
						'<th>Services</th>'+
						'</tr>'+

						'<tr class="page-name-row">'+
						'<td class="text-center">1</td>'+
						'<td onclick="return navigatePagesByID(&#39;dbPage-5&#39;);"><a>Maternal Health</a></td>'+
						'</tr>'+

						'<tr><td class="text-center">1.1</td><td>Antenatal care</td></tr>'+
						'<tr><td class="text-center">1.2</td><td>Delivery & Postnatal care</td></tr>'+
						'<tr><td class="text-center">1.3</td><td>Pregnancy complications</td></tr>'+

						'<tr class="page-name-row">'+
						'<td class="text-center">2</td>'+
						'<td onclick="return navigatePagesByID(&#39;dbPage-3&#39;);"><a>Child Health</a></td>'+
						'</tr>'+

						'<tr><td class="text-center">2.1</td><td>Live Births, New Born Care</td></tr>'+
						'<tr><td class="text-center">2.2</td><td>Child Immunization</td></tr>'+

						'</table>'+

					'</div>'+
					'</section>'+
					'</div>';

	bulletin.pageIDs.push("frontPage-2");

	$.each(DBs, function (index, DB) {
		DBPagesContent += generateDBPage(index,DB);
	});

	document.getElementById("page-container").innerHTML = DBPagesContent;

	generatePivotTables();

	navigatePagesByDir(+1);
};

/*
 * @param pageNo - start from 0,1,2,...
 * @param DB - one DashBord per one page - bulletin.DBs[i]
 * @returns {string} - html content related to that page
 */
var generateDBPage = function(pageNo,DB){

	var DBPageContent = '';
	DBPageContent += '<div id="dbPage-'+pageNo+'" class="page">';

	DBPageContent += '<svg width="110%" height="70" style="position:relative;left:-50px;top:-20px">'+
					'<rect width="110%" height="70" style="fill:rgb(73,124,255)" />'+
					'<text x="550" y="35" alignment-baseline="central" text-anchor="middle" font-size="35px" fill="white">'+DB.displayName+'</text>'+
					'</svg>';

	//DBPageContent += '<div class="page-title"><h4>'+DB.displayName+'</h4></div>';

	$.each(DB.dashboardItems, function (index, DBItem) {
		DBPageContent += generateDBItem(pageNo,index,DBItem);
	});

	DBPageContent += '<div id="textarea'+pageNo+'" class="inline moveable" draggable="true">'+
						'<textarea rows="4" cols="50">'+
							'Write your interpretation'+
						'</textarea>'+
					'</div>';

	DBPageContent += '<div id="page-footer"></div>';

	DBPageContent += '</div>';

	bulletin.pageIDs.push("dbPage-"+pageNo+"");

	return DBPageContent;
};

/*
 * generate html content depend on item type(pivotTable,chart,...)
 * @param pageNo - start from 0,1,2,...
 * @param itemNo - start from 0,1,2,...
 * @param DBItem - bulletin.DBs[i].dashboardItems[j]
 * @returns {string} - html content of that item
 */
var generateDBItem = function(pageNo,itemNo,DBItem){

	var DBItemContent = '';
	var itemType = getDBItemType(DBItem);

	switch(itemType) {
		case "reportTable":
			var itemID = DBItem.reportTable.id;
			DBItemContent = '<div id="dbItem-'+pageNo+'-'+itemNo+'" class="dbItemDiv inline moveable" draggable="true">' +
				'</div>';

			bulletin.pivotTables.push({tableID:""+itemID+"",elementID:"dbItem-"+pageNo+"-"+itemNo+""});
			break;
		case "chart":
			var itemID = DBItem.chart.id;
			var itemName = DBItem.chart.name;
			DBItemContent = '<div id="dbItem-'+pageNo+'-'+itemNo+'" class="dbItemDiv inline moveable" draggable="true">' +
				'<img src="'+ baseURL +'api/charts/'+itemID+'/data?width=410&height=275" alt="'+itemName+'" draggable="false">' +
				'</div>';
			break;
		case "map":
			var itemID = DBItem.map.id;
			var itemName = DBItem.map.name;
			DBItemContent = '<div id="dbItem-'+pageNo+'-'+itemNo+'" class="dbItemDiv inline moveable" draggable="true"">' +
				'<img src="'+ baseURL +'api/maps/'+itemID+'/data?width=410&height=275" alt="'+itemName+'" draggable="false">' +
				'</div>';
			break;
		default:
			DBItemContent = "";
	}

	return DBItemContent;
};

/*
 * call dhis2 plugin
 * bulletin.pivotTables contain all details
 */
var generatePivotTables = function() {

	$.each(bulletin.pivotTables, function (index, table) {
		DHIS.getTable({ url: baseURL, el: table.elementID, id: table.tableID });
	});

	//DHIS.getTable({ url: baseURL, el: "dbItem-0-0", id: "j6YjtD8oj5S" });

	//setTimeout(resizeTable, 4000);
	//$("#dbItem-0-0").children("table").addClass("test");
	//resizeTable($("#dbItem-0-0").children("table"),100,100);
	//resizeTable($("#dbItem-0-0").children());
	//$("#dbItem-0-0_bec73fca-11de-41ec-be9d-a56fcecc26a1").addClass("test");
};

/*
 * @param item - bulletin.DBs[i].dashboardItems[j]
 * @returns {string}
 */
var getDBItemType = function(item){
	var type = "invalid";

	switch(item.type) {
		case "reportTable":
			type = "reportTable";
			break;
		case "chart":
			type = "chart";
			break;
		case "map":
			type = "map";
			break;
		default:
		type = "invalid";
	}

	return type;
};

/*
 * not used
 * @param DBItem
 * @returns {*|string}
 */
var getDBItemID = function(DBItem){
	return DBItem.id;
};

var generateTableOfContent = function(){
	var tableOfContentHTML = "";

	tableOfContentHTML += '<table id="content-table" style="width:60%;" align="center">'+
						'<tr style="background-color:#99ffbb;">'+
						'<th>S.No</th>'+
						'<th>Services</th>'+
						'</tr>';
	var pageNo = 1;
	$.each(bulletin.DBs, function (index, DB) {
		if(!isPageIgnored(index+2)){
			var pageID = bulletin.pageIDs[index+2];
			var pageName = DB.displayName;

			tableOfContentHTML += '<tr class="page-name-row">'+
								'<td class="text-center">'+pageNo+'</td>'+
								'<td onclick="return navigatePagesByID(&#39;'+pageID+'&#39;);">'+pageName+'</td>'+
								'</tr>';

			var itemNo = 1;
			$.each(DB.dashboardItems, function (index, dbItem) {
				var itemType = getDBItemType(dbItem);
				var itemName = "";

				switch(itemType) {
					case "reportTable":
						itemName = dbItem.reportTable.name;
						tableOfContentHTML += '<tr><td class="text-center">'+pageNo+'.'+itemNo+'</td><td>'+itemName+'</td></tr>';
						break;
					case "chart":
						itemName = dbItem.chart.name;
						tableOfContentHTML += '<tr><td class="text-center">'+pageNo+'.'+itemNo+'</td><td>'+itemName+'</td></tr>';
						break;
					case "map":
						itemName = dbItem.map.name;
						tableOfContentHTML += '<tr><td class="text-center">'+pageNo+'.'+itemNo+'</td><td>'+itemName+'</td></tr>';
						break;
				}

				itemNo++;
			});
			pageNo++;
		}
	});

	tableOfContentHTML += '</table>';

	document.getElementById("tableOfContentDiv").innerHTML = tableOfContentHTML;
};

/*
 * will hide all other page divs and display only one
 * @param pageID - bulletin.pageIDs[i]
 */
var displayPage = function(pageID){
	/*$.each(bulletin.pageIDs, function (index, pageID) {
		if(pageID == visibleID)
			$("#"+pageID+"").attr("style","display:initial");
		else
			$("#"+pageID+"").attr("style","display:none");
	});*/

	$(".page").addClass("hidden");
	$("#"+pageID+"").removeClass("hidden");
};

/*
 * navigate through pages
 * @param direction - -1 for previous page and +1 for next page
 * @returns {boolean}
 */
var navigatePagesByID = function(pageID){



	var pageIndex = bulletin.pageIDs.indexOf(pageID);


	/* check ignore radio buttons */
	if(isPageIgnored(pageIndex))
		$('input:radio[name=ignorePage]')[0].checked = true;
	else
		$('input:radio[name=ignorePage]')[1].checked = true;


	displayPage(pageID);
	window.location.hash="page-"+(pageIndex+1);
	bulletin.currentPage = pageIndex;

	/* following conditions are related to navigation UI component */
	if(bulletin.pageIDs.length <= pageIndex+1)
		$("#nextBtn").addClass("disabled");
	else
		$("#nextBtn").removeClass("disabled");

	if(pageIndex-1 < 0)
		$("#preBtn").addClass("disabled");
	else
		$("#preBtn").removeClass("disabled");

	return false;
};

var navigatePagesByDir = function(dir){
	var newPageIndex = bulletin.currentPage + dir;
	var newPageID = bulletin.pageIDs[newPageIndex];

	/* this condition can be removed for now */
	if( newPageIndex < 0 || bulletin.pageIDs.length <= newPageIndex){
		alert("invalid navigation");
		return false;
	}

	navigatePagesByID(newPageID);
};

/* remove this later */
var navigatePagesBackup = function(direction){

	var newPage = bulletin.currentPage + direction;

	/* this condition can be removed for now */
	if( newPage < 0 || bulletin.pageIDs.length <= newPage){
		alert("invalid navigation");
		return false;
	}

	/* check ignore radio buttons */
	if(isPageIgnored(newPage))
		$('input:radio[name=ignorePage]')[0].checked = true;
	else
		$('input:radio[name=ignorePage]')[1].checked = true;


	displayPage(bulletin.pageIDs[newPage]);
	window.location.hash="page-"+(newPage+1);
	bulletin.currentPage = newPage;

	/* following conditions are related to navigation UI component */
	if(bulletin.pageIDs.length <= newPage+1)
		$("#nextBtn").addClass("disabled");
	else
		$("#nextBtn").removeClass("disabled");

	if(newPage-1 < 0)
		$("#preBtn").addClass("disabled");
	else
		$("#preBtn").removeClass("disabled");

	return false;
};

/*
 * bulletin.currentPage will be added to bulletin.pagesIgnored array
 */
var ignorePage = function () {
	bulletin.pagesIgnored.push(bulletin.currentPage);
	var pageID = bulletin.pageIDs[bulletin.currentPage];
	$("#"+pageID+"").addClass("ignored");

	generateTableOfContent();
};

/*
 * bulletin.currentPage will be removed from bulletin.pagesIgnored array
 */
var activatePage = function () {
	var index = bulletin.pagesIgnored.indexOf(bulletin.currentPage);
	bulletin.pagesIgnored.splice(index,1);
	var pageID = bulletin.pageIDs[bulletin.currentPage];
	$("#"+pageID+"").removeClass("ignored");

	generateTableOfContent();
};

/*
 * check whether a page is ignored or not
 * @param pageIndex - index of particular page in bulletin.pageIDs
 * return true if page is ignored
 */
var isPageIgnored = function(pageIndex){
	var pageIgnored = false;
	$.each(bulletin.pagesIgnored, function (index, ignoredPageIndex) {
		if(pageIndex==ignoredPageIndex)
			pageIgnored = true;
	});
	return pageIgnored;
};

/*
 * download a single page as an image using html2canvas library
 * @param pageID - bulletin.pageIDs[i]
 * @param pageName - downloaded file gets this name
 */
var downloadPage = function(pageIndex){

/*	var myBlob = new Blob( [document.getElementById('dhisBulletin').outerHTML] , {type: 'image/png'});
	var url = window.URL.createObjectURL(myBlob);
	var a = document.createElement("a");
	document.body.appendChild(a);
	a.href = url;
	a.download = "newfile.png";
	a.click();
	//adding some delay in removing the dynamically created link solved the problem in FireFox
	setTimeout(function() {window.URL.revokeObjectURL(url);},0);*/

	//saveSvgAsPng(document.getElementById("dhisBulletin"), "dhisBulletin.png");

	/*html2canvas(document.body).then(function(canvas) {
		//document.body.appendChild(canvas);

		console.log(canvas);

		link.href = canvas.toDataURL();
		link.download = newfile.png;

		/!*var url = window.URL.createObjectURL(canvas);
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.href = url;
		a.download = "newfile.png";
		a.click();*!/

		//adding some delay in removing the dynamically created link solved the problem in FireFox
		//setTimeout(function() {window.URL.revokeObjectURL(url);},0);
	});
*/

	var pageID = bulletin.pageIDs[pageIndex];
	var pageName = "bulletin-page-" +(pageIndex+1);

	displayPage(pageID);

	html2canvas($("#"+pageID+""),
		{
			onrendered: function (canvas) {
				var a = document.createElement("a");
				// toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
				//a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
				a.href = canvas.toDataURL("image/png");
				a.download = pageName + ".png";
				a.click();
			}
		});

	displayPage(bulletin.pageIDs[bulletin.currentPage]);

};

/*
 * download all pages
 */
var downloadBulletin = function(){

	$.each(bulletin.pageIDs, function (pageIndex, pageID) {
		if(!isPageIgnored(pageIndex)){
			//var pageName = "bulletin-page-" +(index+1);
			downloadPage(pageIndex);
		}
	});
};

/*
 * first remove hidden class from all pages
 * then add hidden class only for ignored pages
 * call window.print() method
 */
var printBulletin = function(){

	$(".page").removeClass("hidden");
	$.each(bulletin.pagesIgnored, function (index, ignoredPageIndex) {
		var pageID = bulletin.pageIDs[ignoredPageIndex];
		$("#"+pageID+"").addClass("hidden");
	});
	window.print();

	displayPage(bulletin.pageIDs[bulletin.currentPage]);
};

/*
 * used to make items moveable
 */
function drag_start(event) {
	var style = window.getComputedStyle(event.target, null);
	event.dataTransfer.setData("application/x-moz-node", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY) + ',' + event.target.getAttribute('id'));
}

/*
 * used to make items moveable
 */
function drag_over(event) {
	event.preventDefault();
	return false;
}

/*
 * used to make items moveable
 */
function drop(event) {
	var offset = event.dataTransfer.getData("application/x-moz-node").split(',');

	var mv = document.getElementsByClassName('moveable');
	mv[offset[2]].style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
	mv[offset[2]].style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
	event.preventDefault();
	return false;
}

var updateDistrictName = function(districtName){
	bulletin.districtName = districtName;
	var districtNameElements = document.getElementsByClassName("districtName");
	for (var i = 0; i < districtNameElements.length; i++) {
		districtNameElements[i].innerHTML = bulletin.districtName;
	}
};

var calculateTimePeriod = function(){
	var today = new Date();
	var thisYr = today.getFullYear();

	/* find quarter
	 * Apr-Jun = 1
	 * Jul-Sep = 2
	 * Oct-Dec = 3
	 * Jan-Mar = 4
	 */
	var q = Math.floor(today.getMonth()/3);
	var quarter = q < 1 ? 4 : q;

	// set starting and ending months and years
	switch (quarter){
		case 1:
			bulletin.timePeriod.strMonth = "April";
			bulletin.timePeriod.endMonth = "June";
			bulletin.timePeriod.strYr = thisYr;
			bulletin.timePeriod.endYr = thisYr+1;
			break;
		case 2:
			bulletin.timePeriod.strMonth = "July";
			bulletin.timePeriod.endMonth = "September";
			bulletin.timePeriod.strYr = thisYr;
			bulletin.timePeriod.endYr = thisYr+1;
			break;
		case 3:
			bulletin.timePeriod.strMonth = "October";
			bulletin.timePeriod.endMonth = "December";
			bulletin.timePeriod.strYr = thisYr;
			bulletin.timePeriod.endYr = thisYr+1;
			break;
		case 4:
			bulletin.timePeriod.strMonth = "January";
			bulletin.timePeriod.endMonth = "March";
			bulletin.timePeriod.strYr = thisYr-1;
			bulletin.timePeriod.endYr = thisYr;
			break;
	}
};

var updateSettings = function(){
	// update District name
	bulletin.districtName = document.getElementById("districtNameStng").value || "Varanasi";
	var districtNameElements = document.getElementsByClassName("districtName");
	for (var i = 0; i < districtNameElements.length; i++) {
		districtNameElements[i].innerHTML = bulletin.districtName;
	}

	// update Volume
	bulletin.volume = document.getElementById("volumeStng").value || 1;
	var volumeElements = document.getElementsByClassName("volume");
	for (var i = 0; i < volumeElements.length; i++) {
		volumeElements[i].innerHTML = bulletin.volume;
	}
};

/*
 * dont use for now
 * @param tableID
 * @param width
 * @param height
 */
var resizeTable = function(tableID,width,height){

	console.log($("#dbItem-0-0").children());
	$("#dbItem-0-0").children("table").attr("width","100");
	//console.log($("#dbItem-0-0"));
	//$("#"+tableID+"").attr({"width":""+width+"", height:""+height+""});
	//tableID.attr({"width":""+width+"", "height":""+height+""});
	//tableID.attr("id","helloo");
	//tableID.prevObject[0].clientHeight = 400;
};

/*
 * starting point of the app
 */
$(document).ready(function(){

	var def = $.Deferred();
	var promise = def.promise();

	promise = promise.then(loadDBsInfo);
	promise = promise.then(function(){
		console.log(bulletin.DBs);

		/* find financial year and months */
		calculateTimePeriod();

		generateDBPages(bulletin.DBs);

		generateTableOfContent();

		/* make selected content editable*/
		var editableElements = document.getElementsByClassName("contentEditable");
		for (i = 0; i < editableElements.length; i++) {
			editableElements[i].contentEditable = true;
		}

		/* following code block make items moveable */
		var mv = document.getElementsByClassName('moveable');
		for (var i = 0; i < mv.length; i++) {
			mv[i].addEventListener('dragstart', drag_start, true);
		}
		document.body.addEventListener('dragover', drag_over, false);
		document.body.addEventListener('drop', drop, false);

		/* change event for ignore page radio buttons */
		$('input[type=radio][name=ignorePage]').change(function() {
			if (this.value == 'yes') {
				ignorePage();
			}
			else if (this.value == 'no') {
				activatePage();
			}
		});

		/* initiate settings dialog */
		var settingsDialog = $( "#settings-form" ).dialog({
			autoOpen: true,
			height: 400,
			width: 350,
			modal: true,
			buttons: {
				"Update": function() {
					updateSettings();
					$(this).dialog("close");
				},
				Cancel: function() {
					$(this).dialog("close");
				}
			},
			close: function() {
				//form[0].reset();
				//allFields.removeClass( "ui-state-error" );
			}
		});
		/* adding onclick to settings button */
		$( "#settingsBtn" ).on( "click", function() {
			settingsDialog.dialog("open");
		});
	});

	def.resolve();

});






