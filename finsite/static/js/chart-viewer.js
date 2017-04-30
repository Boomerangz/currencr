var stage;
var canvas;
var chart;

function init(code) {
    canvas = document.getElementById("chart-canvas");
    stage = new createjs.Stage("chart-canvas");
    createjs.Ticker.on("tick", function() {
        stage.update();
    });
    
    window.addEventListener("resize", resizeHandler, false);
    resizeHandler();
    
    requestHistory(code);
}

function requestHistory(code) {
    var req = new XMLHttpRequest();
    req.open("GET", code + ".json", true);
    
    req.addEventListener("load", reqCompleteHandler, false);
    req.addEventListener("error", reqErrorHandler, false);
    
    req.send();
}

function reqCompleteHandler(e) {
    var data = JSON.parse(e.currentTarget.responseText);
    chart = createChart(canvas.width - 100, 400, data.length - 1);
    chart.x = 50;
    chart.y = 50;
    stage.addChild(chart);
    appendChartData(data);
}

function appendChartData(data) {
    data = data.map(function(item, index, array) {
        return Number(item.price);
    });
    chart.append(data);
}

function reqErrorHandler(e) {
    alert(e.currentTarget.status + ': ' + e.currentTarget.statusText);
}

function createChart(width, height, segmentsCount) {
    var size = {width: width, height: height};
    var point = {width: width / segmentsCount, height: 0.5};
    var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 10, bottom: 10}};
    var style = {
        background: {color: "#00AAFF", alpha: 0.1},
        grid: {thickness: 0.5, color: "#00FFFF", alpha: 0.5, width: Math.max(segmentsCount / 100, 1), height: 0, dash: [1, 0]},
        zero:  {thickness: 1, color: "#00FFFF", alpha: 0.75},
        chart: {thickness: 1, radius: 0, color: "#003333", alpha: 0.75, bounds: "full"}
    };
    
    var chart = new charts.StreamingChart(size, point, axis, style);
    return chart;
}

function resizeHandler(e) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}