const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const Activity = sequelize.define('activity', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_social_userid: {
        type: DataTypes.STRING,
        allowNull: true
    },
    account_platform: {
        type: DataTypes.STRING,
        allowNull: true
    },    
    activity_type: {
        type: DataTypes.STRING,
        allowNull: true
    }, 
    activity_subType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: true
    },
    source_type: {
        type: DataTypes.STRING,
        allowNull: true
    }, 
    post_form_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reference_pageID: {
        type: DataTypes.JSON,
        allowNull: true
    },        
    activity_dateTime: {
        type: DataTypes.DATE,        // ✅ correct type for timestamp
        allowNull: false,
        defaultValue: DataTypes.NOW  // ✅ auto set current timestamp
    },
    nextAPI_call_dateTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    }, {
        tableName: 'activity', 
        timestamps: true 
});

sequelize.sync()
module.exports = Activity;