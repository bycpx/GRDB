/* GRDB Helper Script */

var maillist, userlist, visitorlist;
var mailbutton, visitorbutton, userbutton, info;
var lastView, lastButton;
var userPic;
var base, pbase, today;
var mailHandler, visitHandler, userPicMap;

var visitIcons = {
	10:"like", 11:"like", 13:"like", 14:"like", 15:"like", 16:"like", 17:"like", 19:"like", 31:"like", 42:"like", 47:"like", 50:"like", 51:"like", 52:"like", 53:"like",
	9:"hot", 20:"hot", 21:"hot", 22:"hot", 30:"hot", 40:"hot",
	8:"hi", 26:"hi", 41:"hi", 44:"hi",
	1:"date", 7:"date",
	12:"love", 54:"love",
	27:"no", 28:"no",
	6:"ex", 49:"ex",
	48:"ok"
};

safari.self.addEventListener("message", function(message) {
	switch(message.name) {
		case "fetchMails":
			if(message.message) {
				base = message.message;
			}
			fetchMails();
		break;
		case "fetchVisitors":
			if(message.message) {
				base = message.message;
			}
			fetchVisitors();
		break;
	}
}, false);

function fetchURL_didFetch_error(url, didFetchFunc, errorFunc)
{
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if(xhr.readyState==4) {
			if(xhr.status==200 || xhr.status==0) {
				didFetchFunc(xhr.responseText);
			} else {
				errorFunc(xhr.status);
			}
		}
	}
	xhr.open("GET", url, true);
	xhr.send("");
}

function create(tag, content)
{
	var node = document.createElement(tag);
	if(content!==undefined) {
		node.appendChild(document.createTextNode(content));
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

function absAttr(node, attr)
	{
	for(var val=0; node; node = node.offsetParent) {
		val += node[attr];
		}
	return val;
	}

// -

function createUserLink(id, name)
{
	var link = create("a", name);
	link.setAttribute("href", base+"/auswertung/setcard/?set="+id);
	link.setAttribute("target","_blank");
	if(pic = userPicMap[id]) {
		link.setAttribute("data-pic",pic);
		link.addEventListener("mouseover", showUserPic, false);
		link.addEventListener("mouseout", hideUserPic, false);
	}
	return link;
}

function createHistoryLink(id, conv)
{
	var link = create("a", "⇄");
	link.setAttribute("href",base+"/msg/history.php?uid="+id+"#lastmessage");
	link.style.backgroundImage = conv ? "url(hist_hi.png)" : "url(hist.png)";
	link.setAttribute("title","History");
	link.setAttribute("target","_blank");
	return link;
}

function createMsgLink(id, msgID)
{
	var link = create("a", "M");
	link.setAttribute("href",base+"/msg/?uid="+id);
	if(msgID && msgID!=-1) {
		link.setAttribute("data-msg", msgID);
		link.addEventListener("click", handleMailClick, false);
		link.style.backgroundImage = "url(msg_hi.png)";
		link.setAttribute("title","Read Message");
	} else {
		link.style.backgroundImage = "url(msg.png)";
		link.setAttribute("title","Message");
	}
	link.setAttribute("target","_blank");
	return link;
}

function timestamp(datestring)
{
	return new Date(datestring.replace(/(\d\d)\.(\d\d)\./, "$2/$1 "));
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

function appendMailRow(senderID, sender, msgID, subject, datetime, timestamp, hasAttachment, dup, sent)
{
	var cell, link;
	var row = create("li");

	if(msgID==-1) {
		row.setAttribute("class","drop");
	} else if(msgID) {
		row.setAttribute("data-msg",msgID);
		row.addEventListener("click", handleMailClick, false);
	}
	if(sent) {
		row.setAttribute("class",row.getAttribute("class")+" sent");
	}
	if(!dup) {
		cell = create("div");
		cell.setAttribute("class","action");
		link = createHistoryLink(senderID);
		link.addEventListener("click", onlyThis, false);
		cell.appendChild(link);
		row.appendChild(cell);

		cell = create("h2");
		link = createUserLink(senderID, sender);
		link.addEventListener("click", onlyThis, false);
		cell.appendChild(link);
		if(sent) {
			cell.setAttribute("data-label","To");
		}
		row.appendChild(cell);
	}
	if(timestamp) {
		cell = create("h3", datetime);
		age = dayDiff(timestamp,today);
		if(age>1) {
			cell.setAttribute("title",Math.floor(age)+" days old");
		}
		if(age<=0.5) {
			cell.setAttribute("data-age","new");
		}
		if(age > (sent?3:10)) {
			cell.setAttribute("data-age","old");
		}
		if(hasAttachment) {
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

function appendUserRow(id, name)
{
	var cell, link;
	var row = create("li");
	cell = create("div");
	cell.setAttribute("class","action");
	link = create("a","→");
	link.setAttribute("href",base+"/msg/history_email.php?uid="+id);
	link.style.backgroundImage = "url(ffwd.png)";
	link.setAttribute("title","Forward via E-Mail");
	link.setAttribute("target","_blank");
	link.addEventListener("click", markLow, false);
	cell.appendChild(link);
	cell.appendChild(createHistoryLink(id));
	row.appendChild(cell);
	cell = create("h2");
	cell.appendChild(createUserLink(id, name));
	row.appendChild(cell);
	userlist.appendChild(row);
}

function appendVisitorRow(id, name, datetime, timestamp, receivedID, received, givenID, given, msgID)
{
	var cell;
	var row = create("li");
	if(givenID==-1) {
		row.setAttribute("class","new");
	}
	if(receivedID==-1) {
		row.setAttribute("class","drop");
	}
	cell = create("div");
	cell.setAttribute("class","action");
	cell.appendChild(createMsgLink(id, msgID));
	cell.appendChild(createHistoryLink(id, msgID));
	row.appendChild(cell);
	cell = create("h2");
	cell.appendChild(createUserLink(id, name));
	row.appendChild(cell);
	if(timestamp) {
		cell = create("h3", datetime.replace(/-/," "));
		age = dayDiff(timestamp,today);
		if(age<=0.5) {
			cell.setAttribute("data-age","new");
		}
		if(age>2.5) {
			cell.setAttribute("data-age","old");
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
	}
	visitorlist.appendChild(row);
}

function setBadge(node, cont)
{
	if(cont) {
		node.setAttribute("data-badge",cont);
	} else {
		node.removeAttribute("data-badge");
		return 0;
	}
	return cont;
}

function setMailCount(count)
{
	count = setBadge(mailbutton, count);
	safari.self.tab.dispatchMessage("messageCountDidChange", count);
}

function setFetchTime()
{
	if(!today) {
		today = new Date();
		clearNode(info);
		setText(info, today.toLocaleString());
	}
}

function showListMessage(node, text, des, error)
{
	clearNode(node);
	var row = create("li");
	row.setAttribute("class", error?"err":"low");
	row.appendChild(create("h2",text));
	if(des) {
		row.appendChild(create("p",des));
	}
	node.appendChild(row);
}

function handleMailClick(event)
{
	var popup = window.open(base+"/msg/?id="+this.getAttribute("data-msg"), null, "width=336,height=450,scrollbars=yes");
	popup.opener = null;
	this.setAttribute("class","low");
	event.preventDefault();
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

function markLow(event)
{
	this.parentElement.parentElement.setAttribute("class","low");
}

function onlyThis(event)
{
	event.stopPropagation();
}

function switchView(view, button)
{
	if(button!=lastButton) {
		lastButton.setAttribute("class","");
		button.setAttribute("class","act");
		lastButton = button;
	}
	if(view!=lastView) {
		setText(info, "GRDB.");
		lastView.style.display = "none";
		view.setAttribute("style","");
		lastView = view;
	}
}

// -

function noLogin(handler)
{
	setBadge(mailbutton);
	setBadge(visitorbutton);
	setBadge(userbutton);
	if(window.safari) {
		safari.self.tab.dispatchMessage("sessionDidEnd");
	}
	if(handler) {
		handler["fail"] = true;
	}
}

function clusterItems(html, regex, more, index, isSent)
{
	var first, dup, last, item = null;

	for(item = null; item = regex.exec(html); index[item[1]] = item) {
		if(isSent) {
			item.timestamp = timestamp(item[4].replace(/\s/,"."+today.getFullYear()+" "));
		} else {
			item.timestamp = timestamp(item[5]);
		}
		if((dup = index[item[1]]) && (dup!=last)) {
			var old = dup.next;
			dup.next = item;
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

	while(item = more.exec(html)) {
		if(item[1]!="0" && !index[item[1]]) {
			item.timestamp = null;
			if(last) {
				last.next = item;
			} else {
				first = item;
			}
			index[item[1]] = item;
			last = item;
		}
	}

	return first;
}

function findMails(html, regex, type)
{
	mailHandler["found"]++;
	setFetchTime();
	var more = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;

	var i_n = mailHandler["new"]; // userID => new item
	var index = mailHandler["index"]; // userID => item

	switch(type) {
		case 0: // new
			mailHandler["newmail"] = clusterItems(html, regex, more, i_n, false);
			for(attr in i_n) {
				index[attr] = i_n[attr];
			}
		break;
		case 1: // undelivered
			var i_u = {}
			mailHandler["undelivered"] = clusterItems(html, regex, more, i_u, true);
			for(attr in i_u) {
				index[attr] = i_u[attr];
			}
		break;
		case 2: // sent
			mailHandler["sent"] = clusterItems(html, regex, more, {}, true);
		break;
	}

	if(mailHandler["found"] >= 3) {
		clearNode(maillist);

		var n = mailHandler["newmail"];
		var u = mailHandler["undelivered"];
		var s = mailHandler["sent"];
		var d = [];
		var i = 0;

		for(var item = s; item; item = item.next) {
			if(!index[item[1]]) {
				d[i] = item;
				index[item[1]] = item;
				i++;
			}
		}

		var dl = i;
		i = 0;
		var k = 0;
		var curID, prvID;
		while(n || u || i<dl) {
			while(n && (!u || n.timestamp>=u.timestamp) && (i>=dl || n.timestamp>=d[i].timestamp)) {
				curID = n[1];
				prvID = 0;
				while(n && curID == n[1]) {
					appendMailRow(n[1], n[2], n[3], n[4], n[5] ? n[5].replace(/(\d\d\.\d\d)\.\d\d/,"$1 ") : '', n.timestamp, n[6]=="i", prvID==curID, false);
					prvID = curID;
					n = n.next;
					k++;
				}
			}
			while(u && (!n || u.timestamp>=n.timestamp) && (i>=dl || u.timestamp>=d[i].timestamp)) {
				curID = u[1];
				prvID = 0;
				while(u && curID == u[1]) {
					appendMailRow(u[1], u[2], null, u[3], u[4], u.timestamp, u[5]=="i", prvID==curID, true);
					prvID = curID;
					u = u.next;
					k++;
				}
			}
			while(i<dl && (!n || d[i].timestamp>=n.timestamp) && (!u || d[i].timestamp>=u.timestamp)) {
				appendMailRow(d[i][1], d[i][2], -1, d[i][3], d[i][4], d[i].timestamp, d[i][5]=="i", false, true);
				i++;
				k++;
			}
		}
		if(k==0) {
			showListMessage(maillist,"No Messages");
		}
	} else {
		showListMessage(maillist, "Loading", Math.round(100*mailHandler["found"]/3)+"%");
	}
}

function findVisits(html, isGiven)
{
	visitHandler["found"]++;
	setFetchTime();
	if(html) {
		html = html.replace(/<wbr>/, "");
	}
	var regex = /(?:\/usr\/([^\.]*)\.[^\n]*\n\s*)?<td class="resHeadline"[^?]*\?set=(\d+)[^;]*;">([^<]*)<\/a>[^\n]*\n\s*<td[^>]*>(?:(?:<[^>]*>[^<]*<\/[^>]*>)|[\s0-9.a-z'"&;])*;([^<]*)<\/td>[\s\S]*?(<img [a-z="0-9\/]*\/(\d+)[^:]*: ([^"]*)"[^>]*>\s*)?<span>[^<]*<\/span>\s*<br \/>\s*<br \/><br \/>/gi;
	var item, i;

	var r = visitHandler["received"];
	var g = visitHandler["given"];
	var index = visitHandler["index"];

	if(isGiven) {
		for(i = g.length; item = regex.exec(html); i++) {
			item.timestamp = timestamp(item[4].replace(/-/,today.getFullYear()+" "));
			index[item[2]] = item;
			userPicMap[item[2]] = item[1];
			g[i] = item;
		}
	} else {
		for(i = r.length; item = regex.exec(html); i++) {
			item.timestamp = timestamp(item[4].replace(/-/,today.getFullYear()+" "));
			userPicMap[item[2]] = item[1];
			r[i] = item;
		}
	}

	if(visitHandler["found"]>=visitHandler["total"]) {
		clearNode(visitorlist);

		var rl = r.length;
		var gl = g.length;
		for(i = 0; i < rl; i++) {
			if(item = index[r[i][2]]) {
				item[2] = 0;
			}
		}

		i = 0; var j = 0; var k = 0;
		var mail = mailHandler["index"] || {};
		var newmail = mailHandler["new"] || {};
		var id;
		while(i<rl || j<gl) {
			while(j<gl && g[j][2]==0) {
				j++;
			}
			while(i<rl && (j>=gl || r[i].timestamp>=g[j].timestamp)) {
				id = r[i][2];
				item = index[id];
				appendVisitorRow(id, r[i][3], r[i][4], r[i].timestamp, r[i][6], r[i][7], item ? item[6] : -1, item ? item[7] : null, newmail[id] ? newmail[id][3] : (mail[id] ? -1 : 0));
				i++;
			}
			while(j<gl && (i>=rl || r[i].timestamp<g[j].timestamp)) {
				if(id = g[j][2]) {
					appendVisitorRow(id, g[j][3], g[j][4], g[j].timestamp, -1, null, g[j][6], g[j][7], newmail[id] ? newmail[id][3] : (mail[id] ? -1 : 0));
					k++;
				}
				j++;
			}
		}

		if(i==0 && k==0) {
			showListMessage(visitorlist,"No Visitors");
		} else {
			setBadge(visitorbutton, i+"+"+k);
		}
	} else {
		showListMessage(visitorlist, "Loading", Math.round(100*visitHandler["found"]/visitHandler["total"])+"%");
	}
}

function fetchMails(event)
{
	today = null;
	mailHandler = {"newmail":false, "new":{}, "undelivered":false, "sent":false, "index":{}, "found":0, "fail":false};
	switchView(maillist, mailbutton);

	showListMessage(maillist,"Loading …");
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=new", function(html) {
		setFetchTime();
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler);
			showListMessage(maillist, "Cannot retrieve new messages.", "Ensure you are logged in.", true);
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
		findMails(html, regex, 0);
	}, function(status) {
		noLogin(mailHandler);
		showListMessage(maillist, "Cannot access new messages.", "The server responded with error "+status+".", true);
	});

	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=sent", function(html) {
		setFetchTime();
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler);
			showListMessage(maillist, "Cannot retrieve all sent messages.", "Ensure you are logged in.", true);
			return;
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;
		findMails(html, regex, 2);
	}, function(status) {
		noLogin(mailHandler);
		showListMessage(maillist, "Cannot access all sent messages.", "The server responded with error "+status+".", true);
	});

	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=sentUnread", function(html) {
		setFetchTime();
		var regex = /name="messagelist"/gi;
		if(mailHandler["fail"] || !regex.test(html)) {
			noLogin(mailHandler);
			showListMessage(maillist, "Cannot retrieve sent messages.", "Ensure you are logged in.", true);
			return;
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;
		findMails(html, regex, 1);
	}, function(status) {
		noLogin(mailHandler);
		showListMessage(maillist, "Cannot access sent messages.", "The server responded with error "+status+".", true);
	});
}

function fetchUsers(event)
{
	today = null;
	switchView(userlist, userbutton);
	showListMessage(userlist, "Loading …");
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=all", function(html) {
		setFetchTime();
		var regex = /name="messagelist"/gi;
		if(!regex.test(html)) {
			noLogin();
			showListMessage(userlist, "Cannot retrieve users.", "Ensure you are logged in.", true);
			return;
		}

		clearNode(userlist);

		regex = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;
		for(var i = 0, item; item = regex.exec(html); i++) {
			if(item[1]!="0") {
				appendUserRow(item[1], item[2]);
			} else {
				i--;
			}
		}
		setBadge(userbutton,i);
		if(i==0) {
			showListMessage(userlist,"No Users");
		}
	}, function(status) {
		noLogin();
		showListMessage(userlist, "Cannot access users.", "The server responded with error "+status+".", true);
	});
}

function fetchVisitors(event)
{
	today = null;
	visitHandler = {"received":[], "given":[], "index":{}, "found":0, "total":2, "fail":false};
	switchView(visitorlist, visitorbutton);

	showListMessage(visitorlist, "Loading …");
	fetchURL_didFetch_error(base+"/search/index.php?action=execute&searchType=myVisitors", function(html) {
		var regex = /page=search/gi;
		if(visitHandler["fail"] || !regex.test(html)) {
			noLogin(visitHandler);
			showListMessage(visitorlist, "Cannot retrieve visitors.", "Ensure you are logged in.", true);
			return;
		}

		fetchNextVisitPage(html, regex, false);
	}, function(status) {
		noLogin(visitHandler);
		showListMessage(visitorlist, "Cannot access visitors.", "The server responded with error "+status+".", true);
	});
	fetchURL_didFetch_error(base+"/search/?action=execute&searchType=myVisits", function(html) {
		var regex = /page=search/gi;
		if(visitHandler["fail"] || !regex.test(html)) {
			noLogin(visitHandler);
			showListMessage(visitorlist, "Cannot retrieve your visits.", "Ensure you are logged in.", true);
			return;
		}

		fetchNextVisitPage(html, regex, true);
	}, function(status) {
		noLogin(visitHandler);
		showListMessage(visitorlist, "Cannot access your visits.", "The server responded with error "+status+".", true);
	});
}

function fetchNextVisitPage(html, regex, isGiven)
{
	regex.lastIndex = 0;
	nextregex = /\d<\/a>&nbsp;\|&nbsp;<a href="([^"]*)">/gi;
	var url = nextregex.exec(html);

	if(url && url[1]) { // there is more to do
		visitHandler["total"]++;
	}
	findVisits(html, isGiven);

	if(!url) {
		return;
	}

	fetchURL_didFetch_error(base+"/search/"+url[1], function(html) {
		if(!regex.test(html)) {
			findVisits(null, isGiven);
			return;
		}

		fetchNextVisitPage(html, regex, isGiven);
	}, function(status) {
		findVisits(null, isGiven);
	});
}

function findUsers(event)
{
	event.preventDefault();
	safari.self.tab.dispatchMessage("findUser", event.target[0].value);
}

function home()
{
	safari.self.tab.dispatchMessage("openBase");
}

function init()
{
	maillist = document.getElementById("mails");
	mailbutton = document.getElementById("mail");
	visitorlist = document.getElementById("visitors");
	visitorbutton = document.getElementById("visitor");
	userlist = document.getElementById("users");
	userbutton = document.getElementById("user");

	info = document.getElementById("info");

	mailHandler = {};
	userPicMap = {};
	pbase = "http://s.gayromeo.com/img/usr/";
	userPic = document.getElementById("userpic");
	userPic.style.display = "none";

	lastView = maillist;
	userlist.style.display = "none";
	visitorlist.style.display = "none";
	lastButton = mailbutton;

	safari.self.tab.dispatchMessage("ready");
}
