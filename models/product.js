// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');
const labelConstants = require('./../constants/label-constants');

// create a schema
var productSchema = new Schema({
	product_id: {
		type: String,
		default: '',
	},
	total_orders: {
		type: Number,
		default: 0,
	},
	user_id: {
		type: String,
		default: '',
	},
	producer_id: {
		type: String,
		default: '',
	},
	product_type: {
		type: String,
		enum: ['available', 'forecast', 'demand'],
		default: 'available',
	},
	description: {
		type: Object,
		default: {},
	},
	category_id: {
		type: String,
		default: '',
	},
	sub_category_id: {
		type: String,
		default: '',
	},
	product_variety_id: {
		type: String,
		default: '',
	},
	grade: {
		type: String,
		default: '',
	},
	unit_type: {
		type: String,
		default: '',
	},
	unit_value: {
		type: Number,
		default: 0,
	},
	remaining_unit_value: {
		type: Number,
		default: 0,
	},
	size: {
		type: String,
		default: '',
	},
	unit_price: {
		type: Number,
		default: 0,
	},
	total_unit_price: {
		type: Number,
		default: 0,
	},
	lower_price_range: {
		type: Number,
		default: 0,
	},
	higher_price_range: {
		type: Number,
		default: 0,
	},
	harvest_date: {
		type: Date,
		default: Date.now,
	},
	expire_date: {
		type: Date,
		default: Date.now,
	},
	images: {
		type: Array,
		default: [],
	},
	location: {
		type: String,
		default: '',
	},
	state_id: {
		type: String,
		default: '',
	},
	city_id: {
		type: String,
		default: '',
	},
	reviews: {
		type: Array,
		default: [],
	},
	where_to_deliver_id: {
		type: String,
		default: '',
	},
	period: {
		type: String,
		enum: [
			'none',
			'every_week',
			'every_twice_week',
			'every_month',
			'every_2_months',
			'every_3_months',
		],
		default: 'none',
	},
	status: {
		type: String,
		enum: ['not_approved', 'approved'],
		default: 'not_approved',
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
});

// Execute before each user.save() call
productSchema.pre('save', function (callback) {
	idGenerator.generateId(labelConstants.product, (err, ID) => {
		this.product_id = ID;
		callback();
	});
});

var Product = mongoose.model('Product', productSchema);
module.exports = Product;
