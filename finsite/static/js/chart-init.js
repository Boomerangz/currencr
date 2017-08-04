var ci = {};

(function() {

var CHART_HEIGHT = 350;
var container;
var canvas;
var stage;
var currencyCode;
var chart;

function init(code, canvasID, containerID) {
    currencyCode = code;
    container= document.getElementById(containerID);
    canvas = document.getElementById(canvasID);
    window.context = canvas.getContext("2d");
    
    stage = new createjs.Stage(canvasID);
    stage.mouseMoveOutside = true;
    stage.enableMouseOver(10);
    stage.preventSelection = false;
    createjs.Touch.enable(stage, false, true);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.on("tick", function() {
        stage.update();
    });
    
    handleResizing();
    chart = stage.addChild(createChart());
}

/**
 * 
 * 
 */
function handleResizing() {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();
     
    function resizeCanvas(e) {
        canvas.width = container.clientWidth;
        canvas.height = CHART_HEIGHT;
        if (chart) {
            chart.setComplexSize(container.clientWidth, CHART_HEIGHT);
            chart.redraw();
        }
    }
}

/**
 * 
 * 
 */
function createChart() {
    var chart = new cr.ComplexChart(container.clientWidth, CHART_HEIGHT, 50);
    
    var data;
    var pre;
    var req = new XMLHttpRequest();
    requestData();
    
    function requestData() {
        var count = 180;
        var fromUTC = (new Date()).getTime() - count * 60 * 1000;
        var queryString = "?from=" +  fromUTC  + "&period=minute&format=json";
        var reqURL = "./history_db/" + queryString;
        req.open("GET", reqURL, true);
        
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        
        req.send();
    }
    
    var lastDate;

    function reqCompleteHandler(e) {
        data = JSON.parse(req.responseText);
        chart.setPoint(chart.getSize().width / (data.length - 1), chart.getPoint().height);
        chart.redraw();
        data = linearize(data);
        lastDate = data[data.length - 1].date;
        chart.complexAppend(data);

        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
        
        if (currencyCode != "BCH") requestPrediction();
    }
    
    function reqErrorHandler(e) {
        alert("История курса по " + currencyCode + " не была загружена. Попробуйте позднее...");
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }

    function requestPrediction() {
        var reqURL = "https://prdc.currencr.me/" + currencyCode;
        req.open("GET", reqURL, true);
        
        req.addEventListener("load", reqPredictionCompleteHandler, false);
        req.addEventListener("error", reqPredictionErrorHandler, false);
        
        req.send();
    }

    function reqPredictionCompleteHandler(e) {
        var prc = JSON.parse(req.responseText);
        pre = [];
        for (var i = 0; i < prc[0].length; i++) {
            pre.push({
                date: new Date(lastDate.getTime() + ((i + 1) * 60000)),
                price: prc[0][i]
            });
        }
        chart.complexAppend(pre);
        var x = chart.getCapacity() - pre.length - 1;
        chart.setPredictionBound(chart.getLocalXByIndex(x));
        req.removeEventListener("load", reqPredictionCompleteHandler, false);
        req.removeEventListener("error", reqPredictionErrorHandler, false);
    }

    function reqPredictionErrorHandler(e) {
        alert("На данный момент прогноза по " + currencyCode + " нет. Попробуйте позднее...");
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }
    
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
    
    return chart;
}

ci.init = init;
})();
