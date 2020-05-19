'use strict';
const app = require('../../server/server');
var moment = require('moment');

var { sellInterests } = require('../lib/productSells');
var { sendEmail } = require('../lib/sendEmail')
var { sendSms } = require('../lib/sendSms')


module.exports = function(ProductSellsOffers) {

  ProductSellsOffers.observe('before save', async function(ctx, next) {
    console.log('before save');
    console.log('ctx.isNewInstance');
    console.log(ctx.isNewInstance);
    console.log('ctx.instance');
    console.log(ctx.instance);
    if (ctx.isNewInstance) {
      var productSellObj = await app.models.productSells.findById(
        ctx.instance.productSellsId,
      );
      var mongoDb = app.dataSources.canxchangedb;
      var mongoConnector = app.dataSources.canxchangedb.connector;
      var sequence = await mongoConnector
        .collection('counters')
        .findAndModify(
          {collection: productSellObj.customId},
          [['_id', 'asc']],
          {$inc: {value: 1}},
          {new: true},
        );
      var newCustomId = productSellObj.customId + '-' + sequence.value.value;
      console.log(sequence);
      ctx.instance.customId = newCustomId;
      // console.log('before save');
      // var expireDate = app.get('expireDate');
      // var headers = ProductSellsOffers.app.get('headers') || {};
      // var zone = headers['x-timezone-offset'];
      // ctx.instance.expireDate = moment(new Date())
      //   .utcOffset(zone)
      //   .add(expireDate.qty, expireDate.unit)
      //   .toISOString();
    }

    next();
    
  });



  ProductSellsOffers.softDelete = async function(req, res, id) {
    await ProductSellsOffers.upsert({id, deleted: true})
    await ProductSellsOffers.app.models.messages.updateAll({ productSellsOfferId: id },{deleted: true})
    return {deleted: true}
  }


  var trType = null;

  ProductSellsOffers.beforeUpdate = async function(next, modelInstance) {
    // var date =  (!modelInstance.date) ? moment().format(): modelInstance.date
    if (modelInstance.trType) {
      trType = modelInstance.trType
      delete modelInstance.trType;
    }
    // if (!trType){
    //   var expireDate = app.get("expireDate");
    //   modelInstance.expireDate = moment(new Date()).add(expireDate.qty, expireDate.unit).toISOString();
    //   if (modelInstance.notifyExpire)  modelInstance.notifyExpire = null
    // } 

    if (modelInstance.deleted === true && modelInstance.notifyExpire !== null)  modelInstance.notifyExpire = null

    next();
  };

  ProductSellsOffers.afterUpdate = async function(next) {

    // if only updated qty from productSellTransaction creation 
    if (trType && (trType === 'updateQty' || trType === 'updateNotify')) {
      delete this.trType;
      trType = null;
    } 
   
    next();
  }

  ProductSellsOffers.makeOffer = async function(req, res, data) {
    delete data.sold

    var exists = await ProductSellsOffers.find({where: {and: [{id: data.id},{status: 'pending'}]}})
    
    var insertedSellOffer = await ProductSellsOffers.upsert(data)

    var isOnline = await ProductSellsOffers.app.models.useronline.find({where: {id: {neq: insertedSellOffer.userId}}})

    // find admin user to send email notification
    var adminRole = await ProductSellsOffers.app.models.Role.find({where: {name: 'admin'}})
    if (adminRole.length > 0) {
      var adminUsers = await ProductSellsOffers.app.models.RoleMapping.find({where:{ roleId: adminRole[0].id}})
      if (adminUsers.length > 0){
        adminUsers.forEach(async user =>{
          var notifyAdmin = await sendEmail({Model: ProductSellsOffers, data: {
            buyer: user.principalId,
            seller: insertedSellOffer.userId, 
            actionType: insertedSellOffer.actionType,
            template: 'new-interest-admin',
            type: 'informAdmin',
            offer: true
          }})
        })
      }
    }

    if (process.env.ENABLE_LIVE_DATA && process.env.ENABLE_LIVE_DATA === "true") {
    
      isOnline.forEach(async user => {
        if (user.isAdmin) {
          var product = await ProductSellsOffers.find({where:{and: [{status: 'pending'},{id: data.id}, {deleted: false}]}, include: ['product', 'user']})
          if (exists.length > 0){
            app.io.to(user.socketid).emit('updateProductSell', product[0]);
          } else {
            app.io.to(user.socketid).emit('newProductSell', product[0]);
          }
        } 
      })

    }

    return insertedSellOffer;
  }

  ProductSellsOffers.adminApprove = async function(req, res, id) {
    
    var approvedSellOffer = await ProductSellsOffers.upsert({id, status: 'complete'})
    var productSellOwner = await ProductSellsOffers.app.models.productSells.findById(approvedSellOffer.productSellsId)
    const { userId: Owner } = productSellOwner

    var message = {
      productSellsId: approvedSellOffer.productSellsId, 
      productSellsOfferId: approvedSellOffer.id,
      read: false, 
      messageType: 'offerForBuyInterest', 
      userId: Owner, 
      sendUserId: approvedSellOffer.userId,
      date: moment().format()
    }
    
    var insertedMessage = await ProductSellsOffers.app.models.messages.upsert(message)

    var finalMessage = await ProductSellsOffers.app.models.messages.findById(insertedMessage.id,{include: ["sendUser", "productSellsTransactions", "productSellsOffer", "productSellsOffersTransactions","productSellsCounterOffers", {relation: "productSells",scope: { include: { 
      relation: 'product', scope: {fields: ["name","unitType","showCbd"]}}}}]})

    // send email to owner of buy interest offer
    // var notifySeller = await sendEmail({Model: ProductSellsOffers, data: {
    //   buyer: Owner,
    //   seller: approvedSellOffer.userId, 
    //   qty: approvedSellOffer.qty,
    //   price: approvedSellOffer.price,
    //   total: approvedSellOffer.qty * approvedSellOffer.price,
    //   template: 'approved-by-admin-owner',
    //   type: 'informBuyer',
    //   folder: 'productSellOffers',
    //   unitType: finalMessage.toJSON().productSells.product.unitType,
    //   productSellsId: approvedSellOffer.productSellsId,
    //   productSellsIdOffer: approvedSellOffer.id,
    //   availableFromDate: moment(finalMessage.toJSON().productSells.date).format('DD/MM/YYYY'),
    //   priceDescription : finalMessage.toJSON().productSells.product.showCbd ? '(per %CBD/' + finalMessage.toJSON().productSells.product.unitType + ')' : 'per (' + finalMessage.toJSON().productSells.product.unitType + ')',
    //   product: finalMessage.toJSON().productSells.product
    // }})

    try {
      con
      var smsBuyer = await sendSms(Owner, `Canxchange : You have a NEW OFFER for your BUY interest. Please connect to your profile.`)
    } catch(e){console.log(e)}

    var isOwnerOnline = await ProductSellsOffers.app.models.useronline.findById(Owner)
    if (isOwnerOnline) {
      app.io.to(isOwnerOnline.socketid).emit('message', finalMessage);
    }

    var buyerMessage = {
      productSellsId: approvedSellOffer.productSellsId, 
      productSellsOfferId: approvedSellOffer.id,
      read: false, 
      messageType: 'offerForBuyInterestAproveReject', 
      userId: approvedSellOffer.userId, 
      sendUserId: Owner,
      date: moment().format()
    }
    
    var insertedBuyerMessage = await ProductSellsOffers.app.models.messages.upsert(buyerMessage)

    var finalBuyerMessage = await ProductSellsOffers.app.models.messages.findById(insertedBuyerMessage.id,{include: ["sendUser", "productSellsTransactions", "productSellsOffer", "productSellsOffersTransactions","productSellsCounterOffers", {relation: "productSells",scope: { include: { 
      relation: 'product', scope: {fields: ["name","unitType","showCbd"]}}}}]})

    // send email to buyer of buy interest offer
    // var notifyBuyer = await sendEmail({Model: ProductSellsOffers, data: {
    //   buyer: approvedSellOffer.userId,
    //   seller: 'admin', 
    //   qty: approvedSellOffer.qty,
    //   price: approvedSellOffer.price,
    //   total: approvedSellOffer.qty * approvedSellOffer.price,
    //   template: 'response-by-admin-buyer',
    //   actionType: approvedSellOffer.actionType,
    //   status: approvedSellOffer.status,
    //   type: 'informBuyer',
    //   folder: 'productSellOffers',
    //   unitType: finalBuyerMessage.toJSON().productSells.product.unitType,
    //   productSellsId: approvedSellOffer.productSellsId,
    //   productSellsIdOffer: approvedSellOffer.id,
    //   availableFromDate: moment(finalBuyerMessage.toJSON().productSells.date).format('DD/MM/YYYY'),
    //   priceDescription : finalBuyerMessage.toJSON().productSells.product.showCbd ? '(per %CBD/' + finalBuyerMessage.toJSON().productSells.product.unitType + ')' : 'per (' + finalBuyerMessage.toJSON().productSells.product.unitType + ')',
    //   product: finalBuyerMessage.toJSON().productSells
    // }})
    
    var isBuyerOnline = await ProductSellsOffers.app.models.useronline.findById(approvedSellOffer.userId)
    if (isBuyerOnline) {
      app.io.to(isBuyerOnline.socketid).emit('message', finalBuyerMessage);
    }

    
    return approvedSellOffer;
  }

  ProductSellsOffers.adminReject = async function(req, res, id, reasson) {
      
    var rejectedSellOffer = await ProductSellsOffers.upsert({id, status: 'reject', reasson})
    var productSellOwner = await ProductSellsOffers.app.models.productSells.findById(rejectedSellOffer.productSellsId)
    const { userId: Owner } = productSellOwner
 
    var buyerMessage = {
      productSellsId: rejectedSellOffer.productSellsId, 
      productSellsOfferId: rejectedSellOffer.id,
      read: false, 
      messageType: 'offerForBuyInterestAproveReject', 
      userId: rejectedSellOffer.userId, 
      sendUserId: Owner,
      date: moment().format()
    }
    
    var insertedBuyerMessage = await ProductSellsOffers.app.models.messages.upsert(buyerMessage)

    var finalBuyerMessage = await ProductSellsOffers.app.models.messages.findById(insertedBuyerMessage.id,{include: ["sendUser", "productSellsTransactions", "productSellsOffer", "productSellsOffersTransactions","productSellsCounterOffers", {relation: "productSells",scope: { include: { 
      relation: 'product', scope: {fields: ["name","unitType","showCbd"]}}}}]})

    // send email to buyer of buy interest offer
    // var notifyBuyer = await sendEmail({Model: ProductSellsOffers, data: {
    //   buyer: rejectedSellOffer.userId,
    //   seller: 'admin', 
    //   qty: rejectedSellOffer.qty,
    //   price: rejectedSellOffer.price,
    //   total: rejectedSellOffer.qty * rejectedSellOffer.price,
    //   template: 'response-by-admin-buyer',
    //   actionType: rejectedSellOffer.actionType,
    //   status: rejectedSellOffer.status,
    //   reasson: rejectedSellOffer.reasson,
    //   type: 'informBuyer',
    //   folder: 'productSellOffers',
    //   unitType: finalBuyerMessage.toJSON().productSells.product.unitType,
    //   productSellsId: rejectedSellOffer.productSellsId,
    //   productSellsIdOffer: rejectedSellOffer.id,
    //   availableFromDate: moment(finalBuyerMessage.toJSON().productSells.date).format('DD/MM/YYYY'),
    //   priceDescription : finalBuyerMessage.toJSON().productSells.product.showCbd ? '(per %CBD/' + finalBuyerMessage.toJSON().productSells.product.unitType + ')' : 'per (' + finalBuyerMessage.toJSON().productSells.product.unitType + ')',
    //   product: finalBuyerMessage.toJSON().productSells
    // }})
    
    var isBuyerOnline = await ProductSellsOffers.app.models.useronline.findById(rejectedSellOffer.userId)
    if (isBuyerOnline) {
      app.io.to(isBuyerOnline.socketid).emit('message', finalBuyerMessage);
    }
    
    return rejectedSellOffer;
  }

};