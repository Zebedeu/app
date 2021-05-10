let _ = require('underscore');
let moment = require('moment');
let config = require('../../../config/config');
let Cart = require('mongoose').model('Cart');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Product = require('mongoose').model('Product');
let User = require('mongoose').model('User');
let Order = require('mongoose').model('Order');
let labels = require('../../utils/labels.json');
let { getMonthDateRange } = require('../../utils/date');
let {
     convert_date,
     separators,
     separatorsWD
} = require('../../utils/formatter');
let logger = require('../../utils/logger');

exports.toDashboard = (req, res) => {
	return res.redirect('/compradors/dashboard');
} 
exports.filterList = function (req, res) {
     
     Order.find({ 'buyer_info.user_id': req.session.user_id, $and: [{ "delivery_at": { $gte: new Date(req.query.from_date + 'T00:00:00.000Z') } }, { "delivery_at": { $lte: new Date(req.query.to_date + 'T23:59:59.000Z') } }] }, { _id: 0 }, (err, orders) => {
          orders = JSON.parse(JSON.stringify(orders));
          _.each(orders, (element, index, list) => {
               _.each(element['products'], (inner_element, inner_index, inner_list) => {
                    orders[index]['products'][inner_index]['item_total'] = separators(inner_element.unit_price * inner_element.qty);
                    orders[index]['products'][inner_index]['unit_price'] = separators(inner_element.unit_price);
                    orders[index]['products'][inner_index]['product_qty'] = separatorsWD(inner_element.qty);
                    orders[index]['products'][inner_index]['category_title'] = inner_element.category_title[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['sub_category_title'] = inner_element.sub_category_title[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['unit_plural_title'] = inner_element.unit_plural_title[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['unit_type'] = inner_element.unit_type[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['description'] = inner_element.description[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['images'][0] = ((inner_element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + inner_element.images[0] : '../../../images/item-placeholder.png');
               })

               if (element.payment_type == 'atm_reference') {
                    orders[index]['atm_reference_response']['AMOUNT'] = separators(element.atm_reference_response.AMOUNT);

                    let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
                    let endDate = moment(moment(element.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

                    let days = endDate.diff(currentDate, 'days');
                    orders[index]['atm_reference_response']['TIME_LEFT'] = (days >= 0) ? (days + ' ' + labels['LBL_DAYS'][req.session.language]) : '';
               }

               orders[index]['total'] = separators(element.total);
               orders[index]['delivery_at'] = convert_date(element.delivery_at, req.session.language);
          })

          res.render('compradors/order/filter-list', {
               user: {
                    user_id: req.session.user_id,
                    name: req.session.name,
                    user_type: req.session.user_type,
                    login_type: req.session.login_type
               },
               orders,
               moment,
               labels,
               layout: false,
               language: req.session.language || 'PT'
          });
     }).sort({ created_at: -1 });
};

exports.rating = function (req, res) {
     Order.findOne({ order_id: req.query.order_id }, { _id: 0, products: 1, is_rated: 1 }, (err, singleOrder) => {
          if (singleOrder && !singleOrder.is_rated) {
               let orderId = req.query.order_id;
               let deliveryOnTime = req.query.delivery_on_time;
               let productRating = JSON.parse(req.query.product_rating);

               let products = singleOrder.products;
               _.each(products, (element, index, list) => {
                    let selectedProduct = _.findWhere(productRating, { product_id: element.product_id });
                    products[index]['rating'] = selectedProduct.rating;
               })

               Order.update({ order_id: req.query.order_id }, { products, is_rated: true, transporter_rating: deliveryOnTime }, (err, update_response) => {
                    res.send({ code: 200 })
               })
          } else {
               res.send({ code: 404 })
          }
          return false;
     })
};

exports.confirm = function (req, res) {
     Order.findOne({ order_id: req.query.order_id }, { _id: 0, products: 1, cargon_is_delivered: 1, buyer_received: 1 }, (err, singleOrder) => {
          if (singleOrder) {
               let orderId = req.query.order_id;
               let params = req.query.params;

               let products = singleOrder.products;

               for(let i = 0; i< products.length; i++){
                    products[i].shipment_status="delivered"
               } 

               if(params){
                    let columUpdate ={
                         cargon_is_delivered: true, 
                         buyer_received: 'received',
                         status: 'delivered',
                         products:products
                    };
                    Order.update({ order_id: req.query.order_id }, columUpdate, (err, update_response) => {
                         if(err){
                              console.log('Erro: ', err);
                         }  else{
                              console.log('Response: ', update_response);
                         } 
                         res.send({ code: 200 })
                    })

                    /*
                    console.log(singleOrder.products[0])
                    let user_ids = [];
                    user_ids.push(singleOrder.products[0].user_info.user_id)
                    user_ids.push(singleOrder.products[0].buyer_info.user_id)
                    // console.log(singleOrder.products[0])
                    
                    query.updateAndFindSingle(dbConstants.dbSchema.orders, { $set: { "products.$.shipment_status": requestParam.status } }, {
                         order_id: singleOrder.products[0].order_id, products: {
                         $elemMatch: {
                         shipment_id: singleOrder.products[0].shipment_id
                         } 
                         } 
                    },{},async function(error, data) {
                         if (error) {
                              logger('Error: can not update ');
                              done(error, null);
                              return;
                         }
                         console.log(data)
                         let totalPackedProductsArr = _.where(data.products, { shipment_status: requestParam.status });
                         if(totalPackedProductsArr.length == data.products.length){
                              let updateOrderData = {
                                   status:requestParam.status
                              }
                              if(requestParam.status == 'delivered'){
                                   updateOrderData.delivery_at = new Date();
                              }
                              let updateOrder = await query.updateSinglePromise(dbConstants.dbSchema.orders, updateOrderData, {'order_id': singleOrder.products[0].order_id});
                         }
                         if(requestParam.status == 'delivered'){
                              let lockedAmountData = await query.selectWithAndOnePromise(dbConstants.dbSchema.locked_amounts, {order_id: singleOrder.products[0].order_id, shipment_id: singleOrder.products[0].shipment_id}, { _id: 0});
                              let languages = await query.selectWithAndPromise(dbConstants.dbSchema.languages, {status:'active'}, { _id: 0, language_id: 1, code:1 });
                              let updatedUserData = await query.selectWithAndOnePromise(dbConstants.dbSchema.users, {user_id: singleOrder.products[0].user_info.user_id}, { _id: 0, user_id: 1, user_type:1, wallet:1});
                              let userWallet = updatedUserData.wallet;
                              // console.log(lockedAmountData)
                              // console.log(userWallet)
                              userWallet = parseFloat(userWallet) + parseFloat(lockedAmountData.amount);
                              // console.log(userWallet)
                              let newLable = await query.selectWithAndOnePromise(dbConstants.dbSchema.push_templates, {code:'ADD_SHIPMENT_WALLET'}, { _id: 0, push_template_id: 1, code:1, value:1, caption_value:1 });
                              let title={}
                              let updateDescription={}
                              _.each(languages, data=>{
                                   let lableValue = newLable.value[data.code].replace('#AMOUNT#', "Kz "+lockedAmountData.amount);
                                   lableValue = lableValue.replace('#SHIPMENT_ID#', lockedAmountData.shipment_id);
                                   title[data.code] = 'Admin'
                                   updateDescription[data.code] = lableValue
                              })
                              let updateWalletData = {
                                   user_id:singleOrder.products[0].user_info.user_id,
                                   user_type:updatedUserData.user_type,
                                   type:'add',
                                   title:title,
                                   description:updateDescription,
                                   amount:lockedAmountData.amount,
                                   remaining_balance:userWallet
                              } 
                              let updateNotificationLogData = {
                                   user_id:singleOrder.products[0].user_info.user_id,
                                   user_type:updatedUserData.user_type,
                                   title:title,
                                   description:updateDescription,
                                   amount:userWallet
                              } 
                              let updateUser = await query.updateSinglePromise(dbConstants.dbSchema.users, {wallet: userWallet}, {'user_id': singleOrder.products[0].user_info.user_id});
                              let newAddWallet = await query.insertSinglePromise(dbConstants.dbSchema.wallet_logs, updateWalletData);
                              let newAddNotificationLog = await query.insertSinglePromise(dbConstants.dbSchema.notification_logs, updateNotificationLogData);  
                              query.removeMultiple(dbConstants.dbSchema.locked_amounts, {order_id: singleOrder.products[0].order_id, shipment_id: singleOrder.products[0].shipment_id}, function(error, data) {
                                   if (error) {
                                        logger('Error: can not delete ');
                                        done(error, null);
                                        return;
                                   }
                                   return;
                              });
                         }
                         // console.log(data)
                         let sendPushData = {
                              user_ids:user_ids,
                              status:requestParam.status,
                              shipment_id:singleOrder.products[0].shipment_id
                         }
                         sendShipmentNotification(sendPushData);
                         sendShipmentStatusEmail(sendPushData);
                         done(null, data);
                    });
                    */

               }else{

                    Order.update({ order_id: req.query.order_id }, { cargon_is_delivered: true,  buyer_received: false  }, (err, update_response) => {
                         res.send({ code: 200 })
                    })

               } 
          } else {
               res.send({ code: 404 })
          }
          return false;
     })
};

const sendShipmentNotification =async (requestParam, error) => {
     query.selectWithAndOne(dbConstants.dbSchema.settings,async function (error, setting) {
         if (error) {
             logger('Error: can not get setting data');
             done(error, null);
             return;
         }
         let updatedUserData = await query.selectWithAndPromise(dbConstants.dbSchema.users, {user_id: {$in: requestParam.user_ids} }, { _id: 0, user_id: 1, user_type:1});
         console.log(updatedUserData)
         let languages = await query.selectWithAndPromise(dbConstants.dbSchema.languages, {status:'active'}, { _id: 0, language_id: 1, code:1 });
         let lable = await query.selectWithAndOnePromise(dbConstants.dbSchema.push_templates, {code:'SHIPMENT_STATUS'}, { _id: 0, push_template_id: 1, code:1, value:1, caption_value:1 });
         let title = {}
         let description = {}
         _.each(languages, data=>{
             let lableValue = lable.value[data.code].replace('#SHIPMENT_ID#', requestParam.shipment_id);
             lableValue = lableValue.replace('#STATUS#', requestParam['status']);
             title[data.code] = 'Admin'
             description[data.code] = lableValue
         })
         let notificationLogData = []
         _.each(updatedUserData, singleUser=>{
             notificationLogData.push({
                 notification_log_id:`${moment().unix()}${Math.floor((Math.random() * 99) + 11)}`,
                 user_id:singleUser.user_id,
                 user_type:singleUser.user_type,
                 title:title,
                 description,
             })
         })
         console.log(notificationLogData)
         let addNotificationLog = await query.insertSinglePromise(dbConstants.dbSchema.notification_logs, notificationLogData);
         return false;
     });
 };

 const sendShipmentStatusEmail = (requestParam, error) => {
     query.selectWithAndOne(dbConstants.dbSchema.settings,function (error, setting) {
         if (error) {
             logger('Error: can not get setting data');
             done(error, null);
             return;
         }
         async.forEachSeries(requestParam['user_ids'],async (singleJob, callbackSingleJob) => {
             let updatedUserData = await query.selectWithAndOnePromise(dbConstants.dbSchema.users, {user_id: singleJob }, { _id: 0, user_id: 1, first_name:1, last_name:1, email:1, user_type:1});
             console.log(updatedUserData)
             let joinArr = [
             {
               $lookup: {
                 from: "users",
                 localField: "user_id",
                 foreignField: "user_id",
                 as: "usersDetails",
               },
             },
             {
               //$unwind: "$usersDetails"
               $unwind: {
                 path: "$usersDetails",
                 preserveNullAndEmptyArrays: true,
               },
             },
             {
               $lookup: {
                 from: "product_varieties",
                 localField: "product_variety_id",
                 foreignField: "product_variety_id",
                 as: "productVarietiesDetails",
               },
             },
             {
               //$unwind: "$productVarietiesDetails"
               $unwind: {
                 path: "$productVarietiesDetails",
                 preserveNullAndEmptyArrays: true,
               },
             },
             {
               $lookup: {
                 from: "categories",
                 localField: "category_id",
                 foreignField: "category_id",
                 as: "categoriesDetails",
               },
             },
             {
               //$unwind: "$categoriesDetails"
               $unwind: {
                 path: "$categoriesDetails",
                 preserveNullAndEmptyArrays: true,
               },
             },{
               $lookup: {
                 from: "sub_categories",
                 localField: "sub_category_id",
                 foreignField: "sub_category_id",
                 as: "subCategoriesDetails",
               },
             },
             {
               //$unwind: "$subCategoriesDetails"
               $unwind: {
                 path: "$subCategoriesDetails",
                 preserveNullAndEmptyArrays: true,
               },
             },{
               $lookup: {
                 from: "units",
                 localField: "unit_type",
                 foreignField: "unit_id",
                 as: "unitsDetails",
               },
             },
             {
               //$unwind: "$unitsDetails"
               $unwind: {
                 path: "$unitsDetails",
                 preserveNullAndEmptyArrays: true,
               },
             },{
               $lookup: {
                 from: "sizes",
                 localField: "size",
                 foreignField: "size_id",
                 as: "sizesDetails",
               },
             },
             {
               //$unwind: "$sizesDetails"
               $unwind: {
                 path: "$sizesDetails",
                 preserveNullAndEmptyArrays: true,
               },
             },
             {
               $match: {product_id: requestParam['shipment_id']},
             },
             {
               $project: {
                 _id: 0,
                 product_id: "$product_id",
                 user_id: "$user_id",
                 sub_category_id: "$sub_category_id",
                 category_id: "$category_id",
                 product_variety_id: "$product_variety_id",
                 unit_type: "$unit_type",
                 size: "$size",
                 harvest_date: "$harvest_date",
                 images: "$images",
                 unit_value: "$unit_value",
                 category_name: "$categoriesDetails.title.EN",
                 sub_category_name: "$subCategoriesDetails.title.EN",
                 product_variety_name: "$productVarietiesDetails.title.EN",
                 unit_name: "$unitsDetails.title.EN",
                 size_name: "$sizesDetails.title.EN",
                 email: "$usersDetails.email",
                 name: {
                   $concat: [
                     "$usersDetails.first_name",
                     " ",
                     "$usersDetails.last_name",
                   ],
                 },
               },
             },
             { $sort: { created_at: -1 } },
           ];
             query.joinWithAnd(dbConstants.dbSchema.products,joinArr,(error, response) => {
                 if (error) {
                     logger("Error: can not get record.");
                     // done(errors.internalServer(true), null);
                     return;
                 }
                 response = response[0]
                 // console.log(response)
                 query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
                     code: 'SHIPMENT_STATUS'
                 }, {
                     _id: 0,
                     from_name: 1,
                     from_email: 1,
                     email_subject: 1,
                     description: 1,
                 }, (error, template) => {
                     if (error) {
                         // done(errors.internalServer(true), null);
                         return;
                     }
 
                     if (template) {
                         let emailtemplate = template.description['PT'];
                         emailtemplate = emailtemplate.replace('#IMAGE#', (response.images.length > 0)?config.aws.prefix + config.aws.s3.productBucket + '/' +response.images[0]:'http://my.kepya.co.ao/images/forcast.png');
                         emailtemplate = emailtemplate.replace('#NAME#', updatedUserData.first_name+" "+updatedUserData.last_name);
                         emailtemplate = emailtemplate.replace('#SHIPMENT_ID#', requestParam.shipment_id);
                         emailtemplate = emailtemplate.replace('#STATUS#', requestParam.status);
                         emailtemplate = emailtemplate.replace('#PNAME#', response.category_name+"-"+response.sub_category_name);
                         emailtemplate = emailtemplate.replace('#UNIT#', response.unit_name);
                         emailtemplate = emailtemplate.replace('#VARIETY#', response.product_variety_name);
                         emailtemplate = emailtemplate.replace('#SIZE#', response.size_name);
                         emailtemplate = emailtemplate.replace('#QTY#', response.unit_value+" "+response.unit_name);
                         emailtemplate = emailtemplate.replace('#HARVEST#', moment(response.harvest_date).format('DD/MM/YYYY'));
                         emailtemplate = emailtemplate.replace('#TWITTER#', setting.twitter_url);
                         emailtemplate = emailtemplate.replace('#FACEBOOK#', setting.fb_url);
                         emailtemplate = emailtemplate.replace('#INSTAGRAM#', setting.instagram_url);
                         let subject = template.email_subject['PT'];
                         subject = subject.replace('#STATUS#', requestParam['status']);
                         subject = subject.replace('#SHIPMENT_ID#', requestParam['shipment_id']);
                         // let fromEmail = template.from_email;
                         let fromEmail = 'agromplace@gmail.com';
                         let data = {
                             from_email: template.from_name + ' <' + fromEmail + '>',
                             to_email: updatedUserData.email,
                             subject: subject,
                             description: emailtemplate
                         };
                         const params = {
                             Destination: {
                                 ToAddresses: [data.to_email]
                             },
                             Message: {
                                 Body: {
                                     Html: {
                                         Charset: 'UTF-8',
                                         Data: data.description
                                     }
                                 },
                                 Subject: {
                                     Charset: 'UTF-8',
                                     Data: data.subject
                                 }
                             },
                             ReturnPath: data.from_email,
                             Source: data.from_email,
                         };
 
                         ses.sendEmail(params, (err, data) => {
                             console.log(err);
                             console.log("Email sent.", data);
                             callbackSingleJob();
                         });
                         // console.log(data)
                         // mailgun.messages().send(data, function(error, body) {
                         //     console.log(error)
                         //     console.log(body)
                         //     callbackSingleJob();
                         // });
                     } else {
                         callbackSingleJob();
                     }
                 })
             });
         },function(){
             return false;
         });
     });
 };

exports.list = function (req, res) {
     let monthStartEndDates = getMonthDateRange(moment().format('YYYY'), moment().format('MM'));
     Order.find({ 'buyer_info.user_id': req.session.user_id, $and: [{ "delivery_at": { $gte: new Date(monthStartEndDates.start + 'T00:00:00.000Z') } }, { "delivery_at": { $lte: new Date(monthStartEndDates.end + 'T23:59:59.000Z') } }] }, { _id: 0 }, (err, orders) => {
          orders = JSON.parse(JSON.stringify(orders));
          _.each(orders, (element, index, list) => {
               _.each(element['products'], (inner_element, inner_index, inner_list) => {
                    orders[index]['products'][inner_index]['item_total'] = separators(inner_element.unit_price * inner_element.qty);
                    orders[index]['products'][inner_index]['unit_price'] = separators(inner_element.unit_price);
                    orders[index]['products'][inner_index]['product_qty'] = separatorsWD(inner_element.qty);
                    orders[index]['products'][inner_index]['category_title'] = inner_element.category_title[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['sub_category_title'] = inner_element.sub_category_title[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['unit_plural_title'] = inner_element.unit_plural_title[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['unit_type'] = inner_element.unit_type[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['description'] = inner_element.description[req.session.language || config.default_language_code];
                    orders[index]['products'][inner_index]['images'][0] = ((inner_element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + inner_element.images[0] : '../../../images/item-placeholder.png');
               })

               if (element.payment_type == 'atm_reference') {
                    orders[index]['atm_reference_response']['AMOUNT'] = separators(element.atm_reference_response.AMOUNT);

                    let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
                    let endDate = moment(moment(element.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

                    let days = endDate.diff(currentDate, 'days');
                    days++;
                    orders[index]['atm_reference_response']['TIME_LEFT'] = (days >= 0) ? (days + ' ' + labels['LBL_DAYS'][req.session.language]) : '';
               }

               orders[index]['total'] = separators(element.total);
               orders[index]['delivery_at'] = convert_date(element.delivery_at, req.session.language);
          })

          res.render('compradors/order/list', {
               user: {
                    user_id: req.session.user_id,
                    name: req.session.name,
                    user_type: req.session.user_type,
                    login_type: req.session.login_type
               },
               orders,
               start_date: monthStartEndDates.start,
               end_date: monthStartEndDates.end,
               moment,
               labels,
               language: req.session.language || 'PT',
               breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "compradors/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_YOUR_ORDERS'][(req.session.language || 'PT')] + "</li>",
               messages: req.flash('error') || req.flash('info'),
               messages: req.flash('info'),
          });
     }).sort({ created_at: -1 });
};

exports.actionBidders = function (req, res) {
     console.log(req.query);
     Order.findOne({ order_id: req.query.order_id }, { _id: 0, transporters: 1 }, (err, singleOrder) => {
          if (singleOrder) {
               let columnAndValues = {};
               let transporters = singleOrder.transporters;
               _.some(transporters, (element, index, list) => {
                    if (req.query.transporter_id == element.transporter_id && req.query.type == 'accept') {
                         transporters[index]['transporter_status'] = 'compradors_accepted';
                         return true;
                    } else if (req.query.transporter_id == element.transporter_id && req.query.type == 'reject') {
                         transporters[index]['transporter_status'] = 'none';
                         return true;
                    }
               })

               columnAndValues = {
                    transporters,
                    is_compradors_accepted: (req.query.type == 'accept') ? true : false
               }

               Order.update({ order_id: req.query.order_id }, columnAndValues, (err, update_response) => {
                    res.send({ code: 200 })
               })
          } else {
               res.send({ code: 404 })
          }
          return false;
     })
};

exports.details = function (req, res) {
     
     Order.findOne({ order_id: req.params.id }, { _id: 0 }, (err, singleOrder) => {
          if (!singleOrder) {
               return res.redirect(config.base_url + 'compradors/order/list');
          }

          singleOrder = JSON.parse(JSON.stringify(singleOrder));
          
          let transporters = singleOrder.transporters;
          let bidders = [];
          _.each(singleOrder.transporters, (element, index, list) => {
               if (element.is_bidded) {
                    bidders.push({
                         transporter_id: element.transporter_id,
                         name: element.name,
                         phone_number: element.mobile_country_code + element.phone_number,
                         bid_type: ((element.bid_type == 'fixed_bid') ? labels['LBL_FIXED_BID'][req.session.language || 'PT'] : labels['LBL_PRICE_PER_KM'][req.session.language || 'PT']),
                         bid_amount: separators(element.bid_amount),
                         transporter_status: element.transporter_status
                    })
               }
          })

          singleOrder['delivery_at'] = convert_date(singleOrder.delivery_at, req.session.language);
          let totalPacked = 0, totalShipped = 0, totalDelivered = 0;
          _.each(singleOrder['products'], (inner_element, inner_index, inner_list) => {
               if (inner_element.shipment_status == 'packed' || inner_element.shipment_status == 'shipped' || inner_element.shipment_status == 'delivered') {
                    totalPacked += 1;
               }
               if (inner_element.shipment_status == 'shipped' || inner_element.shipment_status == 'delivered') {
                    totalShipped += 1;
               }
               if (inner_element.shipment_status == 'delivered') {
                    totalDelivered += 1;
               }

               singleOrder['products'][inner_index]['item_total'] = separators(inner_element.unit_price * inner_element.qty);
               singleOrder['products'][inner_index]['unit_price'] = separators(inner_element.unit_price);
               singleOrder['products'][inner_index]['product_qty'] = separatorsWD(inner_element.qty);
               singleOrder['products'][inner_index]['category_title'] = inner_element.category_title[req.session.language || config.default_language_code];
               singleOrder['products'][inner_index]['sub_category_title'] = inner_element.sub_category_title[req.session.language || config.default_language_code];
               singleOrder['products'][inner_index]['unit_plural_title'] = inner_element.unit_plural_title[req.session.language || config.default_language_code];
               singleOrder['products'][inner_index]['unit_type'] = inner_element.unit_type[req.session.language || config.default_language_code];
               singleOrder['products'][inner_index]['description'] = inner_element.description[req.session.language || config.default_language_code];
               singleOrder['products'][inner_index]['images'][0] = ((inner_element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + inner_element.images[0] : '../../../images/item-placeholder.png');
          })

          if (singleOrder.payment_type == 'atm_reference') {
               singleOrder['atm_reference_response']['AMOUNT'] = separators(singleOrder.atm_reference_response.AMOUNT);

               let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
               let endDate = moment(moment(singleOrder.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

               let days = endDate.diff(currentDate, 'days');
               days++;
               singleOrder['atm_reference_response']['TIME_LEFT'] = (days >= 0) ? (days + ' ' + labels['LBL_DAYS'][req.session.language]) : '';
          }

          singleOrder['subtotal'] = separators(singleOrder['subtotal']);
          singleOrder['transport_fee'] = separators(singleOrder['transport_fee']);
          singleOrder['total'] = separators(singleOrder['total']);
          res.render('compradors/order/details', {
               user: {
                    user_id: req.session.user_id,
                    name: req.session.name,
                    user_type: req.session.user_type,
                    login_type: req.session.login_type
               },
               moment,
               order: singleOrder,
               total_cart_products: 0,
               totalProduct: singleOrder['products'].length,
               totalPacked: totalPacked,
               totalShipped: totalShipped,
               totalDelivered: totalDelivered,
               labels,
               bidders,
               language: req.session.language || 'PT',
               breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "compradors/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'><a href='" + config.base_url + "compradors/order/list'>" + labels['LBL_YOUR_ORDERS'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_ORDER_DETAILS'][(req.session.language || 'PT')] + "</li>",
               messages: req.flash('error') || req.flash('info'),
               messages: req.flash('info'),
          });
     });
};

exports.payment = function (req, res) {
     User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, email: 1, wallet: 1 }, (err, response) => {
          Order.findOne({ order_id: req.query.order_id }, { _id: 0, total: 1, transport_fee: 1, status: 1 }, (err, order) => {
               let deducted_amount = 0, status = '', payment_status = '';
               if (order.status == 'waiting') {
                    deducted_amount = order.total;
                    status = 'paid';
                    payment_status = 'paid';
               } else if (order.status == 'paid' && order.transport_fee > 0) {
                    deducted_amount = order.transport_fee;
                    status = 'transported';
                    payment_status = 'paid';
               } else {
                    return res.redirect('/compradors/order/list');
               }

               if (response.wallet >= deducted_amount) {
                    User.update({ user_id: req.session.user_id }, { $inc: { wallet: -deducted_amount } }, function (err, update_response) {
                         Order.update({ order_id: req.query.order_id }, { status, payment_status }, function (err, update_response) {
                              return res.redirect('/compradors/order/list');
                         })
                    })
               } else {
                    return res.redirect('/compradors/order/list');
               }
          });
     })
};

exports.cancel = (req, res) => {
     Product.findOne({ product_id: req.query.product_id }, { _id: 0, unit_value: 1 }, (err, product) => {
          let unit_value = parseFloat(product.unit_value) + parseFloat(req.query.qty);
          Product.update({ product_id: req.query.product_id }, { unit_value: unit_value }, function (err, update_response) {
               Order.update({ order_id: req.query.order_id }, { status: 'cancelled' }, function (err, update_response) {
                    return res.redirect('/compradors/order/list');
               })
          })
     });
}