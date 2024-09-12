// M.Tabs.init(chartTabs, {});


const CrUXApiService = {};
CrUXApiService.API_KEY = 'AIzaSyABFb0DrX8sAZ3867SAjpimUP-lxZ6yjuA';
CrUXApiService.API_HOST = 'https://chromeuxreport.googleapis.com';
CrUXApiService.API_ENDPOINT_PATH = `/v1/records:queryRecord?key=${CrUXApiService.API_KEY}`;
CrUXApiService.API_ENDPOINT = `${CrUXApiService.API_HOST}${CrUXApiService.API_ENDPOINT_PATH}`;
CrUXApiService.query = function (url) {
    if (CrUXApiService.API_KEY === '[YOUR_API_KEY]') {
        throw 'Replace "YOUR_API_KEY" with your private CrUX API key. Get a key at https://goo.gle/crux-api-key.';
    }
    const requestBody = {
        url: url,
        formFactor: 'PHONE',
        metrics: ['first_contentful_paint', 'largest_contentful_paint', 'cumulative_layout_shift', 'interaction_to_next_paint', 'experimental_time_to_first_byte'],
    };

    return fetch(CrUXApiService.API_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(requestBody),
        })
        .then(response => response.json())
        .then(response => {
            if (response.error) {
                // what to do when there is no crux data?.
                response.record = null;

                // or reject all data
                //return Promise.reject(response);
            }
            return response;
        });
};

const queryBatch = {};
queryBatch.noData = [];
queryBatch.cruxUrls = [];
queryBatch.metrics = [];
queryBatch.results = {
    LCP: [],
    CLS: [],
    FID: [],
    FCP: [],
    INP: [],
    TTFB: []
};

function processUrls() {
    const dataUrls = document.getElementById('dataUrls').value;
    const urls = dataUrls.split(/[,\n]/).map(url => url.trim());
    const filteredUrls = urls.filter(url => url.startsWith('https'));
    const promises = filteredUrls.map(url => CrUXApiService.query(url));

    Promise.all(promises)
        .then(responses => {
            responses.forEach((response, index) => {
                console.log(response)
                const url = urls[index];
                if (!response.record) {
                    queryBatch.noData.push(url);
                    return
                };
                queryBatch.cruxUrls.push(url)
                response.record.metrics = labelMetricDatabatch(response.record.metrics);
                queryBatch.metrics.push(response?.record)

                // Store results in queryBatch.results object
                response.record.metrics.forEach(metric => {
                    const resultObj = {
                        url: url,
                        percentiles: metric.percentiles.p75,
                        labeledBins: {}
                    };
                    metric.labeledBins.forEach(bin => {
                        resultObj.labeledBins[bin.label] = bin.percentage;
                    });
                    queryBatch.results[metric.acronym].push(resultObj);
                });
            });

            console.log("batch results", queryBatch)
            const goodUrls = queryBatch.cruxUrls.length;
            const badUrls = queryBatch.noData.length;
            const totalUrls = goodUrls + badUrls;
            document.querySelector('.feedback').innerHTML = `<span>queryBatch URL info - Total Urls: ${totalUrls} - have crux: ${goodUrls} - noData: ${badUrls} </span>`;
            renderData(queryBatch.metrics)
        })
        .catch(error => {
            console.error('Error in Promise.all:', error);
        });

};

function renderData(crux) {
    const tableBody = document.getElementById('data');
    tableBody.innerHTML = ''; // Clear the table body before rendering

    crux.forEach((metric, index) => {
        const li = document.createElement('li');
        const header = document.createElement('div');
        header.classList.add('collapsible-header');

        // Create collapsible header content
        const siteCell = document.createElement('td');
        siteCell.classList.add('site');
        const sitename = `<span><a href="${metric.key.url}" target="_blank" rel="noopener">${metric.key.url}</a></span>`;
        siteCell.innerHTML = sitename;
        header.appendChild(siteCell);

        metric.metrics.forEach(metricData => {
            const metricCell = document.createElement('td');
            metricCell.classList.add(metricData.acronym);

            const binLabels = ['good', 'needs improvement', 'poor'];
            const binSpans = binLabels.map(label => {
                const bin = metricData.labeledBins.find(bin => bin.label === label);
                if (bin) {
                    return `<span class="${label}">${bin.percentage.toFixed(0)}%</span>`;
                } else {
                    return '';
                }
            });

            const metricHTML = `
              <div class="metric">
                <div class="metric-title">${metricData.acronym}</div>
                <div class="metric-labels">
                  <div class="metric-label">Good (≤ ${metricData.labeledBins[0].end} ms)</div>
                  <div class="metric-percentage">${binSpans[0]}</div>
                </div>
                <div class="metric-labels">
                  <div class="metric-label">Needs Improvement (${metricData.labeledBins[1].start} ms - ${metricData.labeledBins[1].end} ms)</div>
                  <div class="metric-percentage">${binSpans[1]}</div>
                </div>
                <div class="metric-labels">
                  <div class="metric-label">Poor (> ${metricData.labeledBins[2].start} ms)</div>
                  <div class="metric-percentage">${binSpans[2]}</div>
                </div>
                <div class="metric-labels">
                  <div class="metric-label">75th Percentile</div>
                  <div class="metric-percentage">${metricData.percentiles.p75} ms</div>
                </div>
              </div>
            `;


            metricCell.innerHTML = metricHTML;
            header.appendChild(metricCell);
        });

        const body = document.createElement('div');
        body.classList.add('collapsible-body');

        // Create collapsible body content
        const bodyContentHTML = `
          <div id="site${index}" class="container">
              <div class="drill spi"><a href="https://pagespeed.web.dev/analysis?url=${metric.key.url}" target="_blank" rel="noopener">Load PageSpeed</a></div>
            <div class="top">
              <span class="hide">${metric.key.url}</span>
              <div class="cwv">
                <div class="title"><i class="material-icons">assessment</i>Core Web Vitals Assessment</div>
                <div class="cwvmetrics">
                  ${metric.metrics.map(metricData => {
                    const bin = metricData.labeledBins.find(bin => bin.label === 'good');
                    const goodPercentage = bin ? bin.percentage.toFixed(0) : 0;
                    const status = goodPercentage > 75 ? 'Passed' : 'Failed';

                    return `<div class="metric-label ${status} ${metricData.acronym}">${metricData.acronym} - ${status}</div>`;

                  }).join('')}
                </div>
              </div>
              <div class="drill"><p>Below, you can view historical data for the page. This provides a time series of web performance data which updates weekly and allows you to view up to 6 months of history with 25 data points spaced out over each week.</p><button id="histo${index}" data-index="${index}">Load Historical Data</button></div>
            </div>
            <div id="page">
                <ul id="chartPageTabs${index}" class="tabs">
                    <li class="tab col s3"><a href="#LCP${index}">LCP</a></li>
                    <li class="tab col s3"><a href="#CLS${index}">CLS</a></li>
                    <li class="tab col s3"><a href="#FCP${index}">FCP</a></li>
                    <li class="tab col s3"><a href="#INP${index}">INP</a></li>
                    <li class="tab col s3"><a href="#TTFB${index}">TTFB</a></li>
                </ul>
                <div id="LCP${index}" class="col s12"></div>
                <div id="CLS${index}" class="col s12"></div>
                <div id="FCP${index}" class="col s12"></div>
                <div id="INP${index}" class="col s12"></div>
                <div id="TTFB${index}" class="col s12"></div>
            </div>
          </div>
        `;



        body.innerHTML = bodyContentHTML;

        li.appendChild(header);
        li.appendChild(body);

        tableBody.appendChild(li);

        var pageTabs = document.querySelectorAll(`#chartPageTabs${index}`);
        var instancesTab = M.Tabs.init(pageTabs);

        // Add an event listener to the button with id "histo + index"
        document.getElementById(`histo${index}`).addEventListener("click", function (event) {
          // Get the data-id attribute value
          const dataId = event.target.getAttribute("data-index");
          const pageURL = document.querySelector(`#site${dataId} .hide`).innerHTML;
          event.target.hidden = true

          // Call the function to load historical data using the dataId value as a scope for the charts
          loadHistoricalDataById(dataId, pageURL)
        });


    });
}



function labelMetricDatabatch(metrics) {
    const nameToFullNameMap = {
        first_contentful_paint: 'First Contentful Paint (FCP)',
        largest_contentful_paint: 'Largest Contentful Paint (LCP)',
        first_input_delay: 'First Input Delay (FID)',
        cumulative_layout_shift: 'Cumulative Layout Shift (CLS)',
        interaction_to_next_paint: 'Interaction to Next Paint (INP)',
        experimental_time_to_first_byte: 'experimental Time to First Byte (TTFB)',
    };
    const nameToAcronymMap = {
        first_contentful_paint: 'FCP',
        largest_contentful_paint: 'LCP',
        first_input_delay: 'FID',
        cumulative_layout_shift: 'CLS',
        interaction_to_next_paint: 'INP',
        experimental_time_to_first_byte: 'TTFB',
    };
    return Object.entries(metrics).map(([metricName, metricData]) => {
        const standardBinLabels = ['good', 'needs improvement', 'poor'];
        const metricBins = metricData.histogram;
        const labeledBins = metricBins.map((bin, i) => {
            return {
                label: standardBinLabels[i],
                percentage: bin.density ? bin.density * 100 : 0,
                ...bin,
            };
        });
        return {
            acronym: nameToAcronymMap[metricName],
            name: nameToFullNameMap[metricName],
            percentiles: metricData.percentiles,
            labeledBins,
        };
    });
}


function exportToCSV(data, filename) {
    const csvContent = "data:text/csv;charset=utf-8," + convertToCSV(data);
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
}

function convertToCSV(data) {
    const rows = [];
    const header = ["Site"];
    const metrics = data[0].metrics;

    // Generate the header row
    metrics.forEach(metric => {
        const labels = ["good", "needs improvement", "poor"];
        const metricLabels = labels.map(label => `${metric.acronym} - ${label}`);
        header.push(...metricLabels);
    });
    rows.push(header);

    // Generate the data rows
    data.forEach(crux => {
        const row = [crux.key.url];

        // Iterate over each metric
        metrics.forEach(metric => {
            let goodPercentage = "";
            let niPercentage = "";
            let poorPercentage = "";

            // Check if metric has data for the current URL
            if (crux.metrics.some(m => m.acronym === metric.acronym)) {
                const labeledBins = crux.metrics.find(m => m.acronym === metric.acronym).labeledBins;
                const goodBin = labeledBins.find(bin => bin.label === "good");
                const needsImprovementBin = labeledBins.find(bin => bin.label === "needs improvement");
                const poorBin = labeledBins.find(bin => bin.label === "poor");

                goodPercentage = goodBin ? `${goodBin.percentage.toFixed(2)}%` : "";
                niPercentage = needsImprovementBin ? `${needsImprovementBin.percentage.toFixed(2)}%` : "";
                poorPercentage = poorBin ? `${poorBin.percentage.toFixed(2)}%` : "";
            }

            row.push(goodPercentage, niPercentage, poorPercentage);
        });

        rows.push(row);
    });

    return rows.map(row => row.join(",")).join("\n");
}

const exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", () => {
    exportToCSV(queryBatch.metrics, "crux_data.csv");
});


document.addEventListener('DOMContentLoaded', function () {
    var modal = document.querySelectorAll('.modal');
    var instancesModal = M.Modal.init(modal);
});

document.addEventListener('DOMContentLoaded', function () {
    var collapsible = document.querySelectorAll('.collapsible');
    var instancesCollapsible = M.Collapsible.init(collapsible);
});



function createBubbleChart(acronym, data) {
    var chartDiv = document.getElementById(acronym);
    var root = am5.Root.new(chartDiv);
    root.setThemes([
    am5themes_Animated.new(root)
  ]);

    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelY: "zoomXY",
        pinchZoomX: true,
        pinchZoomY: true
    }));

    var xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
    }));

    // Customize X-axis labels and appearance if needed

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
            inversed: false
        }),
        tooltip: am5.Tooltip.new(root, {})
    }));

    // Customize Y-axis labels and appearance if needed
    let labelValue = "[bold]{title}[/]\nPercentile: {valueX.formatNumber('#')}\nGood Percentage: {valueY.formatNumber('#.00')}%\n{metric}";
    if (acronym === "CLS") {
        labelValue = "[bold]{title}[/]\nRoom to improve: {valueX.formatNumber('#')}\nGood Percentage: {valueY.formatNumber('#.00')}%\n{metric}";
    }
    var series = chart.series.push(am5xy.LineSeries.new(root, {
        calculateAggregates: true,
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "y",
        valueXField: "x",
        valueField: "value",
        seriesTooltipTarget: "bullet",
        tooltip: am5.Tooltip.new(root, {
            pointerOrientation: "horizontal",
            labelText: labelValue
        })
    }));

    series.strokes.template.set("visible", false);

    var circleTemplate = am5.Template.new({});
    circleTemplate.adapters.add("fill", function (fill, target) {
        var dataItem = target.dataItem;
        if (dataItem) {
            return am5.Color.fromString(dataItem.dataContext.color);
        }
        return fill;
    });

    series.bullets.push(function () {
        var bulletCircle = am5.Circle.new(root, {
            radius: 5,
            fill: series.get("fill"),
            fillOpacity: 0.8
        }, circleTemplate);
        return am5.Bullet.new(root, {
            sprite: bulletCircle
        });
    });

    series.set("heatRules", [{
        target: circleTemplate,
        min: 3,
        max: 60,
        dataField: "value",
        key: "radius"
  }]);

    var seriesData = [];
    data.forEach((result, index) => {
        let exValue = result.percentiles
        if (acronym === "CLS") {
            exValue = result.labeledBins["needs improvement"] + result.labeledBins.poor
        }
        var dataObj = {
            "title": result.url,
            "id": acronym + index,
            "metric": acronym,
            "color": "#eea638",
            "x": exValue,
            "y": result.labeledBins.good,
            "value": result.labeledBins["needs improvement"]
        };
        seriesData.push(dataObj);
    });

    series.data.setAll(seriesData);

    chart.set("cursor", am5xy.XYCursor.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        snapToSeries: [series]
    }));

    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));

    chart.set("scrollbarY", am5.Scrollbar.new(root, {
        orientation: "vertical"
    }));

    series.appear(1000);
    chart.appear(1000, 100);
}


function processCharts() {
    // Create charts for each acronym
    createBubbleChart("LCP", queryBatch.results.LCP);
    createBubbleChart("CLS", queryBatch.results.CLS);
    createBubbleChart("FID", queryBatch.results.FID);
    createBubbleChart("FCP", queryBatch.results.FCP);
    createBubbleChart("INP", queryBatch.results.INP);
    createBubbleChart("TTFB", queryBatch.results.TTFB);

}
