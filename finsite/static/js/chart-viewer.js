var cv = {};

(function() {
    
var container;
var canvas;
var stage;
var currencyCode;

function init(code, canvasID, containerID) {
    currencyCode = code;
    container= document.getElementById(containerID);
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
        //canvas.width = container.width;
        //canvas.height = 300;
    }
}

/**
 * 
 * 
 */
function createChart() {
    var size = {width: canvas.width, height: 300};
    var point = {width: 1, height: 1};
    var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 5, bottom: 10}};
    var style = {
        background: {color: "#112E07", alpha: 0.6},
        grid: {thickness: 1, color: "#FFFFFF", alpha: 0.25, width: canvas.width / 10, height: 10, dash: [1, 0]},
        zero:  {thickness: 1, color: "#000000", alpha: 1},
        chart: {
            lines: {thickness: 1.5, color: "#000000", alpha: 1, bounds: false},
            points:  {thickness: 0, radius: 0, lineColor: "#FFFFFF", fillColor: "#00BB00", alpha: 0, bounds: true}
        }
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    chart.y = 425;
    chart.x = 25;
    
    var data;
    var req = new XMLHttpRequest();
    requestData();
    
    function requestData() {
        var fromUTC = (new Date()).getTime() - 86400000;
        var queryString = "?from=" +  fromUTC  + "&count=100&format=json";
        var reqURL = "http://ssh.dsxmachine.com:8080/" + currencyCode + "/history_db/" + queryString;
        req.open("GET", "test.json", true);
        
        req.addEventListener("load", reqCompleteHandler, false);
        req.addEventListener("error", reqErrorHandler, false);
        
        req.send();
    }
    
    function reqCompleteHandler(e) {
        data = JSON.parse(req.responseText);
        
        chart.setPoint(size.width / (data.length - 1), chart.getPoint().height);
        
        var interval = setInterval(function() {
            if (!data.length) {
                clearInterval(interval);
                return;
            }
            chart.append(data.splice(0, Math.ceil(data.length / 20)));
        }, 50);
        
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