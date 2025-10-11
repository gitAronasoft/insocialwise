const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const PostComments  = sequelize.define('PostComments', {
    user_uuid  : {
        type: DataTypes.STRING,
        allowNull: false
    },
    social_userid: {
        type: DataTypes.STRING,
        allowNull: true
    },
    platform_page_Id : {
        type: DataTypes.STRING,
        allowNull: true
    },
    platform : {
        type: DataTypes.STRING,
        allowNull: true
    },
    post_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    activity_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comment_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parent_comment_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    from_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    from_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comment: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comment_created_time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comment_type: {
        type: DataTypes.STRING,
        allowNull: true
    },
    comment_behavior: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reaction_like: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reaction_love: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reaction_haha: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reaction_wow: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reaction_sad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reaction_angry: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
    
}, {
    tableName: 'post_comments',
    timestamps: true 
});

sequelize.sync()
module.exports = PostComments;
