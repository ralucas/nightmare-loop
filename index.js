const fs = require('fs');
const path = require('path');

const Nightmare = require('nightmare');
const _ = require('lodash');

const config = require('./config');
const dom = require('./lib/dom');
const models = require('./models');

// Url to scrape
// There's a default url here...Remove when ready
const URL = process.argv[2] || 
  "http://www.forever21.com/Product/Product.aspx?br=F21&category=top_blouses&productid=2000169528";
if ( !URL ) {
  process.exit('A url is required');
}

let aggregator = [];

function writeFile(dataFile, data) {
  const dataFileName = dataFile + '-' + new Date().getTime() + '.json';
  const filePath = path.join(__dirname, 'data', dataFileName);
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data), (err) => {
      if (err) {
        return reject(err);
      }
      return resolve({
        file: filePath,
        data: data,
        status: 'saved' 
      });
    });
  });
}

// Let's get started
function run() {
  const showBrowser = process.env.SHOW_BROWSER === 'false' ? false : true;
  const nightmareOpts = {
    show: showBrowser,
  };

  // Instantiate
  const nightmare = Nightmare(nightmareOpts);

  const browser = nightmare
    .goto(URL)
    .wait('main');

  let resolution = Promise.resolve();

  getColorIds(browser)
    .then((ids) => {
      return ids.map((id, i) => {
        return function promise() {
          return scrape(browser, id)
            .then(aggregate);
        }; 
      });
    })
    .then((promises) => {
      promises.forEach(fn => {
        resolution = resolution.then((result) => fn(result));
      });
      return resolution;
    })
    .then((aggregation) => {
      browser.end().then();
      return writeFile(aggregation[0].model_number, aggregation);
    })
    .then((savedFile) => {
      console.log('---------\nScraping Result\n----------\n\n', savedFile.data);
      return savedFile;
    })
    .catch((err) => {
      console.error("Error in run", err);
      browser.end().then();
    });

}

function aggregate(result) {
  aggregator = aggregator || [];
  aggregator.push(result);
  return aggregator;
}

function getColorIds(browser) {
  return new Promise((resolve, reject) => {
    browser
      .evaluate(() => {
        return Array.prototype.slice.call(
          document.getElementsByClassName('colorOpt')
        ).map((colorEl) => {
          return colorEl.id;
        });
      })
      .then((ids) => {
        return resolve(ids);
      })
      .catch((err) => {
        return reject('Error in getColorIds', err);
      });
  });
}


function scrape(browser, id) {
  return new Promise((resolve, reject) => {
    const selector = 'li#' + id + ' a';
    const selected = 'li#' + id + '.selected';
    
    browser
      .click(selector)
      .wait(selected)
      .evaluate((conf) => {
        let els = {};
        for ( var key in conf ) {
          els[key] = document
            .getElementsByClassName(conf[key].className)[0]
            .innerHTML;
        }
        return els;
      }, config)
      .then(html => _.mapValues(html, dom))
      .then(models.transform)
      .then((result) => {
        return resolve(result);
      })
      .catch((err) => {
        console.error('Error in Nightmare', err);
        return reject(err);
      });
  });
}

// Run it
run();

