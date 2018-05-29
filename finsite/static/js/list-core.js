/**
 * 
 */
window.previews = {};

/**
 * 
 * 
 */
function addPreviewChart(canvasID, containerID, currency) {
    var container = document.getElementById(containerID);
    var canvas = document.getElementById(canvasID);

    var stage = new createjs.Stage(canvasID);
    stage.mouseMoveOutside = true;
    stage.preventSelection = false;
    stage.enableMouseOver(10);
    
    createjs.Touch.enable(stage, false, true);
    createjs.Ticker.on("tick", stage.update.bind(stage));
    createjs.Ticker.framerate = 60;

    var chart = stage.addChild(new cr.PreviewChart(container.clientWidth, container.clientHeight));
    handleResizing(canvas, container, chart);
    return chart;
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