const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const AdsetsAds = sequelize.define('adsets_ads', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_platform: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_social_userid: {
        type: DataTypes.STRING,
        allowNull: true
    }, 
    campaign_id : {
        type: DataTypes.BIGINT,
        allowNull: true
    },   
    adsets_id : {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    ads_id : {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    ads_name: { 
        type: DataTypes.STRING,
        allowNull: true
    },    
    ads_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_effective_status: { 
        type: DataTypes.STRING 
    },
    ads_insights_impressions: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_clicks: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_cpc: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_cpm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_ctr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_spend: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_reach: { 
        type: DataTypes.STRING,
        allowNull: true 
    },
    ads_insights_date_start: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ads_insights_date_stop: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ads_insights_cost_per_result: { 
        type: DataTypes.STRING,
        allowNull: true 
    },
    ads_result_type: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    ads_insights_actions: {
        type: DataTypes.JSON,
        allowNull: true
    },
}, {
    tableName: 'adsets_ads', 
    timestamps: true 
});

sequelize.sync()
module.exports = AdsetsAds;
