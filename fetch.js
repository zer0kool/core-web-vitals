const CrUXApiUtil = {};
CrUXApiUtil.KEY = 'AIzaSyBX3phN4IuKNtJkQrTeAL0lZL95kHUY08o';

const endpointUrl = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
var url = `${endpointUrl}?key=${CrUXApiUtil.KEY}`;
var app = document.querySelector('#app');
var toastHTML = '<span>Data already exist on screen</span><button class="btn-flat toast-action">ok</button>';

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var origin = document.getElementById('search').value.toLowerCase();
    var siteName = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
    if (!siteName) { return }
    var child = document.querySelector(`#${siteName}`);
    if (app.contains(child)) {
        M.toast({ html: toastHTML });
    } else {
        M.toast({
            html: `Building a request to the API.`,
            classes: 'green',
            displayLength: 600
        })
        getData(origin);
    }
})

CrUXApiUtil.query = async function (requestBody) {
    const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
    });
    const json = await resp.json();
    if (resp.ok) { return json; }
    M.toast({
        html: `${json.error.message}`,
        classes: 'red darken-4 white-text'
    })
    throw new Error(json.error.message);
};

getData = async (origin) => {
    const json = await CrUXApiUtil.query({ origin: `https://${origin}/` });
    console.log('CrUX API response:', json);
    const favicon  = `https://${origin}/favicon.ico`
    const labeledMetrics = labelMetricData(json.record.metrics);
    const data = buildCard(labeledMetrics, origin, favicon)
}

function buildCard(labeledMetrics, origin, favicon) {
    var siteName = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');

    let card = `
        <div class="card" id="${siteName}"><div class="cardHeader">
            <img src="${favicon}">
            <span>${siteName}</span>
        </div>
    `
    document.getElementById('app').insertAdjacentHTML("beforeend", card);
    labeledMetrics.forEach( metric => {
        const finalData = { acronym:"", good:"", ok:"", poor:""}
        finalData.acronym = metric.acronym;
        finalData.good = metric.labeledBins[0].percentage.toFixed(2);
        finalData.ok = metric.labeledBins[1].percentage.toFixed(2);
        finalData.poor = metric.labeledBins[2].percentage.toFixed(2);

        let htmlBar = `
        <section class="${finalData.acronym}">
        <h2>${finalData.acronym}</h2>
            <p>good: ${finalData.good}%, needs improvement: ${finalData.ok}%, poor: ${finalData.poor}%</p>
            <div class="grid-container" style="grid-template-columns: ${finalData.good}% ${finalData.ok}% ${finalData.poor}%;">
                <div class="box-good" data-title="${finalData.good}% good"></div>
                <div class="box-needs-improvement" data-title="${finalData.ok}% needs improvement"></div>
                <div class="box-poor" data-title="${finalData.poor}% poor"></div>
        </section>
        `
        document.querySelector(`#${siteName}`).insertAdjacentHTML("beforeend", htmlBar);
    });
}

function labelMetricData(metrics) {
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
            acronym: nameToAcronymMap[metricName],
            name: metricName,
            labeledBins,
        };
    });
}


