const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const Adsets = sequelize.define('adsets', {
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
    adsets_campaign_id : {
        type: DataTypes.BIGINT,
        allowNull: true
    },   
    adsets_id : {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    adsets_name: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_countries: { 
        type: DataTypes.TEXT,
        allowNull: true
    },
    adsets_regions: {
        type: DataTypes.JSON,
        allowNull: true
    },
    adsets_cities: {
        type: DataTypes.JSON,
        allowNull: true
    },
    adsets_age_min: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    adsets_age_max: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    adsets_genders: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    adsets_publisher_platforms: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    adsets_facebook_positions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    adsets_instagram_positions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    adsets_device_platforms: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    adsets_start_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adsets_end_time: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adsets_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_impressions: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_clicks: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_cpc: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_cpm: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_ctr: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_spend: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_daily_budget: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    adsets_lifetime_budget: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    adsets_insights_date_start: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adsets_insights_date_stop: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adsets_insights_reach: {
        type: DataTypes.STRING, // or INTEGER if you prefer
        allowNull: true
    },
    adsets_insights_results: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    adsets_result_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adsets_insights_cost_per_result: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    adsets_insights_actions: {
        type: DataTypes.JSON,
        allowNull: true
    },
}, {
    tableName: 'adsets', 
    timestamps: true 
});

sequelize.sync()
module.exports = Adsets;
