'use strict';
const app = require('../../../server/server');
const hemptoday = require('./scrapers/hemptoday')
const cannabisEuropaNews = require('./scrapers/cannabisEuropaNews')
const hempindustrydaily = require('./scrapers/hempindustrydaily')
const newcannabisventures = require('./scrapers/newcannabisventures')
// const theextract = require('./scrapers/theextract') - Injects articles via JS, excluding it
const theindependant = require('./scrapers/theindependant')

var updateNewsFeed = async () =>{
    var promises = [];
    promises.push(cannabisEuropaNews());
    promises.push(hemptoday());
    promises.push(hempindustrydaily());
    promises.push(newcannabisventures())
    // promises.push(theextract())
    promises.push(theindependant())
    Promise.all(promises).then(res => {
      console.log('news load completed');
    }).catch(err  => console.log(`error loading news ${err}`))
}

module.exports = {
  updateNewsFeed,
};