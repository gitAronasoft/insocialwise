const sequelize = require('../../db/mysql');
const { DataTypes } = require('sequelize');

const AdsCreative = sequelize.define('ads_creative', {
    user_uuid: { type: DataTypes.STRING },
    account_platform: { type: DataTypes.STRING },
    social_page_id: { type: DataTypes.STRING },
    account_social_userid: { type: DataTypes.STRING },
    campaign_id: { type: DataTypes.STRING },    
    adset_id: { type: DataTypes.STRING },
    ad_id: { type: DataTypes.STRING },
    creative_id: { type: DataTypes.STRING },
    creative_type: { type: DataTypes.STRING }, // carousel, video, image
    image_urls: { type: DataTypes.JSON },       // array of images
    video_thumbnails: { type: DataTypes.JSON }, // array of video thumbnails
    headline: { type: DataTypes.STRING },
    body: { type: DataTypes.TEXT },
    call_to_action: { type: DataTypes.JSON },
    call_to_action_link: { type: DataTypes.STRING },
}, {
    tableName: 'ads_creative', 
    timestamps: true 
});

sequelize.sync()
module.exports = AdsCreative;
