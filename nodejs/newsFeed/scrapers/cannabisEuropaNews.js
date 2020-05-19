const request = require('request');
const moment = require('moment')
const cheerio = require('cheerio');
const insertArticles = require('../insertArticles');

const cannabisEuropaNews = async () => {
    const domain = 'https://cannabis-europa.com/news/';
    return new Promise(async (res, rej) => {
        request(domain, async function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var articles = [];
                $('article').each(function (i, element) {
                    var a = $(element).find('.cmsmasters_post_title  a');
                    var title = a.text();
                    var link = a.attr('href');
                    var content = $(element)
                        .find('.cmsmasters_post_content')
                        .text();
                    var date = $(element)
                        .find('.published')
                        .attr('title');
                    var dateFormatted = moment(date, 'MMMM D, YYYY').format();
                    articles.push({
                        title: title,
                        link: link,
                        content: content,
                        date: dateFormatted,
                        domain: domain
                    });
                });
                console.log('news cannabis europa start');
                await insertArticles(articles);
                console.log('news cannabis europa completed ');
                res(true);
            } else {
                console.log('error request cannabis europa');
                rej(error);
            }
        });
    })
}

module.exports =  cannabisEuropaNews