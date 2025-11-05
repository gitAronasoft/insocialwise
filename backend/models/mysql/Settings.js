const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const Settings = sequelize.define('Settings', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    module_name: {
            type: DataTypes.ENUM,
            values: ['Comment', 'Message', 'Notification', 'User', 'System'],
            allowNull: false,
            defaultValue: "Comment"
        },
        module_status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, 
    {
    tableName: 'settings', 
    timestamps: true
});

sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = Settings;