window.utils = {
    appendStyle: function(path) {
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", path);
        document.head.appendChild(link);
    }
};