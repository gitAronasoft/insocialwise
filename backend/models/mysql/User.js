const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
    uuid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    bio: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    company: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    jobTitle: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userLocation: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userWebsite: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'User'
    },
    profileImage: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    timeZone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // lastLogin: {
    //     type: DataTypes.DATE,// ✅ correct type for timestamp
    //     allowNull: true,        
    // },
    // otp: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    // otpGeneratedAt: {
    //     type: DataTypes.DATE,
    //     allowNull: true
    // },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetPasswordRequestTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'users', // 'users' table in the database
    timestamps: true // Automatically handle 'createdAt' and 'updatedAt' fields
});


sequelize.sync()
    // .then(() => console.log('Models synchronized.'))
    // .catch(err => console.error('Error syncing model:', err));

module.exports = User;