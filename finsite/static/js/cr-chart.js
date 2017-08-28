/**
 * @author R.Akhtyamov
 * Currencr Chart
 */
 
window.cr = {};

/**
 * 
 */
(function() {
    
    ComplexChart.RULER_WIDTH = 75;
    ComplexChart.TIMELINE_HEIGHT = 16;
    
    function ComplexChart(width, height, pointsCount) {
        width -= ComplexChart.RULER_WIDTH;
        height -= ComplexChart.TIMELINE_HEIGHT;
        this.StreamingChart_constructor(
          {width: width, height: height},
          {width: width / (pointsCount - 1), height: height * 0.1},
          {offset: 0, isDynamic: true, dynamicSpace: {top: height * 0.1, bottom: height * 0.1}},
          {
              background: {color: "#00AAFF", alpha: 0.1},
              grid: {thickness: 0.5, color: "#00FFFF", alpha: 0.5, width: 15, height: 0, dash: [1, 0], offset: 0},
              axisX:  {thickness: 1, color: "#00FFFF", alpha: 0.75, offset: 0},
              chart: {
                  lines: {thickness: 1.5, color: "#003333", alpha: 1, bounds: true},
                  points:  {thickness: 0, radius: 0, lineColor: "#000000", fillColor: "#000000", alpha: 0, bounds: true}
              }
          }
        );
        
        this._complexData = [];
        this._chartRange = {top: Number.MAX_VALUE, bottom: -Number.MAX_VALUE};
        this._isInteractiveState = false;
        
        this._forecastPositionShape = this.addChild(new createjs.Shape());
        this._forecastPositionShape.mouseEnabled = false;        
        this._forecastIndex = 0;

        this._guide = this.addChild(new cr.Guide(width, height));
        this._guide.visible = false;

        this._timeline = this.addChild(new cr.Timeline(width, ComplexChart.TIMELINE_HEIGHT));
        this._timeline.y = height;
        
        this._ruler = this.addChild(new cr.Ruler(ComplexChart.RULER_WIDTH, height));
        this._ruler.x = width;
        
        this._handleMouseOver();
    }
    
    var p = createjs.extend(ComplexChart, charts.StreamingChart);
    
    //
    //  Public
    //
    
    p.complexAppend = function(data) {
        if (data.length === 0) return;
        this._complexData = this._complexData.concat(data);
        data = data.map(function(item) {return Number(item.price);});
        this.append(data);
        this._updateGuidesAndRulers();
    };
    
    p.setComplexSize = function(width, height) {
        width -= ComplexChart.RULER_WIDTH;
        this._timeline.setWidth(width);
        this._guide.setSize(width, height);
        this._ruler.x = width;
        this.StreamingChart_setComplexSize(width, height);
        this._updateForecastPosition();
    };

    p.setForecastPosition = function(x) {
        this._forecastIndex = x;
        this._updateForecastPosition();
    }
    
    
    //
    //  Private
    //
    
    p._updateForecastPosition = function() {
        var localX = this.getLocalXByIndex(this._forecastIndex);
        var graphics = this._forecastPositionShape.graphics.clear();
        if (localX === 0) return;
        // -----
        var size = this.getSize();
        graphics.beginLinearGradientFill(
            ["rgba(0,170,255,0.2)","rgba(0,170,255,0.0)"],
            [0, 1],
            0, 0, (size.width - localX) * 0.60, 0
        )
        graphics.drawRect(0, 0, size.width - localX, size.height);
        graphics.endFill();
        graphics.beginStroke("#002D40").setStrokeStyle(1);
        graphics.moveTo(0,0);
        graphics.lineTo(0, size.height);
        // -----
        this._forecastPositionShape.x = localX;
        var currentCapacity = Math.min(this.getData().length, this.getCapacity());
        var timelineIndex = this._complexData.length - currentCapacity + this._forecastIndex;
        if (timelineIndex === -1 || timelineIndex === 0) return;
        var item = this._complexData[timelineIndex];
        this._timeline.showMarker();
        this._timeline.setMarker(localX, this._formatDate(item.date));
    }

    p._updateGuidesAndRulers = function() {
        var currentCapacity = Math.min(this.getData().length, this.getCapacity());
        var left = this._complexData[this._complexData.length - currentCapacity];
        var right = this._complexData[this._complexData.length - 1];
        this._timeline.setRange(this._formatDate(left.date, true), this._formatDate(right.date));
        if (this._isInteractiveState) this._processInteractive();
        var isRangeUpdated = this._processChartRange();
        if (!isRangeUpdated) return;
        this._ruler.setRange(this._chartRange.top, this._chartRange.bottom);
        var gridHeight = this._calculateGridHeight();
        if (gridHeight === 0) return;
        this.setGrid(this.getGrid().width, gridHeight);
        this._setRuler(gridHeight);
    };
    
    p._setRuler = function(gridHeight) {
        var currentY = Math.ceil(this._chartRange.top / gridHeight) * gridHeight;
        this._ruler.clear();
        while (currentY > this._chartRange.bottom) {
            this._ruler.addField(this.getLocalYByValue(currentY), currentY);
            currentY -= gridHeight;
        }
    };
    
    p._processChartRange = function() {
        var range = {
            top: this.getValueByLocalY(0),
            bottom: this.getValueByLocalY(this.getSize().height)
        };
        var a = range.top != this._chartRange.top;
        var b = range.bottom != this._chartRange.bottom;
        this._chartRange = range;
        return a || b;
    };
    
    p._calculateGridHeight = function() {
        var delta = Math.abs(this._chartRange.top - this._chartRange.bottom);
        var logRatio = 0.200;
        var heights = [];
        var reserve = 0;
        var count = 0;
        do {
            heights[0] = this._calculateGridHeightByLogBase(0.2, delta, 0, logRatio);
            heights[1] = this._calculateGridHeightByLogBase(0.5, delta, 0, logRatio);
            heights[1] = this._calculateGridHeightByLogBase(5, delta, 0, logRatio);
            heights[2] = this._calculateGridHeightByLogBase(10, delta, 0, logRatio);
            heights[3] = this._calculateGridHeightByLogBase(20, delta, 0, logRatio);
            heights[4] = this._calculateGridHeightByLogBase(50, delta, 0, logRatio);
            heights[5] = this._calculateGridHeightByLogBase(200, delta, 0, logRatio);
            heights[6] = this._calculateGridHeightByLogBase(2, delta, 0, logRatio);
            for (var i = 0; i < heights.length; i++) {
                reserve = Math.max(reserve, heights[i]);
                count = Math.ceil(delta / heights[i]);
                if (count > 16 || count < 8) continue;
                return heights[i];
            }
            logRatio -= 0.040;
        } while(logRatio > 0.080);
        count = Math.ceil(delta / reserve);
        return reserve;
    };
    
    p._calculateGridHeightByLogBase = function(base, delta, ratio0, ratio1) {
        var pow = Math.log(delta * ratio1) / Math.log(base);
        pow = Math.round(pow + ratio0);
        return Math.pow(base, pow);
    };
    
    p._handleMouseOver = function() {
        var handler = this._processInteractive.bind(this);
        var interval = 0;
        
        this.on("mouseover", function(event) {
            if (this.getData().length < 2) return;
            this._isInteractiveState = true;
            this._timeline.showCurrent();
            this._ruler.showCurrent();
            this._guide.visible = true;
            handler();
            this.stage.addEventListener("stagemousemove", handler);
            clearInterval(interval);
        });
        
        this.on("mouseout", function(event) {
            interval = setInterval((function() {
                this._isInteractiveState = false;
                this._timeline.hideCurrent();
                this._ruler.hideCurrent();
                this._guide.visible = false;
            }).bind(this), 1200);
            handler();
            this.stage.removeEventListener("stagemousemove", handler);
        });
    };
    
    p._processInteractive = function(e) {
        var mouse = this.globalToLocal(this.stage.mouseX, this.stage.mouseY);
        var mouseX = Math.max(0, Math.min(this.getSize().width, mouse.x));
        var currentCapacity = Math.min(this.getData().length, this.getCapacity());
        var timelineIndex = this._complexData.length - currentCapacity + this.getIndexByLocalX(mouseX);
        if (timelineIndex === -1) return;
        var item = this._complexData[timelineIndex];
        var rulerValue = this.getInterpolatedValueByLocalX(mouseX) || 0;
        var levelY = this.getLocalYByValue(rulerValue);
        this._timeline.setCurrent(mouseX, this._formatDate(item.date));
        this._ruler.setCurrent(levelY, rulerValue);
        this._guide.guideX.x = Math.round(mouseX);
        this._guide.guideY.y = levelY;
    };

    p._formatDate = function(date, isFull){
        if (isFull) return date.toLocaleTimeString([], {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    }
    
    cr.ComplexChart = createjs.promote(ComplexChart, "StreamingChart");
    
})();

(function() {
    
})();

/**
 * 
 */ 
(function() {
    
    function Guide(width, height) {
        this.Container_constructor();
        this._width = 0;
        this._height = 0;
        this.guideX = this.addChild(new createjs.Shape());
        this.guideY = this.addChild(new createjs.Shape());
        this.setSize(width, height);
        this.mouseEnabled = false;
        this.mouseChildren = false;
    }
    
    var p = createjs.extend(Guide, createjs.Container);
    
    p.setSize = function(width, height) {
        if (this._width != width) {
            this._drawGuideY(width);
            this._width = width;
        }
        if (this._height != height) {
            this._drawGuideX(height);
            this._height = height;
        }
    };
    
    p._drawGuideX = function(height) {
        var graphics = this.guideX.graphics.clear();
        graphics.setStrokeStyle(1).beginStroke("rgba(0, 0, 0, 0.6)");
        graphics.moveTo(0, 0).lineTo(0, height).endStroke();
    };
    
    p._drawGuideY = function(width) {
        var graphics = this.guideY.graphics.clear();
        graphics.setStrokeStyle(1).beginStroke("rgba(255, 0, 0, 0.6)");
        graphics.moveTo(0, 0).lineTo(width, 0).endStroke();
    };
    
    cr.Guide = createjs.promote(Guide, "Container");
    
})();

/**
 * 
 */ 
(function() {
  
    Ruler.FIELD_HEIGHT = 16;
    Ruler.FONT = "12px Courier";
    Ruler.FONT_COLOR = "#FFFFFF";
    
    function Ruler(width, height) {
        this.Container_constructor();
        this._width = width;
        this._height = height;
        
        this._backgroundShape = this.addChild(new createjs.Shape());
        var graphics = this._backgroundShape.graphics.clear();
        graphics.beginFill("#002D40").drawRect(0, 0, 1, 1).endFill();
        this._backgroundShape.scaleX = width;
        this._backgroundShape.scaleY = height;
        
        this._fieldsContainer = this.addChild(new createjs.Container());
        this._fieldsContainer.mask = new createjs.Shape();
        graphics = this._fieldsContainer.mask.graphics;
        graphics.beginFill("#002D40").drawRect(0, 0, width, height).endFill();
        
        this._topField = this.addChild(this._makeField("", "#00446E"));
        this._bottomField = this.addChild(this._makeField("", "#00446E"));
        this._currentField = this.addChild(this._makeField("", "#7C050B"));
        this._fields = [];
        this._usedCount = 0;
        
        this._bottomField.y = height - this._bottomField.getBounds().height;
        this._currentField.visible = false;
    }
    
    var p = createjs.extend(Ruler, createjs.Container);
    
    p.setCurrent = function(localY, value) {
        this._currentField.setText(value.toFixed(3));
        this._currentField.y = localY - this._bottomField.getBounds().height / 2;
    };
    
    p.hideCurrent = function() {
        this._currentField.visible = false;
    };
    
    p.showCurrent = function() {
        this._currentField.visible = true;
    };
    
    p.setRange = function(top, bottom) {
        this._topField.setText(top.toFixed(3));
        this._bottomField.setText(bottom.toFixed(3));
        this._bottomField.y = this._height - this._bottomField.getBounds().height;
    };
    
    p.clear = function() {
        for (var i = 0; i < this._fields.length; i++) {
            this._fields[i].visible = false;
            this._fields[i].y = 0;
        }
        this._usedCount = 0;
    };
    
    p.addField = function(localY, value) {
        var field = this._fields[this._usedCount];
        if (!field) {
            field = this._fields[this._usedCount] = this._makeField("", "#002D40");
            this._fieldsContainer.addChild(field);
        }
        field.y = localY - cr.Ruler.FIELD_HEIGHT / 2;
        field.setText(value.toFixed(3));
        field.visible = true;
        this._usedCount ++;
    };
    
    p._makeField = function(value, background) {
        return new cr.TextItem(value, Ruler.FONT, Ruler.FONT_COLOR, background, this._width, Ruler.FIELD_HEIGHT);
    };
    
    cr.Ruler = createjs.promote(Ruler, "Container");
    
})();

/**
 * 
 */
(function() {
  
    Timeline.FONT = "12px Courier";
    Timeline.FONT_COLOR = "#FFFFFF";
  
    function Timeline(width, height) {
        this.Container_constructor();
        this._width = width;
        this._height = height;
        
        this._backgroundShape = this.addChild(new createjs.Shape());
        var graphics = this._backgroundShape.graphics.clear();
        graphics.beginFill("#002D40").drawRect(0, 0, 1, 1).endFill();
        
        this._leftField = this.addChild(new cr.TextItem("", Timeline.FONT, Timeline.FONT_COLOR, "#00446E", 0, height));
        this._rightField = this.addChild(new cr.TextItem("", Timeline.FONT, Timeline.FONT_COLOR, "#00446E", 0, height));
        this._markField = this.addChild(new cr.TextItem("", Timeline.FONT, Timeline.FONT_COLOR, "#00446E", 0, height));
        this._currentField = this.addChild(new cr.TextItem("", Timeline.FONT, Timeline.FONT_COLOR, "#7C050B", 0, height));
       
        this._currentField.visible = false;
        this._markField.visible = false;
        
        this.setWidth(width);
        this._backgroundShape.scaleY = height;
    }
    
    var p = createjs.extend(Timeline, createjs.Container);
    
    p.setCurrent = function(localX, value) {
        this._currentField.setText(value);
        var fieldWidth = this._currentField.getBounds().width;
        localX = localX - fieldWidth / 2;
        localX = Math.max(localX, 0);
        localX = Math.min(localX, this._width - fieldWidth);
        this._currentField.x = localX;
    };
    
    p.hideCurrent = function() {
        this._currentField.visible = false;
    };
    
    p.showCurrent = function() {
        this._currentField.visible = true;
    };

    p.setMarker = function(localX, value) {
        this._markField.setText(value);
        var fieldWidth = this._markField.getBounds().width;
        localX = localX - fieldWidth / 2;
        localX = Math.max(localX, 0);
        localX = Math.min(localX, this._width - fieldWidth);
        this._markField.x = localX;
    }

    p.hideMarker = function() {
        this._markField.visible = false;
    };
    
    p.showMarker = function() {
        this._markField.visible = true;
    };
    
    p.setRange = function(left, right) {
        this._leftField.setText(left);
        this._rightField.setText(right);
        this._rightField.x = this._width - this._rightField.getBounds().width;
    };
    
    p.setWidth = function(width) {
        var minWidth = this._leftField.getBounds().width + this._rightField.getBounds().width;
        this._backgroundShape.scaleX = Math.max(width, minWidth);
        this._rightField.x = width - this._rightField.getBounds().width;
        this._width = width;
    };
    
    cr.Timeline = createjs.promote(Timeline, "Container");
    
})();


(function() {
  
    function TextItem(text, font, color, background, width, height) {
        this.Container_constructor();
        
        this._width = width;
        this._height = height;
        
        this._textField = new createjs.Text(text || "#", font, color);
        this._textField.x = 4;
        this._textField.y = 1;
        
        this._backgroundShape = new createjs.Shape();
        var graphics = this._backgroundShape.graphics.clear();
        graphics.beginFill(background).drawRect(0, 0, 1, 1).endFill();
        this._updateBackground();
        
        this.addChild(this._backgroundShape);
        this.addChild(this._textField);
    }
    
    var p = createjs.extend(TextItem, createjs.Container);
    
    p.setText = function(text) {
        this._textField.text = text;
        this._updateBackground();
    };
    
    p.getText = function() {
        return this._textField.text;
    };
    
    p._updateBackground = function() {
        var rect = this._textField.getBounds();
        var workWidth = this._width || rect.width + this._textField.x * 2;
        var workHeight = this._height || rect.height;
        this._backgroundShape.scaleX = workWidth;
        this._backgroundShape.scaleY = workHeight;
        this.setBounds(0, 0, workWidth, workHeight);
    };
    
    cr.TextItem = createjs.promote(TextItem, "Container");
    
})();
