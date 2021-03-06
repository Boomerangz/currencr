/**
 * 
 */
(function() {
    window.previews = {};
})();

/**
 * 
 * 
 */
function addPreviewChart(canvasID, containerID) {
    var container = document.getElementById(containerID);
    var canvas = document.getElementById(canvasID);
    var stage = new createjs.Stage(canvasID);
    stage.mouseMoveOutside = true;
    stage.preventSelection = false;
    stage.enableMouseOver(1);
    
    createjs.Touch.enable(stage, false, true);
    createjs.Ticker.on("tick", stage.update.bind(stage));
    createjs.Ticker.framerate = 12;

    var chart = stage.addChild(new cr.PreviewChart(container.clientWidth, container.clientHeight));
    handleResizing(canvas, container, stage, chart);
    return chart;
}

/**
 * 
 * 
 */
function handleResizing(canvas, container, stage, chart) {
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
        stage.update();
    }
}

/**
 * 
 * 
 */
function handleCQMouse(id) {
    var node = document.getElementById(id);
    var timeoutID = undefined;
    node.addEventListener("click", function(e) {
        var currency = e.currentTarget.dataset.currency;
        var quote = e.currentTarget.dataset.quote;
        var chart = window.previews[currency].chart;
        if (timeoutID || chart.getQuote() != quote) {
            changePreview(e);
            e.preventDefault();
        }
    });
    node.addEventListener("mouseover", function(e) {
        changePreview(e);
        if (timeoutID) return;
        timeoutID = setTimeout(function() {
            timeoutID = undefined;
        }, 250)
    });
}

/**
 * 
 *  
 */
function changePreview(e) {
    var currency = e.currentTarget.dataset.currency;
    var quote = e.currentTarget.dataset.quote;
    if (!currency || !quote) return;
    var item = window.previews[currency].item;
    item.classList.remove("cr-white");
    item.classList.add("cr-grey");
    item.parentElement.firstElementChild.classList.remove("cr-op-1");
    item.parentElement.firstElementChild.classList.add("cr-op-0");
    item = e.currentTarget;
    item.classList.remove("cr-grey");
    item.classList.add("cr-white");
    item.parentElement.firstElementChild.classList.remove("cr-op-0");
    item.parentElement.firstElementChild.classList.add("cr-op-1");
    window.previews[currency].item = item;
    var chart = window.previews[currency].chart;
    var a = window.previews[currency].a;
    a.href = a.dataset.href + e.currentTarget.dataset.url;
    chart.setPreview(window.previews[currency][quote], quote);
}