let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let labels = require('../utils/labels.json');
let config = require('../../config/config');
let {  generateReference, generateRandom }   = require('../utils/id-generator');

let _ = require('underscore');
let moment = require('moment');
let Reference = require('mongoose').model('Reference');
let axios = require('axios');

exports.generate = async function(req, res) {
	let settingInfo = await Setting.findOne({}, { _id: 0, atm_reference_days: 1 });
    let singleUser = await User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, first_name: 1, last_name: 1, email: 1, phone_number: 1 });

	console.log(settingInfo)
    let referenceObj = new Reference({
		// user_type: 'compradors', // compradors OR trading
		user_type: req.session.user_type,
    	user_id: req.session.user_id,
    	source_id: generateReference(),
    	customer_name: singleUser.first_name,
    	email: singleUser.email,
    	phone_number: singleUser.phone_number,
    	amount: parseFloat(req.query.amount),
    	start_date: moment().format('YYYY-MM-DD'),
    	end_date: moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD").add(settingInfo.atm_reference_days, 'days'),
    	atm_reference_response: {}
    });

	referenceObj.save((err, response) => {
		console.log(response);
		res.send({ code: 200 });
		return false;
	})


	let data = JSON.stringify( {
        SOURCE_ID: generateRandom(null),
        CUSTOMER_NAME: singleUser.first_name,
        email: singleUser.email,
        PHONE_NUMBER: singleUser.phone_number,
        AMOUNT: parseFloat(req.query.amount),
        START_DATE: moment().format('YYYY-MM-DD'),
        END_DATE: moment(moment().format('YYYY-MM-DD'), "YYYY-MM-DD").add(settingInfo.atm_reference_days, 'days')
    })

	//console.log(data)

	axios({
		method: 'get',
		url: 'http://18.229.213.198:2000/references',
		data: data
	
	  }).then(atmRes => {
		  console.log(atmRes)
		res.send({ code: 200 });
	  })

	  
	// axios.post('http://18.229.213.198:2000/references', data).then((atmRes) => {
    // 	console.log(atmRes.data);

    //     console.log(req.query);
	// 	res.send({ code: 200 });
    // })
};