// Constants
const CrUXApiHistoryService = {}; // Renamed from CrUXApiHistory
CrUXApiHistoryService.KEY = 'AIzaSyABFb0DrX8sAZ3867SAjpimUP-lxZ6yjuA';
const endpointHistory = 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord';
let endpointURL = `${endpointHistory}?key=${CrUXApiHistoryService.KEY}`;

// Query function for CrUX API
CrUXApiHistoryService.fetchHistoryData = async function (requestBody, formFactor) { // Updated method reference
    const resp = await fetch(endpointURL, {
        method: 'POST',
        body: JSON.stringify(requestBody)
    });
    const json = await resp.json();
    console.log("RAW API response", json);
    if (resp.ok) {
        return json;
    }
    M.toast({
        html: `${formFactor.formFactor}: ${json.error.message}`,
        classes: 'red darken-4 white-text'
    });
};

// Get historical data and build dashboard
async function retrieveHistoricalData(historyOrigin) {

    const requests = [
    CrUXApiHistoryService.fetchHistoryData({ // Updated method reference
            url: historyOrigin,
            formFactor: 'Phone'
        }, {
            formFactor: 'Phone'
        })
  ];

    const requestResults = await Promise.all(requests);

    const data = requestResults.filter(result => result !== undefined);
    processHistoricalData(data[0]);

}

let pageMetricData = {};
pageMetricData.CLS = {};
pageMetricData.TTFB = {};
pageMetricData.FCP = {};
pageMetricData.INP = {};
pageMetricData.DEPRECATED = {};
pageMetricData.navigation = {};
pageMetricData.id = {};
pageMetricData.url = {};
pageMetricData.index = {};


// Build object data
function processHistoricalData(data) {
    // Implement your logic to process and store the historical data
    // Use the 'data' array containing the historical data
    // 'historyOrigin' represents the URL origin for which historical data is collected

    const weeks = data.record.collectionPeriods.map((period, index) => {
        const startDate = formatDate(period.firstDate);
        const endDate = formatDate(period.lastDate);
        const weekNumber = data.record.collectionPeriods.length - index;
        const week = `Week ${weekNumber} / ${endDate}`;
        return {
            date: `${startDate} to ${endDate}`,
            week
        };
    });

    function formatDate(dateObj) {
        const {
            year,
            month,
            day
        } = dateObj;
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
        const monthName = monthNames[month - 1];
        return `${monthName} ${day}, ${year}`;
    }

    console.log("weeks",weeks);

    let pageMetrics = labelMetricsWithWeeks(data.record.metrics, weeks)
    console.log("pageMetric", pageMetrics)

    pageMetrics.forEach(data => {
        pageMetricData[data.acronym] = data;

    })

    createStackedAreaChart(pageMetricData.LCP, pageMetricData.id, pageMetricData.index);
    createStackedAreaChart(pageMetricData.CLS, pageMetricData.id, pageMetricData.index);
    createStackedAreaChart(pageMetricData.FCP, pageMetricData.id, pageMetricData.index);
    createStackedAreaChart(pageMetricData.INP, pageMetricData.id, pageMetricData.index);
    createStackedAreaChart(pageMetricData.TTFB, pageMetricData.id, pageMetricData.index);



    createSimpleColumnChart(pageMetricData.LCP, pageMetricData.id, pageMetricData.index);
    createSimpleColumnChart(pageMetricData.CLS, pageMetricData.id, pageMetricData.index);
    createSimpleColumnChart(pageMetricData.FCP, pageMetricData.id, pageMetricData.index);
    createSimpleColumnChart(pageMetricData.INP, pageMetricData.id, pageMetricData.index);
    createSimpleColumnChart(pageMetricData.TTFB, pageMetricData.id, pageMetricData.index);

}


function labelMetricsWithWeeks(metrics, weeks) {
    const requestedMetrics = [
        'first_contentful_paint',
        'largest_contentful_paint',
        'cumulative_layout_shift',
        'interaction_to_next_paint',
        'experimental_time_to_first_byte',
        'experimental_interaction_to_next_paint'
    ];

    const metricLabels = {
        first_contentful_paint: 'First Contentful Paint (FCP)',
        largest_contentful_paint: 'Largest Contentful Paint (LCP)',
        cumulative_layout_shift: 'Cumulative Layout Shift (CLS)',
        interaction_to_next_paint: 'Interaction to Next Paint (INP)',
        experimental_time_to_first_byte: 'Experimental Time to First Byte (TTFB)',
        experimental_interaction_to_next_paint: 'Experiemental (INP)'
    };

    const nameToAcronymMap = {
        first_contentful_paint: 'FCP',
        largest_contentful_paint: 'LCP',
        cumulative_layout_shift: 'CLS',
        interaction_to_next_paint: 'INP',
        experimental_time_to_first_byte: 'TTFB',
        experimental_interaction_to_next_paint: 'DEPRECATED'
    };

    return Object.entries(metrics)
        .filter(([metricName]) => requestedMetrics.includes(metricName)) // Filter to only include requested metrics
        .map(([metricName, metricData]) => {
            const labeledBins = [];

            for (let i = 0; i < metricData.histogramTimeseries[0].densities.length; i++) {
                const labeledBin = {
                    good: metricData.histogramTimeseries[0].densities[i],
                    'needs improvement': metricData.histogramTimeseries[1].densities[i],
                    poor: metricData.histogramTimeseries[2].densities[i],
                };

                labeledBins.push(labeledBin);
            }

            return {
                acronym: nameToAcronymMap[metricName],
                name: metricLabels[metricName],
                percentiles: metricData.percentilesTimeseries,
                labeledBins,
                weeks,
            };
        });
}


function createStackedAreaChart(data, containerId, index) {
    // Create unique ID for the chart
    let chartId = data.acronym + "_chart_" + containerId;
    containerId = `#${containerId} #${data.acronym}${index}`;

    let chartDiv = document.querySelector(containerId);
    let charttemplate = `<div id="${chartId}" style="width: 100%; height: 500px"></div>`;
    chartDiv.insertAdjacentHTML("afterbegin", charttemplate);


    // Create root element
    var root = am5.Root.new(chartId);

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
        pinchZoomX: true,
        title: "CWV Week Chart"
    }));

    // Add cursor
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "none"
    }));
    cursor.lineY.set("visible", false);

    // Create axes
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "week",
        startLocation: 0.5,
        endLocation: 0.5,
        renderer: am5xy.AxisRendererX.new(root, {
            labels: []
        })
    }));

    xAxis.data.setAll(data.weeks);
    //    xAxis.title.set("text", "CWV Week Chart");

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        min: 0,
        max: 100,
        calculateTotals: true,
        numberFormat: "#'%'",
        renderer: am5xy.AxisRendererY.new(root, {})
    }));




    // Add series
    function createSeries(name, field) {
        var series = chart.series.push(am5xy.LineSeries.new(root, {
            name: name,
            stacked: true,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: field,
            categoryXField: "week",
            valueYShow: "valueYTotalPercent",
            legendValueText: "{valueY}",
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "[bold]{name}:{valueYTotalPercent.formatNumber('#.0')}%[/]\n{categoryX}"
            })
        }));

        series.fills.template.setAll({
            fillOpacity: 0.5,
            visible: true
        });

        // Transform labeledBins array into series data format
        var seriesData = data.weeks.map(function (week, index) {
            return {
                week: week.week,
                categoryX: week.week,
                [field]: data.labeledBins[index][field]
            };
        });

        series.data.setAll(seriesData);
        series.appear(1000);
    }

    createSeries("Good", "good");
    createSeries("Needs Improvement", "needs improvement");
    createSeries("Poor", "poor");

    // Add scrollbar
//    chart.set("scrollbarX", am5.Scrollbar.new(root, {
//        orientation: "horizontal"
//    }));

    // Add legend
    var legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50
    }));

    legend.data.setAll(chart.series.values);
    xAxis.hide();
    // Make stuff animate on load
    chart.appear(1000, 100);
}



function createSimpleColumnChart(data, containerId, index) {
    // Create unique ID for the chart
    let chartId = data.acronym + "_p75_" + containerId;
    containerId = `#${containerId} #${data.acronym}${index}`;

    let chartDiv = document.querySelector(containerId);
    let charttemplate = `<div id="${chartId}" class="p75Chart" style="width: 100%; height: 140px"></div>`;
    chartDiv.insertAdjacentHTML("afterbegin", charttemplate);



    // Create root element
    var root = am5.Root.new(chartId);

 // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create chart
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
        pinchZoomX: false
    }));

    // Add cursor
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "none"
    }));
    cursor.lineY.set("visible", false);

    // Create axes
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "week",
        startLocation: 0.5,
        endLocation: 0.5,
        renderer: am5xy.AxisRendererX.new(root, {}),
    }));

    xAxis.data.setAll(data.weeks);

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Add series
    function createSeries(name, data) {
        var series = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: name,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: "p75s",
            categoryXField: "week",
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "vertical",
                labelText: "[bold]{name}[/]\n{categoryX}: {valueY}"
            })
        }));

        series.data.setAll(data);
        series.appear(1000);
    }

    // Check if data has percentiles and p75s array is not empty
    const percentiles = data.percentiles;
    const p75s = percentiles?.p75s ?? [];

    // Prepare data for series
    const seriesData = data.weeks.map((weekData, index) => ({
        week: weekData.week,
        p75s: p75s[index] ?? 0, // Use 0 if value is not available
    }));

    createSeries("Percentiles", seriesData);

    // Add legend
    var legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        visible: false
    }));

    legend.data.setAll(chart.series.values);

    // Make stuff animate on load
    chart.appear(1000, 100);

    xAxis.hide();
    yAxis.hide();
}




// Function to load historical data based on the dataId parameter
function loadHistoricalDataById(dataId, pageURl) {
    pageMetricData.index = dataId;
    pageMetricData.id = "site"+dataId;
    pageMetricData.url = pageURl;
    retrieveHistoricalData(pageURl)
}
