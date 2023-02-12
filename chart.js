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

getHistoricalData = async (origin) => {
    // document.getElementById("loading").style.display = "block";
    buildModal(origin);
    const request = await [];

    // Fix the code bellow to wait for all the 3 request
    const requests = [
        CrUXApiHistory.query({ url: `https://${origin}/` }, { formFactor: "Sum" }),
        CrUXApiHistory.query({ url: `https://${origin}/`, formFactor: "Phone" }, { formFactor: "Phone" }),
        CrUXApiHistory.query({ url: `https://${origin}/`, formFactor: "Desktop" }, { formFactor: "Desktop" })
    ];

    Promise.all(requests).then((results) => {
        const sum = results[0];
        const phone = results[1];
        const desktop = results[2];

        // check if data is undefined and push into request array if not undefined 		    	
        if (sum !== undefined) { request.push(sum) };
        if (phone !== undefined) { request.push(phone) };
        if (desktop !== undefined) { request.push(desktop) };

        buildObjectData(request)
    });


}

function buildModal(origin){
    // need to clean origin 
    // debugger;
    let domainName = origin.replace(/^https?:\/\//, '').split('.')[1]

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
    document.getElementById('cruxModals').insertAdjacentHTML("afterbegin", modalHTML);
    var modalTrigger = document.querySelectorAll('#cruxModals .modal');
    M.Modal.init(modalTrigger, {});

}

function buildObjectData(entries) {

    // debugger;
    let newRequestToProcess = []
    entries.forEach(item => {
        // debugger;
        const newObject = {};
        for (let i = 0; i < 25; i++) {
            let cardObject = {
                "key": {
                    "cardIndex": i,
                    "formFactor": item.record.key?.formFactor,
                    "origin": item.record.key.url
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
            console.log(cardObject)
            newRequestToProcess.push(cardObject)
        }
        // process(newRequestToProcess, origin);
    })
    console.log(newRequestToProcess);

    const groupCards = arr => {
        let result = {};
    
        for(let i=0; i<arr.length;i++){
            const cardIndexValue = arr[i].key.cardIndex; 
    
            if (result[cardIndexValue] === undefined) //if the key is not present in the object, create an array and add it to the object 
                result[cardIndexValue] = [arr[i]];
            else //else push the objects into existing subarray  
                result[cardIndexValue].push(arr[i]); 
    
        }
    
        return Object.values(result); //return a new array with all values of the grouped objects 				  
    }
    console.log(groupCards(newRequestToProcess))
    let cards = groupCards(newRequestToProcess)
    
    cards.forEach(item => {
        processd(item, origin)
    })
    
}


function processd(formFactor, origin) {
    // debugger;
    const labeledMetrics = [];
    formFactor.forEach(formFactor => {
        // debugger;
        const validData = labelMetricDatax(formFactor.metrics, formFactor.key.formFactor, formFactor.key.cardIndex);
        labeledMetrics.push(validData);
    })
    console.log(labeledMetrics)
    let network = "";
    // debugger;
    let dates = { first: formFactor[0].collectionPeriod.firstDate, last: formFactor[0].collectionPeriod.lastDate };
    const data = buildCard1(labeledMetrics, formFactor[0].key.origin, dates);
}


function buildCard1(labeledMetrics, origin, dates) {
    // debugger;
    const favicon = `${origin}favicon.ico`
    origin = origin.replace(/^(?:https?:\/\/)/i, "").split('/')[0];
    let filter = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
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
    var el = document.querySelectorAll('.tabs');
    var instance = M.Tabs.init(el, {});
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
    console.log(key);
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







am5.ready(function () {

    // Create root element
    // https://www.amcharts.com/docs/v5/getting-started/#Root_element
    var root = am5.Root.new("chartdiv");


    // Set themes
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([
        am5themes_Animated.new(root)
    ]);


    // Create chart
    // https://www.amcharts.com/docs/v5/charts/xy-chart/
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
        pinchZoomX: true
    }));


    // Add cursor
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "none"
    }));
    cursor.lineY.set("visible", false);


    // The data
    var data = [{
        "year": "1994",
        "good": 1587,
        "Need Improvement": 650,
        "bad": 121
    }, {
        "year": "1995",
        "good": 1567,
        "Need Improvement": 683,
        "bad": 146
    }, {
        "year": "1996",
        "good": 1617,
        "Need Improvement": 691,
        "bad": 138
    }, {
        "year": "1997",
        "good": 1630,
        "Need Improvement": 642,
        "bad": 127
    }, {
        "year": "1998",
        "good": 1660,
        "Need Improvement": 699,
        "bad": 105
    }, {
        "year": "1999",
        "good": 1683,
        "Need Improvement": 721,
        "bad": 109
    }, {
        "year": "2000",
        "good": 1691,
        "Need Improvement": 737,
        "bad": 112
    }, {
        "year": "2001",
        "good": 1298,
        "Need Improvement": 680,
        "bad": 101
    }, {
        "year": "2002",
        "good": 1275,
        "Need Improvement": 664,
        "bad": 97
    }, {
        "year": "2003",
        "good": 1246,
        "Need Improvement": 648,
        "bad": 93
    }, {
        "year": "2004",
        "good": 1318,
        "Need Improvement": 697,
        "bad": 111
    }, {
        "year": "2005",
        "good": 1213,
        "Need Improvement": 633,
        "bad": 87
    }, {
        "year": "2006",
        "good": 1199,
        "Need Improvement": 621,
        "bad": 79
    }, {
        "year": "2007",
        "good": 1110,
        "Need Improvement": 210,
        "bad": 81
    }, {
        "year": "2008",
        "good": 1165,
        "Need Improvement": 232,
        "bad": 75
    }, {
        "year": "2009",
        "good": 1145,
        "Need Improvement": 219,
        "bad": 88
    }, {
        "year": "2010",
        "good": 1163,
        "Need Improvement": 201,
        "bad": 82
    }, {
        "year": "2011",
        "good": 1180,
        "Need Improvement": 285,
        "bad": 87
    }, {
        "year": "2012",
        "good": 1159,
        "Need Improvement": 277,
        "bad": 71
    }];


    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "year",
        startLocation: 0.5,
        endLocation: 0.5,
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
    }));

    xAxis.data.setAll(data);

    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        min: 0,
        max: 100,
        calculateTotals: true,
        numberFormat: "#'%'",
        renderer: am5xy.AxisRendererY.new(root, {})
    }));

    // Add series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    function createSeries(name, field) {
        var series = chart.series.push(am5xy.LineSeries.new(root, {
            name: name,
            stacked: true,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: field,
            categoryXField: "year",
            valueYShow: "valueYTotalPercent",
            legendValueText: "{valueY}",
            tooltip: am5.Tooltip.new(root, {
                pointerOrientation: "horizontal",
                labelText: "[bold]{name}[/]\n{categoryX}: {valueYTotalPercent.formatNumber('#.0')}% ({valueY})"
            })
        }));

        series.fills.template.setAll({
            fillOpacity: 0.5,
            visible: true
        });

        series.data.setAll(data);
        series.appear(1000);
    }

    createSeries("good", "good");
    createSeries("Need Improvement", "Need Improvement");
    createSeries("bad", "bad");

    // Add scrollbar
    // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));


    // Add legend
    // https://www.amcharts.com/docs/v5/charts/xy-chart/legend-xy-series/
    var legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50
    }));

    legend.data.setAll(chart.series.values);


    // Make stuff animate on load
    // https://www.amcharts.com/docs/v5/concepts/animations/
    chart.appear(1000, 100);

}); // end am5.ready()