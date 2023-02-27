
const CrUXApiHistory = {};
CrUXApiHistory.KEY = 'AIzaSyCv-IHj-oddickRMsoI5UBAJx3Cwj-mwck';
const enpointHistory = 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord';
let enpointURL = `${enpointHistory}?key=${CrUXApiHistory.KEY}`;


CrUXApiHistory.query = async function (requestBody, formFactor) {
    const resp = await fetch(enpointURL, { method: 'POST', body: JSON.stringify(requestBody) });
    const json = await resp.json();
    console.log(json);
    if (resp.ok) { return json; };
    M.toast({ html: `${formFactor.formFactor}: ${json.error.message}`, classes: 'red darken-4 white-text' });
};


getHistoricalData = async (historyOrigin) => {
    buildModal(historyOrigin);

    const request = await [];

    // Fix the code below to wait for all the 3 requests
    const requests = [
      CrUXApiHistory.query({ origin: `https://${historyOrigin}/` }, { formFactor: "Sum" }),
      CrUXApiHistory.query({ origin: `https://${historyOrigin}/`, formFactor: "Phone" }, { formFactor: "Phone" }),
      CrUXApiHistory.query({ origin: `https://${historyOrigin}/`, formFactor: "Desktop" }, { formFactor: "Desktop" })
    ];
  
    for (let i = 0; i < requests.length; i++) {
      const result = await requests[i];
      if (result !== undefined) {
        request.push(result);
      }
    }
  
//    await buildObjectData(request, historyOrigin);
    formChartData(request);
  };


function buildModal(historyOrigin){
    // need to clean historyOrigin
    // debugger;
    let domainName = historyOrigin.replace(/^https?:\/\//, '').split('.')[1]

    let modalHTML = `
    <div id="${domainName}Modal" class="modal bottom-sheet">
    <div class="modal-content">
    <h4>${domainName} Deck of Cards</h4>
    <p>This data for ${domainName} is updated on a weekly basis, allowing you to view up to 6 months of history in 25 data cards that are spaced out over the course of a week.</p>
    <!-- HTML -->
    <div id="HistoryApp"></div>
    </div>
    <div class="modal-footer">
    <a href="#!" class="modal-close waves-effect waves-green btn-flat">Close Deck</a>
    </div>
    </div>
    `;

    let chartHTML = `
    <div id="${domainName}Chart" class="modal bottom-sheet">
    <div class="modal-content">
        <h4>${domainName} Charts</h4>
        <p>This datasets for ${domainName} is updated weekly, providing up to 6 months of historical data that can be broken down by phone, desktop, and total metrics.</p>
        <!-- HTML -->
        <div id="chartdiv" class="row">
            <div class="col s12">
                <ul class="tabs">
                    <li class="tab col s4"><a href="#${domainName}SUMChart">Sum</a></li>
                    <li class="tab col s4"><a class="active" href="#${domainName}PHONEChart">Mobile</a></li>
                    <li class="tab col s4"><a href="#${domainName}DESKTOPChart">Desktop</a></li>
                </ul>
            </div>
            <div id="${domainName}SUMChart" class="col s12"></div>
            <div id="${domainName}PHONEChart" class="col s12"></div>
            <div id="${domainName}DESKTOPChart" class="col s12"></div>
        </div>
    </div>
    <div class="modal-footer">
        <a href="#!" class="modal-close waves-effect waves-green btn-flat">Close Deck</a>
    </div>
</div>
    `


    document.getElementById('cruxModals').insertAdjacentHTML("afterbegin", modalHTML);
    var modalTrigger = document.querySelectorAll('#cruxModals .modal');
    M.Modal.init(modalTrigger, {});

    document.getElementById('chartModals').insertAdjacentHTML("afterbegin", chartHTML);
    var chartTrigger = document.querySelectorAll('#chartModals .modal');
    M.Modal.init(chartTrigger, {});

    var chartTabs = document.querySelectorAll('#chartModals .tabs');
    // M.Tabs.init(chartTabs, {});
    let instance = M.Tabs.init(chartTabs, {});

}

function buildObjectData(entries, historyOrigin) {

    let newRequestToProcess = []

    entries.forEach(item => {

        const newObject = {};
        for (let i = 0; i < 25; i++) {
            let cardObject = {
                "key": {
                    "cardIndex": i,
                    "formFactor": item.record.key?.formFactor,
                    "origin": item.record.key.origin
                },
                "metrics": {
                    "first_contentful_paint": {
                        "histogram": [
                            {
                                "start": 0,
                                "end": 1800,
                                "density": item.record.metrics.first_contentful_paint.histogramTimeseries[0].densities[i]
                            },
                            {
                                "start": 1800,
                                "end": 3000,
                                "density": item.record.metrics.first_contentful_paint.histogramTimeseries[1].densities[i]
                            },
                            {
                                "start": 3000,
                                "density": item.record.metrics.first_contentful_paint.histogramTimeseries[2].densities[i]
                            }
                        ],
                        "percentiles": {
                            "p75": item.record.metrics.first_contentful_paint.percentilesTimeseries.p75s[i]
                        }
                    },
                    "first_input_delay": {
                        "histogram": [
                            {
                                "start": 0,
                                "end": 100,
                                "density": item.record.metrics.first_input_delay.histogramTimeseries[0].densities[i]
                            },
                            {
                                "start": 100,
                                "end": 300,
                                "density": item.record.metrics.first_input_delay.histogramTimeseries[1].densities[i]
                            },
                            {
                                "start": 300,
                                "density": item.record.metrics.first_input_delay.histogramTimeseries[2].densities[i]
                            }
                        ],
                        "percentiles": {
                            "p75": item.record.metrics.first_input_delay.percentilesTimeseries.p75s[i]
                        }
                    },
                    "largest_contentful_paint": {
                        "histogram": [
                            {
                                "start": 0,
                                "end": 2500,
                                "density": item.record.metrics.largest_contentful_paint.histogramTimeseries[0].densities[i]
                            },
                            {
                                "start": 2500,
                                "end": 4000,
                                "density": item.record.metrics.largest_contentful_paint.histogramTimeseries[1].densities[i]
                            },
                            {
                                "start": 4000,
                                "density": item.record.metrics.largest_contentful_paint.histogramTimeseries[2].densities[i]
                            }
                        ],
                        "percentiles": {
                            "p75": item.record.metrics.largest_contentful_paint.percentilesTimeseries.p75s[i]
                        }
                    },
                    "cumulative_layout_shift": {
                        "histogram": [
                            {
                                "start": "0.00",
                                "end": "0.10",
                                "density": item.record.metrics.cumulative_layout_shift.histogramTimeseries[0].densities[i]
                            },
                            {
                                "start": "0.10",
                                "end": "0.25",
                                "density": item.record.metrics.cumulative_layout_shift.histogramTimeseries[1].densities[i]
                            },
                            {
                                "start": "0.25",
                                "density": item.record.metrics.cumulative_layout_shift.histogramTimeseries[2].densities[i]
                            }
                        ],
                        "percentiles": {
                            "p75": item.record.metrics.cumulative_layout_shift.percentilesTimeseries.p75s[i]
                        }
                    },
                    "experimental_interaction_to_next_paint": {
                        "histogram": [
                            {
                                "start": 0,
                                "end": 200,
                                "density": item.record.metrics.experimental_interaction_to_next_paint.histogramTimeseries[0].densities[i]
                            },
                            {
                                "start": 200,
                                "end": 500,
                                "density": item.record.metrics.experimental_interaction_to_next_paint.histogramTimeseries[1].densities[i]
                            },
                            {
                                "start": 500,
                                "density": item.record.metrics.experimental_interaction_to_next_paint.histogramTimeseries[2].densities[i]
                            }
                        ],
                        "percentiles": {
                            "p75": item.record.metrics.experimental_interaction_to_next_paint.percentilesTimeseries.p75s[i]
                        }
                    },
                    "experimental_time_to_first_byte": {
                        "histogram": [
                            {
                                "start": 0,
                                "end": 800,
                                "density": item.record.metrics.experimental_time_to_first_byte.histogramTimeseries[0].densities[i]
                            },
                            {
                                "start": 800,
                                "end": 1800,
                                "density": item.record.metrics.experimental_time_to_first_byte.histogramTimeseries[1].densities[i]
                            },
                            {
                                "start": 1800,
                                "density": item.record.metrics.experimental_time_to_first_byte.histogramTimeseries[2].densities[i]
                            }
                        ],
                        "percentiles": {
                            "p75": item.record.metrics.experimental_time_to_first_byte.percentilesTimeseries.p75s[i]
                        }
                    }
                },
                "collectionPeriod": item.record.collectionPeriods[i]
            }

            let chartObjectData =  {
                "formFactor": item.record.key?.formFactor,
                "data": {
                    "week": i,
                    "good": item.record.metrics.first_contentful_paint.histogramTimeseries[0].densities[i],
                    "Need Improvement": item.record.metrics.first_contentful_paint.histogramTimeseries[1].densities[i],
                    "bad": item.record.metrics.first_contentful_paint.histogramTimeseries[2].densities[i]
                }
            }

        


            // console.log(cardObject)
            newRequestToProcess.push(cardObject)
        }

    })
    // console.log(newRequestToProcess);
    
    const groupCards = arr => {
        let result = {};

        for (let i = 0; i < arr.length; i++) {
            const cardIndexValue = arr[i].key.cardIndex;

            if (result[cardIndexValue] === undefined) //if the key is not present in the object, create an array and add it to the object 
                result[cardIndexValue] = [arr[i]];
            else //else push the objects into existing subarray  
                result[cardIndexValue].push(arr[i]);

        }

        return Object.values(result); //return a new array with all values of the grouped objects 				  
    }

    let cards = groupCards(newRequestToProcess)


    // console.log(cards)
    cards.forEach(item => {
        processd(item, historyOrigin)
    })
    
    // formChartData(entries);
}


function processd(formFactor, historyOrigin) {
    const labeledMetrics = [];
    formFactor.forEach(formFactor => {

        const validData = labelMetricDatax(formFactor.metrics, formFactor.key.formFactor, formFactor.key.cardIndex);
        labeledMetrics.push(validData);
    })
    // console.log(labeledMetrics)
    let network = "";

    let dates = { first: formFactor[0].collectionPeriod.firstDate, last: formFactor[0].collectionPeriod.lastDate };
    const data = buildCard1(labeledMetrics, formFactor[0].key.origin, dates);

}


function buildCard1(labeledMetrics, historyOrigin, dates) {

    const favicon = `${historyOrigin}favicon.ico`
    historyOrigin = historyOrigin.replace(/^(?:https?:\/\/)/i, "").split('/')[0];
    let filter = historyOrigin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
    let siteName = filter.split('.').join("-");
    let cardTitle = filter.split('.').join("-");
    if (siteName.match(/^\d/)) { siteName = `N${siteName}` }
    let sumId = `${siteName}SUM${labeledMetrics[0][0].index}`;
    let phoneId = `${siteName}PHONE${labeledMetrics[0][0].index}`;
    let desktopId = `${siteName}DESKTOP${labeledMetrics[0][0].index}`;
    let card = `
            <div class="card" id="${siteName}">
                <span class="close hide">remove</span>
                <div class="cardHeader">
                    <img aria-label="${siteName} logo" src="${favicon}">
                    <span>${cardTitle}</span>
                </div>
                <div id="cardBody" class="row">
                <div class="col s12">
                    <ul class="tabs">
                        <li class="tab col s4"><a href="#${sumId}">Sum</a></li>
                        <li class="tab col s4"><a class="active" href="#${phoneId}">Mobile</a></li>
                        <li class="tab col s4"><a href="#${desktopId}">Desktop</a></li>
                    </ul>
                </div>
                <div id="${sumId}" class="col s12"><div class="metrics"></div></div>
                <div id="${phoneId}" class="col s12"><div class="metrics"></div></div>
                <div id="${desktopId}" class="col s12"><div class="metrics"></div></div>
                <span class="date">
                collection period:
                ${dates.last.month}-${dates.last.day}-${dates.last.year} to
                ${dates.first.month}-${dates.first.day}-${dates.first.year}
            </span>
            </div>
        `; document.getElementById('HistoryApp').insertAdjacentHTML("afterbegin", card);
    labeledMetrics.forEach(formFactor => {
        buildData1(formFactor, siteName);
    })
    var el = document.querySelectorAll('#cruxModals .tabs');
    let instance = M.Tabs.init(el, {});
    var noData = `<p class="nodata">No data</p>`;
    let checkMetrics = document.querySelectorAll(".metrics");
    checkMetrics.forEach(metrics => {
        let scopeId = metrics.parentNode.id;
        if (metrics.hasChildNodes()) { return };
        document.querySelector(`#${scopeId} .metrics`).insertAdjacentHTML("beforeend", noData);
    })
    document.getElementById("loading").style.display = "none";
    document.getElementById('search').value = '';
    document.querySelector(`#${siteName} .close`).onclick = function () { removeCard() };
    function removeCard() {
        document.querySelector(`#${siteName}`).remove();
    }
}

function buildData1(labeledMetrics, siteName) {
    // debugger;
    labeledMetrics.forEach(metric => {
        var finalData = { key: "", acronym: "", good: "", ok: "", poor: "" }
        finalData.key = siteName + metric.key + metric.index;
        finalData.acronym = metric.acronym;
        finalData.good = metric.labeledBins[0].percentage.toFixed(2);
        finalData.ok = metric.labeledBins[1].percentage.toFixed(2);
        finalData.poor = metric.labeledBins[2].percentage.toFixed(2);
        let htmlBar = `
            <section class="${finalData.acronym}">
            <div class="labels">
                    <span class="good"><i class="material-icons">sentiment_very_satisfied</i>${finalData.good}%</span>
                    <span class="ok"><i class="material-icons">sentiment_neutral</i>${finalData.ok}%</span>
                    <span class="poor"><i class="material-icons">sentiment_very_dissatisfied</i>${finalData.poor}%</span>
            </div>
            <div class="flex"><h2>${finalData.acronym}</h2>
            <div class="grid-container" style="grid-template-columns: ${finalData.good}% ${finalData.ok}% ${finalData.poor}%;">
                    <div class="box-good" data-title="${finalData.good}% good"></div>
                    <div class="box-needs-improvement" data-title="${finalData.ok}% needs improvement"></div>
                    <div class="box-poor" data-title="${finalData.poor}% poor"></div>
            </section> </div>
            `; document.querySelector(`#${finalData.key} .metrics`).insertAdjacentHTML("beforeend", htmlBar);
    });
}


function labelMetricDatax(metrics, key, index) {
    if (key === undefined) {
        key = "SUM"
    };
    // console.log(key);
    const nameToFullNameMap = {
        first_contentful_paint: 'First Contentful Paint (FCP)',
        largest_contentful_paint: 'Largest Contentful Paint (LCP)',
        first_input_delay: 'First Input Delay (FID)',
        cumulative_layout_shift: 'Cumulative Layout Shift (CLS)',
        experimental_interaction_to_next_paint: 'experimental Interaction to Next Paint (INP)',
        experimental_time_to_first_byte: 'experimental Time to First Byte (TTFB)',
    };
    const nameToAcronymMap = {
        first_contentful_paint: 'FCP',
        largest_contentful_paint: 'LCP',
        first_input_delay: 'FID',
        cumulative_layout_shift: 'CLS',
        experimental_interaction_to_next_paint: 'INP',
        experimental_time_to_first_byte: 'TTFB',
    };
    return Object.entries(metrics).map(([metricName, metricData]) => {
        // debugger; 
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
            index,
            key: key,
            acronym: nameToAcronymMap[metricName],
            name: nameToFullNameMap[metricName],
            labeledBins,
        };
    });
}



function formChartData(apiResponse) {

    apiResponse.forEach(bucket => {

        let formFactor = bucket.record.key.formFactor ?? "SUM"
        let dataStructure = {
            "site": bucket.record.key.origin,
            "formFactor": formFactor,
            "chart": [
                {
                    "metric": "first_contentful_paint",
                    "data": []
                },
                {
                    "metric": "first_input_delay",
                    "data": []
                },
                {
                    "metric": "largest_contentful_paint",
                    "data": []
                },
                {
                    "metric": "cumulative_layout_shift",
                    "data": []
                },
                {
                    "metric": "experimental_interaction_to_next_paint",
                    "data": []
                },
                {
                    "metric": "experimental_time_to_first_byte",
                    "data": []
                }]
        }

        for (let chart of dataStructure.chart) {
            let teemo = [];
            for (let i = 0; i < 25; i++) {
                let metricObj = {
                    "week": i,
                    "good": bucket.record.metrics[chart.metric].histogramTimeseries[0].densities[i] * 100,
                    "Need Improvement": bucket.record.metrics[chart.metric].histogramTimeseries[1].densities[i] * 100,
                    "bad": bucket.record.metrics[chart.metric].histogramTimeseries[2].densities[i] * 100
                };
                teemo.push(metricObj)
            }

            chart.data.push(teemo);
        }

        console.log(dataStructure)
        sortCartData(dataStructure)

    })
}


// gets the charts ready. 
am5.ready()



async function sortCartData(chartData) {
    try {
        // debugger
    let domainName = chartData.site.replace(/^https?:\/\//, '').split('.')[1]
      const chartDiv = document.querySelector(`#${domainName}Chart #chartdiv #${domainName}${chartData.formFactor}Chart`);
      const charts = [];
    
    for (const metricData of chartData.chart) {

        let charttemplate = `
        <div class="col s12 m6 l4 chart">
            <p>${metricData.metric}-${chartData.formFactor}</p>
            <div id="${metricData.metric}-${chartData.formFactor}" style="width: 100%; height: 500px"></div>
        
        </div>
        `
        chartDiv.insertAdjacentHTML("afterbegin", charttemplate);
        
        const root = am5.Root.new(`${metricData.metric}-${chartData.formFactor}`);

        root.fps = 10;
  
        const chart = root.container.children.push(
          am5xy.XYChart.new(root, {
            layout: root.verticalLayout,
            pinchZoomX: false,
          })
        );
  
        const cursor = chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));
        cursor.lineY.set("visible", false);

//			function reverseArray(data) {
//					data.sort(function (a, b) {
//							return b.week - a.week;
//					});
//					return data;
//			}
  
        const data = metricData.data[0];
  
        const xAxis = chart.xAxes.push(
          am5xy.CategoryAxis.new(root, {
            categoryField: "week",
            startLocation: 0.5,
            endLocation: 0.5,
            renderer: am5xy.AxisRendererX.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
          })
        );
        xAxis.data.setAll(data);
  
        const yAxis = chart.yAxes.push(
          am5xy.ValueAxis.new(root, {
            min: 0,
            max: 100,
            calculateTotals: true,
            numberFormat: "#'%'",
            renderer: am5xy.AxisRendererY.new(root, {}),
          })
        );
  
        function createSeries(name, field, color) {
          const series = chart.series.push(
            am5xy.LineSeries.new(root, {
              name: name,
              fill: am5.color(color),
              stacked: true,
              xAxis: xAxis,
              yAxis: yAxis,
              valueYField: field,
              categoryXField: "week",
              valueYShow: "valueYTotalPercent",
              legendValueText: "{valueY}",
              tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "[bold]{name}[/]\nWeek {categoryX}: {valueYTotalPercent.formatNumber('#.0')}% ({valueY})",
              }),
            })
          );
  
          series.fills.template.setAll({
            fillOpacity: 0.5,
            visible: true,
          });
  
          series.data.setAll(data);
          series.appear(1000);
        }
        let green = 0x10c180;
        let yellow = 0xfddc77;
        let red = 0xff0000;

        createSeries("Good", "good", green);
        createSeries("Need improvements", "Need Improvement", yellow);
        createSeries("Bad", "bad", red);

        chart.set("scrollbarX", am5.Scrollbar.new(root, { orientation: "horizontal" }));
        
        const legend = chart.children.push(am5.Legend.new(root, { centerX: am5.p50, x: am5.p50 }));
        legend.data.setAll(chart.series.values);
        
        charts.push(chart);
        // root.container.children.clear();
    }
    
    charts.forEach((chart) => {
        chart.paddingRight = 20;
    });
  
    // root.dispose();
      return charts;
    } catch (error) {
      console.error(error);
    }
  }

