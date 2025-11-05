const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const Campaigns = sequelize.define('campaigns', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_platform: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_social_userid: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    ad_account_id : {
        type: DataTypes.BIGINT,
        allowNull: true
    },    
    campaign_id : {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_name: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_category: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    campaign_bid_strategy: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_buying_type: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_objective: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_budget_remaining: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_daily_budget: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_lifetime_budget: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_effective_status: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_start_time: { 
        type: DataTypes.DATE,
        allowNull: true
    },
    campaign_end_time: { 
        type: DataTypes.DATE,
        allowNull: true
    },
    campaign_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_clicks: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    campaign_insights_cpc: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_cpm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_cpp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_ctr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_date_start: {
        type: DataTypes.DATE,
        allowNull: true
    },
    campaign_insights_date_stop: {
        type: DataTypes.DATE,
        allowNull: true
    },
    campaign_insights_impressions: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_spend: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_reach: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    campaign_insights_results: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    campaign_result_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    campaign_insights_cost_per_result: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    campaign_insights_actions: {
        type: DataTypes.JSON,
        allowNull: true
    },
}, {
    tableName: 'campaigns', 
    timestamps: true 
});

sequelize.sync()
module.exports = Campaigns;
