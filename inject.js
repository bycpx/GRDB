/* GRDB Injection Script */

function messageDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("messageCountDidChange", parseInt(event.newValue));
	}
}

function userDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("userCountDidChange", parseInt(event.newValue));
	}
}

function visitorDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("visitorCountDidChange", parseInt(event.newValue));
	}
}

if(window.top===window) {
	if(window.location.href && window.location.href.indexOf("/logout/")!=-1) {
		safari.self.tab.dispatchMessage("sessionDidEnd");
	}
} else {
	if(document.getElementById("msgDisplay_c")) {
		document.getElementById("msgDisplay_c").addEventListener("DOMCharacterDataModified", messageDisplayChanged, false);
	}
	if(document.getElementById("favDisplay_c")) {
		document.getElementById("favDisplay_c").addEventListener("DOMCharacterDataModified", userDisplayChanged, false);
	}
	if(document.getElementById("visDisplay_c")) {
		document.getElementById("visDisplay_c").addEventListener("DOMCharacterDataModified", visitorDisplayChanged, false);
	}

}
