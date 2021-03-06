/**
 * 
 * @param {string} symbol
 * @param {string} quote
 * @param {string} exchange
 * @param {string} timeframe
 * @param {string} canvasID
 * @param {string} containerID
 */
function createChart(symbol, quote, exchange, timeframe, canvasID, containerID) {
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
    createjs.Ticker.on("tick", stage.update.bind(stage));
    createjs.Ticker.framerate = 60;
    
    var chart = new cr.ComplexChart(container.clientWidth, container.clientHeight, 1);
    chart.alpha = 0;
    stage.addChild(chart);
    handleResizing(canvas, container, chart);

    var HFIDX = 0;
    var currentCount = 150;
    var now = new Date();
    var total = {
        history: null,
        forecasts: []
    }
    total.forecasts[HFIDX] = [];
    var MS_LAG = 120000;
    var HISTORY_COUNT = 600;
    var sStep = Utils.TIMEFRAMES[timeframe];
    var msStep = sStep * 1000;
    var from = now.getTime() - HISTORY_COUNT * msStep - MS_LAG;
    uploadHistory(symbol, exchange, from, timeframe, function(history) {
        if (history) {
            total.history = linearize(history, msStep);
            var time = total.history[total.history.length - 1].date.getTime();
            setData(total.history, null, currentCount);
            canvas.style.opacity = "1";
            chart.alpha = 1;
            if (sStep < Utils.TIMEFRAMES.hour) {
                uploadForecasts(symbol, exchange, function(data) {
                    loader.remove();
                    if (!data) return;
                    if (!data.forecasts) return;
                    if (!data.forecasts.length) return;
                    var prices = data.forecasts[HFIDX].prices;
                    var mStep = Math.round(msStep / 60000);
                    for (var i = 0; i < prices.length; i += mStep) {
                        time += msStep
                        total.forecasts[HFIDX].push({
                            date: new Date(time),
                            price: prices[i]
                        });
                    }
                    setData(total.history, total.forecasts[0], currentCount);
                    showForecastUI();
                });
            } else {
                loader.remove();
            }
        } else {
            loader.remove();
        }
    });

    function showForecastUI() {
        var node = document.getElementById(canvasID + "_switch");
        node.classList.remove("d-none");
        node.style.opacity = "1";
        node = document.getElementById(canvasID + "_disclaimer");
        node.classList.remove("d-none");
        node.style.opacity = "1";
        node.onclick = function() {
            node.classList.add("d-none");
        }
    }

    function setData(history, forecast, count) {
        var data = history.concat(forecast || []).slice(-count);
        chart.complexClear();
        chart.setPoint(chart.getSize().width / (data.length - 1), chart.getPoint().height);
        chart.complexAppend(data);
        var idx = data.length - 1 - (forecast ? forecast.length : 0);
        chart.setForecastPosition(idx);
    }

    var checkbox = document.getElementById(canvasID + "_checkbox");
    var MIN_CAPACITY = 80;
    canvas.addEventListener('wheel', function (event) {
        var maxCapacity = total.history.length + total.forecasts[HFIDX].length
        currentCount += event.deltaY / Math.abs(event.deltaY) * 2;
        currentCount = Math.min(currentCount, maxCapacity);
        currentCount = Math.max(currentCount, MIN_CAPACITY);
        setData(
            total.history,
            checkbox.checked ? total.forecasts[0] : null,
            currentCount
        );
        return false; 
    }, false);
    
    checkbox.onclick = function() {
        setData(
            total.history,
            this.checked ? total.forecasts[0] : null,
            currentCount
        );
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
        callback(JSON.parse(req.responseText));
    }, false);
    req.addEventListener("error", function() {callback(null)}, false);
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
        var data = JSON.parse(req.responseText);
        if (data.status != 0) callback(null);
        callback(data);
    }, false);
    req.addEventListener("error", function() {callback(null)}, false);
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
        resizeCanvas();
        new ResizeObserver(resizeCanvas).observe(container);
    } catch(e) {
        window.addEventListener("resize", resizeCanvas, false);
        window.onload = resizeCanvas;
    }
    function resizeCanvas() {
        canvas.width = container.clientWidth * window.devicePixelRatio;
        canvas.height = container.clientHeight * window.devicePixelRatio;
        canvas.style.width = container.clientWidth + "px";
        canvas.style.height = container.clientHeight + "px";
        chart.stage.scaleX = window.devicePixelRatio;
        chart.stage.scaleY = window.devicePixelRatio;
        chart.setComplexSize(container.clientWidth, container.clientHeight);
    }
}