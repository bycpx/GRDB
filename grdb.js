/* GRDB Helper Script */

var maillist, sentlist, userlist, visitorlist;
var mailview, mailcount, visitorcount, info;
var lastView, lastButton;
var base, today;
var dropHandler, visitHandler;

var visitIcons = {
	10:"like", 11:"like", 13:"like", 14:"like", 15:"like", 16:"like", 17:"like", 19:"like", 31:"like", 42:"like", 47:"like", 50:"like", 51:"like", 52:"like", 53:"like",
	9:"hot", 20:"hot", 21:"hot", 22:"hot", 30:"hot", 40:"hot",
	8:"hi", 41:"hi", 44:"hi",
	1:"date", 7:"date",
	12:"love", 54:"love",
	27:"no", 28:"no",
	6:"ex", 49:"ex",
	48:"ok"
};

safari.self.addEventListener("message", function(message) {
	switch(message.name) {
		case "fetch":
			if(message.message) {
				base = message.message;
			}
			fetchMails();
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

// -

function createUserLink(id, name)
{
	var link = create("a", name);
	link.setAttribute("href", base+"/auswertung/setcard/?set="+id);
	link.setAttribute("target","_blank");
	return link;
}

function createHistoryLink(id)
{
	var link = create("a", "⇄");
	link.setAttribute("href",base+"/msg/history.php?uid="+id+"#lastmessage");
	link.style.backgroundImage = "url(hist.png)";
	link.setAttribute("title","History");
	link.setAttribute("target","_blank");
	return link;
}

function daysSince(datestring)
{
	var date = new Date(datestring.replace(/(\d\d)\.(\d\d)\./, "$2/$1 "));
	if(isNaN(date)) {
		return -1;
	}
	return (today-date) / 24 / 60 / 60 / 1000;
}

function visitIcon(received, given)
{
	var img;
	if(received && received!=-1 && (img=visitIcons[received])) {
		return img+(given?"_b":"_r");
	}
	if((!received || received==-1) && given && given!=-1 && (img=visitIcons[given])) {
		return img+"_g";
	}
	return null;
}

function appendMailRow(list, senderID, sender, msgID, subject, timestamp, hasAttachment, dup, label)
{
	var cell, link;
	var row = create("li");

	if(msgID==-1) {
		row.setAttribute("class","drop");
	} else if(msgID) {
		row.setAttribute("data-msg",msgID);
		row.addEventListener("click", handleMailClick, false);
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
		if(label) {
			cell.setAttribute("data-label",label);
		}
		row.appendChild(cell);
	}
	if(timestamp) {
		cell = create("h3", timestamp);
		age = daysSince(timestamp);
		if(age>1) {
			cell.setAttribute("title",Math.floor(age)+" days old");
		}
		if(age<=0.5) {
			cell.setAttribute("data-age","new");
		}
		if(age>10) {
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
	}
	list.appendChild(row);
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

function appendVisitorRow(id, name, timestamp, receivedID, received, givenID, given)
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
	cell.appendChild(createHistoryLink(id));
	row.appendChild(cell);
	cell = create("h2");
	cell.appendChild(createUserLink(id, name));
	row.appendChild(cell);
	if(timestamp) {
		cell = create("h3", timestamp);
		age = daysSince(timestamp);
		if(age<=0.5) {
			cell.setAttribute("data-age","new");
		}
		if(age>2) {
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
	clearNode(node);
	if(cont) {
		var badge = create("span", cont);
		badge.setAttribute("class","badge");
		node.appendChild(badge);
	} else {
		return 0;
	}
	return cont;
}

function setMailCount(count)
{
	count = setBadge(mailcount, count);
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
}

function markLow(event)
{
	this.parentElement.parentElement.setAttribute("class","low");
}

function onlyThis(event)
{
	event.stopPropagation();
}

function switchView(view, event)
{
	if(event) {
		var button = event.target;
		if(button!=lastButton) {
			lastButton.setAttribute("class","");
			button.setAttribute("class","act");
			lastButton = button;
		}
	}
	if(view!=lastView) {
		setText(info, "GRDB.");
		lastView.style.display = "none";
		view.setAttribute("style","");
		lastView = view;
	}
}

// -

function noLogin()
{
	clearNode(mailcount);
	clearNode(visitorcount);
	if(window.safari) {
		safari.self.tab.dispatchMessage("sessionDidEnd");
	}
}

function clusterItems(html, regex, index)
{
	var first, dup, last = null;

	for(var item = null; item = regex.exec(html); index[item[1]] = item) {
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

	return first;
}

function findDropped(index, html)
{
	dropHandler["found"]++;
	for(attr in index) {
		dropHandler["index"][attr] = index[attr];
	}
	if(html) {
		dropHandler["html"] = html;
	}
	if(dropHandler["found"]>=3) {
		index = dropHandler["index"];
		html = dropHandler["html"];
		regex = /set=(\d+)[^>]*>([^<]+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)</gi;
		for(var item = null; item = regex.exec(html); index[item[1]] = item) {
			if(!index[item[1]]) {
				appendMailRow(sentlist, item[1], item[2], -1, item[3], item[4], null, false, "To");
			}
		}
	}
}

function findVisits(html, isGiven)
{
	visitHandler["found"]++;
	setFetchTime();
	var regex = /<td class="resHeadline"[^?]*\?set=(\d+)[^;]*;">([^<]*)<\/a>[^\n]*\n\s*<td[^>]*>[\s0-9.a-z'"&;]*;([^<]*)<\/td>[\s\S]*?(<img [a-z="0-9\/]*\/(\d+)[^:]*: ([^"]*)"[^>]*>\s*)?<span>[^<]*<\/span>\s*<br \/>\s*<br \/><br \/>/gi;
	if(isGiven) {
		for(var i = 0, item; item = regex.exec(html); i++) {
			item[3] = item[3].replace(/-/,today.getFullYear()+" ");
			visitHandler["given"][item[1]] = item;
		}
	} else {
		for(var i = 0, item; item = regex.exec(html); i++) {
			item[3] = item[3].replace(/-/,today.getFullYear()+" ");
			visitHandler["received"][item[1]] = item;
		}
	}

	if(visitHandler["found"]>=visitHandler["total"]) {
		clearNode(visitorlist);

		var received = visitHandler["received"];
		var given = visitHandler["given"];

		var i = 0;
		for(id in received) {
			appendVisitorRow(received[id][1], received[id][2], received[id][3], received[id][5], received[id][6], given[id] ? given[id][5] : -1, given[id] ? given[id][6] : null);
			i++;
		}

		var j = 0;
		for(id in given) {
			if(!received[id]) {
				appendVisitorRow(given[id][1], given[id][2], given[id][3], -1, null, given[id][5], given[id][6]);
				j++;
			}
		}
		if(i==0 && j==0) {
			showListMessage(userlist,"No Visitors");
		} else {
			setBadge(visitorcount, i+"+"+j);
		}
	}
}

function fetchMails(event)
{
	today = null;
	dropHandler = {"index":{}, "found":0, "html": null};
	switchView(mailview, event);

	showListMessage(maillist,"Loading …");
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=new", function(html) {
		setFetchTime();
		var regex = /name="messagelist"/gi;
		if(!regex.exec(html)) {
			noLogin();
			showListMessage(maillist, "Cannot retrieve new messages.", "Ensure you are logged in.", true);
			return;
		}

		var item = null;
		regex = /view=new">(\d+)/gi;
		if(item = regex.exec(html)) {
			setMailCount(parseInt(item[1]));
		} else {
			setMailCount();
			showListMessage(maillist,"No New Messages");
			return;
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^?]*\?id=(\d+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;

		var index = {};
		var mails = clusterItems(html, regex, index);

		clearNode(maillist);

		for(var prevID = 0, item = mails; item; item = item.next) {
			appendMailRow(maillist, item[1], item[2], item[3], item[4], item[5], item[6]=="i", item[1]==prevID);
			prevID = item[1];
		}

		regex = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;
		while(item = regex.exec(html)) {
			if(item[1]!="0" && !index[item[1]]) {
				appendMailRow(maillist, item[1], item[2], null, "…");
				index[item[1]] = item;
			}
		}

		findDropped(index);
	}, function(status) {
		noLogin();
		showListMessage(maillist, "Cannot access new messages.", "The server responded with error "+status+".", true);
	});

	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=sent", function(html) {
		findDropped({}, html);
	});

	showListMessage(sentlist,"Loading …");
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=sentUnread", function(html) {
		setFetchTime();
		var regex = /name="messagelist"/gi;
		if(!regex.exec(html)) {
			noLogin();
			showListMessage(sentlist, "Cannot retrieve sent messages.", "Ensure you are logged in.", true);
			return;
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)</gi;

		var index = {};
		var mails = clusterItems(html, regex, index);

		clearNode(sentlist);

		var prevID = 0;
		for(var item = mails; item; item = item.next) {
			appendMailRow(sentlist, item[1], item[2], null, item[3], item[4], null, item[1]==prevID, "To");
			prevID = item[1];
		}
		if(prevID==0) {
			showListMessage(sentlist,"No Sent Messages");
		}

		regex = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;
		while(item = regex.exec(html)) {
			if(item[1]!="0" && !index[item[1]]) {
				appendMailRow(sentlist, item[1], item[2], null, "…", null, null, null, "To");
				index[item[1]] = item;
			}
		}

		findDropped(index);
	}, function(status) {
		noLogin();
		showListMessage(sentlist, "Cannot access sent messages.", "The server responded with error "+status+".", true);
	});
}

function fetchUsers(event)
{
	switchView(userlist, event);
	showListMessage(userlist, "Loading …");
	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?view=all", function(html) {
		var regex = /name="messagelist"/gi;
		if(!regex.exec(html)) {
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
		if(i==0) {
			showListMessage(userlist,"No Users");
		} else {
			setText(info, i+" users.");
		}
	}, function(status) {
		noLogin();
		showListMessage(userlist, "Cannot access users.", "The server responded with error "+status+".", true);
	});
}

function fetchVisitors(event)
{
	today = null;
	visitHandler = {"given":{}, "received":{}, "found":0, "total":2};
	switchView(visitorlist, event);

	showListMessage(visitorlist, "Loading …");
	fetchURL_didFetch_error(base+"/search/index.php?action=execute&searchType=myVisitors", function(html) {
		var regex = /searchType=myVisitors/gi;
		if(!regex.exec(html)) {
			noLogin();
			showListMessage(visitorlist, "Cannot retrieve visitors.", "Ensure you are logged in.", true);
			return;
		}

		fetchNextVisitPage(html, regex, false);
	}, function(status) {
		noLogin();
		showListMessage(visitorlist, "Cannot access visitors.", "The server responded with error "+status+".", true);
	});
	fetchURL_didFetch_error(base+"/search/?action=execute&searchType=myVisits", function(html) {
		var regex = /searchType=myVisits/gi;
		if(!regex.exec(html)) {
			noLogin();
			showListMessage(visitorlist, "Cannot retrieve your visits.", "Ensure you are logged in.", true);
			return;
		}

		fetchNextVisitPage(html, regex, true);
	}, function(status) {
		noLogin();
		showListMessage(visitorlist, "Cannot access your visits.", "The server responded with error "+status+".", true);
	});
}

function fetchNextVisitPage(html, regex, isGiven)
{
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
		if(!regex.exec(html)) {
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
	sentlist = document.getElementById("sent");
	mailcount = document.getElementById("mcount");
	userlist = document.getElementById("users");
	visitorlist = document.getElementById("visitors");
	visitorcount = document.getElementById("vcount");

	mailview = document.getElementById("mailview");
	info = document.getElementById("info");

	lastView = mailview;
	userlist.style.display = "none";
	visitorlist.style.display = "none";
	lastButton = mailcount.parentElement;

	safari.self.tab.dispatchMessage("retrieveBase");
}
