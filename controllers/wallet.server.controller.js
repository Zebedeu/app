let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let labels = require('../utils/labels.json');
let config = require('../../config/config');
let LockedAmount = require('mongoose').model('Locked_amount');
let idGenerator = require('../utils/id-generator');
let _ = require('underscore');
let moment = require('moment');
let WalletLog = require('mongoose').model('Wallet_log');
let WithDrawRequest = require('mongoose').model('WithDraw_Request');
let {
     convert_date,
     separators,
     separatorsWD
} = require('../utils/formatter');

exports.withdrawalMoney = function (req, res) {
     User.findOne({ user_id: req.session.user_id }, { _id: 0, wallet: 1, bank_name: 1, bank_account_no: 1 }, (err, singleUser) => {
          let walletBalance = singleUser.wallet;
          let withDrawAmount = (parseFloat(req.body.wallet) >= walletBalance) ? walletBalance : parseFloat(req.body.wallet);
          let remainingAmount = (walletBalance - withDrawAmount);

          User.update({ user_id: req.session.user_id }, { wallet: remainingAmount }, function (err, response) {
               let walletObj = new WithDrawRequest({
                    user_id: req.session.user_id,
                    user_type: req.session.user_type,
                    amount: withDrawAmount
               });

               walletObj.save((err, response) => {
                    let bank_account_no = new Array(singleUser.bank_account_no.length - 3).join('x') + singleUser.bank_account_no.substr(singleUser.bank_account_no.length - 4, 4);
                    let message = labels['LBL_WALLET_WITHDRAWAL_MONEY_MESSAGE'][req.session.language || config.default_language_code];
                    message = message.replace('#BANK_INFO#', singleUser.bank_name + ' (' + bank_account_no + ')');
                    res.send({ code: 200, message, remaining_amount: separators(remainingAmount) })
                    return false;
               })
          })
     })
};

exports.list = function (req, res) {
     User.findOne({ user_id: req.session.user_id }, { _id: 0, wallet: 1, bank_name: 1, bank_account_no: 1 }, (err, singleUser) => {
          LockedAmount.aggregate({ $match: { user_id: req.session.user_id } }, { $group: { _id: null, lockAmountSum: { $sum: "$amount" } } }, (err, lockAmountData) => {
               let lockAmountSum = (lockAmountData.length > 0) ? lockAmountData[0].lockAmountSum : 0;
               WalletLog.find({ user_id: req.session.user_id }, { _id: 0 }, (err, logs) => {
                    logs = JSON.parse(JSON.stringify(logs));
                    _.each(logs, (element, index, list) => {
                         logs[index]['title'] = element.title[req.session.language || config.default_language_code];
                         logs[index]['description'] = element.description[req.session.language || config.default_language_code];
                         logs[index]['amount'] = separators(element.amount);
                         logs[index]['remaining_balance'] = separators(element.remaining_balance);
                         logs[index]['created_at'] = convert_date(element.created_at, req.session.language);
                    })
                    const path = req.session.user_type;
                    res.render('wallet/list', {
                         user: {
                              user_id: req.session.user_id,
                              name: req.session.name,
                              user_type: req.session.user_type,
                              login_type: req.session.login_type
                         },
                         logs,
                         labels,
                         wallet: separators(singleUser.wallet),
                         lockedAmount: separators(lockAmountSum),
                         walletAccountBalance: separators(singleUser.wallet + lockAmountSum),
                         is_wallet_enable: (singleUser.bank_name && singleUser.bank_account_no) ? true : false,
                         breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + path + "/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_WALLET'][(req.session.language || config.default_language_code)] + "</li>",
                         language: req.session.language || config.default_language_code,
                         messages: req.flash('error') || req.flash('info'),
                         messages: req.flash('info'),
                    });
               }).sort({ created_at: -1 }).limit(10)
          })
     })
};

exports.transactions = function (req, res) {

     let columnAndValues = {
          $and: [
               { "created_at": { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') } },
               { "created_at": { $lte: new Date(moment().format('YYYY-MM-DD') + 'T23:59:59.000Z') } }
          ],
          user_id: req.session.user_id
     };

     if (req.query.from_date && req.query.to_date) {
          columnAndValues = {
               $and: [
                    { "created_at": { $gte: new Date(moment(req.query.from_date).format('YYYY-MM-DD') + 'T00:00:00.000Z') } },
                    { "created_at": { $lte: new Date(moment(req.query.to_date).format('YYYY-MM-DD') + 'T23:59:59.000Z') } }
               ],
               user_id: req.session.user_id
          };
     }

     WalletLog.find(columnAndValues, { _id: 0 }, (err, logs) => {
          if (req.query.from_date && req.query.to_date) {
               let ajaxContent = "";
               if (logs.length > 0) {
                    let title = '', description = '', created_at = '', amount = '', remaining_balance="";
                    _.each(logs, (element, index, list) => {

                         title = element.title[req.session.language || config.default_language_code];
                         description = element.description[req.session.language || config.default_language_code];
                         valueChecked = element.remaining_balance;
                         if( valueChecked > 0 ) {
                              remaining_balance = '<span class="wallet-currency-add-color">' + separators(valueChecked) + ' Kz </span>';

                         }else{
                              remaining_balance = separators(valueChecked) + ' Kz ';

                         } 
                         created_at = convert_date(element.created_at, req.session.language);
                         amount = (element.type == 'add') ? ( '<span class="wallet-currency-add-color">' + separators(element.amount)+ ' Kz </span>') : ( ' - ' + separators(element.amount)+ ' Kz ');

                         ajaxContent += "<tr><td>" + created_at + "</td><td>" + description + "</td><td class='wallet_amount'>" + amount + "</td><td class='wallet_amount'>" + remaining_balance + "</td></tr>";
                    })
               } else {
                    ajaxContent = "<tr><td colspan='4'>" + labels['LBL_WALLET_NO_RECORD_AVAILABLE'][(req.session.language || config.default_language_code)] + "</td></tr>";
               }

               res.send(ajaxContent);
               return false;
          } else {
               logs = JSON.parse(JSON.stringify(logs));
               _.each(logs, (element, index, list) => {

                    console.log(element)

                    logs[index]['title'] = element.title[req.session.language || config.default_language_code];
                    logs[index]['amount'] = separators(element.amount);
                    logs[index]['remaining_balance'] = separators(element.remaining_balance);
                    logs[index]['description'] = element.description[req.session.language || config.default_language_code];
                    logs[index]['created_at'] = convert_date(element.created_at, req.session.language);
               })
               const path = req.session.user_type;

               res.render('wallet/transactions', {
                    user: {
                         user_id: req.session.user_id,
                         name: req.session.name,
                         user_type: req.session.user_type,
                         login_type: req.session.login_type
                    },
                    current_date: moment().format('YYYY-MM-DD'),
                    logs,
                    labels,
                    breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + path + "/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_WALLET_BREADCRUMB_TRANSACTION'][(req.session.language || config.default_language_code)] + "</li>",
                    language: req.session.language || config.default_language_code,
                    messages: req.flash('error') || req.flash('info'),
                    messages: req.flash('info'),
               });
          }
     }).sort({ created_at: -1 })
};

exports.withdrawalRequests = function (req, res) {
     let columnAndValues = {
          $and: [
               { "created_at": { $gte: new Date(moment().format('YYYY-MM-DD') + 'T00:00:00.000Z') } },
               { "created_at": { $lte: new Date(moment().format('YYYY-MM-DD') + 'T23:59:59.000Z') } }
          ],
          user_id: req.session.user_id
     };

     if (req.query.from_date && req.query.to_date) {
          columnAndValues = {
               $and: [
                    { "created_at": { $gte: new Date(moment(req.query.from_date).format('YYYY-MM-DD') + 'T00:00:00.000Z') } },
                    { "created_at": { $lte: new Date(moment(req.query.to_date).format('YYYY-MM-DD') + 'T23:59:59.000Z') } }
               ],
               user_id: req.session.user_id
          };
     }

     WithDrawRequest.find(columnAndValues, { _id: 0, withdraw_request_id: 1, amount: 1, status: 1, created_at: 1 }, (err, logs) => {
          if (req.query.from_date && req.query.to_date) {
               let ajaxContent = "";
               if (logs.length > 0) {
                    let created_at = '', amount = '', status = '';
                    _.each(logs, (element, index, list) => {

                         console.log(element)
                         created_at = convert_date(element.created_at, req.session.language);
                         amount = ' - ' + separators(element.amount) + ' Kz ';

                         if (element.status == 'pending') {
                              status = labels['LBL_WITHDRAWAL_REQUEST_STATUS_PENDING'][(req.session.language || config.default_language_code)];
                         } else if (element.status == 'completed') {
                              status = labels['LBL_WITHDRAWAL_REQUEST_STATUS_COMPLETED'][(req.session.language || config.default_language_code)];
                         } else if (element.status == 'cancelled') {
                              status = labels['LBL_WITHDRAWAL_REQUEST_STATUS_CANCELLED'][(req.session.language || config.default_language_code)];
                         }

                         ajaxContent += "<tr><td>" + created_at + "</td><td>" + element.withdraw_request_id + "</td><td class='capitalize'>" + status + "</td><td class='wallet_amount'>" + amount + "</td></tr>";
                    })
               } else {
                    ajaxContent = "<tr><td colspan='4'>" + labels['LBL_WALLET_NO_RECORD_AVAILABLE'][(req.session.language || config.default_language_code)] + "</td></tr>";
               }

               res.send(ajaxContent);
               return false;
          } else {
               logs = JSON.parse(JSON.stringify(logs));
               _.each(logs, (element, index, list) => {
                    logs[index]['created_at'] = convert_date(element.created_at, req.session.language);
               })
               const path = req.session.user_type;
               res.render('wallet/withdrawal-requests', {
                    user: {
                         user_id: req.session.user_id,
                         name: req.session.name,
                         user_type: req.session.user_type,
                         login_type: req.session.login_type
                    },
                    current_date: moment().format('YYYY-MM-DD'),
                    logs,
                    labels,
                    breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + path + "/dashboard'>" + labels['LBL_HOME'][(req.session.language || config.default_language_code)] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_WALLET_BREADCRUMB_WITHDRAWAL_REQUESTS'][(req.session.language || config.default_language_code)] + "</li>",
                    language: req.session.language || config.default_language_code,
                    messages: req.flash('error') || req.flash('info'),
                    messages: req.flash('info'),
               });
          }
     }).sort({ created_at: -1 })
};