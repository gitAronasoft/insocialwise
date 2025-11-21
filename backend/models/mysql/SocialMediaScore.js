const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const SocialMediaScore = sequelize.define('SocialMediaScore', {
    user_uuid: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    total_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    total_engagement: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    total_reach: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    follower_growth_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    total_shares: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    score_date: {
        type: DataTypes.DATEONLY, // Stores date only (e.g., '2025-11-02')
        allowNull: false,
    },
    recommendations: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'social_media_score',
    timestamps: true, // Auto-adds createdAt and updatedAt
});

sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = SocialMediaScore;