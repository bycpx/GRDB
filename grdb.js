/* GRDB Helper Script */

var maillist, sentlist, userlist;
var mailview, mailcount, info;
var lastView, lastButton;
var base, today;

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
	return Math.floor((today-date) / 24 / 60 / 60 / 1000);
}

function appendMailRow(list, senderID, sender, msgID, subject, timestamp, hasAttachment, dup, label)
{
	var cell, link;
	var row = create("li");

	if(msgID) {
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
			cell.setAttribute("title",age+" days old");
		}
		if(age==0) {
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

function setMailCount(count)
{
	clearNode(mailcount);
	if(count) {
		var badge = create("span", count);
		badge.setAttribute("class","badge");
		mailcount.appendChild(badge);
	} else {
		count = 0;
	}
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

function fetchMails(event)
{
	today = null;
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
			}
		}
	}, function(status) {
		noLogin();
		showListMessage(maillist, "Cannot access new messages.", "The server responded with error "+status+".", true);
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
			}
		}
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
	mailcount = document.getElementById("count");
	userlist = document.getElementById("users");

	mailview = document.getElementById("mailview");
	info = document.getElementById("info");

	lastView = mailview;
	userlist.style.display = "none";
	lastButton = mailcount.parentElement;

	safari.self.tab.dispatchMessage("retrieveBase");
}
