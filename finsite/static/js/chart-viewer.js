var cv = {};

(function() {
    
var canvas;
var stage;
var currencyCode;

function init(code, canvasID) {
    var currencyCode = code;
    
    canvas = document.getElementById(canvasID);
    window.context = canvas.getContext("2d");
    
    stage = new createjs.Stage(canvasID);
    createjs.Ticker.on("tick", function() {
        stage.update();
    });
    
    handleResizing();
    stage.addChild(createChart());
}

/**
 * 
 * 
 */
function handleResizing() {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();
     
    function resizeCanvas(e) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

/**
 * 
 * 
 */
function createChart() {
    var size = {width: window.innerWidth - 50, height: 200};
    var point = {width: 1, height: 1};
    var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 5, bottom: 10}};
    var style = {
        background: {color: "#00BB00", alpha: 0.6},
        grid: {thickness: 1, color: "#FFFFFF", alpha: 0.25, width: 1, height: 0, dash: [1, 0]},
        zero:  {thickness: 1, color: "#00FF00", alpha: 0.75},
        chart: {
            lines: {thickness: 5, color: "#FFFFFF", alpha: 0.75, bounds: true},
            points:  {thickness: 5, radius: 10, lineColor: "#FFFFFF", fillColor: "#00BB00", alpha: 1, bounds: true}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 425;
    chart.x = 25;
    
    var data;
    var req = new XMLHttpRequest();
    requestData();
    
    function requestData() {
        var mls = Date.UTC() - 86400000;
        req.open("GET", "history/?format=json&from=" + mls, true);
        
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        
        req.send();
    }
    
    function reqCompleteHandler(e) {
        data = JSON.parse(req.responseText);
        
        var pLength = Math.ceil(Math.random() * 10 + 10);
        chart.setPoint(size.width / (pLength - 1), chart.getPoint().height);
        chart.append(data.splice(0, pLength));
        
        var t = 0;
        var interval = setInterval(function() {
            if (t == data.length) {
                clearInterval(interval);
                return;
            }
            chart.append(data[t]);
            t ++;
        }, 1000);
        
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