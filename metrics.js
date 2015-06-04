var _                 = require('lodash')
  , walk              = require('walkdir')
  , fs                = require('fs-extra')
  , SITE_METRICS      = require('./siteMetricsSettings.js')
  
  
var urlRegex = /(page[\w_\/]+)/gmi;

// saveSiteMetrics();

// function saveSiteMetrics() {
//   var siteMetrics = filterAllPagesInsights('./insights');
//   fs.writeJson('./siteMetrics.js', siteMetrics);  
//   console.log('done');
// }

module.exports = function() {
  return filterAllPagesInsights('./insights');
};

function filterAllPagesInsights(insightsDir) {
  var pagesMetrics = [];
  walk.sync(insightsDir, function(path,stat) {
    var site = path.match(/insights\/(.*?).json/)[1];
    var pageMetrics = {};
    pageMetrics[site] = getSiteMetrics(require(path));
    pagesMetrics.push(pageMetrics);
  });
  return pagesMetrics;
}

function parseInsightId(insight) {
  return insight.id.match(urlRegex)[0];
}

function filterInsight(insights) {
  return _.filter(insights, function(insight) {
    return SITE_METRICS[parseInsightId(insight)];
  });
}

function getSiteMetrics(path) { 
  return _.map(filterInsight(path.data), function(insight) {
    return {
      insight: insight.name,
      title: insight.title,
      value : insight.values[0].value
    };
  });
}