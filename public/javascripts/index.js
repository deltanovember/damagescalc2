var volume;

const numberWithCommas = (x) => {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

$(function() {
    
    // See http://twitter.github.io/typeahead.js/examples/
    
    var states = companies;
    
var states = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    // `states` is an array of state names defined in "The Basics"
    local: states
});
    
    $('#stockCode').typeahead({
    highlight: true,
    hint: true,
    minLength: 3
}, {
    name: 'states',
    source: states,
    limit: 10
});

    $("#calculate").click(function() {

        var stockCode = $("#stockCode").val().split("(")[0].trim();
        var startDate = $("#startDate").val();
        var endDate = $("#endDate").val();
        var dropPrice = $("#dropPrice").val();


        $.post("/calculate", {
                stockCode: stockCode,
                startDate: startDate,
                endDate: endDate,
                dropPrice: dropPrice
            })
            .done(function(data) {

                volume = data.volumeData;

                var chart;
                
                chart = Highcharts.stockChart('container', {

                    chart: {
                        events: {
                            redraw: function() {
                                console.log(chart);
                                var totalDamages = 0;
                                var points = chart.series[0].points;
                                for (var i = 0; i < points.length; i++) {
                                    var point = points[i];
                                    if (undefined != point.name) {
                                        // console.log(point.name);
                                        totalDamages +=  parseInt(dropPrice * parseInt(point.name));
                                    }
                                }
                                chart.setTitle({text: getTitle(stockCode, dropPrice, numberWithCommas(totalDamages))});
                            }
                        },
                        type: 'arearange'
                    },
                    /**
                            dataGrouping: {
                                enabled: false
                            },
                            */
                    rangeSelector: {
                        selected: 5
                    },

                    series: [{
                        name: 'Damages',
                        data: data.graphData,
                        dataGrouping: {
                            enabled: false
                        }

                    }],

                    title: {
                        text: getTitle(stockCode, dropPrice, data.totalDamages)
                    },

                    tooltip: {

                        formatter: function() {
                            var result = '<b>' + Highcharts.dateFormat('%A, %b %e, %Y', this.x) + '</b>';
                            var cumulativeDamages = 0;

                            for (var i = 0; i < this.points.length; i++) {
                                var datum = this.points[i];
                                var pointsArray = datum.point.series.points;
                                for (var j=0; j < pointsArray.length && pointsArray[j].category != datum.point.category; j++) {
                                    var currentPoint = pointsArray[j];
                                    cumulativeDamages += currentPoint.name * dropPrice;
                                }
                                console.log(datum);
                               // result += '<br />Original price: $' + datum.point.high.toFixed(2);
                            //    result += '<br />Dropped price: $' + datum.point.low.toFixed(2);
                                if (undefined != datum.point.name) {
                                    result += '<br />Daily volume: ' + numberWithCommas(datum.point.name);
                                    var dailyDamages = parseInt(datum.point.name * (datum.point.high - datum.point.low));
                                    cumulativeDamages += dailyDamages;
                                    result += '<br />Cumulative damages: $' + numberWithCommas(cumulativeDamages);
                                }
                            }
                            return result;
                        }
                    }


                });



            });

    });



});

function getTitle(stockCode, dropPrice, damages) {
    return stockCode + ' (drop price $' + dropPrice + ') - maximum potential damages - $' + damages;
}