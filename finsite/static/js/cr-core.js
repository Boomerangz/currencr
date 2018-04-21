/**
 * 
 * @param {string} symbol
 * @param {string} exchange
 * @param {string} canvasID
 * @param {string} containerID
 */
function createChart(symbol, exchange, timeframe, canvasID, containerID) {
    var step = ({minute: 60, hour: 3600, day: 86400})[timeframe] * 1000;
    var container = document.getElementById(containerID);
    var canvas = document.getElementById(canvasID);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    window.context = canvas.getContext("2d");
    stage = new createjs.Stage(canvasID);
    stage.mouseMoveOutside = true;
    stage.preventSelection = false;
    stage.enableMouseOver(10);

    createjs.Touch.enable(stage, false, true);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.on("tick", stage.update.bind(stage));
    
    var chart = new cr.ComplexChart(container.clientWidth, container.clientHeight, 60);
    stage.addChild(chart);

    var log = new createjs.Text("DEBUG LOG\n\n", "12px Courier", "#000000");
    log.visible = false;
    stage.addChild(log);

    new ResizeObserver(function(e) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        chart.setComplexSize(canvas.width, canvas.height);
    }).observe(container);
    
    var length = 0;
    var now = new Date();
    var count = 150;
    var lag = 5;
    var from = now.getTime() - (count + lag) * 60 * 1000;
    var pointWidth = 0;
    uploadHistory(symbol, exchange, from, function(history) {
        pointWidth = chart.getSize().width / (count - 1);
        history = history.slice(-count);
        chart.setPoint(pointWidth, chart.getPoint().height);
        chart.complexAppend(history);
        length = history.length;
        log.text = log.text + "History; Point width: " + pointWidth + "; total length: " + length + ";\n\n";
        var time = history[length - 1].date.getTime();
        chart.setGridOffset(60 - history[0].date.getMinutes());
        uploadTicker(symbol, exchange, function(ticker) {
            pointWidth = chart.getSize().width / length;
            ticker.date = new Date(time += step);
            chart.setPoint(pointWidth, chart.getPoint().height);
            chart.complexAppend([ticker]);
            length ++;
            log.text = log.text + "Ticker; Point width: " + pointWidth + "; total length: " + length + ";\n\n";
            uploadForecasts(symbol, exchange, function(data) {
                if (data.forecasts.length) {
                    var prices = data.forecasts[0].prices;
                    var forecast = [];
                    for (var i = 0; i < prices.length; i++) {
                        forecast.push({
                            date: new Date(time += step),
                            price: prices[i]
                        });
                    }
                    var index = length - 1;
                    length += forecast.length;
                    pointWidth = chart.getSize().width / (length - 1);
                    chart.setPoint(pointWidth, chart.getPoint().height);
                    chart.complexAppend(forecast);
                    chart.setForecastPosition(index);
                    log.text = log.text + "Forecasts; Point width: " + pointWidth + "; total length: " + length + ";\n\n";
                }
            });
        });
    });

    
}

/**
 * 
 * @param {string} symbol 
 * @param {string} exchange 
 * @param {string} from 
 * @param {string} callback 
 */
function uploadHistory(symbol, exchange, from, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", "./history_db/?from=" + from + "&period=minute&format=json", true);
    req.addEventListener("load", function() {
        if (!callback) return;
        try {
            var data = JSON.parse(req.responseText);
            data = linearize(data);
        } catch(e) {
            alert("History error.\nTry again later...");
            return;
        }
        callback.call(this, data);
    }, false);
    req.addEventListener("error", function() {
        alert("History upload error.\nTry again later...");
    }, false);
    req.send();
}

/**
 * 
 * @param {string} symbol 
 * @param {string} exchange 
 * @param {string} callback 
 */
function uploadTicker(symbol, exchange, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", "./fresh/?format=json", true);
    req.addEventListener("load", function() {
        if (!callback) return;
        try {
            var data = JSON.parse(req.responseText);
        } catch(e) {
            alert("Ticker error.\nTry again later...");
            return;
        }
        callback.call(this, data);
    }, false);
    req.addEventListener("error", function() {
        alert("Ticker upload error.\nTry again later...");
    }, false);
    req.send();
}


/**
 * 
 * @param {string} symbol 
 * @param {string} exchange 
 * @param {string} callback 
 */
function uploadForecasts(symbol, exchange, callback) {
    var now = (new Date()).getTime();
    var req = new XMLHttpRequest();
    req.open("GET", "https://prdc.currencr.me/" + symbol + "/" + exchange + "?nocache=" + now, true);
    req.addEventListener("load", function() {
        if (!callback) return;
        try {
            var data = JSON.parse(req.responseText);
            if (data.status != 0) {
                alert("Forecast error (" + data.error + ").\nTry again later...");
                return;
            }
        } catch(e) {
            alert("Forecast error.\nTry again later...");
            return;
        }
        callback.call(this, data);
    }, false);
    req.addEventListener("error", function() {
        alert("Forecast upload error.\nTry again later...");
    }, false);
    req.send();
}

//
//Utils
//

/**
 * 
 * @param {Array.<Object>} array 
 */
function linearize(array) {
    var targetDelta = 60 * 1000;
    for (var i = 0; i < array.length - 1; i++) {
        var date0 = array[i].date = new Date(array[i].date);
        var date1 = new Date(array[i + 1].date);
        var delta = date1.getTime() - date0.getTime();
        for (var ms = date0.getTime() + targetDelta; ms < date1.getTime(); ms += targetDelta) {
            var item = {
                date: new Date(ms),
                price: array[i].price
            }
            array.splice(++i, 0, item);
        }
    }
    array[i].date = new Date(array[i].date);
    return array;
}
