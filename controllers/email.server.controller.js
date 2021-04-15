const State = require('mongoose').model('State');
const User = require('mongoose').model('User');
const Setting = require('mongoose').model('Setting');
const EmailTemplate = require('mongoose').model('Email_template');
const passwordHandler = require('../utils/password-handler');
const config = require('../../config/config');
const _ = require('underscore');
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: config.aws.keyId,
    secretAccessKey: config.aws.key,
    region: config.aws.sesRegion,
});
const ses = new AWS.SES({apiVersion: '2010-12-01'});

const setupEmail = async(requestParam) => {
    const params = {
        Destination: {
            ToAddresses: [requestParam.to_email]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: requestParam.description
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: requestParam.subject
            }
        },
        ReturnPath: requestParam.from_email,
        Source: requestParam.from_email,
    };

    ses.sendEmail(params, (err, data) => {
        if (err) {
            return console.log(err, err.stack);
        } else {
            console.log("Email sent.", data);
        }
    });
};

const send = (requestParams) => {
	console.log(requestParams);
	if(!requestParams.language){
		requestParams.language = config.default_language_code;
	}
	Setting.findOne({}, { _id: 0, website: 1, email_logo: 1, fb_url: 1, twitter_url: 1, instagram_url: 1, linkedin_url: 1, address: 1 }, (err, setting) => {
		EmailTemplate.findOne({ code: requestParams.code }, { _id: 0, created_at: 0, updated_at: 0 }, (err, email_template) => {
			console.log(email_template)
			let from_name = email_template.from_name;
			//let from_email = email_template.from_email;
			let from_email = "agromplace@gmail.com";
			let subject = email_template.email_subject[requestParams.language];
			let description = email_template.description[requestParams.language];
			description = description.replace('#INSTAGRAM_URL#', setting.instagram_url);
			description = description.replace('#FB_URL#', setting.fb_url);
			description = description.replace('#LINKEDIN_URL#', setting.linkedin_url);
			description = description.replace('#TWITTER_URL#', setting.twitter_url);
			description = description.replace('#ADDRESS#', setting.address);

			if(_.contains(['PRODUCER_SIGN_UP', 'AGGREGATOR_SIGN_UP', 'COMPRADOR_SIGN_UP', 'TRANSPORTER_SIGN_UP'], requestParams.code)){
				description = description.replace('#NAME#', requestParams.name);
			} else if(requestParams.code == 'FORGOT_PASSWORD'){
				let url = config.base_url+'reset-password/'+requestParams.otp;
				description = description.replace('#NAME#', requestParams.name);
				description = description.replace('#SET_NEW_PASSWORD_LINK#', url).replace('#SET_NEW_PASSWORD_LINK#', url);
			} else if(requestParams.code == 'PASSWORD_CHANGED'){
				description = description.replace('#NAME#', requestParams.name);
				description = description.replace('#HELP_CENTER#', 'http://kepya.net/faqs');
				description = description.replace('#CONTACT_US#', 'http://kepya.net/contact-us/');
			} else if(requestParams.code == 'INVOICE'){
				subject = subject.replace('#ORDER_ID#', requestParams.order_id);
				description = description.replace('#ORDER_ID#', requestParams.order_id);
				description = description.replace('#CLIENT#', requestParams.client_name);
				description = description.replace('#ADDRESS_TYPE#', requestParams.address_type);
				description = description.replace('#ADDRESS_NAME#', requestParams.address_name);
				description = description.replace('#FULL_ADDRESS#', requestParams.full_address);
				description = description.replace('#SUBTOTAL#', requestParams.sub_total);
				description = description.replace('#TRANSPORTATION_FEES#', requestParams.transport_fees);
				description = description.replace('#TOTAL#', requestParams.total).replace('#TOTAL#', requestParams.total);
				description = description.replace('#DELIVERY_DATE#', requestParams.delivery_date);
				description = description.replace('#PRODUCTS#', requestParams.products);
			} else if(requestParams.code == 'ORDER_STATUS'){
				subject = subject.replace('#ORDER_ID#', requestParams.order_id);

				if(requestParams.estado == 'empacotado'){
					subject = subject.replace('foi #STATUS#', 'está pronto para a recolha');
				    description = description.replace('foi #STATUS#', 'está pronto para a recolha');

				}else{
					subject = subject.replace('#STATUS#', requestParams.estado);
				    description = description.replace('#STATUS#', requestParams.estado);

				}
				
				description = description.replace('#ORDER_ID#', requestParams.order_id);
				description = description.replace('#NAME#', requestParams.client_name);
				description = description.replace('#PNAME#', requestParams.product);
			
				description = description.replace('#UNIT#', requestParams.unit);
				description = description.replace('#VARIETY#', requestParams.product_variety);
				description = description.replace('#SIZE#', requestParams.size);
				description = description.replace('#QTY#', requestParams.qtd);
				description = description.replace('#HARVEST#', requestParams.harvest);
			
				description = description.replace('#IMAGE#', (requestParams.images.length > 0) ? config.aws.prefix + config.aws.s3.productBucket + '/' + requestParams.images[0] : 'http://my.kepya.co.ao/images/forcast.png');

			}

			console.log(from_name);
			console.log(from_email);
			console.log(requestParams.email);
			setupEmail({
                to_email: requestParams.email,
                from_email: from_name + ' <' + from_email + '>',
                subject,
                description
            });
		})
	})
};

module.exports = {
    send,
    setupEmail
};