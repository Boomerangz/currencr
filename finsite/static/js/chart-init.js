var ci = {};

(function() {

var CHART_HEIGHT = 400;
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
    createjs.Touch.enable(stage);
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
        var count = 360;
        var fromUTC = (new Date()).getTime() - 21600000;
        var queryString = "?from=" +  fromUTC  + "&count=" + count + "&format=json";
        var reqURL = "./history_db/" + queryString;
        req.open("GET", reqURL, true);
        
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        
        req.send();
    }
    
    function reqCompleteHandler(e) {
        data = JSON.parse(req.responseText);
        chart.setPoint(chart.getSize().width / (data.length - 1), chart.getPoint().height);
        chart.redraw();
        chart.complexAppend(data);

        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
        
        requestPrediction();
    }
    
    function reqErrorHandler(e) {
        alert(req.status + ": " + req.statusText);
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }

    function requestPrediction() {
        var reqURL = "./prediction/";
        req.open("GET", reqURL, true);
        
        req.addEventListener("load", reqPredictionCompleteHandler, false);
        req.addEventListener("error", reqPredictionErrorHandler, false);
        
        req.send();
    }

    function reqPredictionCompleteHandler(e) {
        var prc = JSON.parse(req.responseText);
        pre = [];
        for (var i = 0; i < prc.length; i++) {
            pre.push({
                date: "after " + (i + 1) + " min.",
                price: prc[i].price
            });
        }
        chart.complexAppend(pre);
        chart.setPredictionRatio(pre.length / chart.getCapacity());
        req.removeEventListener("load", reqPredictionCompleteHandler, false);
        req.removeEventListener("error", reqPredictionErrorHandler, false);
    }

    function reqPredictionErrorHandler(e) {
        alert(req.status + ": " + req.statusText);
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }
    
    return chart;
}

ci.init = init;
})();
