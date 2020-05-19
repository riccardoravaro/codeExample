'use strict';
const moment = require('moment');
const app = require('../../../../server/server');
const enableExpired = app.get('enableExpire');

var sellInterestsExpired = async ({
  ProductSells,
  id, // product sells id
  user,
  status,
  accessRoles,
  currentUser,
  actionType,
  includeExpired,
  expireDate,
}) => {
  var products = null;
  // if (accessRoles) {
  //   products = await ProductSells.app.models.Products.find({
  //     where: {accessRoles: {eq: accessRoles}},
  //   });
  //   products = products.map(el => el.id);
  // }

  var query = {};
  if (user) {
    if (status) {
      query.where = {and: [{userId: user}, {status: status}]};
      query.include = [
        {
          relation: 'product',
          scope: {fields: ['name', 'accessRoles', 'unitType']},
        },
      ];
    } else {
      query.where = {and: [{userId: user}]};
      query.include = [
        {
          relation: 'product',
          scope: {fields: ['name', 'accessRoles', 'unitType']},
        },
      ];
    }
  } else {
    if (status) {
      query.where = {and: [{status: status}]};
      query.include = [
        {
          relation: 'product',
          scope: {fields: ['name', 'accessRoles', 'unitType']},
        },
      ];
      if (accessRoles) query.where.and.push({productId: {inq: products}});
      if (includeExpired && enableExpired) {
        query.where.and.push({
          expireDate: {lte: expireDate ? expireDate : moment().format()},
        });
      }
    } else {
      query = {};
      query.include = [
        {
          relation: 'product',
          scope: {fields: ['name', 'accessRoles', 'unitType']},
        },
      ];
    }
    if (!includeExpired && enableExpired) {
      query.where.and.push({
        expireDate: {gte: expireDate ? expireDate : moment().format()},
      });
    }
  }


    if (!query.where) {
      query.where = {};
      query.where.and = [];
    }
    
    if(enableExpired) {
      query.where.and.push({
        expireDate: {lte: expireDate ? expireDate : moment().add('day',1).format()},
      });
    }
  
    if (id) {
      query.where.and.push({id});
    }

  query.where.and.push({deleted: false});

  console.log(JSON.stringify(query));
  var sellOrigin = await ProductSells.find(query);

  sellOrigin = sellOrigin.filter(item => item.qty !== 0);

  var negotiations = await app.models.productSellsTransactions.find({
    where: {and: [{type: 'negotiate'}]},
    fields: ['productSellsId'],
  });
  console.log('negotiations');
  console.log(negotiations);

  await sellOrigin.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  console.log('sellOrigin');
  console.log(sellOrigin);
  console.log(user);
  //

  // exclude  sellInterests under negotiation
  var filteredSellOrigin = sellOrigin.filter(function(s) {
    return !negotiations.some(function(i) {
      console.log('i.productSellsId');
      console.log(i);
      console.log(typeof i.productSellsId);
      console.log('s.id');
      console.log(s.id);
      console.log(typeof s);
      console.log(i.productSellsId.toString() == s.id.toString());
      return i.productSellsId.toString() === s.id.toString();
    });
  });
  console.log('filteredSellOrigin');
  console.log(filteredSellOrigin);

  if (id && filteredSellOrigin.length == 0) {
    var userIsOnline = await app.models.useronline.findById(user);
    console.log(userIsOnline);
    if (userIsOnline) {
      app.io.to(userIsOnline.socketid).emit('removeProductSellExpire', id);
    }
  }
  return filteredSellOrigin;
};

module.exports = sellInterestsExpired;
