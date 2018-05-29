window.Utils = {
    appendStyle: function(path) {
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", path);
        document.head.appendChild(link);
    },

    TIMEFRAMES: {
        minute: 60,
        fiveminute: 300,
        fifteenminute: 900,
        thirtyminutes: 1800,
        hour: 3600,
        day: 86400
    }
};