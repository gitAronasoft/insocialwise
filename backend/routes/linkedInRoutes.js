const express = require('express');
const linkedinRouter = express.Router();
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
const { Op,fn, col, where, json } = require('sequelize');

const secretKey = process.env.JWT_SECRET;


linkedinRouter.post(`/account-connection-linkedin`, async (req, res) => {   
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
        // fetch user info
        
        const shortToken = req.body.data;
        const userResponse = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${shortToken}&fields=name,email,picture,accounts`);
        try {
            const userData = await userResponse.json();
            if(userData.accounts){
                const loggedUser_uuid = authData.userData.uuid;
                await extendToken(userData, loggedUser_uuid, shortToken,res);
                // return res.status(200).json({
                //     success: true,
                //     userData: userData
                // });
            } else {
                return res.status(401).json({ 
                    success: false,
                    message: "This account does not have any pages." 
                });
            }
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: "Technical issue, try again after some time." 
            });
        } 

    });
});

module.exports = linkedinRouter;