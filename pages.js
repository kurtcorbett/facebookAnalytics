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

var searchParams =  {
  since: '2015-01-01',
  until: '2015-01-02'
};

// CREATE ALL PAGES
createAllPagesInsights(fbPages, searchParams)
  .then(function(page) {
    console.log('-----------Done-----------');
  })
  .catch(function(err) {
    console.log('Error: ', new Error);
  });


function createAllPagesInsights(pages, params) {
  console.log('Creating page insights...');
  return when.map(pages, function(page) {
    return createInsights(page, params);
  }).catch(console.log);
}

function createInsights(page, date) {
  return getPageInsights(page, date)
    .then(function(insight) {
      console.log(page.page);
      savePageInsights(insight, page);
    });
}

function savePageInsights(insight, page) {
  return writeJson('./insights/' + page.page + '.json', insight);  
}

function getPageInsights(page, params) {
  return rp('https://graph.facebook.com/v2.3/' 
  + page.id + '/'
  + 'insights'
  + '?since=' + params.since
  + '&until=' + params.until
  + '&access_token=' + page.access_token)
    .then(function(data) {
      return JSON.parse(data);
    });
}