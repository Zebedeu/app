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
let pushTemplate = require('mongoose').model('Push_template');
let notificationLog = require('mongoose').model('Notification_log');

let Unit = require('mongoose').model('Unit');
let Size = require('mongoose').model('Size');
let smsManager = require('../../utils/sms-manager');
let emailController = require('../email.server.controller');

let Language = require('mongoose').model('Language');
let labels = require('../../utils/labels.json');
let { getMonthDateRange } = require('../../utils/date');
let {
     convert_date,
     separators,
     separatorsWD,
} = require('../../utils/formatter');

exports.filterList = function (req, res) {
     Order.find(
          {
               'products.producer_id': { $in: [req.session.user_id] },
               $and: [
                    {
                         delivery_at: {
                              $gte: new Date(
                                   req.query.from_date + 'T00:00:00.000Z'
                              ),
                         },
                    },
                    {
                         delivery_at: {
                              $lte: new Date(
                                   req.query.to_date + 'T23:59:59.000Z'
                              ),
                         },
                    },
               ],
          },
          { _id: 0 },
          (err, orders) => {
               orders = JSON.parse(JSON.stringify(orders));
               _.each(orders, (element, index, list) => {
                    let userProducts = [],
                         subtotal = 0,
                         total = 0;
                    _.each(
                         element['products'],
                         (inner_element, inner_index, inner_list) => {
                              if (
                                   inner_element.user_info.user_id ==
                                   req.session.user_id
                              ) {
                                   let productObj = inner_element;
                                   productObj['category_title'] =
                                        productObj.category_title[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['sub_category_title'] =
                                        productObj.sub_category_title[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['unit_plural_title'] =
                                        productObj.unit_plural_title[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['unit_type'] =
                                        productObj.unit_type[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['description'] =
                                        productObj.description[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['images'][0] =
                                        productObj.images.length > 0
                                             ? config.aws.prefix +
                                             config.aws.s3.productBucket +
                                             '/' +
                                             productObj.images[0]
                                             : '../../../images/item-placeholder.png';
                                   subtotal +=
                                        productObj.unit_price * productObj.qty;
                                   total +=
                                        productObj.unit_price * productObj.qty;
                                   productObj['item_total'] = separators(
                                        productObj.unit_price * productObj.qty
                                   );
                                   productObj['unit_price'] = separators(
                                        productObj.unit_price
                                   );
                                   productObj['quantity'] = separatorsWD(
                                        productObj.qty
                                   );
                                   userProducts.push(productObj);
                              }
                         }
                    );

                    if (element.payment_type == 'atm_reference') {
                         orders[index]['atm_reference_response'][
                              'AMOUNT'
                         ] = separators(element.atm_reference_response.AMOUNT);

                         let currentDate = moment(
                              moment().format('YYYY-MM-DD'),
                              'YYYY-MM-DD'
                         );
                         let endDate = moment(
                              moment(
                                   element.atm_reference_response.END_DATE
                              ).format('YYYY-MM-DD'),
                              'YYYY-MM-DD'
                         );

                         let days = endDate.diff(currentDate, 'days');
                         orders[index]['atm_reference_response']['TIME_LEFT'] =
                              days >= 0
                                   ? days +
                                   ' ' +
                                   labels['LBL_DAYS'][req.session.language]
                                   : '';
                    }

                    orders[index]['delivery_at'] = convert_date(
                         element.delivery_at,
                         req.session.language
                    );
                    orders[index]['subtotal'] = separators(subtotal);
                    orders[index]['total'] = separators(total);
                    orders[index]['products'] = userProducts;
               });

               res.render('farmer/order/filter-list', {
                    user: {
                         user_id: req.session.user_id,
                         name: req.session.name,
                         user_type: req.session.user_type,
                         login_type: req.session.login_type,
                    },
                    orders,
                    moment,
                    labels,
                    layout: false,
                    language: req.session.language || 'PT',
               });
          }
     ).sort({ created_at: -1 });
};

exports.list = function (req, res) {

     let monthStartEndDates = getMonthDateRange(
          moment().format('YYYY'),
          moment().format('MM')
     );
     Order.find(
          {
               'products.producer_id': { $in: [req.session.user_id] },
               $and: [
                    {
                         delivery_at: {
                              $gte: new Date(
                                   monthStartEndDates.start + 'T00:00:00.000Z'
                              ),
                         },
                    },
                    {
                         delivery_at: {
                              $lte: new Date(
                                   monthStartEndDates.end + 'T23:59:59.000Z'
                              ),
                         },
                    },
               ],
          },
          { _id: 0 },
          (err, orders) => {
               orders = JSON.parse(JSON.stringify(orders));
               console.log(orders);
               _.each(orders, (element, index, list) => {
                    let userProducts = [],
                         subtotal = 0,
                         total = 0;
                    _.each(
                         element['products'],
                         (inner_element, inner_index, inner_list) => {
                              if (
                                   inner_element.user_info.user_id ==
                                   req.session.user_id
                              ) {
                                   let productObj = inner_element;
                                   productObj['category_title'] =
                                        productObj.category_title[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['sub_category_title'] =
                                        productObj.sub_category_title[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['unit_plural_title'] =
                                        productObj.unit_plural_title[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['unit_type'] =
                                        productObj.unit_type[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['description'] =
                                        productObj.description[
                                        req.session.language ||
                                        config.default_language_code
                                        ];
                                   productObj['images'][0] =
                                        productObj.images.length > 0
                                             ? config.aws.prefix +
                                             config.aws.s3.productBucket +
                                             '/' +
                                             productObj.images[0]
                                             : '../../../images/item-placeholder.png';
                                   subtotal +=
                                        productObj.unit_price * productObj.qty;
                                   total +=
                                        productObj.unit_price * productObj.qty;
                                   productObj['item_total'] = separators(
                                        productObj.unit_price * productObj.qty
                                   );
                                   productObj['unit_price'] = separators(
                                        productObj.unit_price
                                   );
                                   productObj['quantity'] = separatorsWD(
                                        productObj.qty
                                   );
                                   userProducts.push(productObj);
                              }
                         }
                    );

                    if (element.payment_type == 'atm_reference') {
                         orders[index]['atm_reference_response'][
                              'AMOUNT'
                         ] = separators(element.atm_reference_response.AMOUNT);

                         let currentDate = moment(
                              moment().format('YYYY-MM-DD'),
                              'YYYY-MM-DD'
                         );
                         let endDate = moment(
                              moment(
                                   element.atm_reference_response.END_DATE
                              ).format('YYYY-MM-DD'),
                              'YYYY-MM-DD'
                         );

                         let days = endDate.diff(currentDate, 'days');
                         days++;
                         orders[index]['atm_reference_response']['TIME_LEFT'] =
                              days >= 0
                                   ? days +
                                   ' ' +
                                   labels['LBL_DAYS'][req.session.language]
                                   : '';
                    }

                    orders[index]['delivery_at'] = convert_date(
                         element.delivery_at,
                         req.session.language
                    );
                    orders[index]['subtotal'] = separators(subtotal);
                    orders[index]['total'] = separators(total);
                    orders[index]['products'] = userProducts;
               });

               res.render('farmer/order/list', {
                    user: {
                         user_id: req.session.user_id,
                         name: req.session.name,
                         user_type: req.session.user_type,
                         login_type: req.session.login_type,
                    },
                    orders,
                    start_date: monthStartEndDates.start,
                    end_date: monthStartEndDates.end,
                    moment,
                    labels,
                    language: req.session.language || 'PT',
                    breadcrumb:
                         "<li class='breadcrumb-item'><a href='" +
                         config.base_url +
                         "farmer/dashboard'>" +
                         labels['LBL_HOME'][req.session.language || 'PT'] +
                         "</a></li><li class='breadcrumb-item active' aria-current='page'>" +
                         labels['LBL_YOUR_ORDERS_AGGREGATOR'][
                         req.session.language || 'PT'
                         ] +
                         '</li>',
                    messages: req.flash('error') || req.flash('info'),
                    messages: req.flash('info'),
               });
          }
     ).sort({ created_at: -1 });
     
};
