function handleResizing() {
    var WIDTH = 700;
    var largeContent = document.getElementById("lead-content-large");
    var smallContent = document.getElementById("lead-content-small");
    var currencyList = document.getElementById("currency-list");
    var container = document.getElementById("page-content");
    window.addEventListener("resize", resizeHandler, false);
    resizeHandler();
        
    function resizeHandler(e) {
        if (container.clientWidth <= WIDTH) {
            largeContent.style.display = "none";
            smallContent.style.display = "block";
            currencyList.style.width = "100%";
        } else {
            largeContent.style.display = "block";
            smallContent.style.display = "none";
            currencyList.style.width = "auto";
        }
    }
};
    
var stages = {};
function addPreviewChart(currency, data) {
    var canvas = document.getElementById("preview-canvas-" + currency);
    canvas.width = 258;
    canvas.height = 80;
    stages[currency] = new createjs.Stage("preview-canvas-" + currency);
    createjs.Ticker.setFPS(10);
    var CHART_PADDING = 6;
    var chart = stages[currency].addChild(new cr.PreviewChart(canvas.width - CHART_PADDING, canvas.height));
    chart.setPreview(data.slice(-24));
    chart.x = CHART_PADDING / 2;
    var WIDTH = 450;
    var SPACE = 8;
    var li = document.getElementById("currency-list-item-" + currency);
    var price = document.getElementById("currency-list-item-container-" + currency);
     
    document.addEventListener("DOMContentLoaded", function() {
        window.addEventListener("resize", resizeHandlerChart, false);
        resizeHandlerChart();
    }, false);
     
    function resizeHandlerChart(e) {
        var style = window.getComputedStyle(li, null);
        var innerWidth = parseInt(style.getPropertyValue("width"));
        innerWidth -= parseInt(style.getPropertyValue("padding-left"));
        innerWidth -= parseInt(style.getPropertyValue("padding-right"));
        innerWidth -= parseInt(style.getPropertyValue("border-width")) * 2;
        if (innerWidth > WIDTH) {
            canvas.width = innerWidth - price.clientWidth - SPACE;
        } else {
            canvas.width = innerWidth;
        }
        chart.setComplexSize(canvas.width - CHART_PADDING, canvas.height);
        stages[currency].update();
    }
 }