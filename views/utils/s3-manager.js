const errors = require('./dz-errors');
const { generateRandom } = require('./id-generator');
const S3Handler = require('./s3-handler');
const dbConstants = require('../constants/db-constants');
const moment = require('moment');
const s3Handler = new S3Handler();

/*
 * Common function for upload file Object in aws s3 bucket
 * @param {requestParam} - request parameters from body will be fileObject +
 *                         bucketName +  and id(for fileName)
 * @param {Function} done - Callback function with error, data params
 */
const uploadFileObj = function(fileObject, bucketName, id, done) {
    let location;
    const fileExtLower = fileObject.name.split('.').pop().toLowerCase();
    let fileName = generateRandom(id);
    fileName = `${fileName}.${fileExtLower}`;
    fileObject.file_name = fileName;
    s3Handler.upload(fileObject, bucketName, fileExtLower, (errS3FileUpload, mediaObjRes) => {
        if (errS3FileUpload) {
            done(errS3FileUpload, null);
            return;
        }
        location = mediaObjRes.Location;
        done(null, location);
    });
};


const downloadFileObj = function(options) {
    let location;

    s3Handler.download(options, (errS3FileUpload, mediaObjRes) => {
        if (errS3FileUpload) {

            console.log(errS3FileUpload)
            return;
        }


    });
};

/*
 * Common function for remove image from aws s3 bucket
 * @param {requestParam} - request parameters from body will be filename + bucket name
 * @param {Function} done - Callback function with error, data params
 */
const removeFileObj = (photo, bucketName, done) => {
    const fileName = /[^/]*$/.exec(photo)[0];
    s3Handler.deleteFile(fileName, bucketName, (errS3FileDelete, mediaRemoveRes) => {
        if (errS3FileDelete) {
            done(errors.internalServer(true), null);
            return;
        } else {
            done(null, mediaRemoveRes);
        }
    });
};


module.exports = {
    uploadFileObj: uploadFileObj,
    removeFileObj: removeFileObj,
    downloadFileObj: downloadFileObj
};