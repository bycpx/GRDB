/* GRDB Injection Script */

function messageDisplayChanged(event)
{
	if(event.type=="DOMCharacterDataModified") {
		safari.self.tab.dispatchMessage("messageCountDidChange", parseInt(event.newValue));
	}
}

if(window.top===window) {
	if(document.body && document.body.getAttribute("class")==="logout") {
		safari.self.tab.dispatchMessage("sessionDidEnd", null);
	}
} else {
	if(document.getElementById("msgDisplay_c")) {
		document.getElementById("msgDisplay_c").addEventListener("DOMCharacterDataModified", messageDisplayChanged, false);
	} else if(document.getElementById("m_cell")) {
		document.getElementById("m_cell").addEventListener("DOMCharacterDataModified", messageDisplayChanged, false);
	}
}
