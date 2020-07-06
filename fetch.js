const CrUXApiUtil = {};
CrUXApiUtil.KEY = 'AIzaSyBX3phN4IuKNtJkQrTeAL0lZL95kHUY08o';
const endpointUrl = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
var url = `${endpointUrl}?key=${CrUXApiUtil.KEY}`;
var app = document.querySelector('#app');
var toastHTML = '<span>Data already exist on screen</span><button class="btn-flat toast-action">ok</button>';
var noData = `<p class="nodata">No data</p>`;

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var origin = document.getElementById('search').value.toLowerCase();
    var siteName = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
    if (!siteName) { return }
    var child = document.querySelector(`#${siteName}`);
    if (app.contains(child)) {
        M.toast({ html: toastHTML });
    } else {
        M.toast({html: `Building a request to the API.`, classes: 'green', displayLength: 600});
        getData(origin);
    }
})

CrUXApiUtil.query = async function (requestBody, formFactor) {
    const resp = await fetch(url, {method: 'POST', body: JSON.stringify(requestBody)});
    const json = await resp.json();
    if (resp.ok) { return json; };
    M.toast({ html: `${formFactor.formFactor}: ${json.error.message}`, classes: 'red darken-4 white-text'});
};

getData = async (origin) => {
    document.getElementById("loading").style.display = "block";
    const labeledMetrics = [];
    const request = [];
    const sum = await CrUXApiUtil.query({ origin: `https://${origin}/`}, {formFactor: "Sum"});
    const phone = await CrUXApiUtil.query({ origin: `https://${origin}/`, formFactor: "PHONE"}, {formFactor: "Phone"} );
    const desktop = await CrUXApiUtil.query({ origin: `https://${origin}/`, formFactor: "DESKTOP"},{formFactor: "Desktop"});
    const tablet = await CrUXApiUtil.query({ origin: `https://${origin}/`, formFactor: "TABLET"},{formFactor: "Tablet"});

    // chec if data is undefined
    if (sum !== undefined){request.push(sum)};
    if (phone !== undefined){request.push(phone)};
    if (desktop !== undefined){request.push(desktop)};
    if (tablet !== undefined){request.push(tablet)};
    if (!request.length){document.getElementById("loading").style.display = "none"; throw new Error(`no crux data for ${origin}`); }

    process(request, origin);
}

function process(formFactor, origin) {
    const labeledMetrics = [];
    formFactor.forEach( formFactor => {
        const validData = labelMetricData(formFactor.record.metrics, formFactor.record.key.formFactor);
        labeledMetrics.push(validData);
    })
    const data = buildCard(labeledMetrics, origin);
}

function buildCard(labeledMetrics, origin) {
    const favicon  = `https://${origin}/favicon.ico`
    let filter = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
    let siteName = filter.split('.').join("-")
    let sumId = `${siteName}SUM`;
    let phoneId = `${siteName}PHONE`;
    let desktopId = `${siteName}DESKTOP`;
    let tabletId = `${siteName}TABLET`;
    let card = `
        <div class="card" id="${siteName}"><div class="cardHeader">
            <img aria-label="${siteName} logo" src="${favicon}">
            <span>${siteName}</span>
        </div>
        <div id="cardBody" class="row">
        <div class="col s12">
            <ul class="tabs">
                <li class="tab col s3"><a href="#${sumId}">Sum</a></li>
                <li class="tab col s3"><a class="active" href="#${phoneId}">Mobile</a></li>
                <li class="tab col s3"><a href="#${desktopId}">Desktop</a></li>
                <li class="tab col s3"><a href="#${tabletId}">Tablet</a></li>
            </ul>
        </div>
        <div id="${sumId}" class="col s12"><div class="metrics"></div></div>
        <div id="${phoneId}" class="col s12"><div class="metrics"></div></div>
        <div id="${desktopId}" class="col s12"><div class="metrics"></div></div>
        <div id="${tabletId}" class="col s12"><div class="metrics"></div></div>
        </div>
    `; document.getElementById('app').insertAdjacentHTML("afterbegin", card);
    labeledMetrics.forEach ( formFactor => {
        buildData(formFactor, siteName);
    })

    var el = document.querySelectorAll('.tabs');
    var instance = M.Tabs.init(el, {});

    document.getElementById("loading").style.display = "none";

//    var noData = `<p class="nodata">No data</p>`;
//    let checkMetrics = document.querySelectorAll(".metrics");
//    checkMetrics.forEach( metrics => {
//        if(metrics.hasChildNodes()){return}
//        document.querySelector(`.metrics`).insertAdjacentHTML("beforeend", noData)
//    })

}

function buildData(labeledMetrics, siteName) {
        labeledMetrics.forEach( metric => {
        var finalData = {key:"", acronym:"", good:"", ok:"", poor:""}
        finalData.key = siteName + metric.key;
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
        `;document.querySelector(`#${finalData.key} .metrics`).insertAdjacentHTML("beforeend", htmlBar);
    });
}

function labelMetricData(metrics, key) {
    if(key === undefined){key = "SUM"};
    console.log(key);
    const nameToAcronymMap = {
        first_contentful_paint: 'FCP',
        largest_contentful_paint: 'LCP',
        first_input_delay: 'FID',
        cumulative_layout_shift: 'CLS',
    };
    return Object.entries(metrics).map(([metricName, metricData]) => {
        const standardBinLabels = ['good', 'needs improvement', 'poor'];
        const metricBins = metricData.histogram;
        const labeledBins = metricBins.map((bin, i) => {
            return {
                label: standardBinLabels[i],
                percentage: bin.density * 100,
                ...bin,
            };
        });
        return {
            key: key,
            acronym: nameToAcronymMap[metricName],
            name: metricName,
            labeledBins,
        };
    });
}

// on page load, load google site metrics as an example.
getData('www.google.com');

