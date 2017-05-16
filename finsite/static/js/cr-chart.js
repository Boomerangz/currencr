/**
 * @author R.Akhtyamov
 * Currencr Chart
 */
 
var cr = {};

(function() {
    
    var RULER_WIDTH = 80;
    
    function Chart(width, height, pointsCount) {
        width -= RULER_WIDTH;
        this.StreamingChart_constructor(
          {width: width, height: height},
          {width: width / (pointsCount - 1), height: height * 0.1},
          {offset: 0, isDynamic: true, dynamicSpace: {top: height * 0.1, bottom: height * 0.1}},
          {
              background: {color: "#00AAFF", alpha: 0.1},
              grid: {thickness: 0.5, color: "#00FFFF", alpha: 0.5, width: 12, height: 0, dash: [1, 0]},
              axisX:  {thickness: 1, color: "#00FFFF", alpha: 0.75, offset: 0},
              chart: {
                  lines: {thickness: 1, color: "#003333", alpha: 0.75, bounds: true},
                  points:  {thickness: 0, radius: 0, lineColor: "#000000", fillColor: "#000000", alpha: 0, bounds: true}
              }
          }
        );
        
        this._rulerContainer = this._createRulerContainer(RULER_WIDTH, height);
        this._rulerItemsContainer = new createjs.Container();
        this._rulerContainer.addChild(this._rulerItemsContainer);
        this._rulerContainer.x = width;
        this.addChild(this._rulerContainer);
        
        this._highItems = this._createHightTextItems(this._rulerContainer, height);
        this._rulerItems = [];
        
        this._xLine = this.addChild(new createjs.Shape());
        this._yLine = this.addChild(new createjs.Shape());
        this._drowMouseLines();
        
        this._lastChartBounds = {
            min: {value: -Number.MAX_VALUE, age: Number.MAX_VALUE},
            max: {value: Number.MAX_VALUE, age: Number.MAX_VALUE}
        };
        
        this._processOver();
    }
    
    var p = createjs.extend(Chart, charts.StreamingChart);
    
    //
    //  Public
    //
    
    p.append = function(data) {
        if (data.length === 0) return;
        
        this.StreamingChart_append(data);
        this._tickHandler();
        
        var chartHeight = this.getSize().height;
        var chartBounds = [this.getValueByLocalY(chartHeight), this.getValueByLocalY(0)];
        if (this._lastChartBounds[0] == chartBounds[0] && this._lastChartBounds[1] == chartBounds[1]) return;
        this._lastChartBounds = chartBounds;
        
        var gridHeight = this._calculateGridHeight(chartBounds);
        if (!gridHeight) return;
        this.setGrid(10, gridHeight);
        
        this._highItems[0].setText(chartBounds[1].toFixed(2));
        this._highItems[2].setText(chartBounds[0].toFixed(2));
        
        var gridHeightPixels = gridHeight * this.getPoint().height;
        var gridValue = Math.ceil(chartBounds[0] / gridHeight) * gridHeight;
        var item = {y: 1};
        var i = 0;
        var y = chartHeight;
        while (item.y > 0 || i < this._rulerItems.length) {
            if (y > 0) {
                this._rulerItems[i] = this._rulerItems[i] || new cr.TextItem(" ", "#FFFFFF", "#002D40", RULER_WIDTH);
                item = this._rulerItems[i];
                item.setText(gridValue.toFixed(2));
                item.y = this.getLocalYByValue(gridValue) - item.getBounds().height / 2;
                this._rulerItemsContainer.addChild(item);
                ++i;
                gridValue += gridHeight;
            } else {
                item = this._rulerItems.splice(i, 1)[0];
                this._rulerItemsContainer.removeChild(item);
            }
        }
    };
    
    p.setSize = function(width, height) {
        width -= RULER_WIDTH;
        this._rulerContainer.x = width;
        this.StreamingChart_setSize(width, height);
    };
    
    //
    //  Private
    //
    
    p._calculateGridHeight = function(array) {
        var delta = Math.abs(array[0] - array[1]);
        if (delta === 0) return 0;
        var heights = [];
        heights.push(this._calculateGridHeightByLogBase(5, delta, 0, 0.15));
        heights.push(this._calculateGridHeightByLogBase(10, delta, 0, 0.3));
        heights.push(this._calculateGridHeightByLogBase(20, delta, 0, 0.6));
        
        var ph = this.getPoint().height;
        
        return Math.min.apply(Math, heights);
    };
    
    p._calculateGridHeightByLogBase = function(base, delta, ratio0, ratio1) {
        var pow = Math.log(delta * ratio1) / Math.log(base);
        pow = Math.round(pow + ratio0);
        return Math.pow(base, pow);
    };
    
    p._createHightTextItems = function(container, height) {
        var items = [];
        var item;
        for (var i = 0; i < 3; i++) {
            item = new cr.TextItem("0", "#FFFFFF", "#00446E", RULER_WIDTH);
            container.addChild(item);
            items[i] = item;
        }
        items[1].alpha = 0;
        items[2].y = height - items[2].getBounds().height;
        return items;
    };
    
    p._drowMouseLines = function() {
        var graphics = this._xLine.graphics.clear();
        graphics.setStrokeStyle(0.5).beginStroke("#FF0000");
        graphics.moveTo(0, 0).lineTo(this.getSize().width, 0).endStroke();
        this._xLine.alpha = 0;
        
        graphics = this._yLine.graphics.clear();
        graphics.setStrokeStyle(0.5).beginStroke("#000000");
        graphics.moveTo(0, 0).lineTo(0, this.getSize().height).endStroke();
        this._yLine.alpha = 0;
    };
    
    p._createRulerContainer = function(width, height) {
        var container = new createjs.Container();
        var background = new createjs.Shape();
        background.graphics.beginFill("#002D40");
        background.graphics.drawRect(0, 0, width, height).endFill();
        container.addChild(background);
        return container;
    };
    
    p._processOver = function() {
        var handler = this._tickHandler.bind(this);
        
        this.on("mouseover", function(event) {
            this._xLine.alpha = 1;
            this._yLine.alpha = 1;
            this._highItems[1].alpha = 1;
            createjs.Ticker.addEventListener("tick", handler);
        });
        
        this.on("mouseout", function(event) {
            this._xLine.alpha = 0;
            this._yLine.alpha = 0;
            this._highItems[1].alpha = 0;
            createjs.Ticker.removeEventListener("tick", handler);
        });
    };
    
    p._tickHandler = function(e) {
        var localX = this.globalToLocal(this.stage.mouseX, 0).x;
        localX = Math.min(this.getSize().width, localX);
        var localY = this.globalToLocal(0, this.stage.mouseY).y;
        var value = this.getInterpolatedValueByLocalX(localX) || 0;
        var xLineY = this.getLocalYByValue(value);
        
        this._highItems[1].setText(value.toFixed(2));
        this._highItems[1].y = xLineY - this._highItems[1].getBounds().height / 2;
        this._yLine.x = localX;
        this._xLine.y = xLineY;
    };
    
    cr.Chart = createjs.promote(Chart, "StreamingChart");
    
})();


(function() {
    
    var HEIGHT = 16;
  
    function TextItem(text, fontColor, bgColor, width) {
        this.Container_constructor();
        
        this.textField = new createjs.Text(text || (0).toFixed(2), (HEIGHT - 4) + "px Courier", fontColor);
        this.textField.x = 4;
        
        this.background = new createjs.Shape();
        this.bgColor = bgColor;
        this.width = width;
        this._drawBG(this.bgColor, this.width, HEIGHT);
        
        this.addChild(this.background);
        this.addChild(this.textField);
        
        var rect = this.textField.getBounds();
        this.setBounds(0, 0, this.textField.x + this.width || rect.width, HEIGHT || rect.height);
    }
    
    var p = createjs.extend(TextItem, createjs.Container);
    
    p.setText = function(text) {
        this.textField.text = text;
        this._drawBG(this.bgColor, this.width, HEIGHT);
        var rect = this.textField.getBounds();
        this.setBounds(0, 0, this.width || rect.x + rect.width, HEIGHT || rect.height);
    };
    
    p._drawBG = function(color, width, height) {
        var rect = this.textField.getBounds();
        this.background.graphics.clear();
        this.background.graphics.beginFill(color);
        this.background.graphics.drawRect(0, 0, width || rect.x + rect.width, height || rect.height);
        this.background.graphics.endFill();
    };
    
    cr.TextItem = createjs.promote(TextItem, "Container");
})();
