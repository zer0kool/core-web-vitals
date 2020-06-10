var apiKey = "API_KEY";
const CrUXApiUtil = {};
CrUXApiUtil.KEY = 'AIzaSyBX3phN4IuKNtJkQrTeAL0lZL95kHUY08o';
var app = document.querySelector('#app');

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();

    var origin = document.getElementById('search').value.toLowerCase();
    var siteName = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');

    if (!siteName) { return }
    var child = document.querySelector(`#${siteName}`);

    // If a div inside the #root container holds a class with the username
    if (app.contains(child)) {
        // ..Then it exists as a child, let the user know.
        var toastHTML = '<span>Data already exist on screen</span><button class="btn-flat toast-action">ok</button>';
        M.toast({
            html: toastHTML
        });
    } else {
        M.toast({
            html: `Building a request to the API.`,
            classes: 'green',
            displayLength: 600
        })
        getData();
    }
})

//TODO: structure the response
CrUXApiUtil.query = async function (requestBody) {
    const endpointUrl = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
    const resp = await fetch(`${endpointUrl}?key=${CrUXApiUtil.KEY}`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
    });

    const json = await resp.json();
    console.log(json)
    if (!resp.ok) {
        M.toast({
            html: `${json.error.message}`,
            classes: 'red darken-4 white-text'
        })
        throw new Error(json.error.message);
    }
    return json;
};

// Gather the data for example.com and display it
//TODO re-build this using a template string
getData = async () => {
    var origin = document.getElementById('search').value.toLowerCase();
    var siteName = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
    const json = await CrUXApiUtil.query({
        origin: `https://${origin}/`
    });
    console.log('CrUX API response:', json);

    const labeledMetrics = labelMetricData(json.record.metrics);
    console.log(labeledMetrics)

    const card = document.createElement('div');
    card.classList.add('card');
    card.setAttribute('id', siteName);
    app.append(card);


    let cardHeader = `<div class="cardHeader">
                        <img src="https://${origin}/favicon.ico">
                        <span>${siteName}</span>
                     `

    document.getElementById('app').append(card);
    document.getElementById(siteName).insertAdjacentHTML("afterbegin", cardHeader);

    // Display metric results
    for (const metric of labeledMetrics) {
        const [descEl, barsEl] = createDescriptionAndBars(metric.labeledBins);
        let metrics = `<section class="${metric.acronym}">
                            <h2> ${metric.acronym} </h2>
                        </section>
                        `
        document.getElementById(siteName).insertAdjacentHTML("beforeend", metrics);
        document.querySelector(`#${siteName} .${metric.acronym}`).append(descEl)
        document.querySelector(`#${siteName} .${metric.acronym}`).append(barsEl)
    }
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

        // We assume there are 3 histogram bins and they're in order of: good => poor
        const labeledBins = metricBins.map((bin, i) => {
            // Assign a good/poor label, calculate a percentage, and add retain all existing bin properties
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

// This consumes the output from labelMetricData, not a raw API response.
function createDescriptionAndBars(labeledBins) {
    const descEl = document.createElement('p');
    // Example: 'good: 43.63%, needs improvement: 42.10%, poor: 14.27%'
    descEl.textContent = labeledBins

        .map(bin => `${bin.label}: ${bin.percentage.toFixed(2)}%`)
        .join(', ');

    let barsEl = document.createElement('div');

    for (const bin of labeledBins) {
        const barEl = document.createElement('div');

        // Reuse the label for the styling class, changing any spaces:  `needs improvement` => `needs-improvement`
        barEl.classList.add(`box-${bin.label.replace(' ', '-')}`);

        // Add tooltip to share the size of each bin
        barEl.title = `bin start: ${bin.start}, bin end: ${bin.end}`;
        barsEl.append(barEl);
    }

    // Set the width of the bar columns based on metric bins
    // Ex: `grid-template-columns: 43.51% 42.26% 14.23%`;
    barsEl.style.gridTemplateColumns = labeledBins.map(bin => `${bin.percentage}%`).join(' ');
    barsEl.classList.add(`grid-container`);

    return [descEl, barsEl];
}
