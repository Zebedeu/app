let common = require('../controllers/common.server.controller.js');
const { authenticate_compradors } = require('../utils/session.js');

module.exports = function (app) {
	app.post('/update-profile', common.updateProfile);
	app.post('/update-password', common.updatePassword);
	app.post('/get-mobile-country-codes', common.getMobileCountryCodes);
	app.get('/get-states', common.getStates);
	app.get('/get_city', common.getCities);
	app.get('/get-min-unit-qty', common.getMinUnitQty);
	app.get('/get-total-cart-products', common.getTotalCartProducts);
	app.get('/get-my-account-site-footer', common.getMyAccountSiteFooter);
	app.get('/get-my-wallet-balance', common.getMyWalletBalance);
	app.post('/check_farmer_email_exist', common.checkFarmerEmailExist);
	app.get('/get-producer', common.get_producer);
	app.get('/get-category', common.getCategory);
	app.get('/get-subcategory', common.getSubCategory);
	app.get('/get-verieties', common.getVeriety);
	app.get('/get-units', common.getUnits);
	app.get('/get-max-price-range', common.getMaxPriceRange);
	app.get('/get-sizes', common.get_sizes);
	app.get('/remove-product-image', common.removeProductImage);
	app.get('/remove-profile-image', common.removeProfileImage);
	app.get('/save-gps-location', common.saveGPSLocation);
	app.get('/get-cms', common.getCMS);
	app.get('/check-profile-status', common.checkProfileStatus);
	app.get('/deliver-addresses', common.deliverAddresses);
	app.post('/add_address', common.addAddress);
	app.post('/remove_address', authenticate_compradors, common.removeAddress);
	app.post(
		'/display_address',
		authenticate_compradors,
		common.displayAddress
	);
	app.get(
		'/get_user_address',
		authenticate_compradors,
		common.getUserAddress
	);

	app.post('/edit_address', authenticate_compradors, common.editAddress);
	app.post('/add-product-review', common.addProductReview);

	app.post('/editDocUser', common.editDocUser);
	app.post('/editBankName', common.editBankName);
	
	app.post('/addReceiptUser', common.addReceiptUser);
	app.get('/validIdwallet_log_id', common.validIdwallet_log_id);
};
