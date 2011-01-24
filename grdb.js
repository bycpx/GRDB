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

function appendMailRow(senderID, sender, msgID, subject, timestamp, hasAttachment, dup)
{
	var parser = new DOMParser();
	var row = document.createElement("li");
	var cell;

	if(!dup) {
		cell = document.createElement("div");
		cell.setAttribute("class","action");
		cell.appendChild(document.createTextNode("V"))
		row.appendChild(cell);

		cell = document.createElement("h2");
		cell.appendChild(document.createTextNode(sender));
		row.appendChild(cell);
	}
	if(timestamp) {
		cell = document.createElement("h3");
		if(hasAttachment) {
			cell.setAttribute("data-att","true");
		}
		cell.appendChild(document.createTextNode(timestamp));
		row.appendChild(cell);
	}
	if(subject) {
		subject += "\n";
		cell = document.createElement("p");
		cell.innerHTML = subject.replace("...\n","…");
		row.appendChild(cell);
	}
	maillist.appendChild(row);
}

function fetchNewMail()
{
	// … (inkl. leeren)

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
