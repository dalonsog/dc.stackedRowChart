dc.stackedRowChart = function (parent, chartGroup) {

  var _chart = dc.stackMixin(dc.coordinateGridMixin({}));
  var _g;
  var _rowCssClass = 'row';
  var _xScale;
  var _yScale;
  var _rowData;
  var _x;
  var _y;
  var _axisX;
  var _elasticX;
  var _elasticY;
  var _xAxis = d3.svg.axis().orient('bottom');
  var _yAxis = d3.svg.axis().orient('left');

  _chart._mandatoryAttributes()
        .splice(_chart._mandatoryAttributes().indexOf('x'), 1);

  _chart._doRender = function () {
    _chart.resetSvg();

    _g = _chart.svg()
        .append('g')
        .attr('transform', 'translate(' + _chart.margins().left + 
                              ',' + _chart.margins().top + ')');

    drawChart();

    return _chart;
  };

  /**
   #### .x([scale])
   Gets or sets the x scale. The x scale can be any d3
   [quantitive scale](https://github.com/mbostock/d3/wiki/Quantitative-Scales)
   **/
  _chart.x = function (x) {
    if (!arguments.length) return _x;

    _x = x;
    return _chart;
  };
   
  _chart.y = function (y) {
      if (!arguments.length) return _y;

      _y = y;
      return _chart;
  };

  _chart._doRedraw = function () {
      drawChart();
      return _chart;
  };

  /**
  #### .elasticX([boolean])
  Get or set the elasticity on x axis. If this attribute is set to true, 
  then the x axis will rescle to auto-fit the data range when filtered.
  **/
  _chart.elasticX = function (_) {
    if (!arguments.length) return _elasticX;

    _elasticX = _;
    return _chart;
  };
  
  _chart.elasticY = function (_) {
    if (!arguments.length) return _elasticY;

    _elasticY = _;
    return _chart;
  };

  _chart.data = function (){
    var stack = _chart.stack();
    var groups = [];
    var keys = [];
    
    stack.forEach(function(d){
      groups.push(d.group);
      keys.push(d.name);
    });
    
    dataset = groups.map(function(d){
      var data = d.all()[0]
      return [{ y: data.value, x: data.key }];
    });
    
    var stack = d3.layout.stack();
    
    stack(dataset);
    
    dataset = dataset.map(function (group,i) {
        return group.map(function (d) {
            // Invert the x and y values, and y0 becomes x0
            return { x: d.y, y: d.x, x0: d.y0, layer: keys[i] };
        });
    });
    
    return dataset;
  };

  _chart.axisX = function(_){
    if (!arguments.length) return _axisX;
    
    _axisX = _;
    return _chart;
  }

  function calculateAxisScaleX() {
    if (!_x || _elasticX) {
      var xMax = d3.max(_rowData, function (group) {
        return d3.max(group, function (d) {
          return d.x + d.x0;
        });
      });
      _x = d3.scale.linear()
             .domain([0, xMax])
             .range([0, _chart.effectiveWidth()]);
    }
    _xAxis.scale(_x);
  }

  function calculateAxisScaleY() {
    if (!_y || _elasticY){
      var yLabels = _rowData.map(function (d) {
        return d[0].y;
      });
      _y = d3.scale.ordinal()
             .domain(yLabels)
             .rangeRoundBands([0, _chart.effectiveHeight()], .1);
    }
    _yAxis.scale(_y);
  }

  function drawAxis() {
      var axisG = _g.select('g.axis');

      calculateAxisScaleX();
      calculateAxisScaleY()
      if (axisG.empty() && _axisX) {
          var axisG = _g.append('g').attr('class', 'axis x')
                        .attr('transform', 'translate(0,' + 
                              _chart.effectiveHeight() + ')');
          
          var axisGY = _g.append('g').attr('class', 'axis y')
                          .attr('transform', 'translate(0, ' + 
                                _chart.effectiveWidth() + ')');
      }
      
      dc.transition(axisG, _chart.transitionDuration()).call(_xAxis);
  }

  function createElements(rows){
      var rowEnter = rows.enter()
                         .append('g')
                         .attr('class', function (d, i) {
                             return _rowCssClass + ' _' + i;
                         });
  }

  function removeElements(rows){
      rows.exit().remove();
  }

  function updateElements(rows){
    var rects = rows.selectAll('rect')
                    .data(function (d) {
                      return d;
                    })
                    .enter()
                    .append('rect')
                    .attr('x', function (d) {
                      return _x(d.x0);
                    })
                    .attr('y', function (d, i) {
                      return _y(d.y);
                    })
                    .attr('height', function (d) {
                      return _y.rangeBand();
                    })
                    .attr('width', function (d) {
                      return _x(d.x);
                    })
                    .attr('fill', _chart.getColor);

    var rect = rows.select('rect');
    dc.transition(rect, _chart.transitionDuration())
      .attr('width', function (d) {
        return Math.abs(rootValue() - _x(d[0].x));
      })
      .attr('x', function (d) {
        return Math.abs(rootValue() - _x(d[0].x0));
      });;
  }

  function rootValue() {
    var root = _x(0);
    return (root === -Infinity || root !== root) ? _x(1) : root;
  }

  function drawChart() {
    _rowData = _chart.data();

    drawAxis();

    var rows = _g.selectAll('g.' + _rowCssClass)
                 .data(_rowData);

    createElements(rows);
    removeElements(rows);
    updateElements(rows);
  }
  
  _chart.xAxis = function () {
    return _xAxis;
  };

  _chart.yAxis = function () {
    return _yAxis;
  };

  _chart.legendables = function () {
    return _chart.stack().map(function (layer, i) {
      if (_chart._alwaysLegend) var d = 1;
      else var d = layer.group.top(1)[0].value;
      
      return {
        chart:_chart,
        name:layer.name,
        data:d,
        hidden: layer.hidden || false,
        color:_chart.getColor.call(layer, layer.values, i)
      };
    });
  };

  return _chart.anchor(parent, chartGroup);
};
