'use strict';

const awsHandler = require('./aws-handler');
const fs = require('fs');
const _ = require('underscore');
const moment = require('moment');


class S3Handler {
    constructor() {
        this._objectsToUpload = null;
        this._s3 = awsHandler.s3();
    };

    _params(options) {
        let parameters = {};
        if (_.has(options, 'bucket')) {
            parameters.Bucket = options.bucket;
        }

        if (_.has(options, 'key')) {
            parameters.Key = options.key;
        }

        if (_.has(options, 'region')) {
            parameters.region = options.region;
        }

        return parameters;
    };

    download(options, callback) {
        this._s3.getObject(this._params(options), function(error, s3Object) {
            if (error) {
                callback(error, null);
                return;
            }

            if (!s3Object || !_.has(s3Object, 'Body') || !_.has(s3Object, 'Metadata')) {
                callback(null, null);
                return;
            }

            const formattedObject = {
                body: s3Object.Body,
                metadata: s3Object.Metadata
            };

            callback(null, formattedObject);
        });
    };

    upload(file, bucket, contentType, done) {
        //let file_data = fs.readFileSync(file.path);
        const params = {Bucket: bucket, Key: file.file_name, Body: file.data, ContentType : contentType, ACL : 'public-read'};
        this._s3.upload(params, function(err, data) {
            done(err, data);
        });
    };

    writeFile(file_data,fileName, bucket, contentType, done) {
        const params = {Bucket: bucket, Key: fileName, Body: file_data, ContentType : contentType, ACL : 'public-read'};
        this._s3.upload(params, function(err, data) {
            done(err, data);
        });
    };

    deleteFile(fileName, bucket, done) {
        const params = {
            Bucket: bucket,
            Key: fileName
        };
        this._s3.deleteObject(params, (error, data) => {
            done(error, data);
        });
    };

    deleteMultipleFiles(objects, bucket, done) {
        const params = {
            Bucket: bucket,
            Delete: {
                Objects:objects,
                Quiet: false
            }
        };
        this._s3.deleteObjects(params, (error, data) => {
            done(error, data);
        });
    };

    getBucketContents(options, callback) {
        this._s3.listObjects(this._params(options), function(error, objectList) {
            if (error) {
                callback(error, null);
                return;
            }

            if (!objectList || !_.has(objectList, 'Contents')) {
                callback(null, null);
                return;
            }

            const contents = objectList.Contents;
            let keys = [];
            _.each(contents, function(contentObject) {
                keys.push(contentObject.Key);
            });

            callback(null, keys);
        });
    }
}

module.exports = S3Handler;
