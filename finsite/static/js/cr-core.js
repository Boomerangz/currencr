/**
 * 
 * @param {string} symbol
 * @param {string} exchange
 * @param {string} canvasID
 * @param {string} containerID
 */
function createChart(symbol, exchange, timeframe, canvasID, containerID) {
    var TIMEFRAMES = {minute: 60, fiveminute: 300, hour: 3600, day: 86400};
    var loader = document.getElementById(canvasID + "_loader");
    var container = document.getElementById(containerID);
    var canvas = document.getElementById(canvasID);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.opacity = 0;

    window.context = canvas.getContext("2d");
    stage = new createjs.Stage(canvasID);
    stage.mouseMoveOutside = true;
    stage.preventSelection = false;
    stage.enableMouseOver(10);

    createjs.Touch.enable(stage, false, true);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.on("tick", stage.update.bind(stage));
    
    var chart = new cr.ComplexChart(container.clientWidth, container.clientHeight, 1);
    stage.addChild(chart);
    handleResizing(canvas, container, chart);

    loader.style.opacity = 1;

    var HFIDX = 0;
    var currentCount = 150;
    var now = new Date();
    var total = {
        history: null,
        forecasts: []
    }
    var MS_LAG = 120000;
    var HISTORY_COUNT = 600;
    var msStep = TIMEFRAMES[timeframe] * 1000;
    var from = now.getTime() - HISTORY_COUNT * msStep - MS_LAG;
    uploadHistory(symbol, exchange, from, timeframe, function(history) {
        if (history) {
            total.history = linearize(history, msStep);
            var time = total.history[total.history.length - 1].date.getTime();
            setData(total.history, null, currentCount);
            createjs.CSSPlugin.install();
            createjs.Tween.get(canvas).to({opacity:1}, 500);
        } else {
            hideLoader();
            return;
        }
        uploadForecasts(symbol, exchange, function(data) {
            hideLoader();
            if (!data) return;
            if (!data.forecasts.length) return;
            var prices = data.forecasts[HFIDX].prices;
            var mStep = Math.round(msStep / 60000);
            total.forecasts[HFIDX] = [];
            for (var i = 0; i < prices.length; i += mStep) {
                time += msStep
                total.forecasts[HFIDX].push({
                    date: new Date(time),
                    price: prices[i]
                });
            }
            setData(total.history, total.forecasts[0], currentCount);
        });
    });

    function setData(history, forecast, count) {
        var data = history.concat(forecast || []).slice(-count);
        chart.complexClear();
        chart.setPoint(chart.getSize().width / (data.length - 1), chart.getPoint().height);
        chart.complexAppend(data);
        var idx = data.length - 1 - (forecast ? forecast.length : 0);
        chart.setForecastPosition(idx);
    }

    var MIN_CAPACITY = 80;
    canvas.addEventListener('mousewheel', function (event) {
        var maxCapacity = total.history.length + total.forecasts[HFIDX].length
        currentCount += event.deltaY / 20;
        currentCount = Math.min(currentCount, maxCapacity);
        currentCount = Math.max(currentCount, MIN_CAPACITY);
        setData(
            total.history,
            checkbox.checked ? total.forecasts[0] : null,
            currentCount
        );
        return false; 
    }, false);

    var checkbox = document.getElementById(canvasID + "_checkbox");
    checkbox.onclick = function() {
        setData(
            total.history,
            this.checked ? total.forecasts[0] : null,
            currentCount
        );
    }

    function hideLoader() {
        if (loader.style.opacity != "1") return;
        createjs.Tween.get(loader).to({opacity:0}, 100).call(function() {
            loader.remove();
        });
    }
}

/**
 * 
 * @param {string} symbol 
 * @param {string} exchange 
 * @param {string} from 
 * @param {string} callback 
 */
function uploadHistory(symbol, exchange, from, timeframe, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", "./history_db/?from=" + from + "&period=" + timeframe + "&format=json&exchange=" + exchange, true);
    req.addEventListener("load", function() {
        if (!callback) return;
        try {
            var data = JSON.parse(req.responseText);
        } catch(e) {
            alert("History error.\nTry again later...");
            return;
        }
        callback.call(this, data);
    }, false);
    req.addEventListener("error", function() {
        alert("History upload error.\nTry again later...");
        if (callback) callback.call(this, null);
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
        if (callback) callback.call(this, null);
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
function linearize(array, step) {
    for (var i = 0; i < array.length - 1; i++) {
        var date0 = array[i].date = new Date(array[i].date);
        var date1 = new Date(array[i + 1].date);
        var delta = date1.getTime() - date0.getTime();
        for (var ms = date0.getTime() + step; ms < date1.getTime(); ms += step) {
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

/**
 * 
 * 
 */
function handleResizing(canvas, container, chart) {
    try {
        new ResizeObserver(resizeCanvas).observe(container);
    } catch(e) {
        window.addEventListener("resize", resizeCanvas, false);
        window.onload = resizeCanvas;
    }
    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        chart.setComplexSize(canvas.width, canvas.height);
    }
}