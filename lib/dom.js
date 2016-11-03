const cheerio = require('cheerio');
const config = require('../config');

module.exports = function(html, key) {
  $ = cheerio.load(html);

  return config[key].extract($);
};
