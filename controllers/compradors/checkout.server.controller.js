let _ = require('underscore');
let moment = require('moment');
let async = require('async');
let config = require('../../../config/config');
const idGenerator = require('./../../utils/id-generator');
let s3Manager = require('../../utils/s3-manager');
let City = require('mongoose').model('City');
let Cart = require('mongoose').model('Cart');
let State = require('mongoose').model('State');
let Category = require('mongoose').model('Category');
let ProductVariety = require('mongoose').model('Product_variety');
let SubCategory = require('mongoose').model('Sub_category');
let Product = require('mongoose').model('Product');
let Setting = require('mongoose').model('Setting');
let Farmer = require('mongoose').model('Farmer');
let User = require('mongoose').model('User');
let LockedAmount = require('mongoose').model('Locked_amount');
let Order = require('mongoose').model('Order');
let WalletLog = require('mongoose').model('Wallet_log');
let emailController = require('../email.server.controller');
let labels = require('../../utils/labels.json');
let Sms_template = require('mongoose').model('Sms_template');
let Estimated_transportation = require('mongoose').model('Estimated_transportation');
let smsManager = require('../../utils/sms-manager');
const { generateRandom } = require('../../utils/id-generator');
const labelConstants = require('../../constants/label-constants');
let {
     convert_date,
     separators,
     separatorsWD
} = require('../../utils/formatter');
const axios = require('axios');
const { forEach } = require('p-iteration');

exports.getPaymentCaptions = async (req, res) => {
     Setting.findOne({}, { _id: 0, payment_captions: 1 }, (err, settings) => {
          res.send({
               wallet_caption: ((settings && settings.payment_captions && settings.payment_captions.wallet) ? settings.payment_captions.wallet[req.session.language || config.default_language_code] : ''),
               atm_reference_caption: ((settings && settings.payment_captions && settings.payment_captions.atm_reference) ? settings.payment_captions.atm_reference[req.session.language || config.default_language_code] : ''),
               payment_from_the_bank_caption: ((settings && settings.payment_captions && settings.payment_captions.payment_from_the_bank) ? settings.payment_captions.payment_from_the_bank[req.session.language || config.default_language_code] : '')
          })
          return;
     })
};

exports.reserveOrder = async (req, res) => {
     User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, first_name: 1, last_name: 1, email: 1, addresses: 1, mobile_country_code: 1, phone_number: 1 }, (err, singleUser) => {
          let addressObj = {};
          _.each(singleUser.addresses, (element, index, list) => {
               if (element.address_id == req.body.address_id) {
                    addressObj = {
                         address_id: element.address_id,
                         locality: element.locality,
                         city_district: element.city_name,
                         state: element.state_name,
                         name: element.name,
                         complete_address: element.complete_address,
                         mobile_country_code: element.mobile_country_code,
                         mobile_number: element.mobile_number,
                         email: element.email,
                         type: element.type
                    }
               }
          })

          Cart.aggregate([
               {
                    $lookup:
                    {
                         from: 'products',
                         localField: 'product_id',
                         foreignField: 'product_id',
                         as: 'productDetails'
                    }
               }, {
                    "$unwind": "$productDetails"
               }, {
                    $lookup:
                    {
                         from: 'users',
                         localField: 'productDetails.user_id',
                         foreignField: 'user_id',
                         as: 'userDetails'
                    }
               }, {
                    "$unwind": "$userDetails"
               }, {
                    $lookup:
                    {
                         from: 'categories',
                         localField: 'productDetails.category_id',
                         foreignField: 'category_id',
                         as: 'categoryDetails'
                    }
               }, {
                    "$unwind": "$categoryDetails"
               }, {
                    $lookup:
                    {
                         from: 'sub_categories',
                         localField: 'productDetails.sub_category_id',
                         foreignField: 'sub_category_id',
                         as: 'subCategoryDetails'
                    }
               }, {
                    "$unwind": "$subCategoryDetails"
               }, {
                    $match: {
                         user_id: req.session.user_id
                    },
               }, {
                    $lookup:
                    {
                         from: 'units',
                         localField: 'productDetails.unit_type',
                         foreignField: 'unit_id',
                         as: 'unitDetails'
                    }
               }, {
                    "$unwind": "$unitDetails"
               }, {
                    $lookup:
                    {
                         from: 'sizes',
                         localField: 'productDetails.size',
                         foreignField: 'size_id',
                         as: 'sizeDetails'
                    }
               }, {
                    "$unwind": "$sizeDetails"
               }, {
                    "$project": {
                         _id: 0,
                         category_id: "$categoryDetails.category_id",
                         category_title: "$categoryDetails.title",
                         sub_category_id: "$subCategoryDetails.sub_category_id",
                         sub_category_title: "$subCategoryDetails.title",
                         user_info: {
                              user_id: "$productDetails.user_id",
                              name: "$userDetails.first_name",
                              email: "$userDetails.email",
                              phone_number: "$userDetails.phone_number",
                              type: "$userDetails.user_type"
                         },
                         product_id: "$productDetails.product_id",
                         product_type: "$productDetails.product_type",
                         description: "$productDetails.description",
                         unit_plural_title: "$unitDetails.plural_title",
                         unit_type: "$unitDetails.title",
                         unit_value: "$productDetails.unit_value",
                         size: "$sizeDetails.title",
                         unit_price: "$productDetails.unit_price",
                         expire_date: "$productDetails.expire_date",
                         images: "$productDetails.images",
                         location: "$productDetails.location",
                         qty: "$qty"
                    }
               },
               {
                    $sort: { created_at: 1 }
               }
          ], (err, products) => {
               products = JSON.parse(JSON.stringify(products));
               let total = 0;
               _.each(products, (element, index, list) => {
                    products[index]['rating'] = '';
                    total += (element.qty * element.unit_price);
               })

               User.find({ user_type: 'transporters', status: 'active' }, { _id: 0, user_id: 1, name: 1, mobile_country_code: 1, phone_number: 1, device_details: 1 }, (err, transporters) => {
                    let transporterArr = [];
                    _.each(transporters, (element, index, list) => {
                         transporterArr.push({
                              transporter_id: element.user_id,
                              name: element.name,
                              mobile_country_code: element.mobile_country_code,
                              phone_number: element.phone_number,
                              is_bidded: false,
                              bid_type: 'none',
                              bid_amount: 0,
                              transporter_status: 'none'
                         })
                    });

                    let columnAndValues = {
                         buyer_info: {
                              user_id: singleUser.user_id,
                              name: singleUser.first_name,
                              email: singleUser.email,
                              phone_number: singleUser.phone_number
                         },
                         address_info: addressObj,
                         products,
                         delivery_at: new Date(),
                         payment_type: req.body.payment_type,
                         status: 'reserved',
                         payment_status: 'waiting',
                         transporters: transporterArr,
                         subtotal: total,
                         transport_fee: parseFloat(req.body.transport_fees),
                         total: (total + parseFloat(req.body.transport_fees))
                    }

                    let orderObj = new Order(columnAndValues);
                    orderObj.save((err, response) => {
                         updateProductsQuantity(products);

                         Cart.remove({ user_id: req.session.user_id }, (err, remove_response) => {
                              Sms_template.find({ code: { $in: ['ORDER_PLACED', 'SELLER_NEW_ORDER'] } }, { _id: 0, sms_template_id: 1, title: 1, code: 1, value: 1 }, (err, sms) => {
                                   let productStr = '', sellerInfoNo = [], sellerInfo = [], sellerInfoId = [], sellerInfoDetails = [];
                                   _.each(products, (element, index, list) => {
                                        if (!_.contains(sellerInfoId, element.user_info.user_id)) {
                                             sellerInfoId.push(element.user_info.user_id);
                                             sellerInfoDetails.push({
                                                  user_id: element.user_info.user_id,
                                                  user_type: element.user_info.type,
                                                  amount: (element.qty * element.unit_price)
                                             })
                                        } else {
                                             _.each(sellerInfoDetails, (element_inner, index_inner, list_inner) => {
                                                  if (element_inner.user_id == element.user_info.user_id) {
                                                       sellerInfoDetails[index_inner]['amount'] += (element.qty * element.unit_price);
                                                  }
                                             })
                                        }

                                        if (!_.contains(sellerInfoNo, element.user_info.phone_number)) {
                                             sellerInfoNo.push(element.user_info.phone_number);
                                             sellerInfo.push({
                                                  name: element.user_info.name,
                                                  phone_number: element.user_info.phone_number
                                             })
                                        }

                                        let productImg = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : config.base_url + 'images/item-placeholder.png');
                                        productStr += "<tr><td style='width: 15%;'><img src='" + productImg + "' style='width: 100%;'></td><td style='vertical-align: middle;'>" + element.category_title[req.session.language] + " - " + element.sub_category_title[req.session.language] + "</td><td style='font-size: 14px;vertical-align: middle;'>Quantity : " + element.qty + "</td><td style='font-size: 20px;vertical-align: middle;'>" + (parseFloat(element.unit_price)).toFixed(2) + "Kz /" + element.unit_type[req.session.language] + "</td><td style='font-size: 20px;vertical-align: middle;'>" + (parseFloat(element.qty * element.unit_price)).toFixed(2) + "Kz</td></tr>";
                                   })

                                   let orderPlacedCaption = {}, sellerNewOrderCaption = {};
                                   if (sms.length > 0) {
                                        orderPlacedCaption = _.findWhere(sms, { code: "ORDER_PLACED" });

                                        if (!_.isEmpty(orderPlacedCaption)) {
                                             let caption = (orderPlacedCaption['value'][req.session.language || 'EN']);
                                             caption = caption.replace("#NAME#", addressObj.name);
                                             caption = caption.replace("#ORDER_ID#", response.order_id);
                                             smsManager.sendSMS({ message: caption, mobile: addressObj.mobile_number });
                                        }

                                        sellerNewOrderCaption = _.findWhere(sms, { code: "SELLER_NEW_ORDER" });

                                        if (!_.isEmpty(sellerNewOrderCaption)) {
                                             let sellerCaption = (sellerNewOrderCaption['value'][req.session.language || 'EN']);
                                             sellerCaption = sellerCaption.replace("#ORDER_ID#", response.order_id);
                                             _.each(sellerInfo, (element, index, list) => {
                                                  sellerCaption = sellerCaption.replace("#NAME#", element.name);
                                                  smsManager.sendSMS({ message: sellerCaption, mobile: element.phone_number });
                                             })
                                        }
                                   }

                                   res.send({ code: 200, order_id: response.order_id });
                              })
                         })
                    })
               })
          })
     })
};

exports.placeOrder = async (req, res) => {
     let settingInfo = await Setting.findOne({}, { _id: 0, atm_reference_days: 1, kepya_commission: 1 });
     User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, first_name: 1, last_name: 1, email: 1, addresses: 1, mobile_country_code: 1, phone_number: 1, wallet: 1 }, (err, singleUser) => {
          let addressObj = {};
          _.each(singleUser.addresses, (element, index, list) => {
               if (element.address_id == req.body.address_id) {
                    addressObj = {
                         address_id: element.address_id,
                         locality: element.locality,
                         city_district: element.city_name,
                         state: element.state_name,
                         name: element.name,
                         complete_address: element.complete_address,
                         mobile_country_code: element.mobile_country_code,
                         mobile_number: element.mobile_number,
                         email: element.email,
                         type: element.type
                    }
               }
          })

          Cart.aggregate([
               {
                    $lookup:
                    {
                         from: 'products',
                         localField: 'product_id',
                         foreignField: 'product_id',
                         as: 'productDetails'
                    }
               }, {
                    "$unwind": "$productDetails"
               }, {
                    $lookup:
                    {
                         from: 'users',
                         localField: 'productDetails.user_id',
                         foreignField: 'user_id',
                         as: 'userDetails'
                    }
               }, {
                    "$unwind": "$userDetails"
               }, {
                    $lookup:
                    {
                         from: 'categories',
                         localField: 'productDetails.category_id',
                         foreignField: 'category_id',
                         as: 'categoryDetails'
                    }
               }, {
                    "$unwind": "$categoryDetails"
               }, {
                    $lookup:
                    {
                         from: 'sub_categories',
                         localField: 'productDetails.sub_category_id',
                         foreignField: 'sub_category_id',
                         as: 'subCategoryDetails'
                    }
               }, {
                    "$unwind": "$subCategoryDetails"
               }, {
                    $match: {
                         user_id: req.session.user_id
                    },
               }, {
                    $lookup:
                    {
                         from: 'units',
                         localField: 'productDetails.unit_type',
                         foreignField: 'unit_id',
                         as: 'unitDetails'
                    }
               }, {
                    "$unwind": "$unitDetails"
               }, {
                    $lookup:
                    {
                         from: 'sizes',
                         localField: 'productDetails.size',
                         foreignField: 'size_id',
                         as: 'sizeDetails'
                    }
               }, {
                    "$unwind": "$sizeDetails"
               }, {
                    "$project": {
                         _id: 0,
                         category_id: "$categoryDetails.category_id",
                         category_title: "$categoryDetails.title",
                         sub_category_id: "$subCategoryDetails.sub_category_id",
                         sub_category_title: "$subCategoryDetails.title",
                         user_info: {
                              user_id: "$productDetails.user_id",
                              name: "$userDetails.first_name",
                              email: "$userDetails.email",
                              mobile_country_code: "$userDetails.mobile_country_code",
                              phone_number: "$userDetails.phone_number",
                              type: "$userDetails.user_type"
                         },
                         kepya_commission: "$userDetails.kepya_commission",
                         product_id: "$productDetails.product_id",
                         shipment_id: "$productDetails.product_id",
                         shipment_status: "waiting",
                         product_type: "$productDetails.product_type",
                         description: "$productDetails.description",
                         unit_plural_title: "$unitDetails.plural_title",
                         unit_type: "$unitDetails.title",
                         unit_value: "$productDetails.unit_value",
                         size: "$sizeDetails.title",
                         unit_price: "$productDetails.unit_price",
                         expire_date: "$productDetails.expire_date",
                         images: "$productDetails.images",
                         location: "$productDetails.location",
                         qty: "$qty"
                    }
               },
               {
                    $sort: { created_at: 1 }
               }
          ], (err, products) => {
               console.log(products);
               products = JSON.parse(JSON.stringify(products));
               let total = 0;
               let productAmount = 0, sellerAmount = 0, kepyaCommission = 0;
               idGenerator.generateId(labelConstants.order, (err, ID) => {
                    order_id = ID;
               });
               _.each(products, (element, index, list) => {
                    element.original_price = element.unit_price;
                    
                    kepyaCommission = (element.kepya_commission) || ((settingInfo && settingInfo.kepya_commission) ? settingInfo.kepya_commission : 0);
                    productAmount = (element.qty * element.unit_price);
                    sellerAmount = (productAmount - ((productAmount * kepyaCommission) / 100));

                    let insertLockedAmount = {
                         order_id: order_id,
                         user_id: element.user_info.user_id,
                         shipment_id: element.shipment_id,
                         amount: sellerAmount
                    };
                    let LockedAmountObj = new LockedAmount(insertLockedAmount);
                    LockedAmountObj.save();
                    products[index]['rating'] = '';
                    products[index]['kepya_commission_percentage'] = kepyaCommission;
                    products[index]['kepya_commission'] = ((productAmount * kepyaCommission) / 100);
                    products[index]['seller_amount'] = sellerAmount;
                    total += productAmount;
               })

               User.find({ user_type: 'transporters', status: 'active' }, { _id: 0, user_id: 1, first_name: 1, mobile_country_code: 1, phone_number: 1, device_details: 1 }, (err, transporters) => {
                    let transporterArr = [];
                    if (req.body.transport_fees) {
                         transporters = [];
                    }

                    _.each(transporters, (element, index, list) => {
                         transporterArr.push({
                              transporter_id: element.user_id,
                              name: element.first_name,
                              mobile_country_code: element.mobile_country_code,
                              phone_number: element.phone_number,
                              is_bidded: false,
                              bid_type: 'none',
                              bid_amount: 0,
                              transporter_status: 'none'
                         })
                    });

                    let columnAndValues = {
                         buyer_info: {
                              user_id: singleUser.user_id,
                              name: singleUser.first_name,
                              email: singleUser.email,
                              phone_number: singleUser.phone_number
                         },
                         order_id,
                         address_info: addressObj,
                         products,
                         payment_type: req.body.payment_type,
                         status: (req.body.payment_type == 'wallet') ? 'paid' : 'waiting',
                         payment_status: (req.body.payment_type == 'wallet') ? 'paid' : 'waiting',
                         transporters: transporterArr,
                         subtotal: total,
                         transport_fee: parseFloat(req.body.transport_fees),
                         total: (total + parseFloat(req.body.transport_fees))
                    }

                    let orderObj = new Order(columnAndValues);
                    orderObj.save((err, response) => {
                         updateProductsQuantity(products);

                         let walletAmount = (total + parseFloat(req.body.transport_fees));
                         let logDescEN = labels['LBL_COMPRADOR_WALLET_DEDUCT_FOR_ORDER_DESCRIPTION']['EN'];
                         logDescEN = logDescEN.replace("#AMOUNT#", separators(walletAmount));
                         logDescEN = logDescEN.replace("#ORDER_ID#", response.order_id);

                         let logDescPT = labels['LBL_COMPRADOR_WALLET_DEDUCT_FOR_ORDER_DESCRIPTION']['PT'];
                         logDescPT = logDescPT.replace("#AMOUNT#", separators(walletAmount));
                         logDescPT = logDescPT.replace("#ORDER_ID#", response.order_id);
                         /*_.each(logDesc, (element, index, list) => {
                              let logDescription = element.replace("#AMOUNT#", separators(walletAmount));
                              logDescription = logDescription.replace("#ORDER_ID#", response.order_id);
                              logDesc[index] = logDescription;
                              console.log('Log : ',logDesc[index]);
                         })*/

                         let producerLogTitle = labels['LBL_PRODUCER_WALLET_ADD_FOR_ORDER_TITLE'];
                         let producerLogDesc = labels['LBL_PRODUCER_WALLET_ADD_FOR_ORDER_DESCRIPTION'];
                         let aggregatorLogTitle = labels['LBL_AGGREGATOR_WALLET_ADD_FOR_ORDER_TITLE'];
                         let aggregatorLogDesc = labels['LBL_AGGREGATOR_WALLET_ADD_FOR_ORDER_DESCRIPTION'];

                         Cart.remove({ user_id: req.session.user_id }, (err, remove_response) => {
                              Sms_template.find({ code: { $in: ['ORDER_PLACED', 'SELLER_NEW_ORDER'] } }, { _id: 0, sms_template_id: 1, title: 1, code: 1, value: 1 }, (err, sms) => {
                                   let productStr = '', sellerInfoNo = [], sellerInfo = [], sellerInfoId = [], sellerInfoDetails = [];
                                   _.each(products, (element, index, list) => {
                                        if (!_.contains(sellerInfoId, element.user_info.user_id)) {
                                             sellerInfoId.push(element.user_info.user_id);
                                             sellerInfoDetails.push({
                                                  user_id: element.user_info.user_id,
                                                  user_type: element.user_info.type,
                                                  amount: (element.qty * element.unit_price)
                                             })
                                        } else {
                                             _.each(sellerInfoDetails, (element_inner, index_inner, list_inner) => {
                                                  if (element_inner.user_id == element.user_info.user_id) {
                                                       sellerInfoDetails[index_inner]['amount'] += (element.qty * element.unit_price);
                                                  }
                                             })
                                        }

                                        if (!_.contains(sellerInfoNo, element.user_info.phone_number)) {
                                             sellerInfoNo.push(element.user_info.phone_number);
                                             sellerInfo.push({
                                                  name: element.user_info.name,
                                                  phone_number: element.user_info.mobile_country_code + element.user_info.phone_number
                                             })
                                        }

                                        let productImg = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : config.base_url + 'images/item-placeholder.png');
                                        productStr += "<tr><td style='width: 15%;'><img src='" + productImg + "' style='width: 100%;'></td><td style='vertical-align: middle;'>" + element.category_title[req.session.language] + " - " + element.sub_category_title[req.session.language] + "</td><td style='font-size: 14px;vertical-align: middle;'>Quantity : " + element.qty + "</td><td style='font-size: 20px;vertical-align: middle;'>" + (parseFloat(element.unit_price)).toFixed(2) + "Kz /" + element.unit_type[req.session.language] + "</td><td style='font-size: 20px;vertical-align: middle;'>" + (parseFloat(element.qty * element.unit_price)).toFixed(2) + "Kz </td></tr>";
                                   })

                                   _.each(sellerInfoDetails, (element_seller, index_seller, list_seller) => {
                                        let title, description = '';
                                        if (element_seller.user_type == 'aggregators') {
                                             title = aggregatorLogTitle;

                                             _.each(aggregatorLogDesc, (element, index, list) => {
                                                  aggregatorLogDesc[index] = aggregatorLogDesc[index].replace("#AMOUNT#", separators(element_seller.amount)).replace("#ORDER_ID#", response.order_id)
                                             })

                                             description = aggregatorLogDesc;
                                        } else {
                                             title = producerLogTitle;

                                             _.each(producerLogDesc, (element, index, list) => {
                                                  producerLogDesc[index] = producerLogDesc[index].replace("#AMOUNT#", separators(element_seller.amount)).replace("#ORDER_ID#", response.order_id)
                                             })

                                             description = producerLogDesc;
                                        }
                                   })

                                   let userProfileObj = { $inc: { 'statistics.total_purchase_products': products.length } };
                                   if (req.body.payment_type == 'wallet') {
                                        userProfileObj = { $inc: { 'statistics.total_purchase_products': products.length, wallet: -parseFloat(walletAmount) } };

                                        let walletArr = [{
                                             wallet_log_id: generateRandom(labelConstants.wallet_log),
                                             user_id: req.session.user_id,
                                             user_type: req.session.user_type,
                                             type: 'sub',
                                             title: labels['LBL_COMPRADOR_WALLET_DEDUCT_FOR_ORDER_TITLE'],
                                             description: {
                                                  "EN": logDescEN,
                                                  "PT": logDescPT
                                             },
                                             amount: parseFloat(walletAmount),
                                             remaining_balance: (singleUser.wallet - parseFloat(walletAmount))
                                        }];

                                        WalletLog.insertMany(walletArr);
                                   }

                                   User.update({ user_id: singleUser.user_id }, userProfileObj, function (err, update_response) { });

                                   if (addressObj.email) {
                                        emailController.send({ language: (req.session.language || 'EN'), code: 'INVOICE', email: addressObj.email, order_id: response.order_id, client_name: (singleUser.first_name + ' ' + singleUser.first_name), address_type: (_.isEmpty(addressObj) ? '' : (addressObj.type)).toUpperCase(), address_name: addressObj.name, full_address: (_.isEmpty(addressObj) ? '' : (addressObj.complete_address + ', ' + addressObj.locality + ', ' + addressObj.city_district + ', ' + addressObj.state + ', ' + addressObj.pin_code)), sub_total: parseFloat(total).toFixed(2), transport_fees: parseFloat(req.body.transport_fees), total: parseFloat((total + parseFloat(req.body.transport_fees))).toFixed(2), delivery_date: moment().format('Do MMM YYYY, hh:mm A'), products: productStr });
                                   }

                                   let orderPlacedCaption = {}, sellerNewOrderCaption = {};
                                   if (sms.length > 0) {
                                        orderPlacedCaption = _.findWhere(sms, { code: "ORDER_PLACED" });
                                        console.log("addressObj", addressObj);
                                        if (!_.isEmpty(orderPlacedCaption) && addressObj.mobile_country_code && addressObj.mobile_number) {
                                             console.log('send sms');
                                             let caption = (orderPlacedCaption['value'][req.session.language || 'EN']);
                                             caption = caption.replace("#NAME#", addressObj.name);
                                             caption = caption.replace("#ORDER_ID#", response.order_id);
                                             smsManager.sendSMS({ message: caption, mobile: addressObj.mobile_country_code + addressObj.mobile_number });
                                        }

                                        sellerNewOrderCaption = _.findWhere(sms, { code: "SELLER_NEW_ORDER" });

                                        if (!_.isEmpty(sellerNewOrderCaption)) {
                                             let sellerCaption = (sellerNewOrderCaption['value'][req.session.language || 'EN']);
                                             sellerCaption = sellerCaption.replace("#ORDER_ID#", response.order_id);
                                             _.each(sellerInfo, (element, index, list) => {
                                                  sellerCaption = sellerCaption.replace("#NAME#", element.name);
                                                  smsManager.sendSMS({ message: sellerCaption, mobile: element.phone_number });
                                             })
                                        }
                                   }

                                   _.each(transporters, (element, index, list) => {
                                        config.firebase.firebaseDBRef.ref('assigned_trips/' + element.user_id + '/').set({ status: 'pending_' + response.order_id });
                                   });

                                   if (req.body.payment_type == 'atm_reference') {
                                        axios.post('http://18.229.213.198:2000/references', {
                                             SOURCE_ID: response.order_id,
                                             CUSTOMER_NAME: singleUser.first_name,
                                             email: singleUser.email,
                                             PHONE_NUMBER: singleUser.phone_number,
                                             AMOUNT: (total + parseFloat(req.body.transport_fees)),
                                             START_DATE: moment().format('YYYY-MM-DD'),
                                             END_DATE: moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD").add(settingInfo.atm_reference_days, 'days')
                                        }).then((atmRes) => {
                                             Order.update({ order_id: response.order_id }, { atm_reference_response: atmRes.data }, function (err, update_response) {
                                                  res.send({ code: 200, order_id: response.order_id });
                                             });
                                        })
                                   } else {
                                        res.send({ code: 200, order_id: response.order_id });
                                   }
                              })
                         })
                    })
               })
          })
     })
};

exports.transport_fees = async (req, res) => {
     let settingInfo = await Setting.findOne({}, { _id: 0, reserve_order_hrs: 1 });
     let userInfo = await User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, email: 1, addresses: 1, phone_number: 1, wallet: 1 });
     let products = await Cart.aggregate([
          {
               $lookup:
               {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'productDetails'
               }
          }, {
               "$unwind": "$productDetails"
          }, {
               $lookup:
               {
                    from: 'states',
                    localField: 'productDetails.state_id',
                    foreignField: 'state_id',
                    as: 'statesDetails'
               }
          }, {
               "$unwind": "$statesDetails"
          }, {
               $match: {
                    user_id: req.session.user_id
               },
          }, {
               "$project": {
                    _id: 0,
                    state_id: "$statesDetails.state_id",
                    state_name: "$statesDetails.name"
               }
          }
     ]);

     let transportFees = 0, to_state_id = '';

     if (userInfo && userInfo.addresses.length > 0) {
          if (req.body.address_id) {
               console.log("userInfo.addresses", userInfo.addresses)
               let addressList = JSON.parse(JSON.stringify(userInfo.addresses));
               console.log("userInfo.addressList", addressList)
               let addresses = _.where(addressList, { address_id: parseInt(req.body.address_id) });
               console.log("addresses", addresses);
               to_state_id = addresses[0] ? addresses[0]['state'] : "";
          } else {
               let addresses = userInfo.addresses.reverse();
               to_state_id = addresses[0]['state'];
          }
     }
     await forEach(products, async (product) => {
          console.log("origin:", product.state_id, "to: ", to_state_id);
          let transportFeesRes = await Estimated_transportation.findOne({ origin: product.state_id, to: to_state_id }, { _id: 0, estimated_transportation_id: 1, price: 1 });
          console.log("transportFeesRes", transportFeesRes);
          if (transportFeesRes) {
               transportFees += transportFeesRes.price;
          }
     })

     res.send({ transport_fees: transportFees, reserve_order_hrs: settingInfo.reserve_order_hrs || 0 });
};

exports.getBankInformation = async (req, res) => {
     Setting.findOne({}, { _id: 0, bank_information: 1 }, (err, setting) => {
          res.send({ response: { account_no: (setting) ? setting.bank_information.account_no : '', code: (setting) ? setting.bank_information.code : '', company_name: (setting) ? setting.bank_information.company_name : '' } })
     })
};

exports.list = async (req, res) => {
     let userInfo = await User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, name: 1, email: 1, addresses: 1, phone_number: 1, wallet: 1 });
     let transportFees = 0;
     if (userInfo && userInfo.addresses.length > 0) {
          let addresses = userInfo.addresses.reverse();
          let state_id = addresses[0]['state'];

          let transportFeesRes = await Estimated_transportation.findOne({ origin: state_id }, { _id: 0, estimated_transportation_id: 1, price: 1 });
          if (transportFeesRes) {
               transportFees = transportFeesRes.price;
          }
     }

     Cart.aggregate([
          {
               $lookup:
               {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'productDetails'
               }
          }, {
               "$unwind": "$productDetails"
          }, {
               $lookup:
               {
                    from: 'categories',
                    localField: 'productDetails.category_id',
                    foreignField: 'category_id',
                    as: 'categoryDetails'
               }
          }, {
               "$unwind": "$categoryDetails"
          }, {
               $lookup:
               {
                    from: 'sub_categories',
                    localField: 'productDetails.sub_category_id',
                    foreignField: 'sub_category_id',
                    as: 'subCategoryDetails'
               }
          }, {
               "$unwind": "$subCategoryDetails"
          }, {
               $match: {
                    user_id: req.session.user_id
               },
          }, {
               $lookup:
               {
                    from: 'units',
                    localField: 'productDetails.unit_type',
                    foreignField: 'unit_id',
                    as: 'unitDetails'
               }
          }, {
               "$unwind": "$unitDetails"
          }, {
               "$project": {
                    _id: 0,
                    category_title: "$categoryDetails.title",
                    sub_category_title: "$subCategoryDetails.title",
                    product_id: "$productDetails.product_id",
                    product_type: "$productDetails.product_type",
                    description: "$productDetails.description",
                    unit_plural_title: "$unitDetails.plural_title",
                    unit_type: "$unitDetails.title",
                    unit_value: "$productDetails.unit_value",
                    unit_price: "$productDetails.unit_price",
                    expire_date: "$productDetails.expire_date",
                    images: "$productDetails.images",
                    qty: "$qty"
               }
          },
          {
               $sort: { 'productDetails.unit_price': -1 }
          }
     ], (err, products) => {
          products = JSON.parse(JSON.stringify(products));
          let total = 0;
          _.each(products, (element, index, list) => {
               products[index]['category_title'] = element.category_title[req.session.language || config.default_language_code];
               products[index]['sub_category_title'] = element.sub_category_title[req.session.language || config.default_language_code];
               products[index]['unit_plural_title'] = element.unit_plural_title[req.session.language || config.default_language_code];
               products[index]['unit_type'] = element.unit_type[req.session.language || config.default_language_code];
               products[index]['images'][0] = ((element.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + element.images[0] : '../../../images/item-placeholder.png');
               total += (element.qty * element.unit_price);
          })

          res.render('compradors/checkout/list', {
               user: {
                    user_id: req.session.user_id,
                    name: req.session.name,
                    user_type: req.session.user_type,
                    login_type: req.session.login_type
               },
               addresses: (userInfo.addresses.length > 0) ? userInfo.addresses.reverse() : [],
               products,
               transportFees,
               wallet: (userInfo) ? userInfo.wallet : 0,
               subtotal: total,
               total: total,
               labels,
               language: req.session.language || 'EN',
               breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "compradors/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'><a href='" + config.base_url + "compradors/explore/list'>" + labels['LBL_EXPLORE'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_CHECKOUT'][(req.session.language || config.default_language_code)] + "</li>",
               messages: req.flash('error') || req.flash('info'),
               messages: req.flash('info'),
          });
     })
};

updateProductsQuantity = (requestParam) => {
     let promises = [];

     function updateData(value) {
          return new Promise(async (resolve, reject) => {
               let productInfo = await Product.findOne({ product_id: value.product_id }, { _id: 0, product_id: 1, remaining_unit_value: 1, unit_value: 1, state_id: 1, producer_id: 1 });
               if (!productInfo.remaining_unit_value || productInfo.remaining_unit_value == 0) {
                    productInfo.remaining_unit_value = productInfo.unit_value;
               }
               let remaining_unit_value = parseFloat(productInfo.remaining_unit_value) - parseFloat(value.qty);
               Product.update({ product_id: value.product_id }, { remaining_unit_value: remaining_unit_value, $inc: { total_orders: 1 } }, (err, response) => {
                    State.update({ state_id: productInfo.state_id }, { $inc: { total_orders: 1 } }, (err, response) => {
                         if (productInfo.producer_id) {
                              Farmer.update({ farmer_id: productInfo.producer_id }, { $inc: { total_orders: 1 } }, (err, response) => {
                                   resolve();
                              })
                         } else {
                              resolve();
                         }
                    })
               });
          });
     }

     for (var i = 0; i < requestParam.length; i++) {
          promises.push(updateData(requestParam[i]));
     }

     Promise.all(promises)
          .then(() => {
               return false;
          })
          .catch((e) => {
               console.log(e);
          });
}

updateWalletBalance = (requestParam, payment_type) => {
     let promises = [];

     function updateData(value) {
          return new Promise(async (resolve, reject) => {
               let columnAndValues = {};
               if (value.user_type == 'compradors' && payment_type == 'wallet') {
                    columnAndValues = {
                         $inc: {
                              wallet: - parseFloat(value.amount),
                              'statistics.total_purchase': parseFloat(value.amount)
                         },
                    }
               } else {
                    columnAndValues = {
                         $inc: {
                              wallet: + parseFloat(value.amount),
                              'statistics.total_sales': parseFloat(value.amount)
                         }
                    }
               }

               if (_isEmpty(columnAndValues)) {
                    resolve();
                    return;
               }

               User.update({ user_id: value.user_id }, columnAndValues, function (err, update_response) {
                    resolve();
               });
          });
     }

     for (var i = 0; i < requestParam.length; i++) {
          promises.push(updateData(requestParam[i]));
     }

     Promise.all(promises)
          .then(() => {
               return false;
          })
          .catch((e) => {
               console.log(e);
          });
}