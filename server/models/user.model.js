const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserModelSchema = new Schema({
    name: String,
    email: { type: String, default: "" },
    googleId: { type: String, default: "" },
    isApproved: { type: Boolean, default: false }
});

const UserModel = mongoose.model('User', UserModelSchema);

module.exports = UserModel