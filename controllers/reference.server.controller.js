let User = require('mongoose').model('User');
let Setting = require('mongoose').model('Setting');
let labels = require('../utils/labels.json');
let config = require('../../config/config');
let { generateReference, generateRandom } = require('../utils/id-generator');

let _ = require('underscore');
let moment = require('moment');
let Reference = require('mongoose').model('Reference');
let axios = require('axios');

exports.generate = async function (req, res) {
	let settingInfo = await Setting.findOne({}, { _id: 0, atm_reference_days: 1 });
	let singleUser = await User.findOne({ user_id: req.session.user_id }, { _id: 0, user_id: 1, first_name: 1, last_name: 1, email: 1, phone_number: 1 });

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

	const today = moment();
	const nextData = today.add(settingInfo.atm_reference_days, 'days');
	const end_date = nextData.format('YYYY-MM-DD');

	referenceObj.save((err, reference) => {
		console.log(reference);
		axios.post('http://18.229.213.198:2000/references', {
			SOURCE_ID: generateRandom(null),
			CUSTOMER_NAME: singleUser.first_name,
			email: singleUser.email,
			PHONE_NUMBER: singleUser.phone_number,
			AMOUNT: parseFloat(req.query.amount),
			START_DATE: moment().format('YYYY-MM-DD'),
			END_DATE: end_date
		}).then((atmRes) => {
			console.log(atmRes.data)
			Reference.update({ reference_id: reference.reference_id}, { $set: { atm_reference_response: atmRes.data } }, function (err, response) {
				console.log(response);
			    Reference.findOne({ reference_id: reference.reference_id}, function (err, response) {
					console.log(response);
					console.log(" -------------- " +  atmRes.data.REFERENCE);
					//return res.end(atmRes.data.REFERENCE);
					return res.send({ code: 200, reference: atmRes.data.REFERENCE });
				})
			})
		})
	})
};