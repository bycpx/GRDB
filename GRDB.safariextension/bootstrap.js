/* GRDB Bootstrap script */
/* cat grdb.js bootstrap.js | jsmin >boot.js */

base = window.location.href;

document.write('<link rel="stylesheet" type="text/css" href="'+cbase+'grdb.css" media="screen" /><meta name="viewport" content="width=700" /><base href="'+cbase+'" />');
document.write("<body></body>");

var b = document.body;
var el = b.appendChild(create("header"));
el = el.appendChild(create("nav"));
mailbutton[0] = el.appendChild(create("a", "Messages"));
mailbutton[0].onclick = fetchMails;
mailbutton[0].setAttribute("class","act");
contactbutton[0] = el.appendChild(create("a", "Contacts"));
contactbutton[0].onclick = fetchContacts;
visitorbutton[0] = el.appendChild(create("a", "Visitors"));
visitorbutton[0].onclick = fetchVisitors;

maillist = b.appendChild(create("ul"));
maillist.setAttribute("id","mails");

threadlist = b.appendChild(create("ul","","triple"));
contactlist = b.appendChild(create("ul","","double"));

visitorlist = b.appendChild(create("ul","","double"));
visitorlist.setAttribute("id","visitors");

userPic = b.appendChild(create("img"));
userPic.setAttribute("id","userpic");
info = b.appendChild(create("footer","GRDB to go."));
info.setAttribute("style","margin-left:0");

pbase = "http://s.gayromeo.com/img/usr/";

initViews();
fetchMails();
