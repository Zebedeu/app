// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var settingSchema = new Schema({
    call_us: String,
    support_email: String,
    fb_url: String,
    twitter_url: String,
    instagram_url: String,
    linkedin_url: String,
    app_name: String,
    default_name: String,
    default_email: String,
    default_footer: String,
    google_playstore: String,
    apple_store: String,
    currency: String,
    stripe_live_key: String,
    stripe_test_key: String,
    stripe_status: String,
    twilio_account_sid: String,
    twilio_auth_token: String,
    twilio_mobile_no: String,
    twilio_twiml_app_sid: String,
    twilio_caller_id: String,
    mailgun_api_key: String,
    mailgun_domain: String,
    key_id_ios: String,
    team_id_ios: String,
    bundle_id_passenger: String,
    bundle_id_provider: String,
    ios_push_is_production: {
        type: Boolean,
        default: false
    },
    android_push_server_key: {
        type: String,
        default: ''
    },
    default_currency: {
        type: String,
        default: ''
    },
    customer_care: {
        type: String,
        default: ''
    },
    deactivated_title: {
        type: Object,
        default: {}
    },
    deactivated_description: {
        type: Object,
        default: {}
    },
    banned_title: {
        type: Object,
        default: {}
    },
    banned_description: {
        type: Object,
        default: {}
    },
    support_no: {
        type: String,
        default: '',
    },
    address: {
        type: String,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    email_logo: {
        type: String,
        default: '',
    },
    backoffice_two_step_verification: {
        type: Boolean,
        default: false
    },
    maximum_price_range: {
        type: Number,
        default: 0,
    },
    bank_information: {
        account_no: {
            type: String,
            default: '',
        },
        code: {
            type: String,
            default: '',
        },
        company_name: {
            type: String,
            default: '',
        }
    },
    available_or_forecasted: {
        type: Object,
        default: {},
    },
    my_account_site_footer: {
        type: Object,
        default: {},
    },
    kepya_commission: {
        type: Number,
        default: 0
    },
    reserve_order_hrs: {
        type: Number,
        default: 0
    },
    atm_reference_days: {
        type: Number,
        default: 0
    },
    payment_captions: {
        wallet: {
            type: Object,
            default: {}
        },
        atm_reference: {
            type: Object,
            default: {}
        },
        payment_from_the_bank: {
            type: Object,
            default: {}
        }
    }
});

var Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;