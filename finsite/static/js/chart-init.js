var cv = {};

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
    stage.enableMouseOver(10);
    createjs.Touch.enable(stage);
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
    var chart = new cr.Chart(container.clientWidth, CHART_HEIGHT, 50);
    
    var data;
    var req = new XMLHttpRequest();
    requestData();
    
    function requestData() {
        var fromUTC = (new Date()).getTime() - 86400000;
        var queryString = "?from=" +  fromUTC  + "&count=288&format=json";
        var reqURL = "./history_db/" + queryString;
        req.open("GET", reqURL, true);
        
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        
        req.send();
    }
    
    function reqCompleteHandler(e) {
        data = JSON.parse(req.responseText);
        data = data.map(function(item, index, array) {return Number(item.price);});
        chart.setPoint(chart.getSize().width / (data.length - 1), chart.getPoint().height);
        chart.redraw();
        chart.append(data);
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }
    
    function reqErrorHandler(e) {
        alert(req.status + ": " + req.statusText);
        req.removeEventListener("load", reqCompleteHandler, false);
        req.removeEventListener("error", reqErrorHandler, false);
    }
    
    return chart;
}

cv.init = init;

})();
