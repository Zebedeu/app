let _ = require('underscore');
let moment = require('moment');
let config = require('../../../config/config');
let Cart = require('mongoose').model('Cart');
let Unit = require('mongoose').model('Unit');
let Size = require('mongoose').model('Size');
let Product_variety = require('mongoose').model('Product_variety');
let Category = require('mongoose').model('Category');
let SubCategory = require('mongoose').model('Sub_category');
let ProductVariety = require('mongoose').model('Product_variety');
let Product = require('mongoose').model('Product');
let User = require('mongoose').model('User');
let Order = require('mongoose').model('Order');
let Notification_log = require('mongoose').model('Notification_log');
let labels = require('../../utils/labels.json');
let smsManager = require('../../utils/sms-manager');
let emailController = require('../email.server.controller');
let s3Manager = require('../../utils/s3-manager');

let { getMonthDateRange } = require('../../utils/date');
let {
     convert_date,
     separators,
     separatorsWD
} = require('../../utils/formatter');

exports.filterList = function (req, res) {
     Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] }, $and: [{ "delivery_at": { $gte: new Date(req.query.from_date + 'T00:00:00.000Z') } }, { "delivery_at": { $lte: new Date(req.query.to_date + 'T23:59:59.000Z') } }] }, { _id: 0 }, (err, orders) => {
          orders = JSON.parse(JSON.stringify(orders));
          _.each(orders, (element, index, list) => {
               let userProducts = [], subtotal = 0, total = 0;
               _.each(element['products'], (inner_element, inner_index, inner_list) => {
                    if (inner_element.user_info.user_id == req.session.user_id) {
                         let productObj = inner_element;
                         productObj['category_title'] = productObj.category_title[req.session.language || config.default_language_code];
                         productObj['sub_category_title'] = productObj.sub_category_title[req.session.language || config.default_language_code];
                         productObj['unit_plural_title'] = productObj.unit_plural_title[req.session.language || config.default_language_code];
                         productObj['unit_type'] = productObj.unit_type[req.session.language || config.default_language_code];
                         productObj['description'] = productObj.description[req.session.language || config.default_language_code];
                         productObj['images'][0] = ((productObj.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + productObj.images[0] : '../../../images/item-placeholder.png');
                         subtotal += (productObj.unit_price * productObj.qty);
                         total += (productObj.unit_price * productObj.qty);
                         productObj['item_total'] = separators(productObj.unit_price * productObj.qty);
                         productObj['unit_price'] = separators(productObj.unit_price);
                         productObj['quantity'] = separatorsWD(productObj.qty);
                         userProducts.push(productObj)
                    }
               })

               if (element.payment_type == 'atm_reference') {
                    orders[index]['atm_reference_response']['AMOUNT'] = separators(element.atm_reference_response.AMOUNT);

                    let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
                    let endDate = moment(moment(element.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

                    let days = endDate.diff(currentDate, 'days');
                    orders[index]['atm_reference_response']['TIME_LEFT'] = (days >= 0) ? (days + ' ' + labels['LBL_DAYS'][req.session.language]) : '';
               }

               orders[index]['delivery_at'] = convert_date(element.delivery_at, req.session.language);
               orders[index]['subtotal'] = separators(subtotal);
               orders[index]['total'] = separators(total);
               orders[index]['products'] = userProducts;
          })

          res.render('producers/order/filter-list', {
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

exports.list = async function (req, res) {
     let monthStartEndDates = getMonthDateRange(moment().format('YYYY'), moment().format('MM'));
     Order.find({ 'products.user_info.user_id': { $in: [req.session.user_id] }, $and: [{ "delivery_at": { $gte: new Date(monthStartEndDates.start + 'T00:00:00.000Z') } }, { "delivery_at": { $lte: new Date(monthStartEndDates.end + 'T23:59:59.000Z') } }] }, { _id: 0 }, async (err, orders) => {
          console.log(orders)
          orders = JSON.parse(JSON.stringify(orders));
          _.each(orders, async (element, index, list) => {
               let userProducts = [], subtotal = 0, total = 0;

               //productObj.unit_price = prod.unit_price;


               _.each(element['products'], async (inner_element, inner_index, inner_list) => {

                    if (inner_element.user_info.user_id == req.session.user_id) {

                         //let prod = await Product.findOne({product_id: inner_element.product_id });
                         inner_element.unit_price = (typeof inner_element.original_price !== undefined && inner_element.original_price > 0) ? inner_element.original_price : inner_element.unit_price;

                         let productObj = inner_element;
                         productObj['category_title'] = productObj.category_title[req.session.language || config.default_language_code];
                         productObj['sub_category_title'] = productObj.sub_category_title[req.session.language || config.default_language_code];
                         productObj['unit_plural_title'] = productObj.unit_plural_title[req.session.language || config.default_language_code];
                         productObj['unit_type'] = productObj.unit_type[req.session.language || config.default_language_code];
                         productObj['description'] = productObj.description[req.session.language || config.default_language_code];
                         productObj['images'][0] = ((productObj.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + productObj.images[0] : '../../../images/item-placeholder.png');
                         subtotal += (productObj.unit_price * productObj.qty);
                         total += (productObj.unit_price * productObj.qty);
                         productObj['item_total'] = separators(productObj.unit_price * productObj.qty);
                         productObj['unit_price'] = separators(productObj.unit_price);
                         productObj['quantity'] = separatorsWD(productObj.qty);
                         userProducts.push(productObj)
                    }
               })

               if (element.payment_type == 'atm_reference') {
                    orders[index]['atm_reference_response']['AMOUNT'] = separators(element.atm_reference_response.AMOUNT);

                    let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
                    let endDate = moment(moment(element.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

                    let days = endDate.diff(currentDate, 'days');
                    days++;
                    orders[index]['atm_reference_response']['TIME_LEFT'] = (days >= 0) ? (days + ' ' + labels['LBL_DAYS'][req.session.language]) : '';
               }

               orders[index]['delivery_at'] = convert_date(element.delivery_at, req.session.language);
               orders[index]['subtotal'] = separators(subtotal);
               orders[index]['total'] = separators(total);
               orders[index]['products'] = userProducts;
          })

          res.render('producers/order/list', {
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
               breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_YOUR_ORDERS_PRODUCERS'][(req.session.language || 'PT')] + "</li>",
               messages: req.flash('error') || req.flash('info'),
               messages: req.flash('info'),
          });
     }).sort({ created_at: -1 });
};

exports.details = function (req, res) {
     Order.findOne({ order_id: req.params.id }, { _id: 0 }, (err, singleOrder) => {
          if (!singleOrder) {
               return res.redirect(config.base_url + 'producers/order/list');
          }

          singleOrder = JSON.parse(JSON.stringify(singleOrder));
          let userProducts = [], subtotal = 0, totalPacked = 0,
               totalShipped = 0,
               totalDelivered = 0, total = 0;
          _.each(singleOrder['products'], (inner_element, inner_index, inner_list) => {
               if (inner_element.user_info.user_id == req.session.user_id) {
                    inner_element.unit_price = (typeof inner_element.original_price !== undefined && inner_element.original_price > 0) ? inner_element.original_price : inner_element.unit_price;

                    let productObj = inner_element;

                    if (inner_element.shipment_status == 'packed' || inner_element.shipment_status == 'shipped' || inner_element.shipment_status == 'delivered') {
                         totalPacked += 1;
                    }
                    if (inner_element.shipment_status == 'shipped' || inner_element.shipment_status == 'delivered') {
                         totalShipped += 1;
                    }
                    if (inner_element.shipment_status == 'delivered') {
                         totalDelivered += 1;
                    }

                    productObj['category_title'] = productObj.category_title[req.session.language || config.default_language_code];
                    productObj['sub_category_title'] = productObj.sub_category_title[req.session.language || config.default_language_code];
                    productObj['unit_plural_title'] = productObj.unit_plural_title[req.session.language || config.default_language_code];
                    productObj['unit_type'] = productObj.unit_type[req.session.language || config.default_language_code];
                    productObj['description'] = productObj.description[req.session.language || config.default_language_code];
                    productObj['images'][0] = ((productObj.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + productObj.images[0] : '../../../images/item-placeholder.png');
                    subtotal += (productObj.unit_price * productObj.qty);
                    total += (productObj.unit_price * productObj.qty);
                    productObj['item_total'] = separators(productObj.unit_price * productObj.qty);
                    productObj['unit_price'] = separators(productObj.unit_price);
                    productObj['quantity'] = separatorsWD(productObj.qty);
                    userProducts.push(productObj)
               }
          })

          if (singleOrder.payment_type == 'atm_reference') {
               singleOrder['atm_reference_response']['AMOUNT'] = separators(singleOrder.atm_reference_response.AMOUNT);

               let currentDate = moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD");
               let endDate = moment(moment(singleOrder.atm_reference_response.END_DATE).format('YYYY-MM-DD'), "YYYY-MM-DD");

               let days = endDate.diff(currentDate, 'days');
               days++;
               singleOrder['atm_reference_response']['TIME_LEFT'] = (days >= 0) ? (days + ' ' + labels['LBL_DAYS'][req.session.language]) : '';
          }

          singleOrder['delivery_at'] = convert_date(singleOrder.delivery_at, req.session.language);
          singleOrder['products'] = userProducts;

          res.render('producers/order/details', {
               user: {
                    user_id: req.session.user_id,
                    name: req.session.name,
                    user_type: req.session.user_type,
                    login_type: req.session.login_type
               },
               moment,
               order: singleOrder,
               subtotal: separators(subtotal),
               total: separators(total),
               totalProduct: singleOrder['products'].length,
               totalPacked: totalPacked,
               totalShipped: totalShipped,
               totalDelivered: totalDelivered,
               labels,
               language: req.session.language || 'PT',
               breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + "producers/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'><a href='" + config.base_url + "producers/order/list'>" + labels['LBL_YOUR_ORDERS_PRODUCERS'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_ORDER_DETAILS'][(req.session.language || 'PT')] + "</li>",
               messages: req.flash('error') || req.flash('info'),
               messages: req.flash('info'),
          });
     });
};

exports.changeShipmentStatus = function (req, res) {
     console.log("req.params.id", req.params.id)
     console.log("req.params.productID", req.params.productID)

     let _title = { EN: 'Kepya', PT: 'Kepya' };
     let _description = {
          EN: 'O produto #' + req.params.productID + ' está pronto para a recolha.',
          PT: 'O produto #' + req.params.productID + ' está pronto para a recolha.'
     };

     let sellerCaption = "O pedido " + req.params.id + " está pronto para a recolha.";
     let phone_number = 0;
     let notificationLogData = {}

     Order.findOne({ order_id: req.params.id }, (err, singleOrder) => {
          Product.findOne({ product_id: req.params.productID }, (err, product) => {
               console.log(product);
               console.log(product.description.PT);
               Unit.findOne({ unit_id: product.unit_type }, (err, unit) => {
                    console.log(unit.title.PT);
                    Product_variety.findOne({ product_variety_id: product.product_variety_id }, (err, product_variety) => {
                         console.log(product_variety.title.PT);
                         Size.findOne({ size_id: product.size }, (err, size) => {
                              console.log(size.title.PT);
                              User.findOne({ user_id: singleOrder.buyer_info.user_id }, (err, user) => {
                                   console.log(user)
                                   notificationLogData = [];
                                   notificationLogData = {
                                        notification_log_id: `${moment().unix()}${Math.floor((Math.random() * 99) + 11)}`,
                                        user_id: singleOrder.buyer_info.user_id,
                                        user_type: user.user_type,
                                        title: _title,
                                        description: _description,
                                   };
                                   phone_number = (user.mobile_country_code + user.phone_number);
                                   if (!singleOrder) {
                                        res.end(JSON.stringify({ status: "200" }));
                                        return;
                                   }
                                   let totalPackedProductsArr = _.where(singleOrder.products, { shipment_status: "packed" });
                                   let columnAndValues = {
                                        "products.$.shipment_status": 'packed'
                                   };
                                   if ((totalPackedProductsArr.length + 1) == singleOrder.products.length) {
                                        columnAndValues['status'] = 'packed';
                                   }

                                   let notificationUser = new Notification_log(notificationLogData);
                                   notificationUser.save((err, response) => {
                                        smsManager.sendSMS({ message: sellerCaption, mobile: phone_number });
                                        emailController.send({
                                             language: (req.session.language || 'PT'), code: 'ORDER_STATUS', estado: 'empacotado', email: user.email, order_id: req.params.id, client_name: (user.first_name + ' ' + user.last_name),
                                             product: product.description.PT, unit: unit.title.PT, product_variety: product_variety.title.PT, size: size.title.PT, qtd: product.unit_value + " " + unit.title.PT, harvest: moment(product.harvest_date).format('DD/MM/YYYY'), images: product.images
                                        });
                                   });
                                   Order.update({ order_id: req.params.id, products: { $elemMatch: { shipment_id: req.params.productID } } }, columnAndValues, function (err, response) {
                                        res.end(JSON.stringify({ status: "200" }));
                                        return;
                                   })
                              })
                         })
                    })
               })
          })
     })
};


const editResponse = (req, res, columnAndValues, product_id) => {
     Order.update({ product_id }, columnAndValues, function (err, response) {
               return res.redirect('list');
     })
};


exports.addInvoice = function(req, res) {

      console.log('----------')
          console.log(req)
          console.log('----------')

     Order.findOne({ order_id: req.params.id },  { _id: 0 }, (err, singleOrder) => {

          console.log(singleOrder)
          if(!singleOrder){
               return res.redirect('list1');
          }
          let imageArr = singleOrder.invoice;
         
          var columnAndValues = [];


                    if (!_.isEmpty(req.files)) {
                         console.log('File0: ', req.files);
                         if (Array.isArray(req.files.invoice)) {
                              console.log('File1: ', req.files);
                              async.forEachSeries(req.files.invoice, (singleFile, callbackSingleFile) => {
                                   if (_.contains(['jpeg', 'jpg', 'png'], singleFile.name.split('.').pop().toLowerCase())) {
                                        let fileObj = singleFile;
                                        let filePath = path.join(__dirname, "../../../upload/") + fileObj.name;
                                        let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + fileObj.name;

                                        fileObj.mv(filePath, function (err) {
                                             console.log('File2: ', req.files);
                                             if (err) {
                                                  console.log(err);
                                             }
                                             imagemagick.crop({
                                                  srcPath: filePath,
                                                  dstPath: dstFilePath,
                                                  width: 500,
                                                  height: 500,
                                                  quality: 1,
                                                  gravity: "North"
                                             }, function (err, stdout, stderr) {

                                                  console.log('File3: ', req.files);
                                                  const fileContent = fs.readFileSync(dstFilePath);
                                                  let fileObject = {
                                                       name: fileObj.name,
                                                       data: fileContent,
                                                       encoding: fileObj.encoding,
                                                       mimetype: fileObj.mimetype,
                                                       mv: fileObj.mv
                                                  }

                                                  s3Manager.uploadFileObj(fileObject, config.aws.s3.productBucket, 'product_', (error, url) => {
                                                       if (error) {
                                                            logger('Error: upload photo from aws s3 bucket. ' + error);
                                                            done(errors.internalServer(true), null);
                                                            return;
                                                       }

                                                       fs.unlinkSync(filePath);
                                                       fs.unlinkSync(dstFilePath);
                                                       imageArr.push(url.substring(url.lastIndexOf('/') + 1));
                                                       callbackSingleFile();
                                                  });
                                             });
                                        });
                                   } else {
                                        callbackSingleFile();
                                   }
                              }, function () {
                                   columnAndValues['invoice'] = imageArr;
                                   editResponse(req, res, columnAndValues, req.params.id);
                              });
                         } else {
                              console.log('File4: ', req.files);
                              if (_.contains(['jpeg', 'jpg', 'png'], req.files.invoice.name.split('.').pop().toLowerCase())) {
                                   let fileObj = req.files.invoice;
                                   let filePath = path.join(__dirname, "../../../upload/") + req.files.invoice.name;
                                   let dstFilePath = path.join(__dirname, "../../../upload/") + 'dst_' + req.files.invoice.name;
                                   fileObj.mv(filePath, function (err) {
                                        if (err) {
                                             console.log('File5_1: ', req.files);
                                             console.log(err);
                                        }

                                        imagemagick.crop({
                                             srcPath: filePath,
                                             dstPath: dstFilePath,
                                             width: 500,
                                             height: 500,
                                             quality: 1,
                                             gravity: "North"
                                        }, function (err, stdout, stderr) {
                                             const fileContent = fs.readFileSync(dstFilePath);
                                             let fileObject = {
                                                  name: req.files.invoice.name,
                                                  data: fileContent,
                                                  encoding: req.files.invoice.encoding,
                                                  mimetype: req.files.invoice.mimetype,
                                                  mv: req.files.invoice.mv
                                             }

                                             s3Manager.uploadFileObj(fileObject, config.aws.s3.productBucket, 'product_', (error, url) => {
                                                  if (error) {
                                                       logger('Error: upload photo from aws s3 bucket. ' + error);
                                                       done(errors.internalServer(true), null);
                                                       return;
                                                  }

                                                  fs.unlinkSync(filePath);
                                                  fs.unlinkSync(dstFilePath);

                                                  imageArr.push(url.substring(url.lastIndexOf('/') + 1));
                                                  columnAndValues['invoice'] = imageArr;
                                                  editResponse(req, res, columnAndValues, req.params.id);
                                             });
                                        });
                                   });
                              } else {
                                   columnAndValues['invoice'] = imageArr;
                                   editResponse(req, res, columnAndValues, req.params.id);
                              }
                         }
                    } else {
                         console.log('File6: ', req.files);
                         columnAndValues['invoice'] = imageArr;
                         editResponse(req, res, columnAndValues, req.params.id);
                    }

     })
};
