const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const SocialUser = sequelize.define('SocialUser', {
    user_id : {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    img_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    social_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_user_platform: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: "notConnected" // Connected or notConnected
    }
}, {
    tableName: 'social_users', // 'social_users' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});


sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = SocialUser;