const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const KnowledgebaseMeta = sequelize.define('KnowledgebaseMeta', {  
        user_uuid  : {
            type: DataTypes.STRING,
            allowNull: true
        },              
        knowledgeBase_id: {
            type: DataTypes.STRING,
            allowNull: true
        }, 
        pages_id: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },
        social_account_id: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        },                 
        social_platform: {
            type: DataTypes.TEXT('long'),
            allowNull: true
        }, 
        namespace_id  : {
            type: DataTypes.STRING,
            allowNull: true
        },               
    }, 
    {
        tableName: 'knowledgebase_meta', 
        timestamps: true 
    }
);

sequelize.sync()
module.exports = KnowledgebaseMeta;