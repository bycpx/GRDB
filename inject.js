/* GRDB Injection Script */

function messageDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("messageCountDidChange", parseInt(event.newValue));
	}
}

if(window.top===window) {
	if(window.location.href && window.location.href.indexOf("/logout/")!=-1) {
		safari.self.tab.dispatchMessage("sessionDidEnd");
	}
} else {
	if(document.getElementById("msgDisplay_c")) {
		document.getElementById("msgDisplay_c").addEventListener("DOMCharacterDataModified", messageDisplayChanged, false);
	} else if(document.getElementById("m_cell")) {
		document.getElementById("m_cell").addEventListener("DOMCharacterDataModified", messageDisplayChanged, false);
	}
}
