const sequelize = require('../../db/mysql');
const SocialUserPage = require('./SocialUserPage');
const { DataTypes } = require('sequelize');

const UserPost = sequelize.define('UserPost', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_user_id  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    page_id : {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    schedule_time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    post_media: { 
        type: DataTypes.TEXT('long'), // Use long TEXT to handle larger text data
        allowNull: true
    },
    platform_post_id : {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false // Ensure that each post has a unique ID across platforms
    },
    post_platform: {
        type: DataTypes.STRING,
        allowNull: true
    },
    source: {
        type: DataTypes.ENUM,
        values: ['Platform', 'API'],
        allowNull: false,
        defaultValue: 'Platform'
    },
    form_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    likes: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0'
    },
    comments: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0'
    },
    shares: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0'
    },
    engagements: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0'
    },
    impressions: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '0'
    },
    unique_impressions: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '0'
    },
    week_date: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0 // 0="Draft",1="Published",2="Scheduled"
    }
}, {
    tableName: 'posts', // 'posts' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});

// UserPost.belongsTo(SocialUserPage, { foreignKey: 'page_id' });

sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = UserPost;
