const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const KnowledgeBase = sequelize.define('KnowledgeBase', {
        user_uuid  : {
            type: DataTypes.STRING,
            allowNull: true
        },        
        knowledgeBase_title: {
            type: DataTypes.STRING,
            allowNull: true
        }, 
        knowledgeBase_content: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        }, 
        social_platform: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        }, 
        socialDataDetail: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        }, 
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0 // Connected or notConnected
        },
    }, 
    {
        tableName: 'knowledge_base', 
        timestamps: true 
    }
);

sequelize.sync()
module.exports = KnowledgeBase;