/* GRDB Helper Script */

var maillist, contactlist, visitorlist, threadlist, searchlist;
var info, userPic;
var mailbutton=[];
var contactbutton=[];
var visitorbutton=[];
var searchbutton=[];
var lastView, lastButton, lastRow;
var base, cbase, pbase, today;
var mailHandler = {}, mailMap = {};
var userStatMap = {}, userOnlineMap = {}, userPicMap = {};

var visitIcons = {
	10:"like", 11:"like", 13:"like", 14:"like", 15:"like", 16:"like", 17:"like", 19:"like", 31:"like", 42:"like", 47:"like", 50:"like", 51:"like", 52:"like", 53:"like",
	9:"hot", 20:"hot", 21:"hot", 22:"hot", 30:"hot", 40:"hot", 58:"hot",
	8:"hi", 26:"hi", 41:"hi", 44:"hi",
	1:"date", 7:"date",
	12:"love", 54:"love",
	27:"no", 28:"no",
	6:"ex", 49:"ex",
	48:"ok"
};

var VISITS = "grdb_visits";


function fetchURL_didFetch_error(url, didFetchFunc, errorFunc)
{
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if(xhr.readyState==4) {
			if(xhr.status==200) {
				didFetchFunc(xhr.responseText);
			} else {
				errorFunc(xhr.status);
			}
		}
	}
	xhr.open("GET", url, true);
	xhr.send("");
}

function $(id)
{
	return document.getElementById(id);
}

function create(tag, content, klasse)
{
	var node = document.createElement(tag);
	if(content!==undefined) {
		node.appendChild(document.createTextNode(content));
	}
	if(klasse) {
		node.setAttribute("class",klasse);
	}
	return node;
}

function setText(node, text)
{
	clearNode(node);
	node.appendChild(document.createTextNode(text));
}

function clearNode(node)
{
	while(node.firstChild) {
		node.removeChild(node.firstChild);
	}
}

function clearNodeElements(node)
{
	while(node.firstElementChild) {
		node.removeChild(node.firstElementChild);
	}
}

function absAttr(node, attr)
{
	for(var val=0; node; node = node.offsetParent) {
		val += node[attr];
	}
	return val;
}

function openMessageWindow(url)
{
	return window.open(url, null, "width=336,height=450,scrollbars=yes");
}

function openProfileWindow(url)
{
	return window.open(url, null, "width=470,height=590,scrollbars=yes");
}

function openWindow(url)
{
	if(window.safari) {
		safari.self.tab.dispatchMessage("openTab", url);
	} else {
		window.open(url);
	}
}

function nn(val)
{
	if(val) {
		return val;
	}
	return "–";
}

// -

function userURL(id)
{
	return base+"/auswertung/setcard/?set="+id;
}

function createPicLink(id, pic)
{
	var link = create("a");
	link.setAttribute("href", userURL(id));
	link.setAttribute("class", "pic");
	link.addEventListener("click", handleProfileClick, false);
	img = create("img");
	img.setAttribute("src", pbase+pic+".jpg");
	link.appendChild(img);
	return link;
}

function createUserLink(id, name, info, pic, online, plain)
{
	var link = create("a", name);
	link.setAttribute("href", userURL(id));
	link.addEventListener("click", handleProfileClick, false);
	if(!plain) {
		stats = userStatMap[id];
		if(info && stats) {
			link.setAttribute("title",info+"\n--\n"+stats);
		} else if(info) {
			link.setAttribute("title",info);
		} else if(stats) {
			link.setAttribute("title",stats);
		}
		if(pic = pic || userPicMap[id]) {
			link.setAttribute("data-pic",pic);
			link.addEventListener("mouseover", showUserPic, false);
			link.addEventListener("mouseout", hideUserPic, false);
		}
	}
	if(online = online || userOnlineMap[id]) {
		link.setAttribute("data-online",online);
	}
	return link;
}

function createMoreLink()
{
	var link = create("a", "»");
	link.addEventListener("click",moreAction,false);
	link.style.backgroundImage = "url(i/more.png)";
	link.setAttribute("title","More");
	return link;
}

function createHistoryLink(id, conv)
{
	var link = create("a", "⇄");
	link.setAttribute("href",base+"/msg/history.php?uid="+id+"#lastmessage");
	link.style.backgroundImage = conv ? "url(i/hist_hi.png)" : "url(i/hist.png)";
	link.setAttribute("title","History");
	link.setAttribute("target","_blank");
	return link;
}

function createMailThreadLink(id)
{
	var link = create("a","→");
	link.setAttribute("href",base+"/msg/history_email.php?uid="+id);
	link.style.backgroundImage = "url(i/ffwd.png)";
	link.setAttribute("title","Forward via E-Mail");
	link.setAttribute("target","_blank");
	return link;
}

function createMsgLink(id, msgID, sent)
{
	var link = create("a", sent?"R":"M");
	link.setAttribute("href",base+"/msg/?uid="+id);
	if(msgID && msgID!=-1) {
		link.setAttribute("data-msg", msgID);
		link.addEventListener("click", handleMailClick, false);
		link.style.backgroundImage = "url(i/msg_hi.png)";
		link.setAttribute("title","Read Message");
	} else {
		link.addEventListener("click", handlePanelClick, false);
		link.style.backgroundImage = sent?"url(i/reply.png)":"url(i/msg.png)";
		link.setAttribute("title","Message");
	}
	return link;
}

function createAlbumLink(id)
{
	var link = create("a", "A");
	link.setAttribute("href",base+"/auswertung/album/?set="+id);
	link.style.backgroundImage = "url(i/album.png)";
	link.setAttribute("title","Show Picture Album");
	link.setAttribute("target","_blank");
	return link;
}

function createEditContactLink(id)
{
	var link = create("a", "E");
	link.setAttribute("href",base+"/gemeinsam/php/myuser/?partnerId="+id);
	link.addEventListener("click", handlePanelClick, false);
	link.style.backgroundImage = "url(i/profile.png)";
	link.setAttribute("title","Edit Contact");
	return link;
}

function createFootprintLink(id)
{
	var link = create("a", "F");
	link.setAttribute("href",base+"/auswertung/setcard/romeo/footprint.php?receiverId="+id+"&cameFrom=profile");
	link.addEventListener("click", handlePanelClick, false);
	link.style.backgroundImage = "url(i/footprint.png)";
	link.setAttribute("title","Footprint");
	return link;
}

function createPin(id, name, tapID, tap, sticky)
{
	var link = create("a", "P");
	link.addEventListener("click", function(event) {
		if(this.getAttribute("data-sticky")!="0") {
			unstoreVisit(id);
			this.style.backgroundImage = "url(i/pin.png)";
			this.setAttribute("data-sticky",0);
		} else {
			storeVisit(id, name, tapID, tap);
			this.style.backgroundImage = "url(i/pin_hi.png)";
			this.setAttribute("data-sticky",1);
		}
	}, false);
	if(sticky) {
		link.style.backgroundImage = "url(i/pin_hi.png)";
		link.setAttribute("data-sticky", sticky);
	} else {
		link.style.backgroundImage = "url(i/pin.png)";
		link.setAttribute("data-sticky", 0);
	}
	link.setAttribute("title","Pin");
	return link;
}

function timestamp(datestring, named)
{
	if(named) {
		return new Date(datestring.replace(/\./g," "));
	} else {
		return new Date(datestring.replace(/(\d\d)\.(\d\d)\./, "$2/$1 "));
	}
}

function dayDiff(from, to)
{
	return (to-from) / 24 / 60 / 60 / 1000;
}

function daysSince(datestring)
{
	var date = timestamp(datestring);
	if(isNaN(date)) {
		return -1;
	}
	return dayDiff(date,today);
}

function displayDate(datestring)
{
	return datestring ? datestring.replace(/(\d\d\.\d\d)\.\d\d/,"$1. ") : '';
}

function stripStats(stats)
{
	if(!stats) {
		return null;
	}
	var cleanstats = stats.replace(/<[^>]*>/g, "");
	var regex = /[0-9][0-9a-z'"\s]*/g;
	var res = "";
	for(var i=0; stat = regex.exec(cleanstats); i++) {
		res = res + (i?" · ":"") + stat;
	}
	return res;
}

function visitIcon(received, given)
{
	var img;
	if(received && received!=-1 && (img=visitIcons[received])) {
		if(given && given!=-1) {
			if(visitIcons[given]==img) {
				return img+"_m";
			}
			if(given==48) {
				return img+"_t";
			}
			return img+"_b";
		}
		return img+"_r";
	}
	if((!received || received==-1) && given && given!=-1 && (img=visitIcons[given])) {
		return img+"_g";
	}
	return null;
}

function appendMailRow(senderID, sender, msgID, subject, datetime, timestamp, att, fresh, dup, sent, drop)
{
	var cell, link, klasse;
	var row = create("li");

	if(sent) {
		klasse = "sent";
	} else {
		klasse = "recv";
	}
	if(drop) {
		klasse += " drop";
	}
	row.setAttribute("class",klasse);
	if(msgID) {
		row.setAttribute("data-msg",msgID);
		row.addEventListener("click", handleMailClick, false);
	}
	if(!dup) {
		cell = create("div");
		cell.setAttribute("class","action");
		cell.addEventListener("click", onlyThis, false);
		link = createHistoryLink(senderID, fresh);
		cell.appendChild(link);
		cell.appendChild(createMoreLink());
		if(sent) {
			link = createMsgLink(senderID, null, true);
			cell.appendChild(link);
		}
		link = createAlbumLink(senderID);
		cell.appendChild(link);
		link = createFootprintLink(senderID, null, sent);
		cell.appendChild(link);
		link = createEditContactLink(senderID);
		cell.appendChild(link);
		link = createMailThreadLink(senderID);
		cell.appendChild(link);
		row.appendChild(cell);

		cell = create("h2");
		link = createUserLink(senderID, sender);
		link.addEventListener("click", onlyThis, false);
		cell.appendChild(link);
		row.appendChild(cell);
	}
	if(timestamp) {
		cell = create("h3", displayDate(datetime));
		age = dayDiff(timestamp,today);
		if(age>1) {
			cell.setAttribute("title",Math.floor(age)+" days old");
		}
		if(age<=0.5) {
			cell.setAttribute("data-age","new");
		}
		if(age > (sent?3:10)) {
			cell.setAttribute("data-age","due");
		}
		if(att) {
			cell.setAttribute("data-att","true");
		}
		row.appendChild(cell);
	}
	if(subject) {
		subject += "\n";
		cell = create("p");
		cell.innerHTML = subject.replace("...\n","…");
		row.appendChild(cell);
	} else if(subject == undefined) {
		row.appendChild(create("p","…"));
		row.setAttribute("class",row.getAttribute("class")+" mini");
	}
	maillist.appendChild(row);
}

function appendUserRow(list, id, name, info, timestamp, age, state, online, msgID, isFav, pic)
{
	var cell, klasse;
	var row = create("li");
	if(pic) {
		row.appendChild(createPicLink(id, pic));
	}
	cell = create("div");
	cell.setAttribute("class","action");
	cell.appendChild(createMsgLink(id, msgID));
	cell.appendChild(createMoreLink());
	cell.appendChild(createHistoryLink(id, msgID));
	cell.appendChild(createAlbumLink(id));
	cell.appendChild(createFootprintLink(id));
	cell.appendChild(createEditContactLink(id));
	row.appendChild(cell);
	cell = create("h3",state);
	klasse = isFav?"fav":"";
	if(!isNaN(timestamp)) {
		klasse += " low";
		if(age<2) {
			cell.setAttribute("data-age","recent");
		} else {
			cell.setAttribute("title",Math.floor(age) + " days ago");
		}
	} else if(online>0) {
		cell.setAttribute("data-age","now");
		klasse += " online";
	}
	row.setAttribute("class",klasse);
	row.appendChild(cell);
	cell = create("h2");
	cell.appendChild(createUserLink(id, name, info, pic, online, list==searchlist));
	row.appendChild(cell);
	if(list != contactlist) {
		row.appendChild(create("p",info));
	}
	list.appendChild(row);
}

function appendVisitorRow(id, name, info, datetime, timestamp, receivedID, received, givenID, given, msgID, pic, sticky)
{
	var cell, klasse;
	var row = create("li");
	if(givenID!=-1 && sticky!=1 && receivedID!=-1) {
		klasse = "recv sent";
	} else if(receivedID==-1) {
		klasse = "sent drop";
	} else if(givenID==-1 || sticky==1) {
		klasse = "recv new";
	}
	if(givenID>0 || receivedID>0) {
		klasse+=" taps";
	}
	row.setAttribute("class",klasse);

	if(pic) {
		row.appendChild(createPicLink(id, pic));
	}
	cell = create("div");
	cell.setAttribute("class","action");
	cell.appendChild(createPin(id, name, givenID, given, sticky));
	cell.appendChild(createMoreLink());
	cell.appendChild(createHistoryLink(id, msgID));
	cell.appendChild(createAlbumLink(id));
	cell.appendChild(createFootprintLink(id));
	cell.appendChild(createEditContactLink(id));
	row.appendChild(cell);
	if(timestamp) {
		cell = create("h3", datetime.replace(/-/," "));

		age = dayDiff(timestamp,today);
		if(age<=0.5) {
			cell.setAttribute("data-age","new");
		}
		if(age>2.5) {
			cell.setAttribute("data-age","due");
		}
	} else {
		cell = create("h3", datetime);
	}
	if(img = visitIcon(receivedID, givenID)) {
		cell.style.backgroundImage = "url(f/"+img+".png)";
	}
	if(receivedID && receivedID!=-1) {
		cell.setAttribute("data-recv",receivedID);
		cell.setAttribute("title",received);
	}
	if(givenID && givenID!=-1) {
		cell.setAttribute("data-give",givenID);
		if(prev = cell.getAttribute("title")) {
			prev += "\n";
		} else {
			prev = "";
		}
		if(givenID != receivedID) {
			cell.setAttribute("title", prev+"⇠ "+given);
		}
	}
	row.appendChild(cell);
	cell = create("h2");
	cell.appendChild(createUserLink(id, name, null,null,null, true));
	row.appendChild(cell);
	row.appendChild(create("p", info));
	visitorlist.appendChild(row);
}

function appendThreadRow(id, name)
{
	var cell, link;
	var row = create("li");
	cell = create("div");
	cell.setAttribute("class","action");
	link = createMailThreadLink(id);
	link.addEventListener("click", markLow, false);
	cell.appendChild(link);
	cell.appendChild(createMoreLink());
	cell.appendChild(createHistoryLink(id));
	cell.appendChild(createAlbumLink(id));
	cell.appendChild(createFootprintLink(id));
	cell.appendChild(createEditContactLink(id));
	row.appendChild(cell);
	cell = create("h2");
	cell.appendChild(createUserLink(id, name));
	row.appendChild(cell);
	threadlist.appendChild(row);
}

function setBadge(node, cont, diff)
{
	if(!node) {
		return;
	}
	clearNodeElements(node);
	if(diff) {
		if(diff<0) {
			node.appendChild(create("span",-diff,"badge diff sub"));
		} else {
			node.appendChild(create("span",diff,"badge diff add"));
		}
	}
	if(cont) {
		node.appendChild(create("span",cont,"badge"));
		return cont;
	}
	return 0;
}

function setCount(button, count, message)
{
	count = setBadge(button[0], count);
	setBadge(button[2], count);
	if(window.safari) {
		safari.self.tab.dispatchMessage(message, count);
	}
}

function setMailCount(count)
{
	setCount(mailbutton, count, "updateMessageCount");
}

function setContactCount(count)
{
	setCount(contactbutton, count, "updateContactCount");
}

function setVisitorCount(count)
{
	setCount(visitorbutton, count, "updateVisitorCount");
}

function setFetchTime()
{
	if(!today) {
		today = new Date();
		setText(info, today.toLocaleString());
	}
}

function showListMessage(node, text, des, error)
{
	clearNode(node);
	var row = create("li");
	row.setAttribute("class", error?"msg err":"msg low");
	row.appendChild(create("h2",text));
	if(des) {
		row.appendChild(create("p",des));
	}
	node.appendChild(row);
}

function handleMailClick(event)
{
	var msg = this.getAttribute("data-msg");
	var newmail = mailHandler["new"];
	var uid = mailMap[msg];
	var uindex = newmail[uid] || [];
	var i;
	for(i=0; i < uindex.length; i++) {
		if(uindex[i][3]==msg) {
			uindex.splice(i,1);
			i--;
		}
	}
	if(i==0) {
		delete newmail[uid];
	}
	event.preventDefault();
	this.setAttribute("class",this.getAttribute("class")+" low");
	var popup = openMessageWindow(base+"/msg/?id="+msg);
	popup.opener = null;
}

function handlePanelClick(event)
{
	openMessageWindow(this.getAttribute("href"));
	event.preventDefault();
}

function handleProfileClick(event)
{
	openProfileWindow(this.getAttribute("href"));
	event.preventDefault();
}

function storeVisit(id, name, tapID, tap)
{
	list = JSON.parse(localStorage.getItem(VISITS)) || [];
	list.push([id, name, tapID, tap]);
	localStorage.setItem(VISITS, JSON.stringify(list));
}

function unstoreVisit(id)
{
	list = JSON.parse(localStorage.getItem(VISITS)) || [];
	for(var i=0; i<list.length; i++) {
		if(list[i][0]==id) {
			list.splice(i,1);
			i--;
		}
	}
	localStorage.setItem(VISITS, JSON.stringify(list));
}

function showUserPic(event)
{
	var target = event.target;
	userPic.hideTimer = userPic.hideTimer && clearTimeout(userPic.hideTimer);
	adjPic = function() {
		userPic.setAttribute("src",pbase+target.getAttribute("data-pic")+".jpg");
		userPic.style.top = (absAttr(target, "offsetTop") - 4) + "px";
		userPic.style.left = (absAttr(target, "offsetLeft") - userPic.offsetWidth - 4) + "px";
	}
	if(userPic.style.display=="block") {
		userPic.style.WebkitTransitionProperty = "";
		adjPic();
	} else {
		userPic.showTimer = userPic.showTimer || setTimeout(function() {
			userPic.Timer = null;
			userPic.style.WebkitTransitionProperty = "none";
			userPic.style.display = "block";
			adjPic();
		}, 1000);
	}
}

function hideUserPic(event)
{
	userPic.showTimer = userPic.showTimer && clearTimeout(userPic.showTimer);
	userPic.hideTimer = setTimeout(function() { userPic.style.display = "none"; }, 500);
}

function moreAction(event)
{
	event.stopPropagation();
	this.setAttribute("style","display:none;");
	this.parentElement.setAttribute("class","action more");
}

function markLow(event)
{
	this.parentElement.parentElement.setAttribute("class","low");
}

function onlyThis(event)
{
	event.stopPropagation();
}

function switchView(view, button, row)
{
	if(row && row!=lastRow) {
		lastRow.setAttribute("class","");
		row.setAttribute("class","act");
		if(row.parentElement!=lastRow.parentElement) {
			lastRow.parentElement.style.display = "none";
			row.parentElement.setAttribute("style","");
		}
		lastRow = row;
	}
	if(button && button!=lastButton) {
		setText(info, "GRDB.");
		lastButton.setAttribute("class","");
		button.setAttribute("class","act");
		lastButton = button;
	}
	if(view && view!=lastView) {
		lastView.style.display = "none";
		view.setAttribute("style","");
		lastView = view;
	}
}

// -

function noLogin(handler, message, details)
{
	setBadge(mailbutton[1]);
	setBadge(mailbutton[2]);
	setBadge(mailbutton[3]);
	setBadge(mailbutton[4]);
	setBadge(contactbutton[1]);
	setBadge(contactbutton[2]);
	setBadge(contactbutton[3]);
	setBadge(visitorbutton[1]);
	setBadge(visitorbutton[2]);
	setBadge(visitorbutton[3]);
	setBadge(visitorbutton[4]);
	setBadge(visitorbutton[5]);
	setBadge(searchbutton[1]);
	if(handler) {
		if(!handler["fail"]) {
			if(!isNaN(parseInt(details))) {
				details = "The server responded with error "+details+".";
			}
			if(!details) {
				details = "Ensure you are logged in.";
			}
			showListMessage(handler["list"], message, details, true);
		}
		handler["fail"] = true;
	}
}

function clusterItems(html, regex, more, index, isSent)
{
	var first, dup, last, item = null;

	regex.lastIndex = 0;
	for(item = null; item = regex.exec(html); index[item[1]] ? index[item[1]].unshift(item) : index[item[1]] = [item]) {
		if(isSent) {
			item.timestamp = timestamp(item[4]);
		} else {
			item.timestamp = timestamp(item[5]);
		}
		if((dup = index[item[1]]) && (dup[0]!=last)) {
			var old = dup[0].next;
			dup[0].next = item;
			item.next = old;
		} else {
			if(last) {
				last.next = item;
			} else {
				first = item;
			}
			last = item;
		}
	}

	if(!more) {
		return first;
	}
	more.lastIndex = 0;
	while(item = more.exec(html)) {
		if(item[1]!="0" && !index[item[1]]) {
			item.timestamp = null;
			if(last) {
				last.next = item;
			} else {
				first = item;
			}
			index[item[1]] = [item];
			last = item;
		}
	}

	return first;
}

function handlerInProcess(handler)
{
	if(handler["found"] >= handler["total"]) {
		clearNode(handler["list"]);
		return false;
	}

	showListMessage(handler["list"], "Loading", Math.round(100*handler["found"]/handler["total"])+"%");

	return true;
}

function prepareVisitor(item, tapex)
{
	item.timestamp = timestamp(item[5].replace(/-/,today.getFullYear()+" "));
	userPicMap[item[2]] = item[1];
	userOnlineMap[item[2]] = item[6]=="0f0" ? 2 : item[6]=="ff0"?1:-1;
	item[4] = stripStats(item[4]);
	if(item[7]) {
		item[4] = item[4] + " — " + item[7];
	}
	userStatMap[item[2]] = item[4];
	if(!tapex) {
		return;
	}
	tapex.lastIndex = 0;
	if(tap = tapex.exec(item[8])) {
		item[9] = tap[1];
		item[10] = tap[2];
	}
	item[8] = null;
}

function prepareContact(item, isFav)
{
	var online;
	var id = item[2];

	item.timestamp = timestamp(item[6], true);
	if(isNaN(item.timestamp)) {
		item.days = isFav ? 0 : 1;
	} else {
		item.days = dayDiff(item.timestamp, today);
	}

	if(item[5]=="isOnline") {
		if(item[6]=="Away") {
			online = 1;
		} else { // online
			online = 2;
		}
	} else if(item[5]=="deleted") {
		online = -2;
	} else { // offline
		online = -1;
	}
	if(item[1]) {
		userPicMap[id] = item[1];
	}
	userOnlineMap[id] = online;
	item.online = online;
}

function combineMails(handler, html, regex, type)
{
	handler["found"]++;
	setFetchTime();
	var more = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;

	var i_n = handler["new"]; // userID => [new items]
	var index = handler["index"]; // userID => [items]
	var map = handler["map"]; // msgID => userID

	switch(type) {
		case 0: // new
			handler["newmail"] = clusterItems(html, regex, more, i_n, false);
			for(uid in i_n) {
				index[uid] = i_n[uid];
				for(var i=0; i < i_n[uid].length; i++) {
					map[i_n[uid][i][3]] = uid;
				}
			}
		break;
		case 1: // received
			handler["received"] = clusterItems(html, regex, null, {}, false);
		break;
		case 2: // undelivered
			var i_u = {}
			handler["undelivered"] = clusterItems(html, regex, more, i_u, true);
			for(uid in i_u) {
				index[uid] = i_u[uid];
			}
		break;
		case 3: // sent
			handler["sent"] = clusterItems(html, regex, more, {}, true);
		break;
	}

	if(handlerInProcess(handler)) {
		return;
	}

	var n = handler["newmail"];
	var r = handler["received"];
	var u = handler["undelivered"];
	var s = handler["sent"];
	var d = [];
	var i = 0;

	while(s || r) {
		while(s && !(r && !index[s[1]] && s.timestamp<r.timestamp)) {
			if(!index[s[1]]) {
				s.sent = true;
				d[i] = s;
				index[s[1]] = s;
				i++;
			}
			s = s.next;
		}
		while(r && !(s && !index[r[1]] && r.timestamp<s.timestamp)) {
			if(!index[r[1]]) {
				r.sent = false;
				d[i] = r;
				index[r[1]] = r;
				i++;
			}
			r = r.next;
		}
	}

	var dl = i;
	i = 0;
	var k = 0;
	var curID, prvID;
	while(n || u || i<dl) {
		while(n && !(u && n.timestamp<u.timestamp) && !(i<dl && n.timestamp<d[i].timestamp)) {
			curID = n[1];
			prvID = 0;
			while(n && curID == n[1]) {
				appendMailRow(n[1], n[2], n[3], n[4], n[5], n.timestamp, n[6]=="i", mailMap[n[3]] ? false : true, prvID==curID, false);
				prvID = curID;
				n = n.next;
				k++;
			}
		}
		while(u && !(n && u.timestamp<n.timestamp) && !(i<dl && u.timestamp<d[i].timestamp)) {
			curID = u[1];
			prvID = 0;
			while(u && curID == u[1]) {
				appendMailRow(u[1], u[2], null, u[3], u[4], u.timestamp, u[5]=="i", false, prvID==curID, true);
				prvID = curID;
				u = u.next;
				k++;
			}
		}
		while(i<dl && !(n && d[i].timestamp<n.timestamp) && !(u && d[i].timestamp<u.timestamp)) {
			if(d[i].sent) {
				appendMailRow(d[i][1], d[i][2], null, d[i][3], d[i][4], d[i].timestamp, d[i][5]=="i", false, false, true, true);
			} else {
				appendMailRow(d[i][1], d[i][2], d[i][3], d[i][4], d[i][5], d[i].timestamp, d[i][6]=="i", false, false, false, true);
			}
			i++;
			k++;
		}
	}
	if(k==0) {
		showListMessage(maillist,"No Messages");
	}
	mailMap = map;
}

function combineContacts(handler, html, isFav)
{
	handler["found"]++;
	setFetchTime();
	if(html) {
		html = html.replace(/<wbr>/g, "");
		html = html.replace(/<br\/>[\r\n]+/g, "\n");
	}
	var regex = /(?:\/usr\/([^\.]*)\.[^>]*><\/a><\/td>)?<td class="profileMemoColumn"[^?]*\?set=(\d+)[^>]*>([^<]*)<\/a><br\/>([^<]*)<\/td>.*?<\/td><td class="onlineStatus"><[^"]*"([^"]*)">([^<]*)<\/span>/gi;

	var item, i;

	var f = handler["favs"];
	var o = handler["online"];
	var index = handler["index"];

	if(isFav) {
		for(i = f.length; item = regex.exec(html); i++) {
			prepareContact(item, true);
			if(item.online>0) {
				index[item[2]] = item;
			}
			f[i] = item;
		}
	} else {
		for(i = o.length; item = regex.exec(html); i++) {
			prepareContact(item, false);
			o[i] = item;
		}
	}

	if(handlerInProcess(handler)) {
		return;
	}

	var fl = f.length;
	var ol = o.length;
	var j;

	for(j = 0; j < ol; j++) {
		if(index[o[j][2]]) {
			o[j][2] = 0;
		}
	}

	var id;
	var list = handler["list"];
	var mail = mailHandler["index"] || {};
	var newmail = mailHandler["new"] || {};
	var fav = 0;
	i = 0;
	j = 0;

	while(i<fl || j<ol) {
		while(j<ol && o[j][2]==0) {
			j++;
		}
		while(i<fl && !(j<ol && f[i].days>o[j].days)) {
			item = f[i];
			id = item[2];
			appendUserRow(list, id, item[3], item[4], item.timestamp, item.days, item[6], item.online, newmail[id] ? newmail[id][0][3] : (mail[id] ? -1 : 0), true, item[1]);
			if(item.online>0) {
				fav++;
			}
			i++;
		}
		while(j<ol && !(i<fl && o[j].days>f[i].days)) {
			if(id = o[j][2]) {
				item = o[j];
				appendUserRow(list, id, item[3], item[4], item.timestamp, item.days, item[6], item.online, newmail[id] ? newmail[id][0][3] : (mail[id] ? -1 : 0));
			}
			j++;
		}
	}

	setContactCount(fav);
	setBadge(contactbutton[3], ol);
	if(i==0 && ol==0) {
		showListMessage(contactlist, "No Contacts");
	}
}

function combineVisits(handler, html, isGiven)
{
	handler["found"]++;
	setFetchTime();
	if(html) {
		html = html.replace(/<wbr>/g, "");
	}
	var regex = /(?:\/usr\/([^\.]*)\.[^\n]*\n\s*)?<td class="resHeadline[^?]*\?set=(\d+)[^>]*>([^<]*)<\/a>[^\n]*\n\s*((?:(?:<[^>]*>[^<]*<\/[^>]*>)|[\s0-9.,a-z'"&;])*);([^<]*)<\/td>(?:[^<]+|<(?!tr))*<tr[^>]*>\s*<td[^>]*>\s*<span(?:\s+style="color:#([^;]*);)?[^>]*>(?:[^<]+|<(?!td))*<td[^>]*>(?:<span class="distance">([^<]*))?<\/[^>]+>([\s\S]*?)<br \/>\s*<br \/><br \/>/gi;
	var tapex = /footprints\/([0-9a-z_]+)_\d+\.png[^:]*:\s+([^"]*)"/gi;

	var item, i;

	var r = handler["received"];
	var g = handler["given"];
	var index = handler["index"];

	if(isGiven) {
		for(i = g.length; item = regex.exec(html); i++) {
			prepareVisitor(item, tapex);
			index[item[2]] = item;
			g[i] = item;
		}
	} else {
		for(i = r.length; item = regex.exec(html); i++) {
			prepareVisitor(item, tapex);
			r[i] = item;
		}
	}

	if(handlerInProcess(handler)) {
		return;
	}

	setVisitorCount(r.length);
	setBadge(visitorbutton[3], g.length);

	var s = JSON.parse(localStorage.getItem(VISITS)) || [];
	for(i=0; i<s.length; i++) {
		if(item = index[s[i][0]]) {
			s[i][1] = item[3];
			s[i][2] = item[9];
			s[i][3] = item[10];

			item[11] = 2;
		} else {
			item = [0,0,s[i][0],s[i][1],"","??.??. ??:??","","",0,s[i][2],s[i][3],1];
			item.timestamp = null;
			g.push(item);
			index[s[i][0]] = item;
		}
	}
	localStorage.setItem(VISITS, JSON.stringify(s));

	var rl = r.length;
	var gl = g.length;
	for(i = 0; i < rl; i++) {
		if(item = index[r[i][2]]) {
			item[2] = 0;
		}
	}

	i = 0; var j = 0; var k = 0; var neu = 0; var ign = 0;
	var mail = mailHandler["index"] || {};
	var newmail = mailHandler["new"] || {};
	var id;
	while(i<rl || j<gl) {
		while(j<gl && g[j][2]==0) {
			j++;
			k++;
		}
		while(i<rl && !(j<gl && r[i].timestamp<g[j].timestamp)) {
			id = r[i][2];
			item = index[id];
			appendVisitorRow(id, r[i][3], r[i][4], r[i][5], r[i].timestamp, r[i][9], r[i][10], item ? item[9] : -1, item ? item[10] : null, newmail[id] ? newmail[id][0][3] : (mail[id] ? -1 : 0), r[i][1], item ? item[11] : 0);
			if(!item) {
				neu++;
			}
			i++;
		}
		while(j<gl && !(i<rl && g[j].timestamp<r[i].timestamp)) {
			if(id = g[j][2]) {
				appendVisitorRow(id, g[j][3], g[j][4], g[j][5], g[j].timestamp, -1, null, g[j][9], g[j][10], newmail[id] ? newmail[id][0][3] : (mail[id] ? -1 : 0), g[j][1], g[j][11]);
				if(g[j].timestamp) {
					ign++;
				}
			}
			if(g[j].timestamp) {
				k++;
			}
			j++;
		}
	}

	setBadge(visitorbutton[4], neu);
	setBadge(visitorbutton[5], ign);

	if(rl==0 && gl==0) {
		showListMessage(visitorlist,"No Visitors");
	}
}

function combineSearch(handler, html, flag)
{
	handler["found"]++;
	setFetchTime();
	if(html) {
		html = html.replace(/<wbr>/g, "");
	}
	var regex = /(?:\/usr\/([^\.]*)\.[^\n]*\n\s*)?<td class="resHeadline"[^?]*\?set=(\d+)[^>]*>([^<]*)<\/a>[^\n]*\n\s*<td[^>]*>\s*((?:(?:<[^>]*>[^<]*<\/[^>]*>)|[\s0-9.,a-z'"&;])*)<\/td>(?:[^<]+|<(?!tr))*<tr[^>]*>\s*<td[^>]*>\s*<span(?:\s+style="color:#([^;]*);)?[^>]*>([^<]*)<\/span>(?:[^<]+|<(?!td))*<td[^>]*>(?:<span class="distance">([^<]*))?<\/[^>]+>/gi;

	var item, i;

	var r = handler["results"];
	for(i = r.length; item = regex.exec(html); i++) {
		item[6] = item[6].replace(/^[^:]*:\s*/, "");
		if(parseInt(item[6])) {
			var date = item[6]+" "+today.getFullYear();
			var months = {"Mär":"Mar","Mai":"May","Okt":"Oct","Dez":"Dec"};
			for(var mon in months) {
				date = date.replace(mon, months[mon]);
			}
			item.timestamp = timestamp(date, true);
		}
		if(isNaN(item.timestamp)) {
			item.days = 0;
		} else {
			item.days = dayDiff(item.timestamp, today);
		}
		item.online = item[5]=="0f0" ? 2 : item[5]=="ff0"?1:-1;
		item[4] = stripStats(item[4]);
		if(item[7]) {
			item[4] = item[4] + " — " + item[7];
		}
		r[i] = item;
	}

	if(handlerInProcess(handler)) {
		return;
	}

	var id;
	var list = handler["list"];
	var mail = mailHandler["index"] || {};
	var newmail = mailHandler["new"] || {};
	var rl = r.length;
	setBadge(searchbutton[1], rl);

	for(i=0; i<rl; i++) {
		item = r[i];
		id = item[2];
		appendUserRow(list, id, item[3], item[4], item.timestamp, item.days, item[6], item.online, newmail[id] ? newmail[id][0][3] : (mail[id] ? -1 : 0), false, item[1]);
	}

	if(i==0) {
		showListMessage(list, "No results");
	}
}

function fetchMails(event)
{
	today = null;
	mailHandler = {"newmail":false, "new":{}, "received":false, "undelivered":false, "sent":false, "threads":[], "index":{}, "map":{}, "found":0, "total":4, "list":maillist, "fail":false};
	if(event===false) {
		switchView(maillist, mailbutton[0]);
	} else {
		switchView(maillist, mailbutton[0], mailbutton[1]);
		maillist.removeAttribute("class");
	}

	showListMessage(maillist,"Loading …");
	// NEW
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=new", function(html) {
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler, "Cannot retrieve new messages.");
			return;
		}

		var item = null;
		regex = /view=new">(\d+)/gi;
		if(item = regex.exec(html)) {
			setMailCount(parseInt(item[1]));
		} else {
			setMailCount();
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^?]*\?id=(\d+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;
		combineMails(mailHandler, html, regex, 0);
	}, function(status) {
		noLogin(mailHandler, "Cannot access new messages.", status);
	});

	// RECEIVED
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=all", function(html) {
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler, "Cannot retrieve all received messages.");
			return;
		}

		regex = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;
		var t = mailHandler["threads"];
		var i, item;
		for(i=0; item = regex.exec(html); i++) {
			if(item[1]!="0") {
				t[i] = [item[1], item[2]];
			} else {
				i--;
			}
		}
		setBadge(mailbutton[4], i);

		regex = /set=(\d+)[^>]*>([^<]+)[^?]*\?id=(\d+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;
		combineMails(mailHandler, html, regex, 1);
	}, function(status) {
		noLogin(mailHandler, "Cannot access all received messages.", status);
	});

	// SENT
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=sent", function(html) {
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler, "Cannot retrieve all sent messages.");
			return;
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^&]*&id=\d+[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;
		combineMails(mailHandler, html, regex, 3);
	}, function(status) {
		noLogin(mailHandler, "Cannot access all sent messages.", status);
	});

	// UNDELIVERD
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=sentUnread", function(html) {
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler, "Cannot retrieve sent messages.");
			return;
		}

		var item = null;
		regex = /width="350">&nbsp;\s+(\d+)/gi;
		if(item = regex.exec(html)) {
			setBadge(mailbutton[3], parseInt(item[1]));
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^&]*&id=\d+[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;
		combineMails(mailHandler, html, regex, 2);
	}, function(status) {
		noLogin(mailHandler, "Cannot access sent messages.", status);
	});
}

function fetchContacts(event)
{
	today = null;
	var handler = {"favs":[], "online":[], "index":{}, "found":0, "total":2, "list":contactlist, "fail":false};
	if(event===false) {
		switchView(contactlist, contactbutton[0]);
	} else {
		switchView(contactlist, contactbutton[0], contactbutton[1]);
		contactlist.setAttribute("class","double");
	}

	var regex = /class="user-table"/gi;
	var nextRegex = /<a href="([^"]+)"><b>&raquo;&raquo;&raquo;/gi;
	var baseurl = base+"/myuser/";

	showListMessage(contactlist, "Loading …");
	fetchURL_didFetch_error(base+"/myuser/?page=romeo&filterSpecial=favourites&sort=2&sortDirection=-1", function(html) {
		regex.lastIndex = 0;
		if(handler["fail"] || !regex.test(html)) {
			noLogin(handler, "Cannot retrieve favourites.");
			return;
		}

		fetchNextPage(handler, baseurl, html, regex, nextRegex, true, combineContacts);
	}, function(status) {
		noLogin(handler, "Cannot access favourites.", status);
	});
	fetchURL_didFetch_error(base+"/myuser/?page=romeo&filterSpecial=online&sort=2&sortDirection=-1", function(html) {
		regex.lastIndex = 0;
		if(handler["fail"] || !regex.test(html)) {
			noLogin(handler, "Cannot retrieve favourites.");
			return;
		}

		fetchNextPage(handler, baseurl, html, regex, nextRegex, false, combineContacts);
	}, function(status) {
		noLogin(handler, "Cannot access favourites.", status);
	});
}

function fetchVisitors(event)
{
	today = null;
	var handler = {"received":[], "given":[], "index":{}, "found":0, "total":2, "list":visitorlist, "fail":false};
	if(event===false) {
		switchView(visitorlist, visitorbutton[0]);
	} else {
		switchView(visitorlist, visitorbutton[0], visitorbutton[1]);
		visitorlist.setAttribute("class","double");
	}

	var regex = /page=search/gi;
	var nextRegex = /\d<\/a>&nbsp;\|&nbsp;<a href="([^"]*)">/gi;
	var baseurl = base+"/search/";

	showListMessage(visitorlist, "Loading …");
	fetchURL_didFetch_error(baseurl+"index.php?action=execute&searchType=myVisitors", function(html) {
		regex.lastIndex = 0;
		if(handler["fail"] || !regex.test(html)) {
			noLogin(handler, "Cannot retrieve visitors.");
			return;
		}

		fetchNextPage(handler, baseurl, html, regex, nextRegex, false, combineVisits);
	}, function(status) {
		noLogin(handler, "Cannot access visitors.", status);
	});
	fetchURL_didFetch_error(base+"/search/?action=execute&searchType=myVisits", function(html) {
		regex.lastIndex = 0;
		if(handler["fail"] || !regex.test(html)) {
			noLogin(handler, "Cannot retrieve your visits.");
			return;
		}

		fetchNextPage(handler, baseurl, html, regex, nextRegex, true, combineVisits);
	}, function(status) {
		noLogin(handler, "Cannot access your visits.", status);
	});
}

function fetchNextPage(handler, baseurl, html, regex, nextRegex, flag, combineFunc)
{
	nextRegex.lastIndex = 0;
	var url = nextRegex.exec(html);

	if(url && url[1]) {
		handler["total"]++;
	}
	combineFunc(handler, html, flag);

	if(!url) {
		return;
	}

	fetchURL_didFetch_error(baseurl+url[1], function(html) {
		regex.lastIndex = 0;
		if(!regex.test(html)) {
			combineFunc(handler, null, flag);
			return;
		}

		fetchNextPage(handler, baseurl, html, regex, nextRegex, flag, combineFunc);
	}, function(status) {
		combineFunc(handler, null, flag);
	});
}

function showThreads(event)
{
	if(mailbutton[1]) {
		switchView(threadlist, mailbutton[0], mailbutton[4]);
	} else {
		switchView(threadlist, mailbutton[4]);
	}
	clearNode(threadlist);

	var t = mailHandler["threads"];
	var tl = t.length;
	var i;
	for(i=0; i<tl; i++) {
		appendThreadRow(t[i][0], t[i][1]);
	}
	if(i==0) {
		showListMessage(threadlist,"No Conversations");
	}
}

function findUsers(event)
{
	event.preventDefault();

	var query = event.target[0].value;

	if(id = parseInt(query)) {
		openProfileWindow(base+"/auswertung/setcard/index.php?set="+id);
		return;
	}

	today = null;
	var handler = {"results":[], "found":0, "total":1, "list":searchlist, "fail":false};
	switchView(searchlist, searchbutton[0], searchbutton[1]);

	var regex = /page=search/gi;
	var nextRegex = /\d<\/a>&nbsp;\|&nbsp;<a href="([^"]*)">/gi;
	var baseurl = base+"/search/";

	showListMessage(searchlist, "Loading …");
	fetchURL_didFetch_error(baseurl+"index.php?action=execute&searchType=direct&directMode=userName&directValue="+query, function(html) {
		if(handler["fail"] || !regex.test(html)) {
			noLogin(handler, "Cannot retrieve search results.");
		}

		fetchNextPage(handler, baseurl, html, regex, nextRegex, null, combineSearch);
	}, function(status) {
		noLogin(handler, "Cannot access search.", status);
	});
}

function applyFilter(event, list, filter, button, func)
{
	target = event.eventPhase==2 ? event.target : event.target.parentElement;
	if(target==lastRow) {
		func(false);
		return;
	}
	if(filter) {
		list.setAttribute("class", filter);
	} else {
		list.removeAttribute("class");
	}
	switchView(list, button, target);
}

function filterMails(event, filter)
{
	applyFilter(event, maillist, filter, mailbutton[0], fetchMails);
}

function filterContacts(event, filter)
{
	applyFilter(event, contactlist, "double "+filter, contactbutton[0], fetchContacts);
}

function filterVisitors(event, filter)
{
	applyFilter(event, visitorlist, "double "+filter, visitorbutton[0], fetchVisitors);
}

function home()
{
	openWindow(base+"/");
}

function initViews()
{
	lastView = maillist;
	threadlist.style.display = "none";
	contactlist.style.display = "none";
	visitorlist.style.display = "none";
	lastButton = mailbutton[0];
	if(mailbutton[1]) {
		lastRow = mailbutton[1];
	}
	if(contactbutton[1]) {
		contactbutton[1].parentElement.style.display = "none";
	}
	if(visitorbutton[1]) {
		visitorbutton[1].parentElement.style.display = "none";
	}
	if(searchbutton[1]) {
		searchbutton[1].parentElement.style.display = "none";
	}
	if(searchlist) {
		searchlist.style.display = "none";
	}
}

function init()
{
	maillist = $("mails");
	threadlist = $("threads");
	mailbutton = [ $("mail"), $("allmail"), $("inbox"), $("sent"), $("thread") ];

	contactlist = $("contacts");
	contactbutton = [ $("contact"), $("allcontact"), $("favs"), $("online") ];

	visitorlist = $("visitors");
	visitorbutton = [ $("visitor"), $("allvisitor"), $("received"), $("given"), $("new"), $("ignored") ];

	searchlist = $("results");
	searchbutton = [ $("search"), $("allsearch") ];

	info = $("info");

	pbase = "http://s.gayromeo.com/img/usr/";
	userPic = $("userpic");

	initViews();
}

if(window.safari) {
safari.self.addEventListener("message", function(message) {
	switch(message.name) {
		case "fetchMails":
			if(message.message) {
				base = message.message;
			}
			fetchMails();
		break;
		case "fetchContacts":
			if(message.message) {
				base = message.message;
			}
			fetchContacts();
		break;
		case "fetchVisitors":
			if(message.message) {
				base = message.message;
			}
			fetchVisitors();
		break;
		case "userOnline":
			userOnlineMap[message.message[0]] = message.message[1];
		break;
		case "messageCountChanged":
			setBadge(mailbutton[0], nn(message.message[0]), message.message[1]);
		break;
		case "contactCountChanged":
			setBadge(contactbutton[0], nn(message.message[0]), message.message[1]);
		break;
		case "visitorCountChanged":
			setBadge(visitorbutton[0], nn(message.message[0]), message.message[1]);
		break;
	}
}, false);
}
