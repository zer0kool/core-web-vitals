const CrUXApiUtil = {};
CrUXApiUtil.KEY = 'AIzaSyCv-IHj-oddickRMsoI5UBAJx3Cwj-mwck';
const endpointUrl = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
var url = `${endpointUrl}?key=${CrUXApiUtil.KEY}`;
var app = document.querySelector('#app');
var noData = `<p class="nodata">No data</p>`;
