const request = require('request');
const moment = require('moment')
const cheerio = require('cheerio');
const insertArticles = require('../insertArticles');

const newcannabisventures = async () => {
    const domain = 'https://www.newcannabisventures.com/';
    return new Promise(async (res, rej) => {
        request(domain, async function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var articles = [];
                $('article').each(function (i, element) {
                    var a = $(element).find('.entry-title  a');
                    var title = a.text();
                    var link = a.attr('href');
                    var content = $(element)
                        .find('.entry-content')
                        .text();
                    var date = $(element)
                        .find('.time')
                        .text();
                    var dateFormatted = moment(date, 'MMMM D, YYYY').format();
                    articles.push({
                        title: title,
                        link: link,
                        content: content,
                        date: dateFormatted,
                        domain: domain
                    });
                });
                console.log('news newcannabisventures start');
                await insertArticles(articles);
                console.log('news newcannabisventures completed ');
                res(true);
            } else {
                console.log('error request newcannabisventures');
                rej(error);
            }
        });
    })
}

module.exports =  newcannabisventures