const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require('axios');
const User = require("../models/mysql/User");
const SocialUser = require("../models/mysql/SocialUser");
const SocialUserPage = require("../models/mysql/SocialUserPage");
const InboxConversations = require("../models/mysql/InboxConversations");
const InboxMessages = require("../models/mysql/InboxMessages");
const Analytics = require("../models/mysql/Analytics");
const UserPost = require("../models/mysql/UserPost");
const PostComments = require("../models/mysql/PostComments");
const AdsAccounts = require("../models/mysql/AdsAccounts");
const Campaigns = require("../models/mysql/Campaigns");
const Adsets = require("../models/mysql/Adsets");
const AdsetsAds = require("../models/mysql/AdsetsAds");
const AdsCreative = require("../models/mysql/AdsCreative");
//const Activity = require("../models/mysql/Activity");
const activityCreate = require("../utils/activityCreate");
const sequelize = require('../db/mysql');
const { Op,fn, col, where, json } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

AdsCreative.belongsTo(SocialUserPage, {
  foreignKey: 'social_page_id',
  targetKey: 'pageId', // Adjust if needed
  as: 'socialPage'
});

const secretKey = process.env.JWT_SECRET;
const facebookAPPID = process.env.facebook_APP_ID;
const facebookAPPSecret = process.env.facebook_APP_Secret;

const upload = multer({
  storage: multer.memoryStorage(), // store files in memory as buffer
}).array("images");

router.post('/account-connection', async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided."
        });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return res.status(401).json({ message: "Token not valid." });
        }

        const shortToken = req.body.data;
        try {
            // ✅ Step 1: Get basic user info (excluding accounts)
            const userResponse = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${shortToken}&fields=id,name,email,picture`);
            const userData = await userResponse.json();

            if (!userData || userData.error) {
                return res.status(400).json({ success: false, message: "Failed to fetch user data." });
            }

            // ✅ Step 2: Fetch all managed pages explicitly
            const pagesResponse = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${shortToken}`);
            const pagesData = await pagesResponse.json();
            console.log("pagesData", pagesData);

            if (!pagesData || !pagesData.data || pagesData.data.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "This account does not have any Facebook pages."
                });
            }

            // ✅ Step 3: Attach pages to userData and call your logic
            userData.accounts = pagesData.data;

            const loggedUser_uuid = authData.userData.uuid;
            await extendToken(userData, loggedUser_uuid, shortToken, res);

        } catch (error) {
            console.error("Facebook connection error:", error);
            return res.status(500).json({
                success: false,
                message: "Technical issue, please try again later."
            });
        }
    });
});

async function extendToken(userData, loggedUser_uuid, shortFBtoken, res) {
    const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${facebookAPPID}&client_secret=${facebookAPPSecret}&fb_exchange_token=${shortFBtoken}`;   
    try {
        const response = await axios.get(url);        
        if (response.data.error) {
            //throw new Error(`Facebook API Error: ${response.data.error.message}`);
            return res.status(401).json({ 
                success: false,
                message: "Facebook API Error" 
            });
        }

        if (!response.data.access_token) {
            //throw new Error("Invalid token response from Facebook");
            return res.status(401).json({ 
                success: false,
                message: "Invalid token response from Facebook" 
            });
        }
        const longLivedToken = response.data.access_token;            
        await socialAccountSave(userData, loggedUser_uuid, longLivedToken, res);                
    } catch (error) {
        console.error('Error extending page token:', error);
        return res.status(401).json({ 
            success: false,
            message: "Error extending page token" 
        });
    }
}

async function fetchBusinessPages(loggedUser_uuid, user_social_id, longLivedToken, res) {
    //console.log('ccc',loggedUser_uuid, socail_id, longLivedToken);
    try {
        const response = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${longLivedToken}`);
        const data = await response.json();
        //console.log('data fb page',data);
        if (data?.data?.length > 0) {
            const pagesList= data.data;            
            await fetchPageDetails(pagesList, user_social_id,loggedUser_uuid, res,longLivedToken);                                        
        } else {
            console.warn("No business pages found.");
        }
    } catch (error) {
        console.error("Error fetching business pages: ", error);
    } 
}

async function fetchPageDetails(pagesList, loggedUser_uuid, user_social_id, res,longLivedToken) {
    const pagesDetailList = [];
    for (const page of pagesList) {
        const page_id = page.id;
        const page_access_token = page.access_token;
        try {                  
            const response = await fetch(`https://graph.facebook.com/v22.0/${page_id}?fields=name,category,picture,cover,followers_count,fan_count,posts.summary(true)&access_token=${page_access_token}`);
            const pagesData = await response.json();  
            //console.log('pagesData',pagesData);
            pagesData.page_access_token = page_access_token;
            pagesDetailList.push(pagesData);               
        } catch (error) {
            console.error(`Error fetching metadata for Page ${page_id}: `, error);
           
            throw error;           
        } 
    }
    
    await savePages(pagesDetailList, user_social_id, loggedUser_uuid, res, longLivedToken);     
    fetchPageAnalytics(pagesDetailList, user_social_id, loggedUser_uuid);    
    getPagePosts(pagesDetailList, user_social_id, loggedUser_uuid);
    getPagePostsComments(pagesDetailList, user_social_id, loggedUser_uuid);
    fetchFacebookPageChat(pagesDetailList, user_social_id, loggedUser_uuid);    
}

async function socialAccountSave(userData, loggedUser_uuid, longLivedToken, res) {
    const existingSocialId = await SocialUser.findOne({
        where: {
            social_id: userData.id,
            user_id: { [Op.ne]: loggedUser_uuid }
        }
    });
    
    if(existingSocialId) {
        return res.status(400).json({ // Use res from parameter
            success: false,
            message: "This account is already linked to another user."
        });
    }

    // Check if the current user already has this social ID linked
    const existingUser = await SocialUser.findOne({
        where: {
            user_id: loggedUser_uuid,
            social_id: userData.id
        }
    });

    const pictureData = userData.picture;
    if (!existingUser) {
        try {
            const newSocialUser = await SocialUser.create({
                user_id: loggedUser_uuid,
                name: userData.name,
                img_url: pictureData?.data?.url || '',
                social_id: userData.id,
                social_user_platform: 'facebook',
                user_token: longLivedToken,
                status: "Connected"
            });

            const user_uuid = loggedUser_uuid; 
            const account_social_userid = newSocialUser.social_id;
            const account_platform = newSocialUser.social_user_platform;
            const activity_type = "social";
            const activity_subType = "account";
            const action = "connected";
            const post_form_id = '';
            const reference_pageID = { activity_type_id: {}, activity_subType_id: newSocialUser.social_id, title:newSocialUser.name };
            const source_type = '';
            const nextAPI_call_dateTime = '';
            await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

            // return res.status(200).json({ 
            //     message: "Social Profile Data Saved Successfully.",
            //     createAccount: true,
            //     userInfo: { socialData: newSocialUser }
            // });
            await fetchBusinessPages(loggedUser_uuid, userData.id, longLivedToken,res);
        } catch (error) {
            console.error('Error creating social user:', error);
            return res.status(500).json({ 
                createAccount: false,
                message: "Failed to save Social Profile." 
            });
        }
    } else {
        try {
            const updatedProfile = await existingUser.update({
                img_url: pictureData?.data?.url,
                user_token: longLivedToken,                
                status: "Connected"
            });

            const user_uuid = existingUser.user_id; 
            const account_social_userid = existingUser.social_id;
            const account_platform = existingUser.social_user_platform;
            const activity_type = "social";
            const activity_subType = "account";
            const action = "connected";
            const post_form_id = '';
            const reference_pageID = { activity_type_id: {}, activity_subType_id: existingUser.social_id, title:existingUser.name };
            const source_type = '';
            const nextAPI_call_dateTime = '';
            await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

            await fetchBusinessPages(loggedUser_uuid, userData.id, longLivedToken,res);
            // return res.status(200).json({
            //     message: "User token updated.",
            //     createAccount: true,
            //     userInfo: { socialData: updatedProfile }
            // });
        } catch (error) {
            console.error('Error updating social user:', error);
            return res.status(500).json({ 
                message: "Failed to update Social Profile." ,
                createAccount: false,
            });
        }
    }    
}

async function savePages(pagesData, loggedUser_uuid, user_social_id, res, longLivedToken) {
    //console.log('pagesList',pagesData);
    //console.log('List',user_social_id,loggedUser_uuid);
    for (const page of pagesData) {         
        const pageData = {           
            user_uuid: loggedUser_uuid,
            social_userid: user_social_id,
            pageName: page.name,
            page_picture: page.picture?.data?.url || null,
            page_cover: page.cover?.source || null,
            pageId: page.id,
            category: page.category,
            total_followers : page.followers_count,
            page_platform:'facebook',
            status: "Connected",
            token: page.page_access_token,           
        };
        // Check for existing page using both pageId AND user_uuid
        const existingPage = await SocialUserPage.findOne({
            where: {
                pageId: page.id,
                user_uuid: loggedUser_uuid
            }
        });

        if(existingPage) {
            await existingPage.update(pageData);
        } else {
            await SocialUserPage.create(pageData);
        }                      
    }

    try {
        // const userResponse = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=
        //     name,
        //     account_id,
        //     account_status
        //     &access_token=${longLivedToken}`);
        const userResponse = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=
                name,
                account_id,
                account_status,
                currency,
                timezone_name,
                timezone_offset_hours_utc,
                amount_spent,
                balance,
                business,
                created_time,
                disable_reason,
                min_campaign_group_spend_cap,
                spend_cap,
                owner,
                end_advertiser,
                partner,
                funding_source_details,
                media_agency,
                io_number,
                is_personal,
                is_prepay_account
                &access_token=${longLivedToken}`);
        const adAccounts = await userResponse.json();
        //const activeAccounts = [];
        if (!adAccounts.data || adAccounts.data.length === 0) {
            console.log('No ad accounts returned — likely because user only granted access to some businesses');       
        } else {        
            for(const adAccount of adAccounts.data){
                //console.log('name:',adAccount.name, 'account_id:',adAccount.name, 'account_status',adAccount.name, 'id',adAccount.id);
                if(adAccount.account_status===1){
                    //adAccount.longLivedToken = longLivedToken;
                    //activeAccounts.push(adAccount);
                    //console.log('adAccount',adAccount);                
                    const adAccountData = {           
                        user_uuid: loggedUser_uuid,
                        account_platform: 'facebook',
                        account_social_userid: user_social_id,
                        account_id: adAccount.account_id,
                        account_name: adAccount.name,
                        account_status: adAccount.account_status,
                        // New columns added
                        currency: adAccount?.currency || null,
                        timezone_name: adAccount?.timezone_name || null,
                        timezone_offset_hours_utc: adAccount?.timezone_offset_hours_utc || null,
                        amount_spent: adAccount?.amount_spent || 0,
                        balance: adAccount?.balance || 0,
                        business_page_detail: adAccount?.business || null,
                        min_campaign_group_spend_cap: adAccount?.min_campaign_group_spend_cap || 0,
                        spend_cap: adAccount?.spend_cap || 0,
                    };
                    //console.log("Ads Accounts: ", adAccountData);
                    const existingadAccount = await AdsAccounts.findOne({
                        where: {
                            account_id: adAccount.account_id,
                            user_uuid: loggedUser_uuid
                        }
                    });
                    if(existingadAccount) {
                        await existingadAccount.update(adAccountData);
                    } else {
                        await AdsAccounts.create(adAccountData);
                    }  
                } else if(adAccount.account_status===0){
                    const AccountDataUpdate = {         
                        account_name: adAccount.name,
                        account_status: adAccount.account_status,
                        isConnected: 'notConnected'      
                    };
                    const updateAccountStatus = await AdsAccounts.findOne({
                        where: {
                            account_id: adAccount.account_id,
                            user_uuid: loggedUser_uuid
                        }
                    });                 
                    if(updateAccountStatus) {
                        await updateAccountStatus.update(AccountDataUpdate);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching metadata for Page `, error);
    }        

    // Get updated data with nested structure
    const social_user_data = await SocialUser.findAll({
        where: { 
            user_id: loggedUser_uuid,
        }
    });     

    const social_page_data = await SocialUserPage.findAll({ 
        where: { user_uuid: loggedUser_uuid } 
    });    

    // Create nested structure
    const formattedSocialData = social_user_data.map(socialUser => ({
        ...socialUser.dataValues,
        socialPage: social_page_data
            .filter(page => page.social_userid === socialUser.social_id)
            .map(page => {
                const { user_uuid, ...cleanPage } = page.dataValues;
                return cleanPage;
            })
    }));    

    const userData = await User.findOne({ 
        where: { uuid: loggedUser_uuid } 
    });

    const adsAccountsData = await AdsAccounts.findAll({
        where: { 
            user_uuid: loggedUser_uuid,
            account_social_userid: user_social_id,
            isConnected: 'notConnected'
        }
    });

    const filtered = adsAccountsData.filter(acc => acc.isConnected === 'notConnected');

    const simplifiedAdsAccounts = filtered.map(account => ({
        social_userid: account.account_social_userid,
        account_id: account.account_id,
        account_name: account.account_name
    }));    

    return res.status(200).json({
        success: true,
        message: "Connected & Saved Data Successfully.",
        userInfo: {
            userData: userData,
            socialData: formattedSocialData
        },
        adsAccountsData:simplifiedAdsAccounts
    });    
}

async function fetchPageAnalytics(pagesDetailList, user_social_id, loggedUser_uuid, retries = 3, delay = 2000) {
    setImmediate(async () => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to sync analytics`);
                await facebookPageAnalytics(pagesDetailList, user_social_id, loggedUser_uuid);
                console.log('Background analytics sync completed.');
                break; // success, exit loop
            } catch (err) {
                console.error(`Sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, delay)); // wait before retry
                } else {
                    console.error(' All retry attempts failed for analytics.');
                }
            }
        }
    });
}

async function facebookPageAnalytics(pagesData, loggedUser_uuid, user_social_id) {
    //console.log('pagesData', pagesData);
    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() - 1);
    const sinceDate = new Date(untilDate);
    sinceDate.setDate(untilDate.getDate() - 90);
    // Format as YYYY-MM-DD
    untilDate.toISOString().split('T')[0];
    sinceDate.toISOString().split('T')[0];
    // Timestamps in seconds
    const timestampUntil = Math.floor(untilDate.getTime() / 1000);
    const timestampSince = Math.floor(sinceDate.getTime() / 1000);
    const errors = [];
    const responses = [];
    for (const page of pagesData) {
        //console.log('page:',page);
        try {        
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/insights`,
                {
                    params: {
                        metric: 'page_daily_follows',
                        period: 'day',
                        access_token: page.page_access_token,
                        since: timestampSince,
                        until: timestampUntil
                    }
                }
            ); 
            const analyticsData = response.data;            
            analyticsData.page_id = page.id;
            analyticsData.loggedUser_uuid = loggedUser_uuid;
            responses.push({ analytic_type: 'page_daily_follows', data: analyticsData });        
        } catch (error) {
            console.error('Daily follows API Error:', error);
            errors.push({ type: 'page_daily_follows', error });
        }

        try {           
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/insights`,
                {
                    params: {
                        metric: 'page_impressions',
                        period: 'day',
                        access_token: page.page_access_token,
                        since: timestampSince,
                        until: timestampUntil
                    }
                }
            ); 
            const analyticsData = response.data;
            analyticsData.page_id = page.id;
            analyticsData.loggedUser_uuid = loggedUser_uuid;           
            responses.push({ analytic_type: 'page_impressions', data: analyticsData });            
        } catch (error) {
            console.error('Daily follows API Error:', error);
            errors.push({ type: 'page_impressions', error });
        }

        try {        
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/insights`,
                {
                    params: {
                        metric: 'page_impressions_unique',
                        period: 'day',
                        access_token: page.page_access_token,
                        since: timestampSince, 
                        until: timestampUntil
                    }
                }
            ); 
            const analyticsData = response.data;
            analyticsData.page_id = page.id;
            analyticsData.loggedUser_uuid = loggedUser_uuid; 
            responses.push({ analytic_type: 'page_impressions_unique', data: analyticsData });
        } catch (error) {
            console.error('Daily impressions unique API Error:', error);
            errors.push({ type: 'page_impressions_unique', error });
        }

        try {          
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/insights`,
                {
                    params: {
                        metric: 'page_views_total',
                        period: 'day',
                        access_token: page.page_access_token,
                        since: timestampSince,
                        until: timestampUntil
                    }
                }
            ); 
            const page_views_total = response.data;
            page_views_total.page_id = page.id;
            page_views_total.loggedUser_uuid = loggedUser_uuid;
            responses.push({ analytic_type: 'page_views_total', data: page_views_total });
        } catch (error) {
            console.error('Daily page_views_total API Error:', error);
            errors.push({ type: 'page_views_total', error });
        }

        try {
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/insights`,
                {
                    params: {
                        metric: 'page_post_engagements',
                        period: 'day',
                        access_token: page.page_access_token,
                        since: timestampSince, 
                        until: timestampUntil 
                    }
                }
            );
            const page_post_engagements = response.data;
            page_post_engagements.page_id = page.id;
            page_post_engagements.loggedUser_uuid = loggedUser_uuid;
            responses.push({ analytic_type: 'page_post_engagements', data: page_post_engagements });
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
        }

        try {
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/insights`,
                {
                    params: {
                        metric: 'page_actions_post_reactions_like_total',
                        period: 'day',
                        access_token: page.page_access_token,
                        since: timestampSince, 
                        until: timestampUntil 
                    }
                }
            );
            const page_actions_post_reactions_like_total = response.data;
            page_actions_post_reactions_like_total.page_id = page.id;
            page_actions_post_reactions_like_total.loggedUser_uuid = loggedUser_uuid;
            responses.push({ analytic_type: 'page_actions_post_reactions_like_total', data: page_actions_post_reactions_like_total });           
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
        }
    } 
    
    if (errors.length > 0) {        
        const errorMessage = errors.map(e => `${e.type}: ${e.error.message}`).join('\n');
        throw new Error(`Some analytics failed:\n${errorMessage}`);
    } else {
        await saveAnalyticsData(responses);
    }    
}

async function saveAnalyticsData(analyticsData) {
    try {
        let allRecords = [];
        analyticsData.forEach((analyticItem) => {
            const analyticType = analyticItem.analytic_type;
            // Validate structure
            if (
                !analyticItem.data ||
                !analyticItem.data.data ||
                !Array.isArray(analyticItem.data.data) ||
                analyticItem.data.data.length === 0
            ) {
                console.error('Skipping invalid analytic item - missing data:', analyticItem);
                return;
            }

            const dataEntry = analyticItem.data.data[0];
            if (!dataEntry.values || !Array.isArray(dataEntry.values)) {
                console.error('Skipping invalid analytic item - missing values array:', analyticItem);
                return;
            }

            const values = dataEntry.values;
            const user_uuid = analyticItem.data.loggedUser_uuid;
            const platform_page_Id = analyticItem.data.page_id;

            const commonFields = {
                user_uuid,
                platform_page_Id,
                platform: 'facebook',
                analytic_type: analyticType,
            };

            const mappedRecords = values
                .filter(v => v.value != 0)
                .map(v => {
                    const week_date = v.end_time;
                    let specificField = {};
                    switch (analyticType) {
                        case "page_daily_follows":
                            specificField = { total_page_followers: v.value }; break;
                        case "page_impressions":
                            specificField = { total_page_impressions: v.value }; break;
                        case "page_impressions_unique":
                            specificField = { total_page_impressions_unique: v.value }; break;
                        case "page_views_total":
                            specificField = { total_page_views: v.value }; break;
                        case "page_post_engagements":
                            specificField = { page_post_engagements: v.value }; break;
                        case "page_actions_post_reactions_like_total":
                            specificField = { page_actions_post_reactions_like_total: v.value }; break;
                        default:
                            console.warn(`Skipping unknown analytic type: ${analyticType}`);
                        return null;
                    }

                    return {
                        ...commonFields,
                        ...specificField,
                        week_date,
                    };
                })
                .filter(Boolean);

            allRecords.push(...mappedRecords);
        });

        // Only check DB if we have records to insert
        if (allRecords.length > 0) {
            // Create unique filter conditions
            const whereConditions = allRecords.map(record => ({
                user_uuid: record.user_uuid,
                platform_page_Id: record.platform_page_Id,
                analytic_type: record.analytic_type,
                week_date: record.week_date,
            }));

            // Fetch existing records
            const existingEntries = await Analytics.findAll({
                where: {
                    [Op.or]: whereConditions,
                },
                attributes: ['user_uuid', 'platform_page_Id', 'analytic_type', 'week_date'],
                raw: true,
            });

            // Build key set from existing entries
            const existingKeySet = new Set(
                existingEntries.map(entry =>
                    `${entry.user_uuid}_${entry.platform_page_Id}_${entry.analytic_type}_${entry.week_date}`
                )
            );

            // Filter out already existing entries
            const newRecords = allRecords.filter(record =>
                !existingKeySet.has(
                    `${record.user_uuid}_${record.platform_page_Id}_${record.analytic_type}_${record.week_date}`
                )
            );

            // Insert only new records
            if (newRecords.length > 0) {
                await Analytics.bulkCreate(newRecords);
                console.log(`Inserted ${newRecords.length} new analytics records.`);
            } else {
                console.log('No new analytics data to insert.');
            }
        }

    } catch (err) {
        console.error('Error processing analytics:', err);
    }
}

async function getPagePosts(pagesDetailList, user_social_id, loggedUser_uuid, retries = 3, delay = 2000) {
    setImmediate(async () => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to sync page posts`);
                await fetchPagesPosts(pagesDetailList, user_social_id, loggedUser_uuid);
                console.log('Background page posts sync completed.');
                break;
            } catch (err) {
                console.error(`Sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, delay)); // wait before retry
                } else {
                    console.error(' All retry attempts failed for page posts.');
                }
            }
        }
    });
}

async function fetchPagesPosts(pagesData, loggedUser_uuid, user_social_id) {
    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() - 1);
    const sinceDate = new Date(untilDate);
    sinceDate.setDate(untilDate.getDate() - 90);
    const timestampUntil = Math.floor(untilDate.getTime() / 1000);
    const timestampSince = Math.floor(sinceDate.getTime() / 1000);
    for (const page of pagesData) {
        try {
            const facebookRes = await axios.get(`https://graph.facebook.com/v22.0/${page.id}/posts`, {
                params: {
                    access_token: page.page_access_token,
                    fields: 'id,message,created_time,insights.metric(post_impressions,post_impressions_unique),likes.summary(true),comments.summary(true){id,from,message,created_time,comments{id,from,message,created_time}},shares,attachments',
                    since: timestampSince,
                    until: timestampUntil,
                },
            });
            const posts = facebookRes.data.data || [];
            const fullData = [];
            for (const post of posts) {
                if (!post?.id) continue;
                const createdEpoch = new Date(post.created_time).getTime() / 1000;
                if (createdEpoch >= timestampSince && createdEpoch <= timestampUntil) {
                    const likesCount = post.likes?.summary?.total_count || 0;
                    const commentsCount = post.comments?.summary?.total_count || 0;
                    const sharesCount = post.shares?.count || 0;
                    const engagements = sharesCount
                        ? likesCount + commentsCount + sharesCount / 3
                        : likesCount + commentsCount / 2;
                    const impressions =  post.insights?.data?.[0]?.values?.[0]?.value || 0;
                    const unique_impressions =  post.insights?.data?.[1]?.values?.[0]?.value || 0;
                    const formId = crypto.randomUUID();
                    const record = {
                        user_uuid: loggedUser_uuid,
                        social_user_id: user_social_id,
                        page_id: page.id,
                        content: post.message || '',
                        schedule_time: null,
                        post_media: post.attachments?.data?.[0]?.media?.image?.src || null,
                        platform_post_id: post.id,
                        post_platform: "facebook",
                        source: "API",
                        form_id: formId,
                        likes: likesCount,
                        comments: commentsCount,
                        shares: sharesCount,
                        engagements: engagements || 0,
                        impressions: impressions || 0,
                        unique_impressions: unique_impressions || 0,
                        week_date: new Date(post.created_time).toISOString().split("T")[0],
                        status: "1"
                    };
                    fullData.push(record);
                }
            }
            for (const record of fullData) {
                if (record.platform_post_id) {
                    const existing = await UserPost.findOne({
                        where: {
                            platform_post_id: record.platform_post_id,
                            user_uuid: record.user_uuid,
                            page_id: record.page_id
                        }
                    });
                    if (existing) {
                        const { source, ...updatePayload } = record;
                        await existing.update(updatePayload);
                    } else {
                        await UserPost.create(record);
                    }
                }
            }
        } catch (err) {
            console.error("Facebook Weekly Posts fetch error:", err.response?.data || err.message);
            continue;
        }
    }
}

async function getPagePostsComments(pagesDetailList, user_social_id, loggedUser_uuid, retries = 3, delay = 2000) {
    setImmediate(async () => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to sync page posts comments`);
                await fetchPagesPostsComments(pagesDetailList, user_social_id, loggedUser_uuid);
                console.log('Background page posts comments sync completed.');
                break;
            } catch (err) {
                console.error(`Sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, delay)); // wait before retry
                } else {
                    console.error(' All retry attempts failed for page posts comments.');
                }
            }
        }
    });
}

async function fetchPagesPostsComments(pagesData, loggedUser_uuid, user_social_id) {
    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() - 1);
    const sinceDate = new Date(untilDate);
    sinceDate.setDate(untilDate.getDate() - 90);

    const timestampUntil = Math.floor(untilDate.getTime() / 1000);
    const timestampSince = Math.floor(sinceDate.getTime() / 1000);
    const allComments = [];
    for (const page of pagesData) {
        try {
            const url = new URL(`https://graph.facebook.com/v22.0/${page.id}/posts`);
            url.search = new URLSearchParams({
                fields: 'id,likes.summary(true),comments.limit(50).order(reverse_chronological).summary(true){created_time,message,from,likes.summary(true),comments{created_time,message,from,likes.summary(true),comments{created_time,message,from,likes.summary(true)}}}',
                access_token: page.page_access_token,
                //limit: 25,
                since: timestampSince,
                until: timestampUntil
            });           

            const response = await fetch(url.toString());
            const result = await response.json();
            let posts = result.data;
            const postsWithComments = posts.filter(
                post => post.comments?.summary?.total_count > 0
            );

            function flattenCommentTree(comment, parentCommentId = null, postMetadata = {}, level = 0) {
                const flat = [];
                const current = {
                    ...postMetadata,
                    comment_id: comment.id,
                    parent_comment_id: parentCommentId,
                    from_id: comment.from?.id || null,
                    from_name: comment.from?.name || null,
                    comment: comment.message || '',
                    comment_created_time: comment.created_time,
                    comment_type: parentCommentId ? 'reply' : 'top_level',
                };
                flat.push(current);
                if (comment.comments?.data?.length > 0) {
                    for (const reply of comment.comments.data) {
                        flat.push(...flattenCommentTree(reply, comment.id, postMetadata, level + 1));
                    }
                }
                return flat;
            }

            for (const post of postsWithComments) {
                const postMetadata = {
                    user_uuid: loggedUser_uuid,
                    social_userid: user_social_id,
                    platform_page_Id: page.id,
                    platform: 'facebook',
                    post_id: post.id
                };
                const topComments = post.comments?.data || [];
                for (const comment of topComments) {
                    const flattenedComments = flattenCommentTree(comment, null, postMetadata);
                    allComments.push(...flattenedComments);
                }
            }

        } catch (err) {
            console.error("Facebook Weekly Posts fetch error:", err.response?.data || err.message);
            continue;
        }
    }

    // Remove duplicates using comment_id
    const uniqueComments = new Map();
    for (const item of allComments) {
        if (!uniqueComments.has(item.comment_id)) {
            uniqueComments.set(item.comment_id, item);
        }
    }

    // Save unique comments to DB (skip duplicates already saved)
    for (const commentData of uniqueComments.values()) {
        try {
            const existing = await PostComments.findOne({
                where: { comment_id: commentData.comment_id }
            });

            if (!existing) {
                await PostComments.create(commentData);
            }
        } catch (err) {
            console.error('Error saving comment to DB:', {
                comment_id: commentData.comment_id,
                error: err.message || err
            });
            continue; // Skip this comment and continue with the next
        }
    }

}

async function fetchFacebookPageChat(pagesDetailList, user_social_id, loggedUser_uuid, retries = 3, delay = 2000) {
    setImmediate(async () => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to sync chat...`);
                await fetchFacebookPageChat(pagesDetailList, user_social_id, loggedUser_uuid);
                console.log('Background chat sync completed.');
                break; // success, exit loop
            } catch (err) {
                console.error(`Sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, delay)); // wait before retry
                } else {
                    console.error(' All retry attempts failed for fetchFacebookPageChat.');
                }
            }
        }
    });
}

async function fetchFacebookPageChat(pagesData, loggedUser_uuid, user_social_id) {
    // console.log('pagesData', pagesData);
    // console.log('loggedUser_uuid', loggedUser_uuid);
    // console.log('user_social_id', user_social_id);
    for (const page of pagesData) {
        try {
            const fbConvoRes = await axios.get(
                `https://graph.facebook.com/v22.0/${page.id}/conversations`,
                { params: 
                    { fields: 
                        'id,senders,updated_time,snippet,unread_count', 
                        access_token: page.page_access_token 
                    } 
                }                
            );
            for (const convo of fbConvoRes.data.data) {
                const other = convo.senders.data.find(s => s.id !== page.id) || {};
                const convoRow = await InboxConversations.findOrCreate({
                    where: { conversation_id: convo.id },
                    defaults: {
                        user_uuid        : loggedUser_uuid,
                        social_userid    : user_social_id,
                        social_pageid    : page.id,
                        social_platform  : 'facebook',
                        external_userid  : other.id || 'NA',
                        external_username: other.name || null,
                        snippet          : convo.snippet || '',
                        //unreaded_messages: convo.unread_count,
                        status           : 'Active'
                    }
                }).then(([row]) => row);
                /* update snippet / unread every sync */
                await convoRow.update({
                    snippet          : convo.snippet || '',
                    unreaded_messages: convo.unread_count,
                    updatedAt        : new Date()
                });
                /* pull messages → upsert */
                const fbMsgRes = await axios.get(
                    `https://graph.facebook.com/v22.0/${convo.id}/messages`,
                    { params: { fields: 'id,message,from,created_time', access_token: page.page_access_token } }
                );
                for (const m of fbMsgRes.data.data) {
                    await InboxMessages.findOrCreate({
                        where: { platform_message_id: m.id },
                        defaults: {
                            conversation_id    : convo.id,
                            sender_type        : m.from?.id === page.id ? 'page' : 'visitor',
                            message_text       : m.message || '',
                            message_type       : 'text',
                            timestamp          : m.created_time
                        }
                    });
                }
            }
        } catch (syncErr) {
            console.error(`:x: Sync error for page ${page.id}:`, syncErr.response?.data || syncErr.message);
            continue;
        }
    }
}

router.post(`/adsAccounts`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({
            success: false,
            message: "No token provided." 
        });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ 
                success: false,
                message: "Token not valid." 
            });
        }

        const loggedUserdata = authData.userData;

        // Step 1: Get connected social accounts
        const connectedAccounts = await SocialUser.findAll({
            where: {
                user_id: loggedUserdata.uuid,
                social_user_platform: req.body.platform,
                status: 'Connected'
            },
            raw: true
        });

        if (connectedAccounts.length === 0) {
            return resp.status(200).json({
                success: false,
                message: "No connected accounts found."
            });
        }

        const connectedSocialIds = connectedAccounts.map(acc => acc.social_id);

        // Get connected pages
        const socialPages = await SocialUserPage.findAll({
            where: {
                user_uuid: loggedUserdata.uuid,
                social_userid: { [Op.in]: connectedSocialIds },
                status: 'Connected'
            },
            raw: true
        });

        // Get notConnected ad accounts
        const adsAccountsData = await AdsAccounts.findAll({
            where: {
                user_uuid: loggedUserdata.uuid,
                account_social_userid: { [Op.in]: connectedSocialIds },
                //isConnected: 'notConnected'
            },
            raw: true
        });

        // Final structured response
        const socialData = connectedAccounts.map(account => {
            const pages = socialPages
                .filter(p => p.social_userid === account.social_id)
                .map(p => ({
                    pageId: p.pageId,
                    pageName: p.pageName,
                    page_picture: p.page_picture,
                    page_platform: p.page_platform,
                    social_userid: p.social_userid
                }));

            const ads = adsAccountsData
                .filter(ad => ad.account_social_userid === account.social_id)
                .map(ad => ({
                    social_userid: ad.account_social_userid,
                    account_id: ad.account_id,
                    account_name: ad.account_name,
                    isConnected: ad.isConnected,
                    timezone: ad.timezone_name,
                    currency: ad.currency,
                    amount_spent: ad.amount_spent,
                    balance: ad.balance,
                    spend_cap: ad.spend_cap,
                }));

            return {
                name: account.name,
                social_id: account.social_id,
                img_url: account.img_url,
                social_user_platform: account.social_user_platform,
                status: account.status,                
                socialPage: pages,
                AdsAccounts: ads
            };
        });
     
        return resp.status(200).json({
            success: true,
            message: "Data fetch successfully.",
            socialData            
        });      
    });

});

router.post(`/ads-data`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({
            success: false,
            message: "No token provided." 
        });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ 
                success: false,
                message: "Token not valid." 
            });
        }

        const loggedUserdata = authData.userData;
        const selectdAdsAccount = req.body.accounts;

        if(req.body.selectedAccount) {
            const adsAccounts= [];

            const SocialUserData = await SocialUser.findOne({ 
                where: { 
                    user_id: loggedUserdata.uuid,
                    social_id: req.body.selectedAccount
                } 
            });          
            for (const adsAccount of selectdAdsAccount) {
                adsAccounts.push({
                    ads_accounts: adsAccount
                });
                const adsAccountsData = await AdsAccounts.findOne({
                    where: {
                        account_id: adsAccount,                      
                    }
                });

                if (adsAccountsData) {
                    await adsAccountsData.update({
                        isConnected: "Connected"
                    });
                }
                const user_uuid = loggedUserdata.uuid; 
                const account_social_userid = adsAccountsData.account_social_userid;
                const account_platform = 'facebook';
                const activity_type = "ads";
                const activity_subType = "account";
                const action = "connect";
                const post_form_id = '';
                const reference_pageID = { activity_type_id: {}, activity_subType_id: adsAccountsData.account_id, title:adsAccountsData.account_name };
                const source_type = '';
                const nextAPI_call_dateTime = '';
                await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            } 
            adsCampaignData(adsAccounts, loggedUserdata.uuid, SocialUserData.social_id, SocialUserData.user_token); 
                        
            return resp.status(200).json({
                success: true,
                message: "Data fetch successfully.",
                adsAccounts:adsAccounts
            });        
        } else {
            return resp.status(400).json({
                success: false,
                message: "Selected account not provided."
            });
        }
    });
}); 

async function adsCampaignData(adsAccounts, loggedUser_uuid, user_social_id, user_social_token, retries = 3, delay = 2000) {
    //console.log('cc',adAccountResponses,loggedUser_uuid, user_social_id);
    setImmediate(async () => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to sync campaign`);
                await saveAdsCampaignData(adsAccounts,loggedUser_uuid, user_social_id, user_social_token);
                console.log('Background campaign sync completed.');
                break; // success, exit loop
            } catch (err) {
                console.error(`Sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, delay)); // wait before retry
                } else {
                    console.error(' All retry attempts failed for campaign.');
                }
            }
        }
    });
}

// async function saveAdsCampaignData_old(adsAccounts, loggedUser_uuid, user_social_id, user_social_token) {
//     const adAccountResponses = [];
//     const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

//     for (const item of adsAccounts) {
//         const adsAccountId = item.ads_accounts;
//         try {
//             const campaignResponse = await fetch(
//                 `https://graph.facebook.com/v22.0/act_${adsAccountId}/campaigns?fields=name,status,effective_status,bid_strategy,start_time,end_time,daily_budget,lifetime_budget,spend_cap,budget_remaining&access_token=${user_social_token}`
//             );
//             const campaignJson = await campaignResponse.json();

//             const campaignsWithInsights = [];

//             if (campaignJson.data && campaignJson.data.length > 0) {
//                 for (const campaign of campaignJson.data) {
//                     const insightsUrl = `https://graph.facebook.com/v22.0/${campaign.id}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop&date_preset=last_90d&access_token=${user_social_token}`;

//                     let campaignInsights = [];
//                     try {
//                         const insightsResponse = await fetch(insightsUrl);
//                         const insightsJson = await insightsResponse.json();
//                         campaignInsights = insightsJson.data || [];
//                     } catch (insightErr) {
//                         console.error(`Failed to fetch campaign insights: ${insightErr.message}`);
//                     }

//                     let adsetsData = [];
//                     try {
//                         const adsetsResponse = await fetch(
//                             `https://graph.facebook.com/v22.0/${campaign.id}/adsets?fields=id,name,status,start_time,end_time,daily_budget,lifetime_budget,effective_status&access_token=${user_social_token}`
//                         );
//                         const adsetsJson = await adsetsResponse.json();

//                         if (adsetsJson.data && adsetsJson.data.length > 0) {
//                             for (const adset of adsetsJson.data) {
//                                 const adsetInsightsUrl = `https://graph.facebook.com/v22.0/${adset.id}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop&date_preset=last_90d&access_token=${user_social_token}`;
//                                 try {
//                                     const adsetInsightsRes = await fetch(adsetInsightsUrl);
//                                     const adsetInsightsJson = await adsetInsightsRes.json();

//                                     adsetsData.push({
//                                         adsetData: adset,
//                                         insights: adsetInsightsJson.data || []
//                                     });
//                                 } catch (err) {
//                                     adsetsData.push({
//                                         adsetData: adset,
//                                         insights: [],
//                                         error: `Failed to fetch adset insights: ${err.message}`
//                                     });
//                                 }
//                             }
//                         }
//                     } catch (adsetErr) {
//                         console.error(`Failed to fetch adsets: ${adsetErr.message}`);
//                     }

//                     campaignsWithInsights.push({
//                         campaignData: campaign,
//                         insights: campaignInsights,
//                         adsets: adsetsData
//                     });

//                     await sleep(300); // delay to avoid rate limits
//                 }
//             }

//             adAccountResponses.push({
//                 adAccountId: adsAccountId,
//                 campaigns: campaignsWithInsights
//             });

//         } catch (error) {
//             console.log(`Error fetching campaigns for account ${adsAccountId}: ${error.message}`);
//             adAccountResponses.push({
//                 adAccountId: adsAccountId,
//                 error: `Error fetching campaigns: ${error.message}`
//             });
//         }
//     }

//     for (const account of adAccountResponses) {
//         for (const campaignsData of account.campaigns) {
//             try {
//                 const existing = await Campaigns.findOne({
//                     where: { campaign_id: campaignsData.campaignData.id }
//                 });

//                 const campaignRecord = {
//                     user_uuid: loggedUser_uuid,
//                     account_platform: 'facebook',
//                     account_social_userid: user_social_id,
//                     ad_account_id: account.adAccountId,
//                     campaign_id: campaignsData.campaignData.id,
//                     campaign_name: campaignsData.campaignData.name,
//                     campaign_bid_strategy: campaignsData.campaignData.bid_strategy || null,
//                     campaign_budget_remaining: campaignsData.campaignData.budget_remaining || null,
//                     campaign_daily_budget: campaignsData.campaignData.daily_budget || null,
//                     campaign_effective_status: campaignsData.campaignData.effective_status || null,
//                     campaign_start_time: campaignsData.campaignData.start_time || null,
//                     campaign_campaign_status: campaignsData.campaignData.status || null
//                 };

//                 if (campaignsData.insights.length > 0) {
//                     const insight = campaignsData.insights[0];
//                     campaignRecord.campaign_insights_clicks = insight.clicks || null;
//                     campaignRecord.campaign_insights_cpc = insight.cpc || null;
//                     campaignRecord.campaign_insights_cpm = insight.cpm || null;
//                     campaignRecord.campaign_insights_cpp = insight.cpp || null;
//                     campaignRecord.campaign_insights_ctr = insight.ctr || null;
//                     campaignRecord.campaign_insights_date_start = insight.date_start || null;
//                     campaignRecord.campaign_insights_date_stop = insight.date_stop || null;
//                     campaignRecord.campaign_insights_impressions = insight.impressions || null;
//                     campaignRecord.campaign_insights_spend = insight.spend || null;
//                     campaignRecord.campaign_insights_reach = insight.reach || null;
//                     campaignRecord.campaign_insights_actions = insight.actions || null;

//                     if (insight.actions && Array.isArray(insight.actions)) {
//                         const resultAction = insight.actions.find(action =>
//                             ['link_click', 'offsite_conversion', 'lead'].includes(action.action_type)
//                         );
//                         if (resultAction && Number(resultAction.value) > 0) {
//                             campaignRecord.campaign_insights_cost_per_result = (
//                                 parseFloat(insight.spend) / parseFloat(resultAction.value)
//                             ).toFixed(2);
//                             campaignRecord.campaign_result_type = resultAction.action_type;
//                             campaignRecord.campaign_insights_results = parseInt(resultAction.value);
//                         }
//                     }
//                 }

//                 if (!existing) {
//                     await Campaigns.create(campaignRecord);
//                 } else {
//                     await Campaigns.update(campaignRecord, {
//                         where: { campaign_id: campaignsData.campaignData.id }
//                     });
//                 }

//                 for (const adsetItem of campaignsData.adsets || []) {
//                     try {
//                         const adset = adsetItem.adsetData;
//                         const insight = adsetItem.insights[0] || {};

//                         const resultAction = insight.actions?.find(action =>
//                             ['link_click', 'offsite_conversion', 'lead'].includes(action.action_type)
//                         );

//                         let costPerResult = null;
//                         let totalResults = null;
//                         let resultType = null;

//                         if (resultAction && parseFloat(resultAction.value) > 0 && parseFloat(insight.spend) > 0) {
//                             costPerResult = (parseFloat(insight.spend) / parseFloat(resultAction.value)).toFixed(2);
//                             totalResults = parseInt(resultAction.value);
//                             resultType = resultAction.action_type;
//                         }

//                         const adsetRecord = {
//                             user_uuid: loggedUser_uuid,
//                             account_platform: 'facebook',
//                             account_social_userid: user_social_id,
//                             adsets_campaign_id: campaignsData.campaignData.id,
//                             adsets_id: adset.id,
//                             adsets_name: adset.name,
//                             adsets_status: adset.status,
//                             adsets_start_time: adset.start_time || null,
//                             adsets_insights_impressions: insight.impressions || null,
//                             adsets_insights_clicks: insight.clicks || null,
//                             adsets_insights_cpc: insight.cpc || null,
//                             adsets_insights_cpm: insight.cpm || null,
//                             adsets_insights_ctr: insight.ctr || null,
//                             adsets_insights_spend: insight.spend || null,
//                             adsets_daily_budget: adset.daily_budget ? (parseFloat(adset.daily_budget) / 100).toFixed(2) : null,
//                             adsets_lifetime_budget: adset.lifetime_budget ? (parseFloat(adset.lifetime_budget) / 100).toFixed(2) : null,
//                             adsets_insights_date_start: insight.date_start || null,
//                             adsets_insights_date_stop: insight.date_stop || null,
//                             adsets_insights_reach: insight.reach || null,
//                             adsets_insights_results: totalResults,
//                             adsets_result_type: resultType,
//                             adsets_insights_cost_per_result: costPerResult,
//                             adsets_insights_actions: insight.actions || null
//                         };

//                         const existingAdset = await Adsets.findOne({ where: { adsets_id: adset.id } });

//                         if (!existingAdset) {
//                             await Adsets.create(adsetRecord);
//                         } else {
//                             await Adsets.update(adsetRecord, { where: { adsets_id: adset.id } });
//                         }

//                         // ✅ Corrected adset ID access here
//                         const adsetId = adset.id;
//                         const adsUrl = `https://graph.facebook.com/v22.0/${adsetId}/ads?fields=id,name,adset_id,campaign_id,effective_status,status&access_token=${user_social_token}`;
//                         try {                          
//                             const adsResponse = await fetch(adsUrl);
//                             const adsJson = await adsResponse.json();
//                             console.log('andy',adsJson);
//                             if (Array.isArray(adsJson.data)) {
//                                 for (const ad of adsJson.data) {
//                                     const adInsightsUrl = `https://graph.facebook.com/v22.0/${ad.id}/insights?fields=impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop&date_preset=last_90d&access_token=${user_social_token}`;
//                                     try {
//                                         const adInsightsRes = await fetch(adInsightsUrl);
//                                         const adInsightsJson = await adInsightsRes.json();

//                                         const insight = adInsightsJson.data?.[0] || {};
//                                         let costPerResult = null;
//                                         let resultType = null;

//                                         const resultAction = insight.actions?.find(act =>
//                                             ['link_click', 'offsite_conversion', 'lead'].includes(act.action_type)
//                                         );

//                                         if (resultAction && Number(resultAction.value) > 0) {
//                                             costPerResult = (parseFloat(insight.spend) / parseFloat(resultAction.value)).toFixed(2);
//                                             resultType = resultAction.action_type;
//                                         }

//                                         const adRecord = {
//                                             user_uuid: loggedUser_uuid,
//                                             account_platform: 'facebook',
//                                             account_social_userid: user_social_id,
//                                             campaign_id: campaignsData.campaignData.id,
//                                             adset_id: adsetId,
//                                             ads_id: ad.id,
//                                             ads_name: ad.name,
//                                             ads_status: ad.status,
//                                             ads_effective_status: ad.effective_status,

//                                             ads_insights_clicks: insight.clicks || null,
//                                             ads_insights_cpc: insight.cpc || null,
//                                             ads_insights_cpm: insight.cpm || null,
//                                             ads_insights_ctr: insight.ctr || null,
//                                             ads_insights_spend: insight.spend || null,
//                                             ads_insights_reach: insight.reach || null,
//                                             ads_insights_impressions: insight.impressions || null,
//                                             ads_insights_actions: insight.actions || null,
//                                             ads_insights_date_start: insight.date_start || null,
//                                             ads_insights_date_stop: insight.date_stop || null,
//                                             ads_insights_cost_per_result: costPerResult,
//                                             ads_result_type: resultType
//                                         };

//                                         await AdsetsAds.upsert(adRecord);
//                                     } catch (err) {
//                                         console.error(`Ad insights fetch error for ad ${ad.id}:`, err.message);
//                                     }
//                                 }
//                             }
//                         } catch (err) {
//                             console.error(`Error fetching ads for adset ${adsetId}:`, err.message);
//                         }

//                     } catch (err) {
//                         console.error(`Failed to save adset ${adsetItem?.adsetData?.id}:`, err.message);
//                     }
//                 }
//             } catch (err) {
//                 console.error('Error saving campaign to DB:', err.message);
//                 continue;
//             }
//         }
//     }
//     await sleep(1000);
// }

async function saveAdsCampaignData(adsAccounts, loggedUser_uuid, user_social_id, user_social_token) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const item of adsAccounts) {
        const adsAccountId = item.ads_accounts;

        const fields = [
            "name",
            "special_ad_category",
            "status",
            "effective_status",
            "bid_strategy",
            "buying_type", 
            "objective",
            "start_time",
            "end_time",
            "daily_budget",
            "lifetime_budget",
            "spend_cap",
            "budget_remaining",            
            "insights.fields(impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop).date_preset(last_90d)",
            "adsets.limit(50){id,name,status,start_time,end_time,daily_budget,lifetime_budget,effective_status,targeting{geo_locations{countries,regions,cities},age_min,age_max,genders,publisher_platforms,facebook_positions,instagram_positions,device_platforms}," +
                "insights.fields(impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop).date_preset(last_90d)," +
                "ads.limit(50){id,name,adset_id,campaign_id,effective_status,status," +
                    "insights.fields(impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop).date_preset(last_90d)" +
                "}}"
        ].join(',');

        try {
            const res = await fetch(
                `https://graph.facebook.com/v22.0/act_${adsAccountId}/campaigns?fields=${fields}&access_token=${user_social_token}`
            );
            const data = await res.json();

            if (!data.data) continue;

            for (const campaign of data.data) {
                try {
                    const campaignId = campaign.id;
                    const existingCampaign = await Campaigns.findOne({ where: { campaign_id: campaignId } });

                    const campaignRecord = {
                        user_uuid: loggedUser_uuid,
                        account_platform: 'facebook',
                        account_social_userid: user_social_id,
                        ad_account_id: adsAccountId,
                        campaign_id: campaign.id,
                        campaign_name: campaign.name,
                        campaign_category: campaign.special_ad_category || null,
                        campaign_bid_strategy: campaign.bid_strategy || null,
                        campaign_buying_type: campaign.buying_type || null,
                        campaign_objective: campaign.objective || null,
                        campaign_budget_remaining: campaign.budget_remaining || null,
                        campaign_daily_budget: campaign.daily_budget || null,
                        campaign_lifetime_budget: campaign.lifetime_budget || null,
                        campaign_effective_status: campaign.effective_status || null,
                        campaign_start_time: campaign.start_time || null,
                        campaign_end_time: campaign.end_time || null,
                        campaign_campaign_status: campaign.status || null
                    };

                    const campaignInsight = campaign.insights?.data?.[0];
                    if (campaignInsight) {
                        Object.assign(campaignRecord, {
                            campaign_insights_clicks: campaignInsight.clicks || null,
                            campaign_insights_cpc: campaignInsight.cpc || null,
                            campaign_insights_cpm: campaignInsight.cpm || null,
                            campaign_insights_cpp: campaignInsight.cpp || null,
                            campaign_insights_ctr: campaignInsight.ctr || null,
                            campaign_insights_date_start: campaignInsight.date_start || null,
                            campaign_insights_date_stop: campaignInsight.date_stop || null,
                            campaign_insights_impressions: campaignInsight.impressions || null,
                            campaign_insights_spend: campaignInsight.spend || null,
                            campaign_insights_reach: campaignInsight.reach || null,
                            campaign_insights_actions: campaignInsight.actions || null
                        });

                        const resultAction = campaignInsight.actions?.find(action =>
                            ['link_click', 'offsite_conversion', 'lead'].includes(action.action_type)
                        );

                        if (resultAction && parseFloat(resultAction.value) > 0 && parseFloat(campaignInsight.spend) > 0) {
                            campaignRecord.campaign_insights_cost_per_result = (
                                parseFloat(campaignInsight.spend) / parseFloat(resultAction.value)
                            ).toFixed(2);
                            campaignRecord.campaign_result_type = resultAction.action_type;
                            campaignRecord.campaign_insights_results = parseInt(resultAction.value);
                        }
                    }

                    if (!existingCampaign) {
                        await Campaigns.create(campaignRecord);
                    } else {
                        await Campaigns.update(campaignRecord, { where: { campaign_id: campaignId } });
                    }

                    // === Adsets ===
                    if (campaign.adsets?.data?.length) {
                        for (const adset of campaign.adsets.data) {

                            const targeting = adset.targeting || {};
                            const geoLocations = targeting.geo_locations || {};

                            // Extract geo-location values
                            const countries = geoLocations.countries || [];
                            const regions = geoLocations.regions || [];  // Array of region objects
                            const cities = geoLocations.cities || [];     // Array of city objects

                             const ageMin = targeting.age_min || null;
                            const ageMax = targeting.age_max || null;
                            const genders = targeting.genders ? targeting.genders.join(',') : null;
                            const publisherPlatforms = targeting.publisher_platforms ? targeting.publisher_platforms.join(',') : null;
                            const facebookPositions = targeting.facebook_positions ? targeting.facebook_positions.join(',') : null;
                            const instagramPositions = targeting.instagram_positions ? targeting.instagram_positions.join(',') : null;
                            const devicePlatforms = targeting.device_platforms ? targeting.device_platforms.join(',') : null;

                            const insight = adset.insights?.data?.[0] || {};

                            const resultAction = insight.actions?.find(action =>
                                ['link_click', 'offsite_conversion', 'lead'].includes(action.action_type)
                            );

                            let costPerResult = null;
                            let totalResults = null;
                            let resultType = null;

                            if (resultAction && parseFloat(resultAction.value) > 0 && parseFloat(insight.spend) > 0) {
                                costPerResult = (parseFloat(insight.spend) / parseFloat(resultAction.value)).toFixed(2);
                                totalResults = parseInt(resultAction.value);
                                resultType = resultAction.action_type;
                            }

                            const adsetRecord = {
                                user_uuid: loggedUser_uuid,
                                account_platform: 'facebook',
                                account_social_userid: user_social_id,
                                adsets_campaign_id: campaign.id,
                                adsets_id: adset.id,
                                adsets_name: adset.name,
                                adsets_countries: countries.join(',') || null,
                                adsets_regions: regions.length > 0 ? regions : null,
                                adsets_cities: cities.length > 0 ? cities : null,
                                adsets_age_min: ageMin,
                                adsets_age_max: ageMax,
                                adsets_genders: genders,
                                adsets_publisher_platforms: publisherPlatforms,
                                adsets_facebook_positions: facebookPositions,
                                adsets_instagram_positions: instagramPositions,
                                adsets_device_platforms: devicePlatforms,
                                adsets_status: adset.status,
                                adsets_effective_status: adset.effective_status,
                                adsets_start_time: adset.start_time || null,
                                adsets_end_time: adset.end_time || null,
                                adsets_daily_budget: adset.daily_budget ? (parseFloat(adset.daily_budget) / 100).toFixed(2) : null,
                                adsets_lifetime_budget: adset.lifetime_budget ? (parseFloat(adset.lifetime_budget) / 100).toFixed(2) : null,
                                
                                adsets_insights_impressions: insight.impressions || null,
                                adsets_insights_clicks: insight.clicks || null,
                                adsets_insights_cpc: insight.cpc || null,
                                adsets_insights_cpm: insight.cpm || null,
                                adsets_insights_ctr: insight.ctr || null,
                                adsets_insights_spend: insight.spend || null,
                                adsets_insights_date_start: insight.date_start || null,
                                adsets_insights_date_stop: insight.date_stop || null,
                                adsets_insights_reach: insight.reach || null,
                                adsets_insights_results: totalResults,
                                adsets_result_type: resultType,
                                adsets_insights_cost_per_result: costPerResult,
                                adsets_insights_actions: insight.actions || null
                            };

                            const existingAdset = await Adsets.findOne({ where: { adsets_id: adset.id } });

                            if (!existingAdset) {
                                await Adsets.create(adsetRecord);
                            } else {
                                await Adsets.update(adsetRecord, { where: { adsets_id: adset.id } });
                            }

                            // === Ads ===
                            if (adset.ads?.data?.length) {
                                for (const ad of adset.ads.data) {
                                    const adInsight = ad.insights?.data?.[0] || {};

                                    const resultAction = adInsight.actions?.find(act =>
                                        ['link_click', 'offsite_conversion', 'lead'].includes(act.action_type)
                                    );

                                    let costPerResult = null;
                                    let resultType = null;

                                    if (resultAction && Number(resultAction.value) > 0 && Number(adInsight.spend) > 0) {
                                        costPerResult = (
                                            parseFloat(adInsight.spend) / parseFloat(resultAction.value)
                                        ).toFixed(2);
                                        resultType = resultAction.action_type;
                                    }

                                    const adRecord = {
                                        user_uuid: loggedUser_uuid,
                                        account_platform: 'facebook',
                                        account_social_userid: user_social_id,
                                        campaign_id: campaign.id,
                                        adsets_id: adset.id,
                                        ads_id: ad.id,
                                        ads_name: ad.name,
                                        ads_status: ad.status,
                                        ads_effective_status: ad.effective_status,

                                        ads_insights_clicks: adInsight.clicks || null,
                                        ads_insights_cpc: adInsight.cpc || null,
                                        ads_insights_cpm: adInsight.cpm || null,
                                        ads_insights_ctr: adInsight.ctr || null,
                                        ads_insights_spend: adInsight.spend || null,
                                        ads_insights_reach: adInsight.reach || null,
                                        ads_insights_impressions: adInsight.impressions || null,
                                        ads_insights_actions: adInsight.actions || null,
                                        ads_insights_date_start: adInsight.date_start || null,
                                        ads_insights_date_stop: adInsight.date_stop || null,
                                        ads_insights_cost_per_result: costPerResult,
                                        ads_result_type: resultType
                                    };

                                    const userDetails = {
                                        user_uuid: loggedUser_uuid,
                                        user_social_id: user_social_id
                                    };
                                    await saveAdCreativeFromAdId(ad.id, adset.id, campaign.id, userDetails, user_social_token);                                

                                    const existingAds = await AdsetsAds.findOne({ where: { ads_id: ad.id } });
                                    if (!existingAds) {
                                        await AdsetsAds.create(adRecord);
                                    } else {
                                        await AdsetsAds.update(adRecord, { where: { ads_id: ad.id } });
                                    }

                                }
                            }  
                        }
                    }

                } catch (err) {
                    console.error('❌ Error saving campaign, adset, or ads:', err.message);
                }
            }

            await sleep(800); // prevent rate limit
        } catch (err) {
            console.error(`❌ Error fetching data for account ${adsAccountId}:`, err.message);
        }
    }
}

async function saveAdCreativeFromAdId(adId, adsetId, campaignId, userDetails, accessToken) {
    try {
        const res = await fetch(
            `https://graph.facebook.com/v18.0/${adId}?fields=id,creative{ id, title, body, image_url, object_story_spec, asset_feed_spec }&access_token=${accessToken}`
        );
        const data = await res.json();
        if (!data || !data.creative) {
            console.warn(`:warning: No creative found for Ad ID ${adId}`);
            return;
        }
        const creative = data.creative;
        const objectStory = creative.object_story_spec?.link_data || {};
        const videoData = creative.object_story_spec?.video_data || null;
        const assetSpec = creative.asset_feed_spec;
        let creativeType = 'unknown';
        let imageUrls = null;
        let videoThumbnail = null;
        // Handle carousel
        if (assetSpec?.titles && assetSpec?.images) {
            const cards = assetSpec.titles.map((titleObj, index) => ({
                title: titleObj.text || null,
                body: assetSpec.bodies?.[index]?.text || null,
                image_url: assetSpec.images?.[index]?.url || null,
                call_to_action: assetSpec.call_to_action_types?.[0] || null
            }));
            imageUrls = JSON.stringify(cards);
            creativeType = 'carousel';
        }
        // Handle video
        else if (videoData?.video_id) {
            videoThumbnail = videoData?.image_url || null;
            imageUrls = null;
            creativeType = 'video';
        }
        // Handle single image
        else if (creative?.image_url) {
            imageUrls = JSON.stringify(creative.image_url);
            creativeType = 'image';
        }
        const creativeRecord = {
            user_uuid: userDetails.user_uuid,
            account_platform: 'facebook',
            social_page_id: creative.object_story_spec?.page_id || null,
            account_social_userid: userDetails.user_social_id,
            campaign_id: campaignId,
            adset_id: adsetId,
            ad_id: adId,
            creative_id: creative.id || null,
            creative_type: creativeType,
            image_urls: imageUrls,
            video_thumbnails: videoThumbnail,
            headline: creative.title || null,
            body: creative.body || null,
            call_to_action:
                objectStory?.call_to_action?.type ||
                assetSpec?.call_to_action_types?.[0] ||
                null,
            call_to_action_link:objectStory.link || null
        };
        const existingCreative = await AdsCreative.findOne({
            where: { creative_id: creative.id }
        });
        if (!existingCreative) {
            await AdsCreative.create(creativeRecord);
        } else {
            await AdsCreative.update(creativeRecord, {
                where: { creative_id: creative.id }
            });
        }
        console.log(`:white_check_mark: Creative saved for Ad ID ${adId}`);
    } catch (err) {
        console.error(`:x: Error saving creative for Ad ID ${adId}:`, err.message);
    }
}

// facebook campaigns functions starts here
router.post(`/get-campaigns`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({
            success: false,
            message: "No token provided."
        });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({
                success: false,
                message: "Token not valid."
            });
        }
        try {
            const adData = req.body.adData;
            if(!adData){
                resp.status(500).json({ error: 'Ad Data not provided.' })
            }
            const campaigns = await Campaigns.findAll({
                where:{
                    account_social_userid: adData.social_userid,
                    ad_account_id: adData.account_id
                },
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM adsets_ads AS ads
                                WHERE ads.campaign_id = campaigns.campaign_id
                            )`),
                            'ads_count'
                        ]
                    ]
                },
                raw:true
            });
            //console.log("Campaigns Data: ",campaigns);
            resp.json({ campaigns: campaigns });
        } catch (err) {
            console.error(err.response?.data || err.message);
            resp.status(500).json({ error: 'Campaigns Data fetch error.', err_data : err });
        }
    });
});

router.post('/campaign-ads-details', async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ success: false, message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, message: "Token not valid." });
        }
        const { campaignId, socialUserId } = req.body;
        if (!campaignId || !socialUserId) {
            return resp.status(400).json({ success: false, message: 'Campaign ID and Social User ID are required.' });
        }
        try {
            const ActiveSocialUser = await SocialUser.findOne({
                where: {
                    social_id: socialUserId,
                    status: 'Connected',
                    user_id: authData.userData.uuid
                }
            });
            if (!ActiveSocialUser) {
                return resp.status(404).json({ success: false, message: 'Connected social user not found.' });
            }
            // First, fetch campaign separately to get ad_account_id
            const campaign = await Campaigns.findOne({
                where: {
                    account_social_userid: socialUserId,
                    campaign_id: campaignId
                },
                raw: true
            });
            if (!campaign) {
                return resp.status(404).json({ success: false, message: 'Campaign not found.' });
            }
            // Now run the rest of the dependent queries in parallel
            const [adsets, adsets_ads, ads_creative, ad_account] = await Promise.all([
                Adsets.findAll({
                    where: {
                        account_social_userid: socialUserId,
                        adsets_campaign_id: campaignId
                    },
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT COUNT(*)
                                    FROM adsets_ads AS ads
                                    WHERE ads.adsets_id = adsets.adsets_id
                                )`),
                                'ads_count'
                            ]
                        ]
                    },
                    raw: true
                }),
                AdsetsAds.findAll({
                    where: {
                        account_social_userid: socialUserId,
                        campaign_id: campaignId
                    },
                    attributes: {
                        include: [
                            [
                                sequelize.literal(`(
                                    SELECT adsets.adsets_name
                                    FROM adsets
                                    WHERE adsets.adsets_id = adsets_ads.adsets_id
                                    LIMIT 1
                                )`),
                                'adsets_name'
                            ],
                            [
                                sequelize.literal(`(
                                    SELECT adsets.adsets_insights_results
                                    FROM adsets
                                    WHERE adsets.adsets_id = adsets_ads.adsets_id
                                    LIMIT 1
                                )`),
                                'adsets_insights_results'
                            ]
                        ]
                    },
                    raw: true
                }),
                AdsCreative.findAll({
                    where: {
                        account_social_userid: socialUserId,
                        campaign_id: campaignId
                    },
                    include: [
                        {
                            model: SocialUserPage,
                            as: 'socialPage',
                            attributes: ['pageId','pageName','page_picture'], // or other fields you need
                            required: false
                        }
                    ]
                }),
                AdsAccounts.findOne({
                    where: {
                        account_id: campaign.ad_account_id,
                        account_social_userid: socialUserId
                    },
                    raw: true
                }),
            ]);
            return resp.status(200).json({
                success: true,
                data: {
                    campaign,
                    adsets,
                    adsets_ads,
                    ads_creative,
                    ad_account
                }
            });
        } catch (error) {
            console.error('[CAMPAIGN_FETCH_ERROR]', error.message || error);
            return resp.status(500).json({
                success: false,
                message: 'Failed to fetch campaign-related data.',
                error: error.message || error
            });
        }
    });
});

router.post(`/fetch-targeting`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({
            success: false,
            message: "No token provided." 
        });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ 
                success: false,
                message: "Token not valid." 
            });
        }
        const loggedUserdata = authData.userData;

        if(req.body.selectedAccount) {
            const SocialUserData = await SocialUser.findOne({ 
                where: { 
                    user_id: loggedUserdata.uuid,
                    social_id: req.body.selectedAccount
                } 
            });

            try {
                const res = await fetch(
                    `https://graph.facebook.com/v19.0/search?type=adinterest&q=${encodeURIComponent(
                    req.body.queryText
                    )}&limit=200&access_token=${SocialUserData.user_token}`
                );
                const data = await res.json();
                if (data?.data) {
                    return resp.status(200).json({
                        success: true,
                        targetingData: data?.data
                    });
                } else {
                    return resp.status(200).json({
                        success: true,
                        targetingData: ''
                    });
                }
            } catch (err) {
                console.error('Targeting search failed', err);
                return resp.status(400).json({
                    success: false,
                    message: "Targeting search failed."
                });
            }           

        } else {
            return resp.status(402).json({
                success: false,
                message: "Selected account not found."
            });
        }
    });
});

function formatDateTime(dateString) {
  const dateObj = new Date(dateString);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

router.post(`/create-campaign`, upload, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({
            success: false,
            error_user_msg: "No token provided."
        });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({
                success: false,
                error_user_msg: "Token not valid."
            });
        }

        const loggedUserdata = authData.userData;
        const payload = JSON.parse(req.body.data);

        if (!payload.socailAccount) {
            return resp.status(402).json({
                success: false,
                error_user_msg: "Selected account not found."
            });
        }

        const SocialUserData = await SocialUser.findOne({
            where: {
                user_id: loggedUserdata.uuid,
                social_id: payload.socailAccount
            }
        });
        
        try {
            const createCampaignResponse = await axios.post(
                `https://graph.facebook.com/v22.0/act_${payload.AdsAccounts[0]}/campaigns?access_token=${SocialUserData.user_token}`,
                {
                    name: payload.campaignData.campaignName,
                    objective: payload.campaignData.campaignObjective,
                    status: 'PAUSED',
                    special_ad_categories: [payload.campaignData.campaignCategory || 'NONE'],
                    buying_type: payload.campaignData.campaignBuyingType || "AUCTION",                    
                }
            );

            if (createCampaignResponse.data.id) {
                const campaignID = createCampaignResponse.data.id;
                const AdsAccountID = payload.AdsAccounts[0];
                // const SocialUsertoken = SocialUserData.user_token;
                // const AdsAccountID = payload.AdsAccounts[0];
                // const adsetsData = {
                //     campaignID,
                //     adsetsName: payload.createAdData.campaignName,
                //     adsetContent: payload.adsetsData
                // };       
                // const AdCreativeData = {
                //     accessToken: SocialUserData.user_token,
                //     AdsAccounts: payload.AdsAccounts[0],
                //     pageDetail: payload.pageDetail,
                //     createAdName: payload.createAdData.createAdName,
                //     createAdContent: payload.createAdData.createAdContent,
                //     createAdHeadline: payload.createAdData.createAdHeadline,
                //     createAdWebsiteURL: payload.createAdData.createAdWebsiteURL,
                //     createAdCallToAction: payload.createAdData.createAdCallToAction,
                //     createAdImages: req.files
                // };
                //console.log('campaignID',campaignID);
                //await createCampaignAdSets(adsetsData, AdsAccountID, SocialUsertoken, AdCreativeData); 
                
                const campaignRecord = {
                    user_uuid: loggedUserdata.uuid,
                    account_platform: 'facebook',
                    account_social_userid: payload.socailAccount,
                    ad_account_id: AdsAccountID,
                    campaign_id: campaignID,
                    campaign_name: payload.campaignData.campaignName,
                    campaign_buying_type:payload.campaignData.campaignBuyingType,
                    campaign_objective:payload.campaignData.campaignObjective,
                    campaign_category: payload.campaignData.campaignCategory || 'NONE',
                    campaign_daily_budget: payload.daily_type === "daily" ? parseFloat(payload.daily_budget).toFixed(2) : null,
                    campaign_lifetime_budget: payload.daily_type === "lifetime" ? parseFloat(payload.daily_budget).toFixed(2) : null,
                    campaign_start_time: payload.start_time,
                    campaign_end_time: payload.end_time,
                    campaign_status: 'PAUSED',
                    campaign_effective_status: 'PAUSED',                  
                };

                await Campaigns.create(campaignRecord);               

                return resp.status(200).json({
                    success: true,
                    resData: campaignID             
                });                               
            } else {
                return resp.status(400).json({
                    success: false,
                    error_user_msg: "Campaign creation failed."
                });
            }
        } catch (error) {
            //console.error("Full Ad Creation Error:", error);
            return resp.status(400).json({
                success: false,
                error_user_msg: error
            });
        }
    });
});

// AdSet creation
// async function createCampaignAdSets(adsetsData, AdsAccountID, SocialUsertoken, AdCreativeData) {
//     const {
//         campaignID,
//         adsetsName,
//         adsetContent
//     } = adsetsData;

//     const {
//         daily_type,
//         daily_budget,
//         optimization_goal,
//         start_time,
//         end_time,
//         countries,
//         age_min,
//         age_max,
//         genders,
//         device_platforms,
//         facebook_positions,
//         instagram_positions,
//         bid_strategy,
//         bid_amount
//     } = adsetContent;

//     const strategy = bid_strategy || "LOWEST_COST_WITHOUT_CAP";
//     const payload = {
//         name: adsetsName,
//         campaign_id: campaignID,
//         billing_event: "IMPRESSIONS",
//         optimization_goal,
//         bid_strategy: strategy,
//         daily_budget: daily_type === "daily" ? daily_budget * 100 : undefined,
//         lifetime_budget: daily_type === "lifetime" ? daily_budget * 100 : undefined,
//         start_time,
//         end_time,
//         targeting: {
//             geo_locations: {
//                 countries
//             },
//             age_min,
//             age_max,
//             genders: [genders],
//             device_platforms: device_platforms === "All" ? ["mobile", "desktop"] : [device_platforms],
//             publisher_platforms: ["facebook", "instagram"],
//             facebook_positions: Array.isArray(facebook_positions) ? facebook_positions : Object.values(facebook_positions || {}),
//             instagram_positions: Array.isArray(instagram_positions) ? instagram_positions : Object.values(instagram_positions || {}),
//             interests: Array.isArray(adsetContent.interests) && adsetContent.interests.length > 0
//                 ? adsetContent.interests.map(item => ({ id: item.id, name: item.name }))
//                 : undefined
//         },
//         status: 'PAUSED'
//     };

//     if ((strategy === "LOWEST_COST_WITH_BID_CAP" || strategy === "COST_CAP") && bid_amount) {
//         payload.bid_amount = bid_amount * 100;
//     }

//     try {
//         const response = await axios.post(
//             `https://graph.facebook.com/v22.0/act_${AdsAccountID}/adsets?access_token=${SocialUsertoken}`,
//             payload
//         );

//         if (response.data.id) {
//             const AdSetID = response.data.id;
//             await createAdCreatives(AdCreativeData, AdSetID);
//         } 
//     } catch (error) {
//         const fbError = error?.response?.data?.error; 
//         //console.log('Adsets error:',fbError);
//         //console.log('Adsets error 2:',error);       
//         let adsetsError
//         if(error.error_user_msg){            
//             adsetsError = error.error_user_msg;
//         } else {            
//             adsetsError = fbError.error_user_msg;
//         }      
//         throw {
//             error_user_msg: adsetsError || 'Adsets Create Error.',
//         };
//     }
// }

router.post(`/create-adsets`, upload, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({
            success: false,
            error_user_msg: "No token provided."
        });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({
                success: false,
                error_user_msg: "Token not valid."
            });
        }

        try {
            const loggedUserdata = authData.userData;            
            const payload = JSON.parse(req.body.data);

            const {                
                age_min,
                age_max,
                countries,
                daily_budget,
                daily_type,
                start_time,
                end_time,
                device_platforms,                
                facebook_positions,
                genders,
                instagram_positions,
                interests,
                optimization_goal,                
                bid_strategy,
                bid_amount,
            } = payload.adsetsData;

            const SocialUserData = await SocialUser.findOne({
                where: {
                    user_id: loggedUserdata.uuid,
                    social_id: payload.socailAccount
                }
            });

            if (!SocialUserData) {
                return resp.status(404).json({
                    success: false,
                    error_user_msg: "Social user not found."
                });
            }

            const strategy = bid_strategy || "LOWEST_COST_WITHOUT_CAP";
            const parsedGenders =
                genders === "0" ? [1, 2] :
                genders === "1" ? [1] :
                genders === "2" ? [2] : [];

            const publisherPlatforms = payload.adsetsData.PublisherPlatform || [];
            //console.log('vvv',payload.adsetsData.PublisherPlatform);
            const adSetPayload = {
                name: payload.campaignAdsetsName,
                campaign_id: payload.campaign_id,
                billing_event: "IMPRESSIONS",
                optimization_goal,
                bid_strategy: strategy,
                daily_budget: daily_type === "daily" ? daily_budget * 100 : undefined,
                lifetime_budget: daily_type === "lifetime" ? daily_budget * 100 : undefined,
                start_time,
                end_time,
                targeting: {
                    geo_locations: {
                        countries
                    },
                    age_min,
                    age_max,
                    genders: parsedGenders,
                    device_platforms:
                        device_platforms === "All"
                            ? ["mobile", "desktop"]
                            : [device_platforms.toLowerCase()],

                    publisher_platforms: publisherPlatforms, //["facebook"], //instagram
                    // facebook_positions: Array.isArray(facebook_positions)
                    //     ? facebook_positions
                    //     : Object.values(facebook_positions || {}),
                    // instagram_positions: Array.isArray(instagram_positions)
                    //     ? instagram_positions
                    //     : Object.values(instagram_positions || {}),

                    facebook_positions: publisherPlatforms.includes("facebook")
                        ? (Array.isArray(facebook_positions)
                            ? facebook_positions
                            : Object.values(facebook_positions || {}))
                        : [],
                    instagram_positions: publisherPlatforms.includes("instagram") ? instagram_positions : [],
                    audience_network_positions: publisherPlatforms.includes("audience_network") ? audience_network_positions : [],
                    messenger_positions: publisherPlatforms.includes("messenger") ? messenger_positions : [],
                    threads_positions: publisherPlatforms.includes("threads") ? threads_positions : [],

                    interests: Array.isArray(interests) && interests.length > 0
                        ? interests.map(item => ({ id: item.id }))
                        : undefined
                },
                status: "PAUSED"
            };            

            if ((strategy === "LOWEST_COST_WITH_BID_CAP" || strategy === "COST_CAP") &&bid_amount) 
            {
                adSetPayload.bid_amount = bid_amount * 100;
            }

            const response = await axios.post(
                `https://graph.facebook.com/v22.0/act_${payload.AdsAccounts[0]}/adsets?access_token=${SocialUserData.user_token}`,
                adSetPayload
            );

            if (response.data.id) {
                const AdSetID = response.data.id;
                 
                 // save adset in database
                    const adsetRecord = {
                        user_uuid: loggedUserdata.uuid,
                        account_platform: 'facebook',
                        account_social_userid: payload.socailAccount,
                        adsets_campaign_id: payload.campaign_id,
                        adsets_id: AdSetID,
                        adsets_name: payload.campaignAdsetsName,
                        adsets_countries: countries.join(',') || null,
                        adsets_age_min: age_min,
                        adsets_age_max: age_max,
                        adsets_genders: genders,
                        adsets_publisher_platforms: (payload.adsetsData.PublisherPlatform || []).join(","),
                        adsets_facebook_positions: (payload.adsetsData.facebook_positions || []).join(","),
                        adsets_instagram_positions: (payload.adsetsData.instagram_positions || []).join(","),
                        adsets_device_platforms: device_platforms === "All" ? ["mobile", "desktop"].join(","): device_platforms.toLowerCase(),
                        adsets_status: "PAUSED",
                        adsets_effective_status: "PAUSED",
                        adsets_start_time: payload.adsetsData.start_time ? formatDateTime(payload.adsetsData.start_time): null,
                        adsets_end_time: payload.adsetsData.end_time ? formatDateTime(payload.adsetsData.end_time): null,
                        adsets_daily_budget: daily_type === "daily" ? parseFloat(daily_budget).toFixed(2) : null,
                        adsets_lifetime_budget: daily_type === "lifetime" ? parseFloat(daily_budget).toFixed(2) : null,
                        adsets_result_type: optimization_goal,                    
                    };
                    await Adsets.create(adsetRecord);
                // end save adset in database
                return resp.status(200).json({
                    success: true,
                    adset_id: AdSetID
                });
            } else {
                return resp.status(400).json({
                    success: false,
                    error_user_msg: "Ad Set creation failed. No ID returned."
                });
            }

        } catch (error) {
            const fbError = error?.response?.data?.error;
            return resp.status(400).json({
                success: false,
                error_user_msg:
                    fbError?.error_user_msg ||
                    fbError?.message ||
                    error?.message ||
                    "Adsets Create Error.",
                fb_trace_id: fbError?.fbtrace_id
            });
        }
    });
});

// Creative creation
// async function createAdCreatives(AdCreativeData, AdSetID) {
//     const {
//         accessToken,
//         AdsAccounts,
//         pageDetail,
//         createAdName,
//         createAdContent,
//         createAdHeadline,
//         createAdWebsiteURL,
//         createAdCallToAction,
//         createAdImages
//     } = AdCreativeData;

//     const uploadedImageHashes = [];
//     const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
//     const skippedImages = [];

//     // Upload images to Facebook
//     for (let img of createAdImages) {
//         if (!supportedMimeTypes.includes(img.mimetype)) {
//             skippedImages.push({
//                 name: img.originalname,
//                 type: img.mimetype,
//                 reason: `Unsupported file type`
//             });
//             continue;
//         }

//         const form = new FormData();
//         form.append('access_token', accessToken);
//         form.append('published', 'false');
//         form.append('file', img.buffer, {
//             filename: img.originalname,
//             contentType: img.mimetype
//         });

//         try {
//             const response = await axios.post(
//                 `https://graph.facebook.com/v22.0/act_${AdsAccounts}/adimages`,
//                 form,
//                 { headers: form.getHeaders() }
//             );

//             if (response.data.images && response.data.images[img.originalname]) {
//                 uploadedImageHashes.push(response.data.images[img.originalname].hash);
//             }
//         } catch (err) {
//             skippedImages.push({
//                 name: img.originalname,
//                 error: err.response?.data?.error?.error_user_msg || "Upload failed"
//             });
//         }
//     }

//     if (uploadedImageHashes.length === 0) {
//         throw {
//             error_user_msg: skippedImages.map(i => `${i.name}: ${i.reason || i.error}`).join(', ')
//         };
//     }

//     // Build creative payload
//     const isCarousel = uploadedImageHashes.length > 1;

//     const linkData = isCarousel
//         ? {
//             message: createAdContent,
//             link: createAdWebsiteURL,
//             child_attachments: uploadedImageHashes.map((hash, index) => ({
//                 link: createAdWebsiteURL,
//                 image_hash: hash,
//                 name: `${createAdHeadline} ${index + 1}`,
//                 description: createAdContent,
//                 call_to_action: {
//                     type: createAdCallToAction,
//                     value: { link: createAdWebsiteURL }
//                 }
//             })),
//             multi_share_optimized: true
//         }
//         : {
//             image_hash: uploadedImageHashes[0],
//             link: createAdWebsiteURL,
//             message: createAdContent,
//             // ⚠️ Removed `caption` since it caused the "must be a URL" error
//             call_to_action: {
//                 type: createAdCallToAction,
//                 value: { link: createAdWebsiteURL }
//             }
//         };

//     const creativePayload = {
//         name: createAdName,
//         object_story_spec: {
//             page_id: pageDetail,
//             link_data: linkData
//         },
//         access_token: accessToken
//     };

//     try {
//         // Create Ad Creative
//         const creativeResponse = await axios.post(
//             `https://graph.facebook.com/v22.0/act_${AdsAccounts}/adcreatives`,
//             creativePayload
//         );

//         const creativeId = creativeResponse.data.id;

//         // Create Ad
//         const adPayload = {
//             name: createAdName,
//             adset_id: AdSetID,
//             creative: { creative_id: creativeId },
//             status: 'PAUSED',
//             access_token: accessToken
//         };

//         await axios.post(
//             `https://graph.facebook.com/v22.0/act_${AdsAccounts}/ads`,
//             adPayload
//         );

//     } catch (error) {
//         const fbError = error?.response?.data?.error;
//         console.error("Ad Creative Error:", fbError || error.message);
//         throw {
//             error_user_msg: fbError?.error_user_msg || "Ad Creative creation failed"
//         };
//     }
// }

router.post(`/create-ads`, upload, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ success: false, error_user_msg: "No token provided." });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, error_user_msg: "Token not valid." });
        }

        try {
            const payload = JSON.parse(req.body.data);
            const createAdData = payload.createAddata;
            const createAdImages = req.files || [];
            const loggedUserdata = authData.userData;
            const SocialUserData = await SocialUser.findOne({
                where: {
                    user_id: loggedUserdata.uuid,
                    social_id: payload.socailAccount
                }
            });

            const {
                createAdName,
                createAdContent,
                createAdHeadline,
                createAdWebsiteURL,
                createAdCallToAction
            } = createAdData;

            const AdsAccounts = payload.AdsAccounts[0]; // assuming single ad account
            const pageDetail = payload.pageDetail;
            const AdSetID = payload.adset_ID;

            const uploadedImageHashes = [];
            const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const skippedImages = [];

            // ✅ Upload each image
            for (let img of createAdImages) {
                if (!supportedMimeTypes.includes(img.mimetype)) {
                    skippedImages.push({
                        name: img.originalname,
                        type: img.mimetype,
                        reason: `Unsupported file type`
                    });
                    continue;
                }

                const form = new FormData();
                form.append('access_token', SocialUserData.user_token);
                form.append('published', 'false');
                form.append('file', img.buffer, {
                    filename: img.originalname,
                    contentType: img.mimetype
                });

                try {
                    const response = await axios.post(
                        `https://graph.facebook.com/v22.0/act_${AdsAccounts}/adimages`,
                        form,
                        { headers: form.getHeaders() }
                    );

                    if (response.data.images && response.data.images[img.originalname]) {
                        uploadedImageHashes.push(response.data.images[img.originalname].hash);
                    }
                } catch (err) {
                    skippedImages.push({
                        name: img.originalname,
                        error: err.response?.data?.error?.error_user_msg || "Upload failed"
                    });
                }
            }

            // ❌ All failed?
            if (uploadedImageHashes.length === 0) {
                return resp.status(400).json({
                    success: false,
                    error_user_msg: skippedImages.map(i => `${i.name}: ${i.reason || i.error}`).join(', ')
                });
            }

            const isCarousel = uploadedImageHashes.length > 1;
            let creativeType = 'unknown';

            // ✅ Shared base for both ad types
            const baseLinkData = {
                link: createAdWebsiteURL,
                message: createAdContent,
                call_to_action: {
                    type: createAdCallToAction,
                    value: { link: createAdWebsiteURL }
                }
            };

            // ✅ Build link data with reusable headline logic
            let linkData;
            if (isCarousel) {
                creativeType='carousel';
                linkData = {
                    ...baseLinkData,
                    child_attachments: uploadedImageHashes.map((hash, index) => ({
                        link: createAdWebsiteURL,
                        image_hash: hash,
                        name: `${createAdHeadline || ' '}${index + 1}`, // headline fallback
                        //description: createAdContent,
                        call_to_action: {
                            type: createAdCallToAction,
                            value: { link: createAdWebsiteURL }
                        }
                    })),
                    multi_share_optimized: true
                };
            } else {
                creativeType = 'image';
                linkData = {
                    ...baseLinkData,
                    image_hash: uploadedImageHashes[0],
                    name: createAdHeadline || '',   // headline fallback
                    //description: createAdContent
                };
            }            

            // ✅ Create Ad Creative
            const creativePayload = {
                name: createAdName,
                object_story_spec: {
                    page_id: pageDetail,
                    link_data: linkData
                },
                access_token: SocialUserData.user_token
            };

            const creativeResponse = await axios.post(
                `https://graph.facebook.com/v22.0/act_${AdsAccounts}/adcreatives`,
                creativePayload
            );

            const creativeId = creativeResponse.data.id;
            //console.log('creativeResponse: ',creativeId);           
            if(creativeId){
                //console.log('if creativeId: ',creativeId);
                // ✅ Create Ad
                const adPayload = {
                    name: createAdName,
                    adset_id: AdSetID,
                    creative: { creative_id: creativeId },
                    status: 'PAUSED',
                    access_token: SocialUserData.user_token
                };                

                const adResponse = await axios.post(
                    `https://graph.facebook.com/v22.0/act_${AdsAccounts}/ads`,
                    adPayload
                );

                //console.log('adResponse: ',adResponse);
                if(adResponse.data.id){
                    //console.log('ad Response: ',adResponse);
                    //console.log('page id',payload.pageDetail,'creativeId',creativeId);
                    const creativeRecord = {
                        user_uuid: loggedUserdata.uuid,
                        account_platform: 'facebook',
                        social_page_id: payload.pageDetail,
                        account_social_userid: SocialUserData.social_id,
                        campaign_id: payload.cammpaign_ID,
                        adset_id: AdSetID,
                        ad_id: adResponse.data.id,
                        creative_id: creativeId,
                        creative_type: creativeType,
                        //image_urls: imageUrls,
                        //video_thumbnails: videoThumbnail,
                        headline: createAdHeadline || null,
                        body: createAdContent || null,
                        call_to_action: createAdCallToAction || null,
                        call_to_action_link:createAdWebsiteURL || null                     
                    };
                    const existingCreative = await AdsCreative.findOne({
                        where: { creative_id: creativeId }
                    });
                    if (!existingCreative) {
                        await AdsCreative.create(creativeRecord);
                    } else {
                        await AdsCreative.update(creativeRecord, {
                            where: { creative_id: creativeId }
                        });
                    }

                    const adRecord = {
                        user_uuid: loggedUserdata.uuid,
                        account_platform: 'facebook',
                        account_social_userid: SocialUserData.social_id,
                        campaign_id: payload.cammpaign_ID,
                        adsets_id: AdSetID,
                        ads_id: adResponse.data.id,
                        ads_name: createAdName,
                        ads_status: "PAUSED",
                        ads_effective_status: "PAUSED",
                    };
                    
                    const existingAds = await AdsetsAds.findOne({ where: { ads_id: adResponse.data.id } });
                    if (!existingAds) {
                        await AdsetsAds.create(adRecord);
                    } else {
                        await AdsetsAds.update(adRecord, { where: { ads_id: adResponse.data.id } });
                    }

                    // await Activity.create({
                    //     user_uuid: loggedUserdata.uuid,
                    //     account_social_userid: SocialUserData.social_id,
                    //     account_platform: "facebook",
                    //     activity_type: "ads",
                    //     activity_subType: "campaign",
                    //     action:"create",
                    //     reference_pageID: { ref_id: AdsAccounts, value_id: payload.cammpaign_ID }  // ✅ object
                    // });

                    const campaignData = await Campaigns.findOne({
                        where: {
                            user_uuid: loggedUserdata.uuid,
                            campaign_id: payload.cammpaign_ID
                        }
                    });

                    const user_uuid = loggedUserdata.uuid; 
                    const account_social_userid = SocialUserData.social_id;
                    const account_platform = "facebook";
                    const activity_type = "ads";
                    const activity_subType = "campaign";
                    const action = "create";
                    const post_form_id = '';
                    const reference_pageID = { activity_type_id: AdsAccounts, activity_subType_id: payload.cammpaign_ID, title:campaignData.campaign_name };
                    const source_type = '';
                    const nextAPI_call_dateTime = '';
                    await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

                    resp.status(200).json({
                        success: true,
                        adResponse: adResponse.status, 
                        ad_id: adResponse.data.id
                    });
                } else {
                    //console.log('else ad Response: ',adResponse);
                    resp.status(500).json({
                        success: false,
                        error_user_msg: adResponse.statusText || '',                   
                    });
                }
            } else {
                //console.log('else if creativeId: ',creativeId);
                resp.status(500).json({
                    success: false,
                    error_user_msg: creativeId.statusText || '',                   
                });
            }          

        } catch (error) {
            console.error("Error message:", error);
            resp.status(500).json({
                success: false,
                error_user_msg: 'Something went wrong try again' || '',                   
            });
            //console.error("Error stack:", error.stack);
            // If Facebook API returns a response
            // if (error.response && error.response.body) {
            //     console.error("FB API error body:", error.response.body);
            // }
            //resp.status(500).json({
            //    success: false,
            //    error_user_msg: error.message,
                //fbError: error.response?.body || null
            //});
            // const fbError = error?.response?.data?.error;
            // console.log(fbError?.error_user_msg);
            // console.log('ad error:', error);
            // if (fbError?.error_user_msg) {
            //     resp.status(500).json({
            //         success: false,
            //         error_user_msg: fbError.error_user_msg,
            //     });
            // } else {
            //     resp.status(500).json({
            //         success: false,
            //         error_user_msg: 'Ad Creation Error',
            //     });
            // }
        }
    });
});

router.post(`/campaign-update-status`, upload, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ success: false, error_user_msg: "No token provided." });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, error_user_msg: "Token not valid." });
        }

        const loggedUserdata = authData.userData;
        const payload = JSON.parse(req.body.data);

        if (
            !payload.socailAccount ||
            (!payload.campaignID && !payload.campaignAdsetsID && !payload.campaignAdID) ||
            !payload.changeStatus
        ) {
            return resp.status(402).json({
                success: false,
                error_user_msg: "Missing required fields."
            });
        }

        const SocialUserData = await SocialUser.findOne({
            where: {
                user_id: loggedUserdata.uuid,
                social_id: payload.socailAccount
            }
        });

        if (!SocialUserData) {
            return resp.status(402).json({
                success: false,
                error_user_msg: "Social account not found."
            });
        }

        const accessToken = SocialUserData.user_token;
        const idsToUpdate = [
            { type: "campaign", id: payload.campaignID },
            { type: "adset", id: payload.campaignAdsetsID },
            { type: "ad", id: payload.campaignAdID }
        ].filter(item => item.id); // Remove null/undefined

        const results = [];

        for (let { type, id } of idsToUpdate) {
            try {
                const url = `https://graph.facebook.com/v20.0/${id}`;
                const fbResponse = await axios.post(url, null, {
                    params: {
                        status: payload.changeStatus, // ACTIVE or PAUSED
                        access_token: accessToken
                    }
                });

                // Update DB based on type
                if (type === 'campaign') {
                    const record = await Campaigns.findOne({ where: { campaign_id: id } });
                    if (record) {
                        await record.update({
                            campaign_effective_status: payload.changeStatus,
                            campaign_status: payload.changeStatus
                        });
                    }
                }

                if (type === 'adset') {
                    const record = await Adsets.findOne({ where: { adsets_id: id } });
                    if (record) {
                        await record.update({
                            adsets_status: payload.changeStatus
                        });
                    }
                }

                if (type === 'ad') {
                    const record = await AdsetsAds.findOne({ where: { ads_id: id } });
                    if (record) {
                        await record.update({
                            ads_status: payload.changeStatus,
                            ads_effective_status: payload.changeStatus
                        });
                    }
                }                   

                results.push({ type, id, success: true, data: fbResponse.data });
            } catch (error) {
                console.error(`Error updating ${type} ${id}:`, error.response?.data || error.message);
                results.push({ type, id, success: false, error: error.response?.data || error.message });
            }
        }

        return resp.status(200).json({
            success: results.every(r => r.success),
            message: `Statuses updated to ${payload.changeStatus}`,
            results
        });
    });
});


// facebook campaigns functions ends here


module.exports = router;