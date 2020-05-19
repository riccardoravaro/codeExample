'use strict';
const app = require('../../../../server/server');
const moment = require('moment')
const enableExpired = app.get('enableExpire');

var sellInterests = async ({ ProductSells, id, user, status, accessRoles, currentUser, actionType, includeExpired, expireDate }) => {
    var products = null
    if (accessRoles) {
        products = await ProductSells.app.models.Products.find({ where: { accessRoles: { eq: accessRoles } } })
        products = products.map(el => el.id)
    }

    var query = {}
    if (user) {
        if (status) {
            query.where = { and: [{ userId: user }, { status: status }] }
            query.include = [{ relation: 'product', scope: { fields: ["name", "accessRoles", "unitType"] } }]
        } else {
            query.where = { and: [{ userId: user }] }
            query.include = [{ relation: 'product', scope: { fields: ["name", "accessRoles", "unitType"] } }]
        }
    }
    else {
        if (status) {
            query.where = { and: [{ status: status }] }
            query.include = [{ relation: 'product', scope: { fields: ["name", "accessRoles", "unitType"] } }]
            if (accessRoles) query.where.and.push({ productId: { inq: products } })
            // include expire product
            if (includeExpired && enableExpired) {
              query.where.and.push({
                expireDate: {lte: expireDate ? expireDate : moment().format()},
              });
            }
        } else {
            query = {}
            query.include = [{ relation: 'product', scope: { fields: ["name", "accessRoles", "unitType"] } }]
        }
        //  remove expired products
        if (!includeExpired && enableExpired) {
          query.where.and.push({
            expireDate: {gte: expireDate ? expireDate : moment().format()},
          });
        }
    }

    if (!query.where) {
        query.where = {}
        query.where.and = []
        // include expired product
        if (includeExpired && enableExpired) {
          query.where.and.push({
            expireDate: {lte: expireDate ? expireDate : moment().format()},
          });
        }
    }
    query.where.and.push({ deleted: false })

    if (actionType) query.where.and.push({ actionType })
    if (id) query.where.and.push({ id })

    if (!query.include) query.include = []

    query.include.push({ relation: 'productSellsOffers', scope: { where: { status: 'complete' } } })

    var sellOrigin = await ProductSells.find(query)

    sellOrigin = sellOrigin.filter(item => item.qty !== 0)


    sellOrigin = await Promise.all(sellOrigin.map(async item => {
        var newItem = item.toJSON()

        var checkoffers = await ProductSells.app.models.productSellsOffers.find(
          {
            where: {
              and: [
                {productSellsId: newItem.id},
                {userId: currentUser},
                {deleted: false},
                {status: {inq: ['pending', 'complete']}},
              ],
            },
            fields: {productSellsId: true, id: true, userId: true},
          },
        );
        newItem.offers = checkoffers
        return newItem
    }))
    // console.log(sellOrigin)


    if (user) {
        return await Promise.all(sellOrigin.map(async item => {
            var soldSamples = await ProductSells.app.models.ProductSellsTransactions.find({ where: { and: [{ productSellsId: item.id }, { type: 'sample' }] } })
            var itemsSold = 0
            soldSamples.forEach(item => itemsSold = itemsSold + 1 || 0);
            item.samplesOrdered = itemsSold
            return item
        }))
    }
    // console.log("currentUser -------------------------")
    await Promise.all(sellOrigin.map(async item => {
        var checkNegotiate = await ProductSells.app.models.ProductSellsTransactions.find(
          {
            where: {
              and: [
                // {productId: item.productId},
                {productSellsId: item.id},
                {userId: currentUser},
                {type: 'negotiate'},
                {status: {inq: ['pending', 'complete']}},
              ],
            },
          },
        );
        console.log(checkNegotiate)
        item.negotiate = checkNegotiate
        return item
    }))
    
    

    await sellOrigin.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    })

    return sellOrigin;
}

module.exports =   sellInterests 