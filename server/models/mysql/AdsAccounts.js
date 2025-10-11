const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const AdsAccounts = sequelize.define('ads_accounts', {
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
    account_id : {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_name: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    account_status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isConnected: {
        type: DataTypes.ENUM,
        values: ['notConnected', 'Connected'],
        allowNull: false,
        defaultValue: "notConnected"
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timezone_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timezone_offset_hours_utc: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount_spent: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    balance: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    business_page_detail: {
        type: DataTypes.JSON,
        allowNull: true
    },
    min_campaign_group_spend_cap: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    spend_cap: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
}, {
    tableName: 'ads_accounts', 
    timestamps: true 
});

sequelize.sync()
module.exports = AdsAccounts;
