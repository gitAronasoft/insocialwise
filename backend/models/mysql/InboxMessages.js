const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const InboxMessages = sequelize.define('InboxMessages', {
    conversation_id  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    platform_message_id : {
        type: DataTypes.STRING,
        allowNull: false
    },
    sender_type: {
        type: DataTypes.ENUM,
        values: ['facebook', 'linkedin', 'instagram', 'NA'],
        allowNull: false,
        defaultValue: 'NA'
    },
    message_text: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    message_type : {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_read: {
        type: DataTypes.ENUM,
        values: ['yes', 'no'],
        allowNull: true,
        defaultValue: 'yes'
    },
    timestamp: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'inbox_messages', // 'inbox_messages' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});

sequelize.sync()
module.exports = InboxMessages;
