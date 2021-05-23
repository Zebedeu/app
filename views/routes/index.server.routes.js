let index = require('../controllers/index.server.controller.js');

module.exports = function(app) {
	app.route('/')
		.get(index.render)
		.post(index.render);
	app.route('/sign-up')
		.get(index.signUp)
		.post(index.signUp);
	app.route('/forgot-password')
		.get(index.forgotPassword)
		.post(index.forgotPassword);
	app.post('/check-your-email', index.checkYourEmail);
	app.get('/reset-password/:id', index.resetPassword);
	app.get('/password-changed/', index.passwordChanged);
	app.get('/get-user-profile/', index.getUserProfile);
	app.post('/reset-password', index.resetPassword);
	app.post('/authenticate', index.authenticate);
	app.post('/send-otp', index.sendOTP);
	app.get('/verify-otp', index.verifyOTP);
	app.get('/welcome', index.welcome);
	app.post('/submit-verify-otp', index.submitVerifyOTP);
	app.post('/check-email-exist', index.checkEmailExist);
	app.get('/logout', index.logout);
	app.get('/get-state', index.getState);
	app.get('/get-mobile-country-code', index.getMobileCountryCode);
	app.post('/get-city', index.getCity);
	app.get('/get-wallet-details', index.getWalletDetails);
	app.post('/clear-notifications', index.clearNotifications);
	app.get('/note/:id', index.deleteNotifiy);


	app.route('/faqs')
	.get(index.faqs);

	app.route('/faqs-produtor')
	.get(index.faqsprodutor);

};