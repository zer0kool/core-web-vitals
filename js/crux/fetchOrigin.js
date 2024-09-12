
const CrUXApiOrigin = {
    KEY: 'AIzaSyABFb0DrX8sAZ3867SAjpimUP-lxZ6yjuA',
};

const endpointOrigin = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CrUXApiOrigin.KEY}`;
const app = document.querySelector('#cruxorigin #app');

document.querySelector('#cruxorigin form').addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();
    const origin = getOriginFromInput();
    const siteName = formatSiteName(origin);

    if (!siteName) return;

    if (appContainsChild(siteName)) {
        M.toast({ html: '<span>Data already exist on screen</span><button class="btn-flat toast-action">ok</button>' });
    } else {
        M.toast({
            html: `Building a request to the API.`,
            classes: 'green',
            displayLength: 600
        });
        await getOriginData(origin);
        // Removed the call to getHistoricalData here
    }
}

function getOriginFromInput() {
    return document.querySelector('#cruxorigin #search').value.toLowerCase().replace(/^(?:https?:\/\/)/i, "").split('/')[0];
}

function formatSiteName(origin) {
    let siteName = origin.replace(/^www\./, '').split('.').join('-');
    return siteName.match(/^\d/) ? `N${siteName}` : siteName;
}

function appContainsChild(siteName) {
    return app.contains(document.querySelector(`#${siteName}`));
}

CrUXApiOrigin.query = async function (requestBody, formFactor) {
    const response = await fetch(endpointOrigin, { method: 'POST', body: JSON.stringify(requestBody) });
    const json = await response.json();
    console.log("origin \n", json);

    if (response.ok) {
        return json;
    }

    M.toast({
        html: `${formFactor.formFactor}: ${json.error.message}`,
        classes: 'red darken-4 white-text',
        displayLength: 480
    });
};

async function getOriginData(origin, network = "") {
    document.querySelector("#cruxorigin #loading").style.display = "block";
    const requests = await Promise.all([
        CrUXApiOrigin.query({ origin: `https://${origin}/`, effectiveConnectionType: network }, { formFactor: "Sum" }),
        CrUXApiOrigin.query({ origin: `https://${origin}/`, formFactor: "PHONE", effectiveConnectionType: network }, { formFactor: "Phone" }),
        CrUXApiOrigin.query({ origin: `https://${origin}/`, formFactor: "DESKTOP", effectiveConnectionType: network }, { formFactor: "Desktop" }),
        CrUXApiOrigin.query({ origin: `https://${origin}/`, formFactor: "TABLET", effectiveConnectionType: network }, { formFactor: "Tablet" }),
    ]);

    const validRequests = requests.filter(request => request !== undefined).map((request, index) => ({
        ...request,
        formFactor: ["Sum", "Phone", "Desktop", "Tablet"][index]
    }));

    if (!validRequests.length) {
        document.querySelector("#cruxorigin #loading").style.display = "none";
        throw new Error(`no crux data for ${origin}`);
    }

    console.log(validRequests);
    process(validRequests, origin);
}

function process(formFactor, origin) {
	const labeledMetrics = [];
	formFactor.forEach(formFactor => {
		const validData = labelMetricData(formFactor.record.metrics, formFactor.record.key.formFactor);
		labeledMetrics.push(validData);
	})
	console.log(labeledMetrics)
	let network = formFactor[0].record.key.effectiveConnectionType;
	let dates = { first: formFactor[0].record.collectionPeriod.firstDate, last: formFactor[0].record.collectionPeriod.lastDate };
	const data = buildCard(labeledMetrics, origin, network, dates);
}

function extractDomainName(origin) {
	return origin.replace(/^https?:\/\//, '').split('.')[1];
}

function buildCard(labeledMetrics, origin, network, dates) {
	network = network ?? "default";
	const favicon = `https://${origin}/favicon.ico`;
	const siteName = formatSiteName(origin);
	const cardTitle = formatCardTitle(origin);
	const { sumId, phoneId, desktopId, tabletId } = generateIds(siteName, network);
	const domainName = extractDomainName(origin); // Ensure domainName is defined here

	if (network === "default") {
		const card = createDefaultCard(cardTitle, favicon, siteName, sumId, phoneId, desktopId, tabletId, dates, origin, domainName); // Pass domainName to createDefaultCard
		document.querySelector('#cruxorigin #app').insertAdjacentHTML("afterbegin", card);
		setupRemoveCardAction(siteName);
		document.querySelector("#cruxorigin #loading").style.display = "none";
	} else {
		const networkDATA = createNetworkData(network, sumId, phoneId, desktopId, tabletId);
		document.querySelector(`#cruxorigin #${siteName} #cardBody`).insertAdjacentHTML("afterbegin", networkDATA);
		document.querySelector("#cruxorigin #loading").style.display = "none";
	}

	labeledMetrics.forEach(formFactor => { buildData(formFactor, siteName, network); });
	initializeTabs(siteName);
	handleNoDataMetrics(siteName);
	// setupNetworkSettings(siteName, origin);
	buildModal(origin);

	// Add event listener for the historical data button
	document.querySelector(`#cruxorigin #${siteName} .loadHistory`).addEventListener('click', function() {
		setTimeout(() => {
			getHistoricalData(origin);
		}, 300); // Delay the call to getHistoricalData by 300 milliseconds
	});
}

// Helper Functions
function formatSiteName(origin) {
	let filter = origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
	let filter2 = origin.replace(/^www\./, '').split('.').join('-');
	let siteName = filter2.split('.').join("-");
	if (siteName.match(/^\d/)) { siteName = `N${siteName}`; }
	return siteName;
}

function formatCardTitle(origin) {
	return origin.replace(/^www\./, '').split('.').slice(0, -1).join('.');
}

function generateIds(siteName, network) {
	return {
		sumId: `${siteName}SUM${network}`,
		phoneId: `${siteName}PHONE${network}`,
		desktopId: `${siteName}DESKTOP${network}`,
		tabletId: `${siteName}TABLET${network}`
	};
}

function formatDate(date) {
	return new Date(`${date.year}-${date.month}-${date.day}`).toLocaleString('default', { month: 'long' }) + ` ${date.day}, ${date.year}`;
}

function createDefaultCard(cardTitle, favicon, siteName, sumId, phoneId, desktopId, tabletId, dates, origin, domainName) {
	let idchart = origin.replace(/^https?:\/\//, '').replace(/\./g, '').replace(/^www/, 'www').replace(/^amp/, 'amp');
	return `
		<div class="card originData" id="${siteName}">
			<i class="activator material-icons right">call_to_action</i>
			<div class="cardHeader">
				<img class="activator" aria-label="${siteName} logo" src="${favicon}" />
				<span data-title="${origin}">${cardTitle}</span>
			</div>
			<div id="cardBody">
				<div id="network" data-type="default" class="default row active">
					<span class="networkType">Effective connection type: unspecified</span>
					<div class="col s12">
						<ul class="tabs">
							<li class="tab col s3"><a href="#${sumId}">Overall</a></li>
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
				<span class="date">Aggregated from ${formatDate(dates.first)} to ${formatDate(dates.last)}</span>
			</div>
			<div class="card-reveal">
				<span class="close">Remove this card</span>
				<span class="card-title grey-text text-darken-4">CRUX Settings<i class="material-icons right">close</i></span>
				<p>When the effective connection type is unspecified, aggregated data from all connection types will be displayed for a comprehensive overview.</p>

				<div class="history">
					<p>Explore the historical core web vitals trends for ${origin} from the last 6 months. This data is updated weekly and reflects the overall performance across all connection types.</p>
					<div class="center container">
						<a data-origin="${origin}" class="btn modal-trigger loadHistory" href="#${idchart}Chart"> View Historical Chart </a>
					</div>
				</div>
				<div class="periodDate">
					<p>This card displays aggregated data from</p>
					<span class="firstDate">${formatDate(dates.first)}</span> to <span class="lastDate">${formatDate(dates.last)}</span>
				</div>
			</div>
		</div>
	`;
}

function createNetworkFilters() {
	return `
		<p>Filter 3G connection bucket</p>
		<div class="switch n3g">
			<label>
				Off
				<input type="checkbox" />
				<span class="lever"></span>
				On
			</label>
		</div>
		<p>Filter 4G connection bucket</p>
		<div class="switch n4g">
			<label>
				Off
				<input type="checkbox" />
				<span class="lever"></span>
				On
			</label>
		</div>
	`;
}

function setupRemoveCardAction(siteName) {
	document.querySelector(`#cruxorigin #${siteName} .close`).onclick = function () { removeCard(siteName); };
}

function removeCard(siteName) {
	document.querySelector(`#cruxorigin #${siteName}`).remove();
}

function createNetworkData(network, sumId, phoneId, desktopId, tabletId) {
	return `
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
			<div id="${sumId}" class="col s12"><div class="metrics"></div></div>
			<div id="${phoneId}" class="col s12"><div class="metrics"></div></div>
			<div id="${desktopId}" class="col s12"><div class="metrics"></div></div>
			<div id="${tabletId}" class="col s12"><div class="metrics"></div></div>
		</div>
	`;
}

function initializeTabs(siteName) {
	let originTabs = document.querySelectorAll(`#cruxorigin #${siteName} .tabs`);
	M.Tabs.init(originTabs, {});
}

function handleNoDataMetrics(siteName) {
	let noData = `<p class="nodata">No data</p>`;
	let checkMetrics = document.querySelectorAll(`#cruxorigin #${siteName} .metrics`);
	checkMetrics.forEach(metrics => {
		let scopeId = metrics.parentNode.id;
		if (!metrics.hasChildNodes()) {
			document.querySelector(`#cruxorigin #${scopeId} .metrics`).insertAdjacentHTML("beforeend", noData);
		}
	});
}

function setupNetworkSettings(siteName, origin) {
	const network_settings = {
		networkRows: document.querySelectorAll(`#cruxorigin #${siteName} #network`),
		networkData: function (network) {
			let cardBody = document.querySelector(`#cruxorigin #${siteName}`);
			let netData = document.querySelector(`#cruxorigin #${siteName} div[data-type="${network}"]`);
			return { exits: cardBody.contains(netData), element: netData };
		},
		networkToggle: function (network, enable) {
			let el = document.querySelector(`#cruxorigin #${siteName} div[data-type="${network}"]`);
			el.classList.toggle('active', enable);
			el.classList.toggle('hide', !enable);
		},
		networkActiveRows: function () {
			document.querySelectorAll(`#cruxorigin #${siteName} #cardBody > .active`).forEach(row => {
				row.classList.remove('active');
				row.classList.add('hide');
			});
		},
		setDefault: function (network) {
			this.networkToggle(network, true);
		}
	};

	setupNetworkActions(network_settings, siteName, origin);
}

function setupNetworkActions(network_settings, siteName, origin) {
	['3G', '4G'].forEach(network => {
		document.querySelector(`#cruxorigin #${siteName} .n${network.toLowerCase()} input`).onclick = function () {
			handleNetworkToggle(network, network_settings, siteName, origin);
		};
	});
}

function handleNetworkToggle(network, network_settings, siteName, origin) {
	let _Data = network_settings.networkData(network);
	let status_3g = document.querySelector(`#cruxorigin #${siteName} > div.card-reveal > div.switch.n3g > label > input[type=checkbox]`).checked;
	let status_4g = document.querySelector(`#cruxorigin #${siteName} > div.card-reveal > div.switch.n4g > label > input[type=checkbox]`).checked;

	if (!status_3g && !status_4g) {
		network_settings.networkToggle(network, false);
		network_settings.setDefault('default');
		return;
	}

	if (network === '3G') {
		if (status_3g) {
			status_4g = false; // Uncheck 4G when 3G is checked
			document.querySelector(`#cruxorigin #${siteName} > div.card-reveal > div.switch.n4g > label > input[type=checkbox]`).checked = false;
		}
	} else if (network === '4G') {
		if (status_4g) {
			status_3g = false; // Uncheck 3G when 4G is checked
			document.querySelector(`#cruxorigin #${siteName} > div.card-reveal > div.switch.n3g > label > input[type=checkbox]`).checked = false;
		}
	}

	network_settings.networkActiveRows();
	if (!_Data.exits) {
		getOriginData(`${origin}`, network);
	} else {
		network_settings.networkToggle(network, true);
	}
}

function buildData(labeledMetrics, siteName, network) {
	labeledMetrics.forEach(metric => {
		const finalData = createFinalData(metric, siteName, network);
		const htmlBar = generateHtmlBar(finalData);
		document.querySelector(`#cruxorigin #${finalData.key} .metrics`).insertAdjacentHTML("beforeend", htmlBar);
	});
}

function createFinalData(metric, siteName, network) {
	return {
		key: `${siteName}${metric.key}${network}`,
		acronym: metric.acronym,
		name: metric.name,
		good: metric.labeledBins[0].percentage.toFixed(2),
		ok: metric.labeledBins[1].percentage.toFixed(2),
		poor: metric.labeledBins[2].percentage.toFixed(2)
	};
}

function generateHtmlBar(finalData) {
	return `
		<section class="${finalData.acronym}">
			<div class="labels">
				<span class="good"><i class="material-icons">sentiment_very_satisfied</i>${finalData.good}%</span>
				<span class="ok"><i class="material-icons">sentiment_neutral</i>${finalData.ok}%</span>
				<span class="poor"><i class="material-icons">sentiment_very_dissatisfied</i>${finalData.poor}%</span>
			</div>
			<div class="flex">
				<h2>${finalData.name}</h2>
				<div class="grid-container" style="grid-template-columns: ${finalData.good}% ${finalData.ok}% ${finalData.poor}%;">
					<div class="box-good" data-title="${finalData.good}% good"></div>
					<div class="box-needs-improvement" data-title="${finalData.ok}% needs improvement"></div>
					<div class="box-poor" data-title="${finalData.poor}% poor"></div>
				</div>
			</div>
		</section>
	`;
}

function labelMetricData(metrics, key) {
	if (key === undefined) { key = "SUM" };

	const nameToFullNameMap = {
		first_contentful_paint: 'First Contentful Paint (FCP)',
		largest_contentful_paint: 'Largest Contentful Paint (LCP)',
		first_input_delay: 'First Input Delay (FID)',
		cumulative_layout_shift: 'Cumulative Layout Shift (CLS)',
		interaction_to_next_paint: 'Interaction to Next Paint (INP)',
		experimental_time_to_first_byte: 'Experimental Time to First Byte (TTFB)',
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

		// Check if metricBins is defined before using map
		const labeledBins = metricBins ? metricBins.map((bin, i) => {
			return {
				label: standardBinLabels[i],
				percentage: bin.density ? bin.density * 100 : 0,
				...bin,
			};
		}) : [];

		return {
			key: key,
			acronym: nameToAcronymMap[metricName],
			name: nameToFullNameMap[metricName],
			labeledBins,
		};
	}).filter(metric => metric.acronym !== undefined && metric.name !== undefined); // Ensure only valid metrics are returned
}

// on page load, load google site metrics as an example.
getOriginData('www.google.com').then(results => {
	// Removed the call to getHistoricalData here
})
