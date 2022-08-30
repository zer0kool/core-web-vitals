const CrUXApiOrigin = {};
//CrUXApiOrigin.KEY = 'AIzaSyCv-IHj-oddickRMsoI5UBAJx3Cwj-mwck';
CrUXApiOrigin.KEY = 'AIzaSyABFb0DrX8sAZ3867SAjpimUP-lxZ6yjuA';
const endpointOrigin = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
var url = `${endpointOrigin}?key=${CrUXApiOrigin.KEY}`;
var app = document.querySelector('#cruxorigin #app');
var toastHTML = '<span>Data already exist on screen</span><button class="btn-flat toast-action">ok</button>';
var noData = `<p class="nodata">No data</p>`;

document.querySelector('#cruxorigin form').addEventListener('submit', function (e) {
  e.preventDefault();
  let origin = document.querySelector('#cruxorigin #search').value.toLowerCase().replace(/^(?:https?:\/\/)/i, "").split('/')[0];;
//  let siteName = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
  let siteName = origin.replace(/^www\./, '').split('.').join('-');
  if (!siteName) {return}
  if (siteName.match(/^\d/)) {siteName = `N${siteName}`}
  let child = document.querySelector(`#${siteName}`);
  if (app.contains(child)) { M.toast({html: toastHTML});
  } else {
    M.toast({
      html: `Building a request to the API.`,
      classes: 'green',
      displayLength: 600
    });
    getOriginData(origin);
  }
})

CrUXApiOrigin.query = async function (requestBody, formFactor) {
  const resp = await fetch(url, {method: 'POST',body: JSON.stringify(requestBody)});
  const json = await resp.json();
  console.log(json);
  if (resp.ok) {return json;};
  M.toast({
    html: `${formFactor.formFactor}: ${json.error.message}`,
    classes: 'red darken-4 white-text',
    displayLength: 480
  });
};

getOriginData = async (origin) => {
  document.querySelector("#cruxorigin #loading").style.display = "block";
  const request = [];

	const sum = await CrUXApiOrigin.query({origin: `https://${origin}/`, effectiveConnectionType: ""}, {formFactor: "Sum"});
  const phone = await CrUXApiOrigin.query({origin: `https://${origin}/`,formFactor: "PHONE", effectiveConnectionType: ""}, {formFactor: "Phone"});
  const desktop = await CrUXApiOrigin.query({origin: `https://${origin}/`,formFactor: "DESKTOP", effectiveConnectionType: ""}, {formFactor: "Desktop"});
  const tablet = await CrUXApiOrigin.query({origin: `https://${origin}/`,formFactor: "TABLET", effectiveConnectionType: ""}, {formFactor: "Tablet"});

  // check if data is undefined
  if (sum !== undefined) {request.push(sum)};
  if (phone !== undefined) {request.push(phone)};
  if (desktop !== undefined) {request.push(desktop)};
  if (tablet !== undefined) {request.push(tablet)};
  if (!request.length) {
    document.querySelector("#cruxorigin #loading").style.display = "none";
    throw new Error(`no crux data for ${origin}`);
  }

  process(request, origin);
}

function process(formFactor, origin) {
  const labeledMetrics = [];
  formFactor.forEach(formFactor => {
    const validData = labelMetricData(formFactor.record.metrics, formFactor.record.key.formFactor);
    labeledMetrics.push(validData);
  })
  const data = buildCard(labeledMetrics, origin);
}

function buildCard(labeledMetrics, origin) {
  const favicon = `https://${origin}/favicon.ico`
  let filter = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
  let filter2 = origin.replace(/^www\./, '').split('.').join('-');
  let siteName = filter2.split('.').join("-")
  let cardTitle = filter.split('.').join("-")
  if (siteName.match(/^\d/)) {
    siteName = `N${siteName}`
  }
  let sumId = `${siteName}SUM`;
  let phoneId = `${siteName}PHONE`;
  let desktopId = `${siteName}DESKTOP`;
  let tabletId = `${siteName}TABLET`;
  let card = `
        <div class="card originData" id="${siteName}">
						<i class="activator material-icons right">call_to_action</i>
            <div class="cardHeader">
                <img class="activator" aria-label="${siteName} logo" src="${favicon}">
                <span data-title="${origin}">${cardTitle}</span>
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
			  <div class="card-reveal">
					<span class="close">remove card</span>
					<span class="card-title grey-text text-darken-4">Crux settings<i class="material-icons right">close</i></span>
					<p>If the effective connection type is unspecified, then aggregated data over all effective connection types will be returned.</p>

					<!-- 3G connectivity -->
					<p>Filter 3G connection bucket</p>
					<div class="switch">
						<label>
							Off
							<input type="checkbox">
							<span class="lever"></span>
							On
						</label>
					</div>
					<!-- 4G connectivity -->
					<p>Filter 4G connection bucket</p>
					<div class="switch">
						<label>
							Off
							<input type="checkbox">
							<span class="lever"></span>
							On
						</label>
					</div>
				</div>
    `;
  document.querySelector('#cruxorigin #app').insertAdjacentHTML("afterbegin", card);
  labeledMetrics.forEach(formFactor => {
    buildData(formFactor, siteName);
  })
  let originTabs = document.querySelectorAll('.originData .tabs');
  let instance = M.Tabs.init(originTabs, {});
  let noData = `<p class="nodata">No data</p>`;
  let checkMetrics = document.querySelectorAll("#cruxorigin .metrics");
  checkMetrics.forEach(metrics => {
    let scopeId = metrics.parentNode.id;
    if (metrics.hasChildNodes()) {
      return
    };
    document.querySelector(`#cruxorigin #${scopeId} .metrics`).insertAdjacentHTML("beforeend", noData);
  })
  document.querySelector("#cruxorigin #loading").style.display = "none";
  document.getElementById('search').value = '';
  document.querySelector(`#cruxorigin #${siteName} .close`).onclick = function () {
    removeCard()
  };

  function removeCard() {
    document.querySelector(`#cruxorigin #${siteName}`).remove();
  }
}

function buildData(labeledMetrics, siteName) {
  labeledMetrics.forEach(metric => {
    var finalData = {
      key: "",
      acronym: "",
      good: "",
      ok: "",
      poor: ""
    }
    finalData.key = siteName + metric.key;
    finalData.acronym = metric.acronym;
    finalData.name = metric.name;
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
        <div class="flex"><h2>${finalData.name}</h2>
        <div class="grid-container" style="grid-template-columns: ${finalData.good}% ${finalData.ok}% ${finalData.poor}%;">
                <div class="box-good" data-title="${finalData.good}% good"></div>
                <div class="box-needs-improvement" data-title="${finalData.ok}% needs improvement"></div>
                <div class="box-poor" data-title="${finalData.poor}% poor"></div>
        </section> </div>
        `;
    document.querySelector(`#cruxorigin #${finalData.key} .metrics`).insertAdjacentHTML("beforeend", htmlBar);
  });
}

function labelMetricData(metrics, key) {
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
      key: key,
      acronym: nameToAcronymMap[metricName],
      name: nameToFullNameMap[metricName],
      labeledBins,
    };
  });
}

// on page load, load google site metrics as an example.
getOriginData('www.google.com');
