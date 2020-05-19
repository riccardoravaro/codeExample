'use strict';

var loopback = require('loopback');
var path = require('path');

var senderAddress = 'transactions@canxchange.eu';

module.exports = function(User) {

  User.remoteMethod('check', {
    http: { path: '/check', verb: 'post' },
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } },
      { arg: 'email', type: 'string', required: true },
      { arg: 'password', type: 'string', required: true }
    ],
    returns: { root: true, type: 'object' },
    description: 'check if user password is valid'
  });

  User.remoteMethod('checkRole', {
    http: { path: '/checkRole', verb: 'get' },
    accepts: [
      { arg: 'req', type: 'object', http: { source: 'req' } },
      { arg: 'res', type: 'object', http: { source: 'res' } },
      { arg: 'id', type: 'string', required: true, http: { source: "query" }  }
    ],
    returns: { root: true, type: 'object' },
    description: 'check user roles'
  });

  User.check = async function(req, res, email, password) {

    try {
      var user = await User.login({email, password});
    } catch(e){
    }
    
    return {
      success: user ? true : false
    }
  
  }

  User.checkRole = async function(req, res, id) {

    var admin = await User.app.models.Role.findOne({where: {name: 'admin'}})
    var roles = await User.app.models.RoleMapping.findOne({where: {and: [{principalId: id}]}, include: 'role'})
    var roleName = roles.toJSON().role.name
    
    var isBuyer = await User.app.models.Products.count({accessRoles: `${roleName}@buyer`})
    var isSeller = await User.app.models.Products.count({accessRoles: `${roleName}@seller`})
    var isAdmin = await User.app.models.RoleMapping.findOne({where: {and: [{principalId: id},{ roleId:  admin.id}]}})
    
    var finalArray = []
 

    if (isSeller > 0) finalArray.push('seller')
    if (isBuyer > 0) finalArray.push('buyer')

    var retItem = {
      roles: finalArray,
      isAdmin: isAdmin !== null
    }

    return retItem

  }


  // send password reset link when requested
  User.on('resetPasswordRequest', function(info) {
    var url = 'http://' + process.env.FRONT_URL + '/reset-password';
    var renderer = loopback.template(
      path.resolve(__dirname, '../../server/views/email-templates/reset-password.ejs')
    );
    var html = renderer({
      url: url,
      accessToken: info.accessToken.id
    });
    // console.log(html);

    User.app.models.Email.send({
      to: info.email, // the email of the requested user
      from: senderAddress,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });

  //render UI page after password reset
  User.afterRemote('setPassword', function (ctx, user, next) {
    var userId = ctx.args.options.accessToken.userId;
    const AccessToken = User.app.models.AccessToken;
    AccessToken.destroyAll({
      userId
    }, function(err, data) {

      ctx.result = { result: userId ? "false" : "true" };
      next();
    });
  });
  // prevent non-admin users from creating other users
  User.observe('before save', async function(ctx) {
    if (ctx.isNewInstance) {
      if (ctx.options && ctx.options.accessToken) {
        var loggedInUserId = ctx.options.accessToken.userId;
        var user = await User.findById(loggedInUserId, { include: 'roles' });
        user = user.toJSON();
        for (var i = 0; i < user.roles.length; i++) {
          if (user.roles[i].name === 'admin') {
            return;
          }
        }
      }
      // var error = new Error('Unauthorized');
      // error.statusCode = 401;
      // error.code = 'AUTHORIZATION_REQUIRED';
      // throw error;
    }
  });
  // Create a RoleMapping for the created user based on the 'type' property
  User.observe('after save', function setRoleMapping(ctx, next) {
    if (ctx.instance) {
      if(ctx.isNewInstance && ctx.instance.type) {
        const Role = User.app.models.Role;
        const RoleMapping = User.app.models.RoleMapping;
        Role.findOne({where: {name: ctx.instance.type}}, function(err, role) {
          if (err) {return console.log(err);}
          var ObjectId = User.getDataSource().ObjectID;
          RoleMapping.create({
            principalType: "user",
            principalId: ObjectId(ctx.instance.id),
            roleId: role.id
          }, function(err, roleMapping) {
            if (err) { return console.log(err); }
            console.log('User assigned RoleID ' + role.id + ' (' + ctx.instance.type + ')');
          });
        });
      }
    }
    next();
  });

  User.observe('after delete', function(ctx, next) {
    // const RoleMapping = User.app.models.RoleMapping;
    // console.log(ctx.where.id.inq[0])
    // RoleMapping.destroyAll({principalId: ctx.where.id.inq[0]}, 
    // function(err, roleMapping) {
    //   if (err) { return console.log(err); }
    //   console.log('User deleted RoleID (' + ctx.where.id.inq[0] + ')');
    // });
    next();
  });
};
