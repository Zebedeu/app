'use strict';

const _ = require('underscore');
const responseCodes = require('../helpers/response-codes');

/*const query = require('./../utils/query-creator');
const dbConstants = require('./../constants/db-constants');
const Language = require('./../models/language');
let labels=[];
query.selectWithAndOne(dbConstants.dbSchema.languages, {status:'active'}, {}, (error, customer) => {
	labels=[{
		"title": "Parameter missing.",
	    "code": "PARAMETER_MISSING",
	    "value": {
	        "EN": "Parameter missing",
	        "CH": "名字"
	    }
	}];
});*/


function DZError(message, code, name = 'DZError') {
	this.name = name;
	this.message = message || 'Default Message';
	this.code = code;
	this.stack = (new Error()).stack;
}

DZError.prototype = Object.create(Error.prototype);
DZError.prototype.constructor = DZError;

module.exports = {
	missingParameter: function(formatForWire, lanCode){

		let label = _.where(labels, {code:lanCode});
		label = label[0].value['EN']; 

		const error = new DZError(
			//'There are one or more parameters missing in the supplied request',
			label,
			responseCodes.BadRequest,
			'MissingParameter'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	missingParameters: function(formatForWire){
		const error = new DZError(
			'There are one or more parameters missing in the supplied request',
			responseCodes.BadRequest,
			'MissingParameter'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	duplicateUser: function(formatForWire){
		const error = new DZError('Duplicate user in database', responseCodes.Conflict, 'DuplicateUser');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	duplicateBankAccountNo: function(formatForWire){
		const error = new DZError('Duplicate bank account no in database', responseCodes.Conflict, 'DuplicateBankAccount');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	duplicateDriver: function(formatForWire){
		const error = new DZError('Email id or mobile no already exist.', responseCodes.Conflict, 'DuplicateUser');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	duplicateVehicle: function(formatForWire){
		const error = new DZError('Duplicate vehicle in database', responseCodes.Conflict, 'DuplicateVehicle');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	alreadyBidded: function(formatForWire){
		const error = new DZError('You cannot bid again', responseCodes.Conflict, 'AlreadyBidded');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	duplicateMobileNo: function(formatForWire){
		const error = new DZError('Mobile no already registered for another user', responseCodes.Conflict, 'DuplicateUser');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	cachingError: function(formatForWire){
		const error = new DZError('Error while managing caching', responseCodes.Caching, 'Caching');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidCreditCard: function(formatForWire) {
		const error = new DZError('Invalid Card', responseCodes.Conflict, 'InvalidCard');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidReferralCode: function(formatForWire) {
		const error = new DZError('Invalid referral code', responseCodes.Conflict, 'InvalidReferralCode');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidQRCode: function(formatForWire) {
		const error = new DZError('Invalid qr code', responseCodes.Conflict, 'InvalidQRCode');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	cardNotExist: function(formatForWire) {
		const error = new DZError('Card Not Exist', responseCodes.Conflict, 'cardNotExist');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	inSufficientCredit: function(formatForWire) {
		const error = new DZError('Insufficient Credit', responseCodes.Insufficient, 'Insufficient');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	inSufficientPermission: function(formatForWire) {
		const error = new DZError("You can't remove default item", responseCodes.Insufficient, 'Insufficient');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	distanceLimitExceeded: function(formatForWire) {
	    const error = new DZError('Google API Error.', responseCodes.DistanceLimit, 'distanceLimit');
	    return formatForWire ? this.formatErrorForWire(error) : error;
	},
	cardExist: function(formatForWire) {
		const error = new DZError('Card Already Exist', responseCodes.Conflict, 'cardExist');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tripAlreadyExist: function(formatForWire) {
		const error = new DZError('First complete your existing trip, then after you can book a new trip', responseCodes.Conflict, 'tripExist');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidCoupon: function(formatForWire) {
		const error = new DZError('Invalid Coupon Code', responseCodes.CouponInvalid, 'couponInvalid');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidOTP: function(formatForWire) {
		const error = new DZError('Invalid OTP', responseCodes.InvalidOTP, 'invalidOTP');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	mobileNotVerified: function(formatForWire) {
		const error = new DZError('Mobile Not Verified', responseCodes.MobileNotVerified, 'mobileNotVerified');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	stripeConnectAccount: function(formatForWire) {
		const error = new DZError('Stripe Connect Account Not Created', responseCodes.Conflict, 'stripeConnectAccount');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	stripePayment: function(formatForWire) {
		const error = new DZError('Stripe Payment Failure', responseCodes.Conflict, 'stripePayment');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	unverifiedUser: function(formatForWire) {
		const error = new DZError('Unverified User', responseCodes.Forbidden, 'UnverifiedUser');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidPassword: function(formatForWire){
		const error = new DZError('Passwords not matched.', responseCodes.Invalid, 'InvalidPassword');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidPin: function(formatForWire){
		const error = new DZError('PIN not matched.', responseCodes.Invalid, 'InvalidPin');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidOldPin: function(formatForWire){
		const error = new DZError('Invalid old PIN.', responseCodes.Invalid, 'InvalidPin');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidEmail: function(formatForWire){
		const error = new DZError('Email id not exists.', responseCodes.Unauthorized, 'InvalidEmail');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	notActivate: function(formatForWire){
		const error = new DZError('Your account is inactive, Contact to administrator', responseCodes.NotActive, 'Status Not Activated');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	passengerNotActivate: function(formatForWire){
		const error = new DZError('Your account has been deactivated on the Mobi Passenger', responseCodes.NotActive, 'Status Not Activated');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	driverNotActivate: function(formatForWire){
		const error = new DZError('Your account has been deactivated on the Mobi Driver', responseCodes.NotActive, 'Status Not Activated');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	passengerBanned: function(formatForWire){
		const error = new DZError('Your account has been banned on the Mobi Passenger', responseCodes.Banned, 'Account Banned');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	driverBanned: function(formatForWire){
		const error = new DZError('Your account has been banned on the Mobi Driver', responseCodes.Banned, 'Account Banned');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	notApproved: function(formatForWire){
		const error = new DZError('Contact to administrator', responseCodes.NotApproved, 'Status Not Approved');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	internalServer: function(formatForWire){
		const error = new DZError(
			'Internal server error',
			responseCodes.InternalServer,
			'InternalServerError'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	incorrectDatabase: function(formatForWire){
		const error = new DZError(
			'Incorrect database selected',
			responseCodes.InternalServer,
			'IncorrectDatabase'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tokenInvalid: function(formatForWire){
		const error = new DZError('Token is invalid', responseCodes.TokenInvalid, 'InvalidToken');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	fbAuthenticationFailure: function(formatForWire){
		const error = new DZError(
			'Facebook Authentication Failed',
			responseCodes.Unauthorized,
			'FacebookAuthenticationFailure'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	failedRestCall: function(formatForWire){
		const error = new DZError('Failed To Make Rest Call', 'FailedRestCall');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	confirmationCodeInvalid: function(formatForWire){
		const error = new DZError(
			'Registration code is invalid',
			responseCodes.Unauthorized,
			'InvalidRegistrationCode'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	resourceNotFound: function(formatForWire){
		const error = new DZError('Resource Not Found', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	passengerNotFound: function(formatForWire){
		const error = new DZError('This account has not been setup on the Mobi Passenger', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	serviceTypeNotFound: function(formatForWire){
		const error = new DZError('Service type not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	serviceNotFound: function(formatForWire){
		const error = new DZError('You have not selected default service type', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	vehicleTypeNotFound: function(formatForWire){
		const error = new DZError('Vehicle type not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	cmsNotFound: function(formatForWire){
		const error = new DZError('CMS not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	templateNotFound: function(formatForWire){
		const error = new DZError('Template not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	settingNotFound: function(formatForWire){
		const error = new DZError('Setting not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tripNotFound: function(formatForWire){
		const error = new DZError('trip not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	fareNotFound: function(formatForWire){
		const error = new DZError('Fare not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	ferryNotFound: function(formatForWire){
		const error = new DZError('Ferry not available', responseCodes.ResourceNotFound, 'FerryNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	fixRouteNotFound: function(formatForWire){
		const error = new DZError('Fix route not available', responseCodes.ResourceNotFound, 'FixRouteNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	ferryRouteNotFound: function(formatForWire){
		const error = new DZError('Ferry route not available', responseCodes.ResourceNotFound, 'FerryRouteNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	driverNotFound: function(formatForWire){
		const error = new DZError('This account has not been setup on the Mobi Driver', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	driverNotAvailable: function(formatForWire){
		const error = new DZError('Driver not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	unionNotFound: function(formatForWire){
		const error = new DZError('Union not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	bankAccountNotFound: function(formatForWire){
		const error = new DZError('Bank account not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	vehicleNotFound: function(formatForWire){
		const error = new DZError('Vehicle not available', responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	defaultVehicleNotFound: function(formatForWire){
		const error = new DZError("You don't have default vehicle for current service", responseCodes.ResourceNotFound, 'ResourceNotFound');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	pendingDues: function(formatForWire){
		const error = new DZError('First pay your pending amount of current union', responseCodes.Unauthorized, 'Unauthorized');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	noService: function(formatForWire){
		const error = new DZError('No service available at the moment. Please try again later.', responseCodes.NoService, 'noService');
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	unauthorizedAccess: function(formatForWire){
		const error = new DZError(
			'Unauthorized access to resource',
			responseCodes.Unauthorized,
			'UnauthorizedAccess'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	lockAlreadyRegistered: function(formatForWire){
		const error = new DZError(
			'This lock has already been registered',
			responseCodes.Conflict,
			'LockAlreadyRegistered'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	sharingLimitReached: function(formatForWire){
		const error = new DZError(
			'This ellipse has been shared the maximum amount',
			responseCodes.Forbidden,
			'MaxSharingLimitReached'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidParameter: function(formatForWire){
		const error = new DZError(
			'Invalid parameter in request body',
			responseCodes.BadRequest,
			'InvalidParameter'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	apiLimitExceeded: function(formatForWire){
		const error = new DZError(
			'Too many request made to API',
			responseCodes.BadRequest,
			'APILimitExceeded'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	cannotSendEmail: function(formatForWire){
		const error = new DZError(
			'Cannot send Email at this time',
			responseCodes.InternalServer,
			'CannotSendEmail'
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	noError: function(){
		return null;
	},
	errorWithMessage: function(error){
		return new DZError((_.has(error, 'message') ? error.message : ''));
	},
	formatErrorForWire: function(DZError){
		return _.omit(DZError, 'stack');
	},
	customError: function(message, code, name, formatForWire){
		const error = new DZError(message, code, name);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},

};
