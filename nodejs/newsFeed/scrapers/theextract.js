const request = require('request');
const moment = require('moment')
const cheerio = require('cheerio');
const insertArticles = require('../insertArticles');

// the extract seems to be injecting the <articles> via script
// the html returned by the site did not include any <article> tags
// although the final rendered code does include those. 
// For that reason, this script and source are not included in the scrapers

const theextract = async () => {
    const domain = 'https://www.theextract.co.uk/category/news/latest-news/';
    return new Promise(async (res, rej) => {
        request(domain, async function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var articles = [];
                $('article').each(function (i, element) {
                    console.log('in')
                    var a = $(element).find('.entry-title a');
                    var title = a.text();
                    var link = a.attr('href');
                    var content = $(element)
                        .find('.post-excerpt')
                        .text();
                    var date = $(element)
                        .find('.meta-date a')
                        .text();
                        console.log('datetheext' + date)
                    var dateFormatted = moment(date, 'MMMM D, YYYY').format();
                    articles.push({
                        title: title,
                        link: link,
                        content: content,
                        date: dateFormatted,
                        domain: domain
                    });
                });
                console.log(articles)
                console.log('news theextract start');
                await insertArticles(articles);
                console.log('news theextract completed ');
                res(true);
            } else {
                console.log('error request theextract');
                rej(error);
            }
        });
    })
}

module.exports = theextract