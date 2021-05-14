let config = require('../../config/config');

let moment = require('moment');
let labels = require('../utils/labels.json');
let logger = require('../utils/logger');
let axios = require('axios');



exports.getKepyaIndex = async function (req, res) {

	
	try{
	var date = req.params.dateTo ? req.params.dateTo : new Date();
	var mercado  = req.params.mercado ? req.params.mercado : '30';
	var currentTime = moment(date).format("YYYY-MM-DD");

	var response = await axios.get("http://186.192.168.122:4000/api/v1/trace/mercado/"+mercado+"/start/"+ currentTime)

	var idx = response.data
	  return res.send(idx) ;	

	}catch(error) {
		console.error(error)
	}
}
exports.kepyaIndex = function (req, res) {


	res.render('kepyaindex', {
		user: {
			user_id: req.session.user_id,
			name: req.session.name,
			user_type: req.session.user_type,
			login_type: req.session.login_type
		},
		labels,
		moment,
		breadcrumb: "<li class='breadcrumb-item'><a href='" + config.base_url + req.session.user_type+"/dashboard'>" + labels['LBL_HOME'][(req.session.language || 'PT')] + "</a></li><li class='breadcrumb-item active' aria-current='page'>" + labels['LBL_KEPYA_INDEX'][(req.session.language || 'PT')] + "</li>",
		language: req.session.language || 'PT',
		messages: req.flash('error') || req.flash('info'),
		messages: req.flash('info')
	});

	
};
