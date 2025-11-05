const sequelize = require('../../db/mysql');
const UserPost = require('./UserPost');
const { DataTypes } = require('sequelize');

const SocialUserPage = sequelize.define('User', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_userid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pageName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pageId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    page_picture: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    page_cover: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    total_followers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    page_platform: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: "notConnected" // Connected or notConnected
    },
    modify_to: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'social_page', // 'social_page' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});

// SocialUserPage.hasMany(UserPost, { foreignKey: 'pageId' }); 

sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = SocialUserPage;