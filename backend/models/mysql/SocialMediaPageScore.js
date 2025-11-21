const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const SocialMediaPageScore = sequelize.define('SocialMediaPageScore', {
    social_score_id : {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_uuid: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    platform_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    page_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    page_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    score_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    engagement: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reach: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    shares: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    follower_growth_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    recommendations: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'social_media_page_score', // 'social_media_page_score' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});

sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = SocialMediaPageScore;