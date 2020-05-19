'use strict';
const moment = require('moment')

var userNegotiations = async ({ ProductSellsTransactions, userId, id }) => {
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
                {
                    or: [
                        {
                            and: [
                                { type: 'negotiate' },
                                { status: 'pending' }
                            ]
                        },
                        {
                            and: [
                                { type: 'negotiate' },
                                { status: 'counterOffer' }
                            ]
                        }
                    ]
                }
            ]
        },
        order: 'date DESC',
        include: [{
            relation: 'productSells',
            scope: { include: ['product'] }
        }, 'counterOffer']
    }

    if (id) {
        query.where.and.push({ id })
    }

    var data = await ProductSellsTransactions.find(query)
    var sellsOffersTransactions = await ProductSellsTransactions.app.models.productSellsOffersTransactions.find(query)
    var finalData = [...data, ...sellsOffersTransactions]


    finalData = await finalData.map(item => {
        var newItem = item.toJSON()
        if (newItem.status === 'counterOffer' && newItem.counterOffer.length > 0) {
            var counterOfferItem = newItem.counterOffer.sort((a, b) => new Date(b.actionDate) - new Date(a.actionDate))
            newItem.qty = counterOfferItem[0].qty
            newItem.price = counterOfferItem[0].price
            newItem.date = counterOfferItem[0].actionDate
        }
        return newItem
    })

    finalData.sort((a, b) => new Date(b.date) - new Date(a.date))

    return id ? (finalData.length > 0) ? finalData[0] : finalData : finalData

}

module.exports = userNegotiations;