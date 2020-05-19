const app = require('../../../server/server');

var insertArticles = articles => {
    articles.map(async article => {
        var exists = await app.models.news.find({
            where: { title: { eq: article.title } },
        });
        if (!exists.length > 0) {
            try {
                await app.models.news.create(article);
            } catch (e) {
                console.error(e);
            }
        }
    });
};

module.exports = insertArticles