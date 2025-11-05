const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const Demographics = sequelize.define('Demographics', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    platform_page_Id : {
        type: DataTypes.STRING,
        allowNull: false
    },
    page_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_userid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    platform: {
        type: DataTypes.ENUM,
        values: ['facebook', 'linkedin', 'instagram', 'NA'],
        allowNull: false,
        defaultValue: 'NA'
    },
    metric_type: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    metric_key : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    metric_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    source: {
        type: DataTypes.ENUM,
        values: ['Sheet', 'API', 'NA'],
        allowNull: false,
        defaultValue: 'NA'
    },
}, {
    tableName: 'demographics', // 'demographics' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});

sequelize.sync()
module.exports = Demographics;
