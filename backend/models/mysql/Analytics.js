const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const Analytics = sequelize.define('analytics', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: true
    },
    platform_page_Id  : {
        type: DataTypes.STRING,
        allowNull: true
    },
    platform: {
        type: DataTypes.STRING,
        allowNull: true
    }, 
    analytic_type: {
        type: DataTypes.STRING,
        allowNull: true
    },   
    total_page_followers: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    total_page_impressions: {
        type: DataTypes.BIGINT,
        allowNull: true
    }, 
    total_page_impressions_unique: {
        type: DataTypes.BIGINT,
        allowNull: true
    }, 
    total_page_views: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    page_post_engagements: {
        type: DataTypes.BIGINT,
        allowNull: true
    }, 
    page_actions_post_reactions_like_total: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    week_date : {
        type: DataTypes.STRING,
        allowNull: true
    },
}, {
    tableName: 'analytics', 
    timestamps: true 
});

sequelize.sync()   

module.exports = Analytics;
