/* GRDB Injection Script */

function messageDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("messageCountDidChange", parseInt(event.newValue));
	}
}

function contactDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("contactCountDidChange", parseInt(event.newValue));
	}
}

function visitorDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("visitorCountDidChange", parseInt(event.newValue));
	}
}

function userSeen(element)
{
	var stat = 0;
	if((st = element.nextElementSibling.nextElementSibling) && st.className) {
	    stat = st.className.slice(-1)=="0"?1:2;
	} else if(element.nextElementSibling.textContent.length>1) {
	    stat = -2;
	} else {
	    stat = -1;
	}
	msg = [el.className.slice(4), stat];
	safari.self.tab.dispatchMessage("userSeen", msg);
}

if(window.top===window) {
	if(window.location.href && window.location.href.indexOf("/logout/")!=-1) {
		safari.self.tab.dispatchMessage("sessionDidEnd");
	}
	if(window.location.href && window.location.href.indexOf("/msg/")!=-1 && (el=document.getElementById("userName"))) {
		userSeen(el);
	}
	if(window.location.href && window.location.href.indexOf("/pix/")!=-1) {
		document.onmousedown = null;
		document.oncontextmenu = null;
		document.ondragstart = null;
	}

} else {
	if(document.getElementById("msgDisplay_c")) {
		document.getElementById("msgDisplay_c").addEventListener("DOMCharacterDataModified", messageDisplayChanged, false);
	}
	if(document.getElementById("favDisplay_c")) {
		document.getElementById("favDisplay_c").addEventListener("DOMCharacterDataModified", contactDisplayChanged, false);
	}
	if(document.getElementById("visDisplay_c")) {
		document.getElementById("visDisplay_c").addEventListener("DOMCharacterDataModified", visitorDisplayChanged, false);
	}
	if(window.location.href && window.location.href.indexOf("/album/")!=-1) {
		document.onmousedown = null;
		document.oncontextmenu = null;
		document.ondragstart = null;
	}

}
