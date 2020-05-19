'use strict';

const moment = require('moment')

var userSamples = async ({ ProductSellsTransactions, userId, id }) => {

    var query = {
        where: {
            and: [
                {
                    or: [
                        {
                            and: [
                                { productSellUserId: userId }
                            ]
                        },
                        {
                            and: [
                                { userId: userId }
                            ]
                        }
                    ]
                },
                { type: "sample" }
            ]
        },
        order: 'date DESC',
        include: {
            relation: 'productSells',
            scope: { include: ['product'] }
        }
    }

    if (id) {
        query.where.and.push({ id })
    }

    var data = await ProductSellsTransactions.app.models.ProductSellsTransactions.find(query)
    var sellsOffersTransactions = await ProductSellsTransactions.app.models.productSellsOffersTransactions.find(query)
    var finalData = [...data, ...sellsOffersTransactions]
    finalData.sort((a, b) => new Date(b.date) - new Date(a.date))

    return id ? (finalData.length > 0) ? finalData[0] : finalData : finalData

}

module.exports = userSamples;