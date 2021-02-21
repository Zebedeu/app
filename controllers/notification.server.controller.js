let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let labels = require('../utils/labels.json');
let config = require('../../config/config');
let idGenerator = require('../utils/id-generator');
let _ = require('underscore');
let moment = require('moment');
let WalletLog = require('mongoose').model('Wallet_log');
let NotificationLog = require('mongoose').model('Notification_log');

exports.list = function(req, res) {

	NotificationLog.find({ user_id: req.session.user_id }, { _id: 0, notification_log_id: 1, title: 1, description: 1, created_at: 1 }, (err, logs) => {
		logs = JSON.parse(JSON.stringify(logs));
		_.each(logs, (element, index, list) => {
			logs[index]['title'] = element.title[req.session.language || config.default_language_code];
			logs[index]['description'] = element.description[req.session.language || config.default_language_code];
			logs[index]['created_at'] = moment(element.created_at).format('Do MMM YYYY, hh:mm A');
		})

		res.render('notification/list', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			logs,
			labels,
			breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+req.session.user_type+"/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_BREADCRUMB_NOTIFICATION_TITLE'][(req.session.language || config.default_language_code)]+"</li>",
			language: req.session.language || config.default_language_code,
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	}).sort({ created_at:-1 }).limit(10)
};

exports.deleteNotifiy = function(req, res) {
	
	NotificationLog.find({ user_id: req.session.user_id }, { _id: 0, notification_log_id: 1, title: 1, description: 1, created_at: 1 }, (err, logs) => {
		logs = JSON.parse(JSON.stringify(logs));
		
		console.log(logs)


	}).sort({ created_at:-1 }).limit(1)
};