let config = require('../../../config/config');
let async = require('async');

exports.getOverMargin=(price, over_margin)=>{
	return parseInt(price + (price * over_margin / 100));
}  