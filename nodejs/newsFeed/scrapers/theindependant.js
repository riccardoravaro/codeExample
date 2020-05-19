const request = require('request');
const moment = require('moment')
const cheerio = require('cheerio');
const insertArticles = require('../insertArticles');

const theindependant = async () => {
    const domain = 'https://www.independent.co.uk/topic/cbd';
    return new Promise(async (res, rej) => {
        request(domain, async function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var articles = [];
                let counter = 0
                $('.article').each(function (i, element) {
                    counter ++
                    if (counter > 6){
                        return false
                    }
                    var a = $(element).find('.content > a');
                    var title = $(a).find('.headline').text().trim()
                    var link = "https://www.independent.co.uk" + a.attr('href')
                    var content = title
                    var date = moment()
                    var dateFormatted = moment(date, 'MMMM D, YYYY').format();
                    articles.push({
                        title: title,
                        link: link,
                        content: content,
                        date: dateFormatted,
                        domain: domain
                    });
                });
                console.log('news theindependant start');
                await insertArticles(articles);
                console.log('news theindependant completed ');
                res(true);
            } else {
                console.log('error request theindependant');
                rej(error);
            }
        });
    })
}

module.exports = theindependant