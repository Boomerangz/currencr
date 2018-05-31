/**
 * @author R.Akhtyamov
 * Preview Chart
 */
(function() {

    PreviewChart.BACKGROUND = "#262626";

    function PreviewChart(width, height) {
        var size = {width: width, height: height};
        var point = {width: 1, height: 1};
        var axis = {offset: 0, isDynamic: true, dynamicSpace: {top: height * 0.05, bottom: height * 0.20}};
        var style = {
            background: {color: PreviewChart.BACKGROUND},
            chart: {
                fill: {
                    type: "solid", 
                    color: "rgb(0,183,195)",
                }
            }
        };
        this.StreamingChart_constructor(size, point, axis, style);
    }

    var p = createjs.extend(PreviewChart, charts.StreamingChart);
    p.setPreview = function(data, quote) {
        this._quote = quote;
        this.setPoint(this.getSize().width / (data.length - 1), this.getPoint().height);
        this.set(data);
    }

    p.getQuote = function() {
        return this._quote;
    }

    window.cr = window.cr || {};
    cr.PreviewChart = createjs.promote(PreviewChart, "StreamingChart");

})();