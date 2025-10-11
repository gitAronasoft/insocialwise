const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const InboxConversations = sequelize.define('InboxConversations', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_userid : {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_pageid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_platform: {
        type: DataTypes.ENUM,
        values: ['facebook', 'linkedin', 'instagram', 'NA'],
        allowNull: false,
        defaultValue: 'NA'
    },
    conversation_id: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    external_userid : {
        type: DataTypes.STRING,
        allowNull: false,
    },
    external_username: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    external_username: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    snippet: {
        type: DataTypes.STRING,
        allowNull: false
    },    
    status: {
        type: DataTypes.ENUM,
        values: ['Active', 'InActive'],
        allowNull: false,
        defaultValue: 'InActive'
    },
}, {
    tableName: 'inbox_conversations', // 'inbox_conversations' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});

sequelize.sync()
module.exports = InboxConversations;
