/* GRDB Helper Script */

var maillist;
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

function handleMailClick(event)
{
	window.open(base+"/msg/?id="+this.getAttribute("data-msg"), null, "width=336,height=450");
}

function onlyThis(event)
{
	event.stopPropagation();
}

// -

function fetchNewMail()
{
	// …
	clearNode(maillist);

	fetchURL_didFetch_error(base+"/mitglieder/messages/uebersicht.php?suche=neue", function(html) {
//	fetchURL_didFetch_error("test.html", function(html) {
		var regex = /set=(\d+)[^>]*>([^<]+)[^?]*\?id=(\d+)[^;]*;">([^<]*)<\/a><\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>[^<]*<(.)/gi;

		var index = {};
		var mails, dup, prev, item = null;

		while(item = regex.exec(html)) {
			if(dup = index[item[1]]) {
				var old = dup.next;
				dup.next = item;
				item.next = old;
			} else {
				if(prev) {
					prev.next = item;
				} else {
					mails = item;
				}
				prev = item;
			}
			index[item[1]] = item;
		}

		// .

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
	}, function(status) { window.alert("#"+status); });
}

function init()
{
	maillist = document.getElementById("mails");
	if(window.safari) {
		safari.self.tab.dispatchMessage("retrieveBase");
	} else {
		base="https://www.gayromeo.com";
		fetchNewMail();
	}
}

function handleMessage(message)
{
	switch(message.name) {
		case "fetch":
			if(message.message) {
				base = message.message;
			}
			fetchNewMail();
		break;
	}
}