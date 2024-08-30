const CrUXApiUtil = {};
CrUXApiUtil.KEY = 'AIzaSyABFb0DrX8sAZ3867SAjpimUP-lxZ6yjuA';
//CrUXApiUtil.KEY = 'AIzaSyCmKGAAlWrPWC8-hin3sJclK8A8Kcb1zLs';
const endpointUrl = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
var url = `${endpointUrl}?key=${CrUXApiUtil.KEY}`;
var appUrl = document.querySelector('#cruxurl #app');
var toastHTML = '<span>Data already exist on screen</span><button class="btn-flat toast-action">ok</button>';
var noData = `<p class="nodata">No data</p>`;
var networks = ['3G', '4G'];

document.querySelector('#cruxurl form').addEventListener('submit', function (e) {
	e.preventDefault();
	let origin = document.querySelector('#cruxurl #fetch').value.toLowerCase().replace(/^(?:https?:\/\/)/i, "");
	let siteName = origin.split('/')[0].replace(/^www\./, '').split('.').slice(0, -1).join('.');
	var pageType = document.querySelector('.pagetype').value.toLowerCase().replace(/\s+/g, '');
	let childCard = siteName.split('.').join("-") + pageType;
	let child = document.querySelector(`#${childCard}`);
	if (appUrl.contains(child)) {
		M.toast({ html: toastHTML });
	} else {
		M.toast({ html: `Building a request to the API.`, classes: 'green', displayLength: 600 });
		getURLData(origin, pageType);
	}
})

CrUXApiUtil.query = async function (requestBody, formFactor) {
	const resp = await fetch(url, { method: 'POST', body: JSON.stringify(requestBody) });
	const json = await resp.json();
	// console.log(json);
	if (resp.ok) { return json; };
	M.toast({ html: `${formFactor.formFactor}: ${json.error.message}`, classes: 'red darken-4 white-text', displayLength: 480 });
};

getURLData = async (origin, pageType, network) => {
	document.querySelector("#cruxurl #loading").style.display = "block";
	const request = [];
	network = network ?? "";
	const sum = await CrUXApiUtil.query({ url: `https://${origin}`, effectiveConnectionType: `${network}` }, { formFactor: "Sum" });
	const phone = await CrUXApiUtil.query({ url: `https://${origin}`, formFactor: "PHONE", effectiveConnectionType: `${network}` }, { formFactor: "Phone" });
	const desktop = await CrUXApiUtil.query({ url: `https://${origin}`, formFactor: "DESKTOP", effectiveConnectionType: `${network}` }, { formFactor: "Desktop" });
	const tablet = await CrUXApiUtil.query({ url: `https://${origin}`, formFactor: "TABLET", effectiveConnectionType: `${network}` }, { formFactor: "Tablet" });

	// check if data is undefined
	if (sum !== undefined) { request.push(sum) };
	if (phone !== undefined) { request.push(phone) };
	if (desktop !== undefined) { request.push(desktop) };
	if (tablet !== undefined) { request.push(tablet) };
	if (!request.length) { document.querySelector("#cruxurl #loading").style.display = "none"; throw new Error(`no crux data for ${origin}`); }

	processURLData(request, origin, pageType);
}

function processURLData(formFactor, origin, pageType) {
	const labeledMetrics = [];
	formFactor.forEach(formFactor => {
		const validData = labelMetricData(formFactor.record.metrics, formFactor.record.key.formFactor);
		labeledMetrics.push(validData);
	})

	let network = formFactor[0].record.key.effectiveConnectionType;
	let dates = { first: formFactor[0].record.collectionPeriod.firstDate, last: formFactor[0].record.collectionPeriod.lastDate };
	const data = buildUrlCardData(labeledMetrics, origin, pageType, network, dates);
}

function buildUrlCardData(labeledMetrics, origin, pageType, network, dates) {
	network = network ?? "default";
	const favicon = `https://${origin}/favicon.ico`;
	let filter = origin.split('/')[0].replace(/^www\./, '').split('.').slice(0, -1).join('.');
	let pageName = filter.split('.').join("-")
	let cardTitle = pageType;
	let siteName = pageName + pageType;
	if (siteName.match(/^\d/)) { siteName = `N${siteName}` }
	let sumId = `${siteName}SUM${network}`;
	let phoneId = `${siteName}PHONE${network}`;
	let desktopId = `${siteName}DESKTOP${network}`;
	let tabletId = `${siteName}TABLET${network}`;
	let date = Date();
	if (network === "default") {
		let card = `
			<div class="card urlData" id="${siteName}">
				<i class="activator material-icons right">call_to_action</i>
				<div class="cardHeader">
					<img class="activator" aria-label="${siteName} logo" src="${favicon}">
					<span data-title="${origin}">${cardTitle}</span>
				</div>
				<div id="cardBody">
					<div id="network" data-type="${network}" class="${network} row active">
						<span class="networkType">effective connection type is unspecified</span>
						<div class="col s12">
							<ul class="tabs">
								<li class="tab col s3"><a href="#${sumId}">Sum</a></li>
								<li class="tab col s3"><a class="active" href="#${phoneId}">Mobile</a></li>
								<li class="tab col s3"><a href="#${desktopId}">Desktop</a></li>
								<li class="tab col s3"><a href="#${tabletId}">Tablet</a></li>
							</ul>
						</div>
						<div id="${sumId}" class="col s12">
							<div class="metrics"></div>
						</div>
						<div id="${phoneId}" class="col s12">
							<div class="metrics"></div>
						</div>
						<div id="${desktopId}" class="col s12">
							<div class="metrics"></div>
						</div>
						<div id="${tabletId}" class="col s12">
							<div class="metrics"></div>
						</div>
					</div>
					<span class="date">
						collection period: ${dates.first.month}-${dates.first.day}-${dates.first.year} to
						${dates.last.month}-${dates.last.day}-${dates.last.year}
					</span>
				</div>
				<div class="card-reveal">
					<span class="close">remove card</span>
					<span class="card-title grey-text text-darken-4">Crux settings<i class="material-icons right">close</i></span>
					<p>If the effective connection type is unspecified, then aggregated data over all effective connection types
						will be returned.</p>

					<div class="periodDate">
						<p>
							The aggregated data on this card is from </p>
						<span class="firstDate">${dates.first.month}-${dates.first.day}-${dates.first.year}</span> to
						<span class="lastDate">${dates.last.month}-${dates.last.day}-${dates.last.year}</span>
					</div>

					<!-- 3G connectivity -->
					<p>Filter 3G connection bucket</p>
					<div class="switch n3g">
						<label>
							Off
							<input data-card="${siteName}" type="checkbox">
							<span class="lever"></span>
							On
						</label>
					</div>
					<!-- 4G connectivity -->
					<p>Filter 4G connection bucket</p>
					<div class="switch n4g">
						<label>
							Off
							<input data-card="${siteName}" type="checkbox">
							<span class="lever"></span>
							On
						</label>
					</div>
				</div>
			</div>
			`;

		document.querySelector('#cruxurl #app').insertAdjacentHTML("afterbegin", card);

		// Action: remove card
		document.querySelector(`#cruxurl #${siteName} .close`).onclick = function () { removeCard() };
		function removeCard() { document.querySelector(`#cruxurl #${siteName}`).remove(); }

	} else {
		let networkDATA = `
			<div id="network" data-type="${network}" class="${network} row active">
				<span class="networkType">effective connection type is ${network}</span>
				<div class="col s12">
					<ul class="tabs">
						<li class="tab col s3"><a href="#${sumId}">Sum</a></li>
						<li class="tab col s3"><a class="active" href="#${phoneId}">Mobile</a></li>
						<li class="tab col s3"><a href="#${desktopId}">Desktop</a></li>
						<li class="tab col s3"><a href="#${tabletId}">Tablet</a></li>
					</ul>
				</div>
				<div id="${sumId}" class="col s12">
					<div class="metrics"></div>
				</div>
				<div id="${phoneId}" class="col s12">
					<div class="metrics"></div>
				</div>
				<div id="${desktopId}" class="col s12">
					<div class="metrics"></div>
				</div>
				<div id="${tabletId}" class="col s12">
					<div class="metrics"></div>
				</div>
			</div>
			`;
		document.querySelector(`#cruxurl #${siteName} #cardBody`).insertAdjacentHTML("afterbegin", networkDATA);
	}
	labeledMetrics.forEach(formFactor => {
		buildURLData(formFactor, siteName, network);
	})
	let urlTabs = document.querySelectorAll('.urlData .tabs');
	M.Tabs.init(urlTabs, {});

	let noData = `<p class="nodata">No data</p>`;
	let checkMetrics = document.querySelectorAll("#cruxurl .metrics");

	checkMetrics.forEach(metrics => {
		let scopeId = metrics.parentNode.id;
		if (metrics.hasChildNodes()) { return };
		// This can return a null we need a safety net here. rv9.5.2022 @alex
		document.querySelector(`#cruxurl #${scopeId} .metrics`).insertAdjacentHTML("beforeend", noData);
	})

	const network_settings = {
		networkRows: document.querySelectorAll(`#cruxurl #${siteName} #network`),
		networkData: function (network) {
			let cardBody = document.querySelector(`#cruxurl #${siteName}`);
			let netData = document.querySelector(`#cruxurl #${siteName} div[data-type="${network}"]`);
			return {
				exits: cardBody.contains(netData),
				element: netData
			};
		},
		networkToggleEnable: function (network) {
			let el = document.querySelector(`#cruxurl #${siteName} div[data-type="${network}"]`);
			el.classList.add('active');
			if (el.classList.contains('hide')) {
				el.classList.remove('hide')
			}

		},
		networkToggleDisable: function (network) {
			document.querySelector(`#cruxurl #${siteName} div[data-type="${network}"]`).classList.remove('active');
			document.querySelector(`#cruxurl #${siteName} div[data-type="${network}"]`).classList.add('hide');
		},
		networkActiveRows: function () {
			let activeRows = document.querySelectorAll(`#cruxurl #${siteName} #cardBody > .active`);
			activeRows.forEach(row => {
				row.classList.remove('active');
				row.classList.add('hide')
			})
		},
		setDefault: function (network) {
			document.querySelector(`#cruxurl #${siteName} div[data-type="${network}"]`).classList.add('active');
			document.querySelector(`#cruxurl #${siteName} div[data-type="${network}"]`).classList.remove('hide');
		}
	}


	//Action: fetch 3g stats
	document.querySelector(`#cruxurl #${siteName} .n3g input`).onclick = function () {
		n3g()
	};

	function n3g() {
		let _Data = network_settings.networkData('3G');
		let status_3g = document.querySelector(`#cruxurl #${siteName} > div.card-reveal > div.switch.n3g > label > input[type=checkbox]`).checked;
		let status_4g = document.querySelector(`#cruxurl #${siteName} > div.card-reveal > div.switch.n4g > label > input[type=checkbox]`);
		if (!status_3g && !status_4g.checked) {
			network_settings.networkToggleDisable('3G');
			network_settings.setDefault('default')
		}
		if (status_3g && status_4g.checked) {
			status_4g.checked = false
		}
		if (status_3g && !_Data.exits) {
			network_settings.networkActiveRows();
			getURLData(`${origin}`, pageType, '3G');
		}
		if (status_3g && _Data.exits) {
			network_settings.networkActiveRows();
			network_settings.networkToggleEnable('3G');
		}
	}



	//Action: fetch 4g stats
	document.querySelector(`#cruxurl #${siteName} .n4g input`).onclick = function () {
		n4g()
	};

	function n4g() {
		let _Data = network_settings.networkData('4G');
		let status_3g = document.querySelector(`#cruxurl #${siteName} > div.card-reveal > div.switch.n3g > label > input[type=checkbox]`);
		let status_4g = document.querySelector(`#cruxurl #${siteName} > div.card-reveal > div.switch.n4g > label > input[type=checkbox]`).checked;
		if (!status_4g && !status_3g.checked) {
			network_settings.networkToggleDisable('4G');
			network_settings.setDefault('default')
		}
		if (status_4g && status_3g.checked) {
			status_3g.checked = false
		};
		if (status_4g && !_Data.exits) {
			network_settings.networkActiveRows();
			getURLData(`${origin}`, pageType, '4G');
			status_3g = false;
		}
		if (status_4g && _Data.exits) {
			network_settings.networkActiveRows();
			network_settings.networkToggleEnable('4G');
			status_3g = false;
		}
	}

	document.querySelector("#cruxurl #loading").style.display = "none";
	document.getElementById('search').value = '';
}

function buildURLData(labeledMetrics, siteName, network) {
	labeledMetrics.forEach(metric => {
		var finalData = { key: "", acronym: "", good: "", ok: "", poor: "" }
		finalData.key = siteName + metric.key + network;
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
			<div class="flex">
				<h2>${finalData.name}</h2>
				<div class="grid-container"
					style="grid-template-columns: ${finalData.good}% ${finalData.ok}% ${finalData.poor}%;">
					<div class="box-good" data-title="${finalData.good}% good"></div>
					<div class="box-needs-improvement" data-title="${finalData.ok}% needs improvement"></div>
					<div class="box-poor" data-title="${finalData.poor}% poor"></div>
				</div>
			</div>
		</section>
        `; document.querySelector(`#cruxurl #${finalData.key} .metrics`).insertAdjacentHTML("beforeend", htmlBar);
	});
}

function labelMetricData(metrics, key) {
    	if ("form_factors" in metrics ) {delete metrics["form_factors"]};
	if ("navigation_types" in metrics ) {delete metrics["navigation_types"]};
	if ("round_trip_time" in metrics ) {delete metrics["round_trip_time"]};
	if (key === undefined) {key = "SUM"};

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
			key: key,
			acronym: nameToAcronymMap[metricName],
			name: nameToFullNameMap[metricName],
			labeledBins,
		};
	});
}

// on page load, load google site metrics as an example.
// Using setTimeout to defer the execution of getURLData, allowing the page to load other resources first
setTimeout(() => getURLData('www.google.com', 'Google'), 500);
//scheduler.postTask(getURLData('www.google.com', 'Google'), {priority: 'background'});
