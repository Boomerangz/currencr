/**
 * @author R.Akhtyamov
 * Currencr Chart
 */
 
window.cr = {};

/**
 * 
 */
(function() {

    function PreviewChart(width, height) {
        var size = {width: width, height: height};
        var point = {width: 1, height: 1};
        var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: 20, bottom: 10}};
        var style = {
            background: {color: "#000000", alpha: 0},
            grid: {thickness: 1, color: "#000000", alpha: 0, width: 0, height: 0, dash: [1, 0]},
            axisX:  {thickness: 1, color: "#000000", alpha: 0, offset: 0},
            chart: {
                lines: {thickness: 4, color: "#002D40", alpha: 1, bounds: false},
                points:  {thickness: 1, radius: 1.5, lineColor: "#002D40", fillColor: "#002D40", alpha: 0, bounds: false}
            }
        };
        this.StreamingChart_constructor(size, point, axis, style);
    }

    var p = createjs.extend(PreviewChart, charts.StreamingChart);

    p.set = function(data) {
        this.setPoint(this.getSize().width / (data.length - 1), this.getPoint().height);
        //this.redraw();
        this.StreamingChart_set(data);
    }

    cr.PreviewChart = createjs.promote(PreviewChart, "StreamingChart");

})();