/* GRDB Helper Script */

var maillist, mailcount, userlist;
var lastView, lastButton;
var base;

safari.self.addEventListener("message", handleMessage, false);

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

function appendMailRow(senderID, sender, msgID, subject, timestamp, hasAttachment, dup)
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
		link = create("a", "⇄");
		link.setAttribute("href",base+"/msg/history.php?uid="+senderID+"#lastmessage");
		link.setAttribute("target","_blank");
		link.addEventListener("click", onlyThis, false);
		cell.appendChild(link);
		row.appendChild(cell);

		cell = create("h2");
		link = createUserLink(senderID, sender);
		link.addEventListener("click", onlyThis, false);
		cell.appendChild(link);
		row.appendChild(cell);
	}
	if(timestamp) {
		cell = create("h3", timestamp);
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
	maillist.appendChild(row);
}

function appendUserRow(id, name)
{
	var cell, link;
	var row = create("li");
	cell = create("div");
	cell.setAttribute("class","action");
	link = create("a","E");
	link.setAttribute("href",base+"/msg/history_email.php?uid="+id);
	link.setAttribute("target","_blank");
	link.addEventListener("click", markLow, false);
	cell.appendChild(link);
	link = create("a","⇄");
	link.setAttribute("href",base+"/msg/history.php?uid="+id+"#lastmessage");
	link.setAttribute("target","_blank");
	cell.appendChild(link);
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

function fetchMails(event)
{
	switchView(maillist, event);
	showListMessage(maillist,"Loading …");

	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?suche=neue", function(html) {
		var regex = /name="messagelist"/gi;
		if(!regex.exec(html)) {
			noLogin();
			showListMessage(maillist, "Cannot retrieve messages.", "Ensure you are logged in.", true);
			return;
		}

		var item = null;
		regex = /view=new">(\d+)/gi;
		if(item = regex.exec(html)) {
			setMailCount(parseInt(item[1]));
		} else {
			setMailCount();
			showListMessage(maillist,"No Messages");
			return;
		}

		regex = /set=(\d+)[^>]*>([^<]+)[^?]*\?id=(\d+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;

		var index = {};
		var mails, dup, last = null;

		while(item = regex.exec(html)) {
			if((dup = index[item[1]]) && (dup!=last)) {
				var old = dup.next;
				dup.next = item;
				item.next = old;
			} else {
				if(last) {
					last.next = item;
				} else {
					mails = item;
				}
				last = item;
			}
			index[item[1]] = item;
		}

		clearNode(maillist);

		item = mails;
		var prevID = 0;
		while(item) {
			appendMailRow(item[1], item[2], item[3], item[4], item[5], item[6]=="i", item[1]==prevID);
			prevID = item[1];
			item = item.next;
		}

		regex = /<option value=\"(\d+)\">([^<]*)<\/option>/gi;
		while(item = regex.exec(html)) {
			if(item[1]!="0" && !index[item[1]]) {
				appendMailRow(item[1], item[2], null, "…");
			}
		}
	}, function(status) {
		noLogin();
		showListMessage(maillist, "Cannot access messages.", "The server responded with error "+status+".", true);
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
		var item;
		var i = 0;
		while(item = regex.exec(html)) {
			if(item[1]!="0") {
				appendUserRow(item[1], item[2]);
				i++;
			}
		}
		if(i==0) {
			showListMessage(userlist,"No Users");
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

function init()
{
	maillist = document.getElementById("mails");
	mailcount = document.getElementById("count");
	userlist = document.getElementById("users");

	lastView = maillist;
	userlist.style.display = "none";
	lastButton = mailcount.parentElement;

	safari.self.tab.dispatchMessage("retrieveBase");
}

function handleMessage(message)
{
	switch(message.name) {
		case "fetch":
			if(message.message) {
				base = message.message;
			}
			fetchMails();
		break;
	}
}
