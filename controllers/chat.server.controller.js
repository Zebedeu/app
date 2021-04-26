let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let Administrator = require('mongoose').model('Administrator');
let labels = require('../utils/labels.json');
let config = require('../../config/config');
let idGenerator = require('../utils/id-generator');
let _ = require('underscore');
let moment = require('moment');
let { 
	convert_date,
	separators,
	separatorsWD
} = require('../utils/formatter');

exports.list = function(req, res) {
	Administrator.find({ status: 'active' }, { _id: 0, user_id: 1, name: 1, last_login_date: 1, email: 1 }, (err, administrators) => {
		res.render('chat/list', {
			user: {
				user_id: req.session.user_id,
				name: req.session.name,
				user_type: req.session.user_type,
				login_type: req.session.login_type
			},
			labels,
			administrators,
			moment,
			breadcrumb: "<li class='breadcrumb-item'><a href='"+config.base_url+req.session.user_type+"/dashboard'>"+labels['LBL_HOME'][(req.session.language || config.default_language_code)]+"</a></li><li class='breadcrumb-item active' aria-current='page'>"+labels['LBL_CHAT'][(req.session.language || config.default_language_code)]+"</li>",
			language: req.session.language || config.default_language_code,
			messages : req.flash('error') || req.flash('info'),
			messages : req.flash('info'),
		});
	})
};