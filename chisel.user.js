// ==UserScript==
// @name           Craftsman Chisel
// @author         Burrito
// @description    Chisels a button in Steam Workshop pages that sends items to Craftsman for download.
// @include        *steamcommunity.com/sharedfiles/filedetails/?id=*
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_registerMenuCommand
// @grant          unsafeWindow
// @version        1.0.0
// ==/UserScript==

// Log userscript start and version
console.log(`⚒️ Craftsman Chisel v${GM_info.script.version} started!`);

// Siblings JavaScript function that makes things easier
const siblings = (elem) => {
    let siblings = [];
    if (!elem.parentNode) {
        return siblings;
    }
    let sibling = elem.parentNode.firstElementChild;
    do {
        if (sibling != elem) {
            siblings.push(sibling);
        }
    } while ((sibling = sibling.nextElementSibling));
    return siblings;
};

// Steam Workshop variables & fixes to make it easier to edit elements
var patt = new RegExp("[0-9]{2,15}");
var id = patt.exec(document.URL);
var itemid = id[0];
var itemname =
    document.getElementsByClassName("workshopItemTitle")[0].innerHTML;
var previewImage = document.getElementById("previewImage");
if (previewImage) {
    var itemimage = previewImage.src;
} else {
    var itemimage = document.getElementById("previewImageMain").src;
}
itemimage = itemimage.replace("&letterbox=true", "");
GM_addStyle(`
    .subscribeOption { display: none; }
    .subscribeOption.selected { display: block; line-height: 30px; }
    #SubscribeItemBtn:hover .subscribeOption.selected + .subscribeOption.remove { display: block; line-height: 30px; }
    .just_added_to_list.body { margin-bottom: 26px; }
`);

// Violentmonkey storage for queue items
var queue = [];
function refreshQueue() {
    queue = GM_getValue("queue", "");
    if (queue == "") {
        queue = [];
    };
};

// Violentmonkey menu commands
GM_registerMenuCommand("Clear Queue", function () {
    window.clearQueue();
    alert("Queue cleared.");
});
GM_registerMenuCommand("Print Queue to Console", function () {
    refreshQueue();
    console.log(queue);
});

unsafeWindow.clearQueue = () => {
    GM_setValue("queue", "");
    refreshQueue();
    updateButton();
    updateQueueList();
    CloseNotification("JustDownloaded");
    document.getElementsByClassName("community_tooltip")[0].remove();
};

// Queue notification
var subNotif = document.getElementById("JustSubscribed");
var queueNotif = subNotif.cloneNode(true);
queueNotif.setAttribute("id", "JustDownloaded");
var queueNotifText = queueNotif.getElementsByClassName("just_added_text")[0];
queueNotifText.innerHTML =
    "This item has been queued in Craftsman for download. When you're ready to start downloading, click the button on the right side panel. Don't have Craftsman? <a href='https://github.com/burritosoftware/Craftsman'>Download it here.</a>";
var queueNotifClose = queueNotif
    .getElementsByClassName("close_notification")[0]
    .getElementsByTagName("a")[0];
queueNotifClose.setAttribute("onclick", "CloseNotification( 'JustDownloaded' );");

// Queue button
var subButton = document.getElementById("SubscribeItemBtn");
var button = subButton.cloneNode(true);

// Add line break after subButton
var br = document.createElement("br");
subButton.parentNode.insertBefore(br, subButton.nextSibling);

// Change button gradient
var spanStyle =
    "color: #91eaf7 !important; background: #417B9C; background: -webkit-linear-gradient( top, #5AA9D6 5%, #417B9C 95%); background: linear-gradient( to bottom, #5AA9D6 5%, #417B9C 95%);";
var innerFade =
    "background: #57749e; background: -webkit-linear-gradient( top, #66C0F4 5%, #417B9C 95%); background: linear-gradient( to bottom, #66C0F4 5%, #417B9C 95%);";

button.setAttribute("style", "position: relative; " + innerFade);
var span = button.querySelector("span");
span.setAttribute("style", spanStyle);
span.setAttribute("id", "DownloadItemSpan");

var unqueueText = document.createElement("div");
unqueueText.setAttribute("class", "subscribeOption remove");
unqueueText.setAttribute("id", "UnqueueText");
unqueueText.innerHTML = "Unqueue";
span.appendChild(unqueueText);

GM_addStyle(`
    #DownloadItemSpan:hover {
        text-decoration: none !important;
        color: #fff !important;
        background: #6ac4f7 !important;
        background: -webkit-linear-gradient( top, #6ac4f7 5%, #4f98c2 95%) !important;
        background: linear-gradient( to bottom, #6ac4f7 5%, #4f98c2 95%) !important;
    }
`);
GM_addStyle("");
// Get appid
var inputElement = document.querySelector('a[data-appid]');
var appid = inputElement.getAttribute("data-appid");

button.removeAttribute("onclick");
button.setAttribute("id", "DownloadItemBtn");

var buttonText = button.querySelector("#SubscribeItemOptionAdd");
buttonText.setAttribute("id", "DownloadItemOption");

function postQueue() {
    GM_setValue("queue", queue);
    updateQueueList();
    updateButton();
    return true;
}

// Change Button attributes depending on if the item is in the queue
// Change icon
var icon = button.getElementsByClassName("subscribeIcon")[0];

function updateButton() {
    if (queue.some((item) => item.itemid === itemid)) {
        buttonText.innerHTML = "Queued";
        icon.setAttribute(
            "style",
            "background-position: 0px -60px; background-image: url(https://community.cloudflare.steamstatic.com/public/images/sharedfiles/ico_subscribe_tiled.png);"
        );
        button.onclick = function () {
            // Remove item from queue
            refreshQueue();
            queue = queue.filter((item) => item.itemid !== itemid);
            CloseNotification("JustDownloaded");
            postQueue();
        };
    } else {
        buttonText.innerHTML = "Queue";
        icon.setAttribute(
            "style",
            "top: 9px; background-image: url(https://store.cloudflare.steamstatic.com/public/shared/images/header/btn_header_installsteam_download.png?v=1);"
        );
        button.onclick = function () {
            // Add item to queue
            refreshQueue();
            queue.push({ appid, itemid, itemname, itemimage });
            queueNotif.removeAttribute("style");
            postQueue();
        };
    }
}

if (!buttonText.classList.contains("selected")) {
    buttonText.classList.add("selected");
}
var nodes = siblings(buttonText);
nodes.forEach((node) => node.remove());

// Info Panel
sidebar = document
    .getElementById("rightContents")
    .getElementsByClassName("sidebar")[0];
var infoPanel = document.createElement("div");
infoPanel.classList.add("panel");
infoPanel.innerHTML = `⚒️ Craftsman Chisel v${GM_info.script.version}<br><a href='https://github.com/burritosoftware/Craftsman'>GitHub</a> | <a href='https://twitter.com/burritosoftware'>Twitter</a>`;

// Queue Panel
var queuePanel = document.createElement("div");
queuePanel.classList.add("panel");
var queuePanelDownloadButton = document.createElement("span");
queuePanelDownloadButton.classList.add("workshopItemControlCtn");
queuePanelDownloadButton.setAttribute("data-panel", '{"focusable":true,"clickOnActivate":true}');
queuePanelDownloadButton.setAttribute("id", "DownloadBtn");
queuePanelDownloadButton.setAttribute("class", "general_btn share tooltip");
queuePanelDownloadButton.setAttribute("data-tooltip-text", "Send the queue to Craftsman for download");
var queuePanelDownloadButtonText = document.createElement("span");
queuePanelDownloadButtonText.innerHTML = "Download";
queuePanelDownloadButton.appendChild(queuePanelDownloadButtonText);

var queuePanelClearButton = document.createElement("span");
queuePanelClearButton.classList.add("workshopItemControlCtn");
queuePanelClearButton.setAttribute("data-panel", '{"focusable":true,"clickOnActivate":true}');
queuePanelClearButton.setAttribute("id", "ClearBtn");
queuePanelClearButton.setAttribute("class", "general_btn share tooltip");
queuePanelClearButton.setAttribute("data-tooltip-text", "Clear all workshop items in the queue");
queuePanelClearButton.setAttribute("onclick", "window.clearQueue();");
var queuePanelClearButtonIcon = document.createElement("img");
queuePanelClearButtonIcon.setAttribute("src", "https://community.cloudflare.steamstatic.com/public/images//sharedfiles/icons/icon_delete.png");
queuePanelClearButtonIcon.setAttribute("style", "padding-top: 7.5px;");
queuePanelClearButtonIcon.innerHTML = '&nbsp;';
queuePanelClearButton.appendChild(queuePanelClearButtonIcon);

function updateQueueList() {
    if (queue.length == 1) {
        var label = "item";
    } else {
        var label = "items";
    }
    if (queue.length >= 1) {
        queuePanelDownloadButton.setAttribute("style", "float: right;");
        queuePanelClearButton.setAttribute("style", "float: right;");
    } else {
        queuePanelDownloadButton.setAttribute("style", "display: none;");
        queuePanelClearButton.setAttribute("style", "display: none;");
    }
    var queueList = "";
    queue.forEach((item) => {
        queueList += `<div class="requiredDLCItem">
        <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=${item.itemid}"><img src="${item.itemimage}" style="vertical-align: middle; padding-right: 5px; height: 45px;"></a>
        <span class="requiredDLCName"><a href="https://steamcommunity.com/sharedfiles/filedetails/?id=${item.itemid}">${item.itemname}</a></span>
        <br clear="all">
    </div>`;
    });
    queuePanelDownloadButton.setAttribute("onclick", `window.location.href = "craftsman://download?queue=${encodeURI(JSON.stringify(queue))})}";window.clearQueue();`);
    queuePanel.innerHTML = `${queuePanelDownloadButton.outerHTML} ${queuePanelClearButton.outerHTML}<div class="rightSectionTopTitle condensed">Craftsman Queue</div><div class="rightSectionMinorText">${queue.length} ${label} in queue</div><div class="requiredDLCContainer">${queueList}</div>`;
    sidebar.insertBefore(queuePanel, sidebar.firstChild);
}

// Gets the latest queue if any items were added in other tabs
refreshQueue();
// Updates the status of the queue button (queued or not queued)
updateButton();
// Updates queue list UI (which also appends the queue to the sidebar)
updateQueueList();
// Appends the info panel to the sidebar
sidebar.appendChild(infoPanel);
// Appends the queue button to the subscribe button if logged in
// Changes the box's text accordingly
if (document.getElementById("account_pulldown")) {
    subButton.parentNode.parentNode
    .getElementsByTagName("h1")[0]
    .getElementsByTagName("span")[0].innerHTML =
    "Subscribe or queue to download";
    subButton.parentNode.appendChild(button);
} else {
    // if not logged in, don't append and suggest to sign in
    var loginLink = Array.from(document.getElementsByClassName("global_action_link")).find((link) => link.innerHTML == "login").href;
    subButton.parentNode.parentNode
    .getElementsByTagName("h1")[0]
    .getElementsByTagName("span")[0].innerHTML =
    `Subscribe to download, or <a href="${loginLink}">login to queue</a>`;
}
// Appends the queue notification to the subscribe notification
subNotif.parentNode.insertBefore(queueNotif, subNotif.nextSibling);