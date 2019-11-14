'use strict';

const {
    Storage
} = require('@google-cloud/storage');
const CLOUD_BUCKET = "<bucket_name>";

const storage = new Storage({
    projectId: "<project_id>",
    keyFilename: "./key.json"
});
const bucket = storage.bucket(CLOUD_BUCKET);


function getPublicUrl(filename) {
    return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

function sendUploadToGCS(req, res, next) {
    if (!req.file) {
        return next();
    }

    const gcsname = Date.now() + req.file.originalname;
    const file = bucket.file(gcsname);

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        },
        resumable: false
    });

    stream.on('error', (err) => {
        req.file.cloudStorageError = err;
        next(err);
    });

    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsname;
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
    });

    stream.end(req.file.buffer);
}
const Multer = require('multer');
const mult = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb
    }
});
// [END multer]

module.exports = {
    getPublicUrl,
    sendUploadToGCS,
    mult
}