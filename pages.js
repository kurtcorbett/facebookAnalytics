var _                 = require('lodash')
  , rp                = require('request-promise')
  , when              = require('when')
  , nodefn            = require('when/node')
  , walk              = require('walkdir')
  , fs                = require('fs-extra')
  , fbPages           = require('./fbPages.js')
  , SITE_METRICS      = require('./siteMetricsSettings.js')
  
  
// promisify node async function
var writeJson = nodefn.lift(fs.writeJson);


// CREATE ALL PAGES
createAllPagesInsights(fbPages)
  .then(function(page) {
    console.log('-----------Done-----------');
  })
  .catch(function(err) {
   console.log(console.log('Error: ', new Error));
  });


function createAllPagesInsights() {
  console.log('Creating page insights...');
  return when.map(fbPages, createInsights);
}

function createInsights(page) {
  return getPageInsights(page)
    .then(function(insight) {
      console.log(page.page);
      savePageInsights(insight, page);
    });
}

function savePageInsights(insight, page) {
  return writeJson('./insights/' + page.page + '.json', insight);  
}

function getPageInsights(page) {
  return rp('https://graph.facebook.com/v2.3/' 
  + page.id + '/'
  + 'insights'
  + '?access_token=' + page.access_token)
    .then(function(data) {
      return JSON.parse(data);
    });
}