const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String, 
    status: {
        type: Number,
        required: true, 
        default: 1,
        description: 'The status of the user, where 0 is inactive and 1 is active.'
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;