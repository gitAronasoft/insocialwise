const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
// const con = require('./db/mysql');
// require("./db/database");
const verifyToken = require("./app/middleware/verifyToken");
const transporter = require("./app/mail/verifyMail");
// const User = require("./models/User");
const sequelize = require('./db/mysql');
const User = require("./models/mysql/User");
const SocialUser = require("./models/mysql/SocialUser");
const SocialUserPage = require("./models/mysql/SocialUserPage");
const UserPost = require("./models/mysql/UserPost");
const Analytics = require("./models/mysql/Analytics");
const Demographics = require("./models/mysql/Demographics");
const AdsAccounts = require("./models/mysql/AdsAccounts");
const Campaigns = require("./models/mysql/Campaigns");
const Adsets = require("./models/mysql/Adsets");
const AdsetsAds = require("./models/mysql/AdsetsAds");
const AdsCreative = require("./models/mysql/AdsCreative");
const { Json } = require("sequelize/lib/utils");
const { Op,fn,col,where,Sequelize,json } = require('sequelize');
const multer = require('multer');
const cron = require('node-cron');
const axios = require('axios');
const http = require('http'); // for live
//const https = require('https'); // for localhost
const fs = require('fs');
const moment = require('moment-timezone');
const FormData = require('form-data');
const path = require('path');
const axiosWithRetry = require('axios-retry').default;
axiosWithRetry(axios, { retries: 5 });
const PostComments = require("./models/mysql/PostComments");
const Settings = require("./models/mysql/Settings");
const InboxConversations = require("./models/mysql/InboxConversations");
const InboxMessages = require("./models/mysql/InboxMessages");
const { Server } = require('socket.io');
const facebookRoutes = require('./routes/facebookRoutes');
// const linkedInRoutes = require('./routes/linkedInRoutes');
const decryptToken = require('./utils/decrypt');
const encryptToken = require('./utils/encrypt');
const activityCreate = require("./utils/activityCreate");
const Activity = require("./models/mysql/Activity");
const mime = require("mime-types");
const { platform } = require("os");
const colors = require('colors');
const KnowledgeBase = require("./models/mysql/KnowledgeBase");
const KnowledgebaseMeta = require("./models/mysql/KnowledgebaseMeta");

PostComments.belongsTo(UserPost, {
  foreignKey: 'post_id',
  targetKey: 'platform_post_id', // Adjust if needed
});

const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// const upload = multer({
//     storage:multer.diskStorage({
//         destination:function(req,file,cb){
//             cb(null,"public/uploads/posts")
//         },
//         filename:function(req,file,cb){
//             cb(null,file.fieldname+"-"+Date.now()+".jpg")
//         }
//     })
// }).single("upload_img");

// const upload = multer({
//     storage: multer.diskStorage({
//       destination: function (req, file, cb) {
//         cb(null, "public/uploads/posts");
//       },
//       filename: function (req, file, cb) {
//         cb(null, file.fieldname + "-" + Date.now() + ".jpg");
//       },
//     }),
// }).array("upload_img");

// Ensure the upload directories exist
const ensureUploadDirs = () => {
    const baseDir = 'public/uploads/posts';
    const imageDir = path.join(baseDir, 'images');
    const videoDir = path.join(baseDir, 'videos');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
};
// Call this function to ensure directories exist
ensureUploadDirs();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine if file is image or video
        if (file.mimetype.startsWith('image/')) {
            cb(null, "public/uploads/posts/images");
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, "public/uploads/posts/videos");
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename with appropriate prefix and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        // Determine prefix based on file type
        let prefix;
        if (file.mimetype.startsWith('image/')) {
            prefix = 'upload-img';
        } else if (file.mimetype.startsWith('video/')) {
            prefix = 'upload-video';
        } else {
            prefix = 'upload-file';
        }
        cb(null, prefix + '-' + uniqueSuffix + ext);
    },
});
const fileFilter = function (req, file, cb) {
    // Allow only images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};
const limits = {
    fileSize: 50 * 1024 * 1024, // 50MB limit for files
};
// Create separate upload instances for different file types if needed
const upload = multer({
    storage,
    fileFilter,
    limits,
}).array("upload_img", 10); // Use a generic field name

require('dotenv').config();

const app = express();
const route = express.Router();

const serverPort = process.env.LOCAL_PORT;
const secretKey = process.env.JWT_SECRET;
const facebookAPPID = process.env.facebook_APP_ID;
const facebookAPPSecret = process.env.facebook_APP_Secret;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

app.use(cors());
app.use(cors({
    origin: `${FRONTEND_URL}`,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: false // if you're sending cookies/session data
  }));
app.use(express.static('public'));    

// const options = {
//     key: fs.readFileSync('ssl/server.key'),
//     cert: fs.readFileSync('ssl/server.cert')
// };

// This code for localhost
    //const privateKey = fs.readFileSync('privkey.pem', 'utf8');
    //const certificate = fs.readFileSync('fullchain.pem', 'utf8');
    //const credentials = { key: privateKey, cert: certificate };
    //const server = https.createServer(credentials, app);
// End This code for localhost

//const server = https.createServer(options, app);

// This code for live
    const server = http.createServer(app);
// This code for live

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
// :point_down:  made io retrievable in every route:
app.set('io', io);
io.on('connection', (socket) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        console.log(":x: No token received. Disconnecting...");
        return socket.disconnect();
    }
    try {
        const userData = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = userData;
    } catch (err) {
        console.log(":x: Invalid token");
        return socket.disconnect();
    }
    
    // page message functions starts here
    socket.join(socket.user.userData.uuid);
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
    });
    socket.on('leave_conversation', (conversationId) => {
        socket.leave(conversationId);
    });
    socket.on('send_message', async (message) => {
        //console.log("Message Data:",message);
        try {
            const page = await SocialUserPage.findOne({
                attributes: ['token'],
                where: {
                    user_uuid: socket.user.userData.uuid,
                    pageId: message.page_id
                },
                raw: true
            });
            if (!page || !page.token) {
                console.log(`:no_entry: No token found for page ID: ${message.page_id}`);
                return;
            }
            const url = `https://graph.facebook.com/v18.0/me/messages`;
            const fbResponse = await axios.post(
                url,
                { recipient: { id: message.recipient_id }, message: { text: message.message_text } },
                { params: { access_token: page.token } }
            );
            const nowUtc = new Date().toISOString().replace('Z', '+0000');
            const Conversation = await InboxConversations.findOne({
                where:{
                    conversation_id: message.conversation_id
                }
            });
            if(Conversation){
                Conversation.update({
                    snippet     : message.message_text || '',
                    updatedAt   : new Date()
                });
            }
            await InboxMessages.create({
                conversation_id: message.conversation_id,
                platform_message_id: fbResponse?.data?.message_id || null,
                sender_type: 'page',
                message_text: message.message_text || '',
                message_type: 'text',
                timestamp: nowUtc
            });
            // Emit message to all sockets in this room
            io.to(message.conversation_id).emit('receive_message', message);
            // :white_check_mark: Emit globally to user’s inbox sidebar
            io.to(socket.user.userData.uuid).emit('global_inbox_update', {
                ...message,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error(`:x: Error sending message to Facebook for page ID ${message.page_id}:`, error.response?.data || error.message);
        }
    });
    // page message functions ends here

    // --- 1️⃣  ROOM LIFECYCLE ------------------------------------------
    // socket.on('join:post', (postId) => socket.join(`post:${postId}`));
    // socket.on('leave:post', (postId) => socket.leave(`post:${postId}`));
    socket.on('join:post', (room) => socket.join(room));   // room already contains "post:123"
    socket.on('leave:post', (room) => socket.leave(room));

    // socket disconnect
    socket.on('disconnect', () => {
        console.log(`:x: Client disconnected: ${socket.id}`);
    });
});

const prefix = 'api';
app.use(express.json());
// Apply middleware globally or selectively depending on the requirement
route.use(verifyToken);

// Define routes
app.use(`/${prefix}`, route);
app.use(`/${prefix}`, facebookRoutes);
// app.use(`/${prefix}`, linkedInRoutes);

// mongodb urls
app.get('/', (req, resp) => {
    resp.json({ data: 'Welcome to the API!' });
});

app.get('/apis', (req, resp) => {
    resp.json({ data: 'API Route' });
});

app.post('/signup', async (req, resp) => {    
    try {
        const { firstName, lastName, email, password } = req.body;
        //for mongodb
        //const existingUser = await User.findOne({ email });
       //for mysql
        //const existingUser = (await User.findOne({ where:[{'email':email},{'status':1}] }));
        const existingUser = (await User.findOne({ where:{'email':email} }));
        if (existingUser) {
            const checkStatus = (await User.findOne({ where:[{'email':email},{'status':'1'}] }));
            if(checkStatus){
                return resp.status(400).json({ message: "Email already exist and verified." });
            }
            return resp.status(400).json({ message: "Email already exist." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const uuid = uuidv4();
        // const otp = crypto.randomInt(100000, 999999);
        // const timestamps = new Date();
        const newUser = new User({
            uuid: uuid,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            status: "0",
            // otp: otp,
            // otpGeneratedAt: timestamps
        });
        const savedUser = await newUser.save();
        if(!savedUser){
            resp.status(500).json({ message: "Failed to save user" });
        }  
        const currentYear = new Date().getFullYear();    
        const mailOptions = {
            from: `InSocialWise ${process.env.EMAIL_USER}`,
            to: email,
            subject: 'insocialwise account verification mail.',           
            html: `<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4361EE; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; margin: 30px 0;">
                        <tr>
                            <td align="center">
                                <table width="550" cellpadding="0" cellspacing="0" style="margin:20px 0px 20px 0px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="padding: 22px 20px; color: #4361EE;">
                                            <table cellpadding="0" cellspacing="0" style="text-align: center;">
                                                <tr>
                                                    <td>
                                                        <img src="https://www.insocialwise.com/assets/images/email_template_images/logo_png.png" alt="Insocialwise Logo" width="50" height="45" style="display: block;">
                                                    </td>
                                                    <td style="padding-left: 10px;">
                                                        <h1 style="font-size: 35px; color: #333333; margin: 0;">Insocialwise</h1>
                                                    </td>
                                                </tr>
                                            </table>
                                            <h4 style="font-size: 1.5rem; margin: 0; padding: 0;">Verify Your Email Address</h4>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 15px 30px;">
                                            <p>Hello ${newUser.firstName} ${newUser.lastName},</p>
                                            <p>Thank you for signing up with Insocialwise! To finish setting up your account, please verify your email by entering the following verification link:</p>

                                            <div style="background-color: #F5F7FF; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0; font-size: 14px; font-weight: 700; letter-spacing: 2px; color: #7366FF;">
                                                <a href="${process.env.FRONTEND_URL}/email-verified-process/${newUser.uuid}" style="color: #7366FF; text-decoration: none;">${process.env.FRONTEND_URL}/email-verified-process/${newUser.uuid}</a>
                                            </div>

                                            <p>Or click the button below to verify automatically:</p>

                                            <div style="display: flex;">
                                                <a href="${process.env.FRONTEND_URL}/email-verified-process/${newUser.uuid}" style="display: inline-block; background-color: #4361EE; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%;">Verify Email Address</a>
                                            </div>
                                            

                                            <p style="font-size: 14px; color: #64748B;">This verification code will expire in 24 hours. If you didn't request this, please ignore this email or contact support.</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Footer -->
                                <table width="550" cellpadding="0" cellspacing="0" style="color: #FFFFFF; font-size: 12px; text-align: center; margin-top: 10px;">
                                    <tr>
                                        <td>
                                            <table align="center" style="margin: 10px auto;">
                                                <tr>
                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/facebook.png" alt="Facebook Logo" style="display: block;"></a></td>
                                                    <td style="padding: 0 5px;">|</td>
                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/instagram.png" alt="Instagram Logo" style="display: block;"></a></td>
                                                    <td style="padding: 0 5px;">|</td>
                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/linkedin.png" alt="Linkedin Logo" style="display: block;"></a></td>
                                                    <td style="padding: 0 5px;">|</td>
                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/twitter.png" alt="Twitter Logo" style="display: block;"></a></td>
                                                </tr>
                                            </table>

                                            <p>Sent by the team at Insocialwise<br>
                                            Advanced Facebook Analytics & Growth Tools</p>

                                            <p>
                                                <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Update your email preferences</a> |
                                                <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Unsubscribe from all emails</a>
                                            </p>

                                            <p style="margin-top: 18px; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                                                © ${currentYear} Insocialwise. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                return resp.status(500).json({ message: "Error sending email.", error: err.message });
            }
            // console.log(info);
            return resp.status(200).json({ message: "Registertion successfully compeleted and verification mail sent to your email.",email: savedUser.email });
        });

        // savedUser ? resp.status(201).json(
        //     { message: "Registertion successfully compeleted.", user_id: savedUser.uuid }) : 
        //         resp.status(500).json(
        //     { message: "Failed to save user" });
    } catch (err) {       
        if (err.name === "ValidationError") {
          return resp.status(400).json({ message: "Validation failed.", error: err.errors });
        }
        resp.status(500).json({ message: "Error creating user.", error: err.message });
    }
});

app.post('/sign-in', async (req, resp) => {
    try {
        const { email, password } = req.body;
        if (email && password) {
            const userData = await User.findOne({ where: { email: email } });
            if (userData != null) {
                if (userData.status === '1') {
                    const passwordMatch = await bcrypt.compare(password, userData.password);
                    if (passwordMatch) {
                        jwt.sign({ userData }, secretKey, async (err, token) => {
                            if (err) {
                                return resp.status(500).json({ message: "Error generating token", error: err.message });
                            }
                            //const decodedToken = jwt.decode(token);
                            //const expirationTime = decodedToken.exp;
                            
                            const { otp, otpGeneratedAt, password,updatedAt,createdAt,role,status, ...userDatanew } = userData.dataValues;
                            const social_user_data = await SocialUser.findAll({ 
                                where: { user_id: userData.dataValues.uuid } 
                            });

                            const user_uuid = userData.dataValues.uuid; 
                            const account_social_userid = null;
                            const account_platform = null;
                            const activity_type = "user";
                            const activity_subType = "profile";
                            const action = "login";
                            const source_type = '';
                            const post_form_id = '';
                            const reference_pageID = { activity_type_id: userData.dataValues.uuid, activity_subType_id: {}, title:userData.dataValues.firstName+' '+userData.dataValues.lastName };
                            const nextAPI_call_dateTime = '';
                            await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

                            if (social_user_data.length > 0) {
                                // Fetch all pages for the user
                                const social_page_data = await SocialUserPage.findAll({ 
                                    where: { user_uuid: userData.dataValues.uuid } 
                                });

                                // Map social users with their corresponding pages
                                const socialDataWithPages = social_user_data.map((socialUser) => {
                                    const socialUserValues = socialUser.dataValues;
                                    // Filter pages that belong to this social user
                                    const pages = social_page_data
                                        .filter((page) => page.dataValues.social_userid === socialUserValues.social_id)
                                        .map((page) => {
                                            // Remove unnecessary fields if needed
                                            const { user_uuid, ...pageData } = page.dataValues;
                                            return pageData;
                                        });
                                    return {
                                        ...socialUserValues,
                                        socialPage: pages
                                    };
                                });
                                
                                resp.status(200).json({
                                    success: true,
                                    message: 'Login successful.',
                                    token: token,
                                    //expirationTime: expirationTime,
                                    userInfo: {
                                        userData: userDatanew,
                                        socialData: socialDataWithPages // Nested pages here
                                    }
                                });
                            } else {
                                resp.status(200).json({
                                    success: true,
                                    message: 'Login successful.',
                                    token: token,
                                    //expirationTime: expirationTime,
                                    userInfo: {
                                        userData: userDatanew,
                                        socialData: null
                                    }
                                });
                            }
                        });
                    } else {
                        return resp.status(401).json({ success: false, message: "Invalid password." });
                    }
                } else if (userData.status === '2') {
                    return resp.status(401).json({ success: false, message: "Account not found!" });
                } else if (userData.status === '0'){
                    return resp.status(401).json({ success: false, message: "Account not verified,contact to support team.", email: userData.email });
                } else {
                    return resp.status(401).json({ success: false, message: "Account not found!",statys:userData.status });
                }
            } else {
                return resp.status(401).json({ success: false, message: "Invalid email address." });
            }
        } else {
            return resp.status(401).json({ success: false, message: "Invalid details" });
        }
    } catch (err) {
        if (err.name === "ValidationError") {
            return resp.status(400).json({ success: false, message: "Validation failed.", error: err.errors });
        }
        resp.status(500).json({ success: false, message: "Error during login.", error: err });
    }
});

app.post(`/${prefix}/sign-out`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            try {
                //console.log('authData:', authData);                
                // await User.update(
                //     { lastLogin: null },
                //     { where: { id: authData.userData.id } }
                // );

                const user_uuid = authData.userData.uuid; 
                const account_social_userid = null;
                const account_platform = null;
                const activity_type = "user";
                const activity_subType = "profile";
                const action = "logout";
                const source_type = '';
                const post_form_id = '';
                const reference_pageID = { activity_type_id: authData.userData.uuid, activity_subType_id: {}, title:authData.userData.firstName+' '+authData.userData.lastName };
                 const nextAPI_call_dateTime = '';
                await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

                return resp.status(200).json({ message: "Logout successfully." });
            } catch (updateErr) {
                console.error("Error updating lastLogin:", updateErr);
                return resp.status(500).json({ message: "Error signing out." });
            }
        }
    });
});

app.post('/resend-email',async(req, resp)=>{    
    try {        
        const userEmail = req.body.email;
        if (userEmail) {            
            const userData = await User.findOne({where:{email:userEmail}});
            if (userData) {                
                if(userData.status === false){
                    const currentYear = new Date().getFullYear();
                    const mailOptions = {
                        from: `InSocialWise ${process.env.EMAIL_USER}`,
                        to: userEmail,
                        subject: 'insocialwise account verification mail.',
                        html: ` <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4361EE; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <table width="550" cellpadding="0" cellspacing="0" style="margin:20px 0px 20px 0px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden;">
                                                <!-- Header -->
                                                <tr>
                                                    <td align="center" style="padding: 22px 20px; color: #4361EE;">
                                                        <table cellpadding="0" cellspacing="0" style="text-align: center;">
                                                            <tr>
                                                                <td>
                                                                    <img src="https://www.insocialwise.com/assets/images/email_template_images/logo_png.png" alt="Insocialwise Logo" width="50" height="45" style="display: block;">
                                                                </td>
                                                                <td style="padding-left: 10px;">
                                                                    <h1 style="font-size: 35px; color: #333333; margin: 0;">Insocialwise</h1>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        <h4 style="font-size: 1.5rem; margin: 0; padding: 0;">Verify Your Email Address</h4>
                                                    </td>
                                                </tr>

                                                <!-- Content -->
                                                <tr>
                                                    <td style="padding: 15px 30px;">
                                                        <p>Hello ${userData.firstName} ${userData.lastName},</p>
                                                        <p>Thank you for signing up with Insocialwise! To finish setting up your account, please verify your email by entering the following verification link:</p>

                                                        <div style="background-color: #F5F7FF; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0; font-size: 14px; font-weight: 700; letter-spacing: 2px; color: #7366FF;">
                                                            <a href="${process.env.FRONTEND_URL}/email-verified-process/${userData.uuid}" style="color: #7366FF; text-decoration: none;">[VERIFICATION LINK]</a>
                                                        </div>

                                                        <p>Or click the button below to verify automatically:</p>

                                                        <div style="display: flex;">
                                                            <a href="${process.env.FRONTEND_URL}/email-verified-process/${userData.uuid}" style="display: inline-block; background-color: #4361EE; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%;">Verify Email Address</a>
                                                        </div>
                                                        

                                                        <p style="font-size: 14px; color: #64748B;">This verification code will expire in 24 hours. If you didn't request this, please ignore this email or contact support.</p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Footer -->
                                            <table width="550" cellpadding="0" cellspacing="0" style="color: #FFFFFF; font-size: 12px; text-align: center; margin-top: 10px;">
                                                <tr>
                                                    <td>
                                                        <table align="center" style="margin: 10px auto;">
                                                            <tr>
                                                                <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/facebook.png" alt="Facebook Logo" style="display: block;"></a></td>
                                                                <td style="padding: 0 5px;">|</td>
                                                                <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/instagram.png" alt="Instagram Logo" style="display: block;"></a></td>
                                                                <td style="padding: 0 5px;">|</td>
                                                                <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/linkedin.png" alt="Linkedin Logo" style="display: block;"></a></td>
                                                                <td style="padding: 0 5px;">|</td>
                                                                <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/twitter.png" alt="Twitter Logo" style="display: block;"></a></td>
                                                            </tr>
                                                        </table>

                                                        <p>Sent by the team at Insocialwise<br>
                                                        Advanced Facebook Analytics & Growth Tools</p>

                                                        <p>
                                                            <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Update your email preferences</a> |
                                                            <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Unsubscribe from all emails</a>
                                                        </p>

                                                        <p style="margin-top: 18px; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                                                            © ${currentYear} Insocialwise. All rights reserved.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                `
                            };
            
                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            //console.error('Error sending email:', err);
                            return resp.status(500).json({ message: "Error sending email.", error: err.message });
                        }
                        return resp.status(200).json({ message: "Verification mail sent to your email." });
                    });
                }else{
                    return resp.status(401).json({ message: "Email already verified." });
                }
            } else {
                return resp.status(401).json({ message: "Invalid email address." });
            }
        } else {
            return resp.status(401).json({ message: "Invalid details" });
        }
    } catch (err) {
        if (err.name === "ValidationError") {
            return resp.status(400).json({ message: "Validation failed.", error: err.errors });
        }
        resp.status(500).json({ message: "Error during resending mail.", error: err.message });
    }
});

app.get('/email-verified-process/:uuid', async (req, resp) => {
    try {
        const uuid = req.params.uuid;
        const currentYear = new Date().getFullYear();
        if (uuid) {
            const userData = await User.findOne({ where: { uuid: uuid } }); // Fixed where clause
            if(userData.status === '0') {                                
                jwt.sign({ userData }, secretKey, async (err, token) => {
                    if (err) {
                        return resp.status(500).json({ message: "Error generating token", error: err.message });
                    }
                    const decodedToken = jwt.decode(token);
                    const expirationTime = decodedToken.exp;
                    await userData.update({ status: '1', otp: null, otpGeneratedAt: null });
                    const { uuid, otp, otpGeneratedAt, password, ...userDatanew } = userData.dataValues;
                    // Get all connected social accounts
                    const social_user_data = await SocialUser.findAll({
                        where: {
                            user_id: userData.uuid
                        }
                    });

                    if (social_user_data.length > 0) {
                        // Get all social pages for the user
                        const social_page_data = await SocialUserPage.findAll({
                            where: { user_uuid: userData.uuid }
                        });

                        // Map social accounts with their pages
                        const formattedSocialData = social_user_data.map(socialUser => ({
                            ...socialUser.dataValues,
                            socialPage: social_page_data
                                .filter(page => page.social_userid === socialUser.social_id)
                                .map(page => {
                                    const { user_uuid, ...cleanPage } = page.dataValues;
                                    return cleanPage;
                                })
                        }));

                        const mailOptions = {
                            from: `InSocialWise ${process.env.EMAIL_USER}`,
                            to: userData.email,
                            subject: 'Welcome',
                            html: `<style>
                                    body, table {
                                    margin: 0;
                                    padding: 0;
                                    }
                                </style>
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4361EE; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; margin: 0;">
                                        <tr>
                                            <td align="center">
                                                <table width="550" cellpadding="0" cellspacing="0" style="margin:20px 0px 20px 0px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; padding-bottom: 20px;">
                                                    <!-- Header -->
                                                    <tr>
                                                        <td align="center" style="padding: 22px 20px; color: #4361EE;">
                                                            <table cellpadding="0" cellspacing="0" style="text-align: center;">
                                                                <tr>
                                                                    <td>
                                                                        <img src="https://www.insocialwise.com/assets/images/email_template_images/logo_png.png" alt="Insocialwise Logo" width="45" height="50" style="display: block;">
                                                                    </td>
                                                                    <td style="padding-left: 10px;">
                                                                        <h1 style="font-size: 35px; color: #333333; margin: 0;">Insocialwise</h1>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <h4 style="font-size: 1.5rem; margin: 0; padding: 0;">Welcome to your social growth journey</h4>
                                                        </td>
                                                    </tr>
                                                    <!-- Content -->
                                                    <tr>
                                                        <td style="padding: 15px 30px;">
                                                            <p>Hi there,</p>
                                                            <p>More than 150,000 users rely on Insocialwise to elevate their social media presence — and now, you’re one of them. Welcome aboard!  <img src="https://www.insocialwise.com/assets/images/email_template_images/party-popper.png" alt=""></p>
                                                            <div style="display: flex;">
                                                                <a href="${process.env.FRONTEND_URL}/account-setup" style="display: inline-block; background-color: #4361EE; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%;">Connect a Channels</a>
                                                            </div>
                                                        
                                                        </td>
                                                    </tr>
                
                                                    <tr>
                                                        <td style="padding: 15px 30px;">
                                                            <div style="display: flex; gap: 20px;">
                                                                <div style="width: 50%;">
                                                                    <h3 style="margin-top: 0;">Connect your channels</h3>
                                                                    <p>Choose from 11+ social platforms including Facebook, Instagram, TikTok, LinkedIn, and more. Let's get started →</p>
                                                                </div>
                                                                <div style="width: 50%;">
                                                                    <img src="https://picsum.photos/500/300?random=4" alt="Connect Channels Demo" style="max-width: 100%; border-radius: 10px;">
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                
                                                    <tr>
                                                        <td style="padding: 15px 30px;">
                                                            <p style="background: #f7f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4361ee;">
                                                            <strong style="margin-bottom: 10px;">Your Starter Plan includes:</strong><br>
                                                            <img src="https://www.insocialwise.com/assets/images/email_template_images/email-check.png" alt="" style="margin-right: 10px;"> Connect up to 3 channels<br>
                                                            <img src="https://www.insocialwise.com/assets/images/email_template_images/email-check.png" alt="" style="margin-right: 10px;"> Schedule 10 posts per channel<br>
                                                            <img src="https://www.insocialwise.com/assets/images/email_template_images/email-check.png" alt="" style="margin-right: 10px;"> Basic analytics dashboard
                                                            </p>
                                                        </td>
                                                    </tr>
                
                                                    <tr>
                                                        <td style="padding: 15px 30px; margin-bottom: 20px;">
                                                            <div style="display: flex; align-items: center; gap: 12px; margin-top: 20px;">
                                                                <img src="https://picsum.photos/600/300?random=22" alt="CEO Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                                                                <div style="margin-left:10px;">
                                                                    <strong>Team</strong><br>
                                                                    Insocialwise
                                                                </div>
                                                            </div>
                                                
                                                            <div style="margin-top: 20px;">
                                                                <p>For over a decade, we’ve supported creators and brands like yours — keep an eye out this week for tips to help you grow faster and smarter.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <!-- Footer -->
                                                <table width="550" cellpadding="0" cellspacing="0" style="color: #FFFFFF; font-size: 12px; text-align: center; margin-top: 10px;">
                                                    <tr>
                                                        <td>
                                                            <table align="center" style="margin: 10px auto; color: #FFFFFF; ">
                                                                <tr>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/facebook.png" alt="Facebook Logo" style="display: block;"></a></td>
                                                                    <td style="padding: 0 5px;">|</td>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/instagram.png" alt="Instagram Logo" style="display: block;"></a></td>
                                                                    <td style="padding: 0 5px;">|</td>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/linkedin.png" alt="Linkedin Logo" style="display: block;"></a></td>
                                                                    <td style="padding: 0 5px;">|</td>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/twitter.png" alt="Twitter Logo" style="display: block;"></a></td>
                                                                </tr>
                                                            </table>
                                                            <p>Sent by the team at Insocialwise<br>
                                                            Advanced Facebook Analytics & Growth Tools</p>
                                                            <p>
                                                                <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Update your email preferences</a> |
                                                                <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Unsubscribe from all emails</a>
                                                            </p>
                                                            <p style="margin: 18px 0; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                                                                © ${currentYear} Insocialwise. All rights reserved.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>`  
                        };
                        transporter.sendMail(mailOptions, (err, info) => {
                            if (err) {
                                console.error('Error sending email:', err);
                                return resp.status(500).json({ message: "Error sending email.", error: err.message });
                            }
                            console.log(info);            
                        });

                        return resp.status(200).json({
                            message: 'Account verified & Logged In successful',
                            token: token,
                            expirationTime: expirationTime,
                            userInfo: {
                                userData: userDatanew,
                                socialData: formattedSocialData
                            }
                        });
                    } else {
                        const mailOptions = {
                            from: `InSocialWise ${process.env.EMAIL_USER}`,
                            to: userData.email,
                            subject: 'Welcome',
                            html: `<style>
                                    body, table {
                                    margin: 0;
                                    padding: 0;
                                    }
                                </style>
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #4361EE; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #333333; line-height: 1.6; margin: 0;">
                                        <tr>
                                            <td align="center">
                                                <table width="550" cellpadding="0" cellspacing="0" style="margin:20px 0px 20px 0px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; padding-bottom: 20px;">
                                                    <!-- Header -->
                                                    <tr>
                                                        <td align="center" style="padding: 22px 20px; color: #4361EE;">
                                                            <table cellpadding="0" cellspacing="0" style="text-align: center;">
                                                                <tr>
                                                                    <td>
                                                                        <img src="https://www.insocialwise.com/assets/images/email_template_images/logo_png.png" alt="Insocialwise Logo" width="45" height="50" style="display: block;">
                                                                    </td>
                                                                    <td style="padding-left: 10px;">
                                                                        <h1 style="font-size: 35px; color: #333333; margin: 0;">Insocialwise</h1>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <h4 style="font-size: 1.5rem; margin: 0; padding: 0;">Welcome to your social growth journey</h4>
                                                        </td>
                                                    </tr>
                                                    <!-- Content -->
                                                    <tr>
                                                        <td style="padding: 15px 30px;">
                                                            <p>Hi there,</p>
                                                            <p>More than 150,000 users rely on Insocialwise to elevate their social media presence — and now, you’re one of them. Welcome aboard!  <img src="https://www.insocialwise.com/assets/images/email_template_images/party-popper.png" alt=""></p>
                                                            <div style="display: flex;">
                                                                <a href="${process.env.FRONTEND_URL}/account-setup" style="display: inline-block; background-color: #4361EE; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; width: 100%;">Connect a Channels</a>
                                                            </div>
                                                        
                                                        </td>
                                                    </tr>
                
                                                    <tr>
                                                        <td style="padding: 15px 30px;">
                                                            <div style="display: flex; gap: 20px;">
                                                                <div style="width: 50%;">
                                                                    <h3 style="margin-top: 0;">Connect your channels</h3>
                                                                    <p>Choose from 11+ social platforms including Facebook, Instagram, TikTok, LinkedIn, and more. Let's get started →</p>
                                                                </div>
                                                                <div style="width: 50%;">
                                                                    <img src="https://picsum.photos/500/300?random=4" alt="Connect Channels Demo" style="max-width: 100%; border-radius: 10px;">
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                
                                                    <tr>
                                                        <td style="padding: 15px 30px;">
                                                            <p style="background: #f7f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4361ee;">
                                                            <strong style="margin-bottom: 10px;">Your Starter Plan includes:</strong><br>
                                                            <img src="https://www.insocialwise.com/assets/images/email_template_images/email-check.png" alt="" style="margin-right: 10px;"> Connect up to 3 channels<br>
                                                            <img src="https://www.insocialwise.com/assets/images/email_template_images/email-check.png" alt="" style="margin-right: 10px;"> Schedule 10 posts per channel<br>
                                                            <img src="https://www.insocialwise.com/assets/images/email_template_images/email-check.png" alt="" style="margin-right: 10px;"> Basic analytics dashboard
                                                            </p>
                                                        </td>
                                                    </tr>
                
                                                    <tr>
                                                        <td style="padding: 15px 30px; margin-bottom: 20px;">
                                                            <div style="display: flex; align-items: center; gap: 12px; margin-top: 20px;">
                                                                <img src="https://picsum.photos/600/300?random=22" alt="CEO Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                                                                <div style="margin-left:10px;">
                                                                    <strong>Team</strong><br>
                                                                    Insocialwise
                                                                </div>
                                                            </div>
                                                
                                                            <div style="margin-top: 20px;">
                                                                <p>For over a decade, we’ve supported creators and brands like yours — keep an eye out this week for tips to help you grow faster and smarter.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <!-- Footer -->
                                                <table width="550" cellpadding="0" cellspacing="0" style="color: #FFFFFF; font-size: 12px; text-align: center; margin-top: 10px;">
                                                    <tr>
                                                        <td>
                                                            <table align="center" style="margin: 10px auto; color: #FFFFFF; ">
                                                                <tr>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/facebook.png" alt="Facebook Logo" style="display: block;"></a></td>
                                                                    <td style="padding: 0 5px;">|</td>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/instagram.png" alt="Instagram Logo" style="display: block;"></a></td>
                                                                    <td style="padding: 0 5px;">|</td>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/linkedin.png" alt="Linkedin Logo" style="display: block;"></a></td>
                                                                    <td style="padding: 0 5px;">|</td>
                                                                    <td><a href="#"><img src="https://www.insocialwise.com/assets/images/email_template_images/twitter.png" alt="Twitter Logo" style="display: block;"></a></td>
                                                                </tr>
                                                            </table>
                                                            <p>Sent by the team at Insocialwise<br>
                                                            Advanced Facebook Analytics & Growth Tools</p>
                                                            <p>
                                                                <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Update your email preferences</a> |
                                                                <a href="#" style="color: #FFFFFF; text-decoration: none; margin: 0 10px;">Unsubscribe from all emails</a>
                                                            </p>
                                                            <p style="margin: 18px 0; font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                                                                © ${currentYear} Insocialwise. All rights reserved.
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>`  
                        };
                        transporter.sendMail(mailOptions, (err, info) => {
                            if (err) {
                                console.error('Error sending email:', err);
                                return resp.status(500).json({ message: "Error sending email.", error: err.message });
                            }
                            console.log(info);            
                        });
                        return resp.status(200).json({
                            message: 'Account verified & Logged In successful',
                            token: token,
                            expirationTime: expirationTime,
                            userInfo: {
                                userData: userDatanew,
                                socialData: null
                            }
                        });
                    }
                });                
            } else {
                return resp.status(404).json({ message: "User Data not found." });
            }
        } else {
            return resp.status(400).json({ message: "Invalid User" });
        }
    } catch (err) {
        console.error('Verification error:', err);
        if (err.name === "ValidationError") {
            return resp.status(400).json({ message: "Validation failed.", error: err.errors });
        }
        return resp.status(500).json({ 
            message: "Error during verification.", 
            error: err.message 
        });
    }
});

app.post('/forget-password', async(req,resp)=>{
    try {
        const { email,requestTime } = req.body;
        if (email) {
            const userData = await User.findOne({where:{email:email}});
            if (userData != null) {
                if(userData.status === '1'){
                    const resetPasswordToken = crypto.randomUUID();
                    await userData.update({ 
                        resetPasswordToken: resetPasswordToken,
                        resetPasswordRequestTime: requestTime 
                    });
                     const updatedUser = await User.findOne({where:{email:email}});
                    const mailOptions = {
                        from: `InSocialWise ${process.env.EMAIL_USER}`,
                        to: email,
                        subject: 'InsocialVise password change request',
                        html: `<h3>Hello ${userData.firstName},</h3>
                                <p>We get a request to change password on our side from your account.</p>
                                <p>To change click on below button</p>
                                <br>
                                <center>
                                    <a href="${process.env.FRONTEND_URL}/reset-password/${updatedUser.resetPasswordToken}" 
                                        target="_blank"
                                        style="background:black;color:white;border-radius:5px;padding:10px;">Reset Password Link</a>.
                                </center>`
                    };                   

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            return resp.status(500).json({ success: false, message: "Error sending email.", error: err.message });
                        }
                        
                        return resp.status(200).json({ success: true, message: "Password reset mail sent to your email." });
                    });
                } else if(userData.status === '2'){
                    return resp.status(401).json({ success: false, message: "Your account deleted." });
                } else {
                    return resp.status(401).json({ success: false, message: "Please verify your account." });
                }
            } else {
                return resp.status(401).json({ success: false, message: "Invalid email address." });
            }
        } else {
            return resp.status(401).json({ success: false, message: "Invalid details" });
        }
    } catch (err) {
        if (err.name === "ValidationError") {
            return resp.status(400).json({ success: false, message: "Validation failed.", error: err.errors });
        }
        resp.status(500).json({ success: false, message: "Error during resending mail.", error: err.message });
    }
});

app.post('/reset-password', async(req,resp)=>{
    try {
        const { passwordToken,requestTime } = req.body;
        if (passwordToken && requestTime) {
            const userData = await User.findOne({ 
                where:{
                    resetPasswordToken:passwordToken
                }                
            });

            if(!userData) {
                return resp.status(401).json({ success:false, message: "Invalid request." });
            }
            const requestDate = new Date(requestTime);
            const storedDate = new Date(userData.resetPasswordRequestTime);

            const diffMs = requestDate - storedDate;            
            //const diffSeconds = Math.floor(diffMs / 1000);
            //const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));            
            if(diffHours >= 24) {
                return resp.status(401).json({ success:false, message: "Password reset token expire." });
            }
            
            if(userData.status === '1'){
                resp.status(200).json({
                    success:true,
                    message: 'Password reset request verified.',
                    email: userData.email,
                });
            } else {
                return resp.status(401).json({ success:false, message: "Your account is not verified." });
            }
        } else {
            return resp.status(401).json({ success:false, message: "Password reset token expire." });
        }
    } catch (err) {
        if (err.name === "ValidationError") {
            return resp.status(400).json({ success:false, message: "Validation failed.", error: err.errors });
        }
        resp.status(500).json({ success:false, message: "Error during password-reset.", error: err.message });
    }
});

app.post('/password-reset-submit', async(req,resp)=>{ 
    try {
        const {email,password} = req.body;
        if (email && password) {            
            const userData = await User.findOne({ where:{email:email} });
            if (userData != null) {
                if(userData.status === '1'){
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const updateUser = await userData.update({ 
                        password:hashedPassword,
                        resetPasswordRequestTime:'',
                        resetPasswordToken:'' 
                    }); 
                    updateUser ? resp.status(200).json({ success:true, message: 'Password reset successfully.' }) : 
                    resp.status(500).json({ success:false, message: "Failed to update account's password." });
                }else{
                    return resp.status(401).json({ success:false, message: "Your account is not verified." });
                }
            } else {
                return resp.status(401).json({ success:false, message: "User data not found." });
            }            
        } else {
            return resp.status(401).json({ success:false, message: "Invalid Data." });
        }
    } catch (err) {
        if (err.name === "ValidationError") {
            return resp.status(400).json({ success:false, message: "Validation failed.", error: err.errors });
        }
        resp.status(500).json({ success:false, message: "Error during password-reset.", error: err.message });
    }
});

app.post(`/${prefix}/profile`, async (req, resp) => {
    const token = req.token;
    // console.log('Token:', token);
    // const decoded = jwt.decode(token); 
    // console.log('Decoded Token:', decoded);    
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }

    jwt.verify(token, secretKey, (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err); // Log the error
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            const { uuid,otp,otpGeneratedAt,password, ...userData } = authData.userData;  // Exclude password and some other data
            return resp.status(200).json({ message: "Success", data: userData });
        }
    });
});

const uploadUserProfileImage = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
        cb(null, "public/uploads/users");
        },
        filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
        },
    }),
}).single("upload_img");

// app.post(`/${prefix}/profileUpdate`, async (req, resp) => {    
//     const token = req.headers["authorization"]?.split(" ")[1];
//     if (!token) {
//         return resp.status(401).json({
//             success: false, 
//             message: "No token provided." 
//         });
//     }    

//     jwt.verify(token, secretKey, async (err, authData) => {
//         if (err) {
//             return resp.status(401).json({ success: false, message: "Invalid token" });
//         }
//         const data = req.body.data;
//         let profileImagePath = null;
//         if(req.file) {
//             profileImagePath = `/uploads/users/${req.file.filename}`;
//         }
//         try {
//             const userData = await User.findOne({ where: { email: data.email } });
//             if (!userData) {
//                 return resp.status(404).json({ success: false, message: "User not found" });
//             }
//             const updateData = {
//                 firstName: data.firstName,
//                 lastName: data.lastName,
//                 bio: data.bio,
//                 company: data.company,
//                 jobTitle: data.jobTitle,
//                 userLocation: data.userLocation,
//                 userWebsite: data.userWebsite,
//             };
//             if(profileImagePath) {
//                 updateData.profileImage = profileImagePath;
//             }
//             await userData.update(updateData);

//             const updatedUser = await User.findOne({ where: { email: data.email } });
//             // convert Sequelize instance to plain object
//             const plainUser = updatedUser.get({ plain: true });
//             // remove unwanted fields
//             const { otp, otpGeneratedAt, password, updatedAt, createdAt, role, status, ...userDatanew } = plainUser;

//             return resp.status(200).json({
//                 success: true,
//                 message: "Profile updated successfully.",
//                 userInfo: {
//                     userData: userDatanew,
//                 },
//             });
//         } catch (error) {
//             console.error(error);
//             return resp.status(500).json({
//                 success: false,
//                 message: "Something went wrong while updating profile.",
//             });
//         }
//     });
// });

app.post(`/${prefix}/profileUpdate`, uploadUserProfileImage, async (req, resp) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return resp.status(401).json({ success: false, message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, message: "Invalid token" });
        }
        try {
            const {
                firstName,
                lastName,
                email,
                bio,
                company,
                jobTitle,
                userLocation,
                userWebsite,
            } = req.body;

            const userData = await User.findOne({ where: { email } });
            if (!userData) {
                return resp.status(404).json({ success: false, message: "User not found" });
            }

            const updateFields = {
                firstName,
                lastName,
                bio,
                company,
                jobTitle,
                userLocation,
                userWebsite,
            };
            // If new profile image uploaded
            if (req.file) {
                // Delete old image if exists
                if (userData.profileImage) {
                    const oldImagePath = path.join("public", userData.profileImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                        console.log(`Deleted file: ${oldImagePath}`);
                    } else {
                        console.warn(`Old profile image not found: ${oldImagePath}`);
                    }
                }
                // Save new image path
                updateFields.profileImage = `/uploads/users/${req.file.filename}`;
            }

            await userData.update(updateFields);
            const updatedUser = await User.findOne({ where: { email } });
            const plainUser = updatedUser.get({ plain: true });

            const {
                otp,
                otpGeneratedAt,
                password,
                updatedAt,
                createdAt,
                role,
                status,
                ...userDatanew
            } = plainUser;

            return resp.status(200).json({
                success: true,
                message: "Profile updated successfully.",
                userInfo: { userData: userDatanew },
            });
        } catch (error) {
            console.error(error);
            return resp.status(500).json({
                success: false,
                message: "Something went wrong while updating profile.",
            });
        }
    });
});

app.post(`/${prefix}/update-profile-password`, async (req, resp) => {    
    const token = req.token; 
    if (!token) {
        return resp.status(401).json({
            success: false, 
            message: "No token provided." 
        });
    } 
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, message: "Invalid token" });
        }
        const { currentPassword, confirmPassword } = req.body;
        const userUuid = authData.userData.uuid;
        //console.log('passowrs : ',req.body.confirmPassword);
        try {
            const user = await User.findOne({ where: { uuid: userUuid } });
            if (!user) {
                return resp.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return resp.status(400).json({
                    success: false,
                    message: "Current password is incorrect."
                });
            }
            const hashedPassword = await bcrypt.hash(confirmPassword, 10);
            await user.update({ password: hashedPassword });
            return resp.json({
                success: true,
                message: "Password updated successfully."
            });
        } catch (error) {
            console.error("Password update error:", error);
            return resp.status(500).json({
                success: false,
                message: "Something went wrong. Please try again."
            });
        }
        
    });
});

app.post(`/${prefix}/delete-account`, async (req, resp) => {    
    const token = req.token; 
    if (!token) {
        return resp.status(401).json({
            success: false, 
            message: "No token provided." 
        });
    } 
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, message: "Invalid token" });
        }
        
        try {
            const user = await User.findOne({ where: { uuid: authData.userData.uuid } });
            if (!user) {
                return resp.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
            await user.update({ status: '2' });
            // User all data delete 
                // await SocialUser.destroy({
                //     where: {
                //         user_id: authData.userData.uuid,
                //     }
                // });
                // await SocialUserPage.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });               
                // await UserPost.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,                        
                //     }
                // });
                // await PostComments.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                
                // await Analytics.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await Demographics.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // const inboxConversations = await InboxConversations.findAll({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // for (const conversation of inboxConversations) {
                //     await InboxMessages.destroy({
                //         where: {
                //             conversation_id: conversation.conversation_id
                //         }
                //     });
                //     await conversation.destroy();
                // }
                // await AdsAccounts.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await Campaigns.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await Adsets.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await AdsetsAds.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await AdsCreative.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await Settings.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
                // await Activity.destroy({
                //     where: {
                //         user_uuid: authData.userData.uuid,
                //     }
                // });
            // End User all data delete

            return resp.json({
                success: true,                
            });
        } catch (error) {
            console.error("Password update error:", error);
            return resp.status(500).json({
                success: false,
                message: "Something went wrong. Please try again."
            });
        }                
    });
});

app.post(`/${prefix}/save-timezone`, async (req, resp) => {      
    const token = req.token;     
    if (!token) {
        return resp.status(401).json({
            success: false, 
            message: "No token provided." 
        });
    } 
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ success: false, message: "Invalid token" });
        }
        const userUuid = authData.userData.uuid;        
        try {
            const user = await User.findOne({ where: { uuid: userUuid } });
            if (!user) {
                return resp.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
            await user.update({ timeZone: req.body.timeZone });
            const updatedUser = await User.findOne({ where: { uuid: userUuid } });
            const plainUser = updatedUser.get({ plain: true });
            const {
                otp,
                otpGeneratedAt,
                password,
                updatedAt,
                createdAt,
                role,
                status,
                ...userDatanew
            } = plainUser;
            return resp.json({
                success: true,
                message: "Timezone save successfully.",
                userInfo: { userData: userDatanew },
            });
        } catch (error) {
            console.error("Timezone error:", error);
            return resp.status(500).json({
                success: false,
                message: "Something went wrong. Please try again."
            });
        }        
    });
});

app.post(`/${prefix}/social_account_submit`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
            
            // Check if the social ID is used by another user
            const existingSocialId = await SocialUser.findOne({
                where: {
                    social_id: req.body.data.id,
                    user_id: { [Op.ne]: userData.uuid }
                }
            });

            if (existingSocialId) {
                return resp.status(400).json({ 
                    message: "This account is already linked to our platform.",
                    createAccount: false 
                });
            }

            // Check if the current user already has this social ID linked
            const existingUser = await SocialUser.findOne({
                where: {
                    user_id: userData.uuid,
                    social_id: req.body.data.id
                }
            });

            const pictureData = req.body.data.picture;

            if (!existingUser) {
                // Create new social profile
                try {
                    const newSocialUser = await SocialUser.create({
                        user_id: userData.uuid,
                        name: req.body.data.name,
                        img_url: pictureData?.data?.url || '',
                        social_id: req.body.data.id,
                        social_user_platform: req.body.social_user_platform,
                        user_token: req.body.accessToken,
                        status: "Connected"
                    });

                    return resp.status(200).json({ 
                        message: "Social Profile Data Saved Successfully.",
                        createAccount: true,
                        userInfo: { socialData: newSocialUser }
                    });
                } catch (error) {
                    console.error('Error creating social user:', error);
                    return resp.status(500).json({ 
                        createAccountError: false,
                        message: "Failed to save Social Profile." 
                    });
                }
            } else {
                // Update existing social profile
                try {
                    const updatedProfile = await existingUser.update({
                        img_url: pictureData?.data?.url,
                        user_token: req.body.accessToken,
                        token_access_expiration_time: req.body.data_access_expiration_time,
                        status: "Connected"
                    });

                    return resp.status(200).json({
                        message: "User token updated.",
                        createAccount: true,
                        userInfo: { socialData: updatedProfile }
                    });
                } catch (error) {
                    console.error('Error updating social user:', error);
                    return resp.status(500).json({ 
                        message: "Failed to update Social Profile." ,
                        createAccountError: false,
                    });
                }
            }
        }
    });
});

app.post(`/${prefix}/social_page_submit`, async (req,resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        }
        
        try {
            const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
            const existingUser = await SocialUser.findOne({ 
                where: { user_id: userData.uuid } 
            });

            if (!existingUser) {
                return resp.status(404).json({ message: "User Social Profile Data Not Found." });
            }

            // Process pages data
            let pagesData = Array.isArray(req.body.pagesData) 
                ? req.body.pagesData 
                : [req.body.pagesData];

            if (!req.body.token) {
                return resp.status(400).json({ message: "Facebook Page Token not found." });
            }

            // Update/Create pages
            for (const page of pagesData) {
                const pageData = {
                    user_uuid: userData.uuid,
                    social_userid: req.body.social_id,
                    pageName: page.name,
                    page_picture: page.picture?.data?.url || null,
                    page_cover: page.cover?.source || null,
                    pageId: page.id,
                    category: page.category,
                    page_platform:req.body.page_platform,
                    status: "Connected",
                    token: req.body.token,
                    modify_to: JSON.stringify(page.tasks || []),
                };

                // Check for existing page using both pageId AND user_uuid
                const existingPage = await SocialUserPage.findOne({
                    where: {
                        pageId: page.id,
                        user_uuid: userData.uuid
                    }
                });

                if (existingPage) {
                    await existingPage.update(pageData);
                } else {
                    await SocialUserPage.create(pageData);
                }
            }

            // Get updated data with nested structure
            const social_user_data = await SocialUser.findAll({
                where: { 
                    user_id: userData.uuid,
                }
            });

            const social_page_data = await SocialUserPage.findAll({ 
                where: { user_uuid: userData.uuid } 
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

            return resp.status(200).json({
                message: "Connected & Saved Data Successfully.",
                userInfo: {
                    userData: userData,
                    socialData: formattedSocialData
                }
            });

        } catch (error) {
            console.error('Error in social_page_submit:', error);
            return resp.status(500).json({ 
                message: "Server error during page submission", 
                error: error.message 
            });
        }
    });
});

app.post(`/${prefix}/create-post`, upload, async (req, resp) => {
    try {
        const token = req.token;
        if (!token) return resp.status(401).json({ message: "No token provided." });
        // Verify token
        const authData = await new Promise((resolve, reject) => {
            jwt.verify(token, secretKey, (err, data) => (err ? reject(err) : resolve(data)));
        });
        const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
        const formId = crypto.randomUUID();
        // --- Parse posts payload
        let posts = [];
        try {
            posts = JSON.parse(req.body.posts || "[]");
            if (!Array.isArray(posts)) throw new Error("`posts` must be an array");
        } catch (e) {
            return resp.status(400).json({ message: "Invalid posts payload" });
        }
        // --- Build a single media array for the entire form
        let finalMediaArray = [];
        if (req.files && req.files.length > 0) {
            finalMediaArray = req.files.map((file, index) => {
                const isVideo = file.mimetype.startsWith("video/");
                const servedPath = `/uploads/posts/${isVideo ? "videos" : "images"}/${file.filename}`;
                return {
                    order: index,
                    type: isVideo ? "video" : "image",
                    path: servedPath
                };
            });
        } else if (posts.length > 0) {
            // Fallback: Use media from the first post if no files uploaded
            const firstPost = posts[0];
            if (Array.isArray(firstPost.mediaUrls) && firstPost.mediaUrls.length > 0) {
                finalMediaArray = firstPost.mediaUrls.map((url, idx) => ({
                    order: idx,
                    type: /\.mp4$/i.test(url) ? "video" : "image",
                    path: url
                }));
            } else if (firstPost.mediaUrl) {
                finalMediaArray = [{ order: 0, type: "image", path: firstPost.mediaUrl }];
            }
        }
        // --- Save posts
        const results = await Promise.all(
            posts.map(async (post) => {
                // Validate page ownership
                const existingPage = await SocialUserPage.findOne({
                    where: { pageId: post.pageId, social_userid: post.social_userid }
                });
                if (!existingPage) throw new Error(`Page ID mismatch for ${post.pageId}`);
                // Create post record
                const newPost = await UserPost.create({
                    user_uuid: userData.uuid,
                    social_user_id: post.social_userid,
                    page_id: post.pageId,
                    content: post.content,
                    schedule_time: post.schedule_time,
                    post_media: JSON.stringify(finalMediaArray), // <-- same media for all posts
                    platform_post_id: post.platform_post_id || "",
                    post_platform: post.socialPlatform || "",
                    form_id: formId,
                    week_date: new Date().toISOString().split("T")[0],
                    status: post.status
                });
                // Log activity
                const now = new Date(); 
                const activity_type = "posts";
                const activity_subType = post.status === "0" ? "Draft" : "Scheduled";
                const action = "create";
                const source_type = '';
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: newPost.id,
                    activity_subType_id: post.pageId,
                    schedule_time: post.status === "2" ? post.schedule_time : ""
                };
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate( userData.uuid,post.social_userid,post.socialPlatform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                return newPost;
            })
        );
        resp.status(200).json({
            message: `${results.length} posts saved successfully`,
            files: (req.files || []).map(file => ({
                original: file.originalname,
                savedAs: file.filename,
                path: file.mimetype.startsWith("video")
                    ? `/uploads/posts/videos/${file.filename}`
                    : `/uploads/posts/images/${file.filename}`
            })),
            posts: results.length
        });
    } catch (err) {
        console.error("Error:", err);
        resp.status(500).json({
            message: err.message,
            errorDetails: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }
});

app.post(`/${prefix}/edit-post`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        }
        try {
            const { formId, userUUID } = req.body;
            if (!formId || !userUUID) {
                return resp.status(400).json({ message: "Missing required fields: formId or userUUID." });
            }
            // Find all posts under this form_id and user
            const posts = await UserPost.findAll({
                where: {
                    form_id: formId,
                    user_uuid: userUUID
                }
            });
            if (!posts || posts.length === 0) {
                return resp.status(404).json({ message: "No posts found for this formId." });
            }
            // Fetch related page data
            const pageIds = posts.map(p => p.page_id);
            const socialPageDataList = await SocialUserPage.findAll({
                where: { pageId: pageIds }
            });
            const socialPageMap = socialPageDataList.reduce((acc, page) => {
                const { category, modify_to, user_uuid, social_userid, createdAt, updatedAt, id, ...userData } = page.dataValues;
                acc[page.pageId] = userData;
                return acc;
            }, {});
            // Combine posts with page data
            const postDetails = posts.map(p => {
                const pJson = p.toJSON();
                return {
                    ...pJson,
                    pageData: socialPageMap[p.page_id] || null
                };
            });
            return resp.status(200).json({ message: "Posts fetched successfully", postDetails });
        } catch (error) {
            console.error("Error fetching post:", error);
            return resp.status(500).json({ message: "Internal server error", error: error.message });
        }
    });
});

// draft and schedule post update function
app.post(`/${prefix}/update-post`, upload, async (req, res) => {
    const token = req.token;
    if (!token) return res.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) return res.status(401).json({ message: "Token not valid." });
        try {
            const userData = authData.userData;
            const { form_id, content, status, schedule_time, pages, removeMedia, existingMedia } = req.body;
            if (!form_id || !pages) {
                return res.status(400).json({ message: "Missing required fields." });
            }
            const incomingPages = JSON.parse(pages);
            const currentPosts = await UserPost.findAll({ where: { form_id } });
            const currentPageIds = currentPosts.map(p => p.page_id);
            const incomingPageIds = incomingPages.map(p => p.page_id);
            const pagesToAdd = incomingPages.filter(p => !currentPageIds.includes(p.page_id));
            const pagesToRemove = currentPosts.filter(p => !incomingPageIds.includes(p.page_id));
            // Remove DB rows for unchecked pages
            if (pagesToRemove.length > 0) {
                for (const removedPost of pagesToRemove) {
                    const socialPage = await SocialUserPage.findOne({
                        where: { pageId: removedPost.page_id },
                        attributes: ["page_platform", "social_userid"],
                        raw: true
                    });
                    const activity_type = "posts";
                    const activity_subType = removedPost.status === "0" ? "Draft" : "Scheduled";
                    const action = "delete";
                    const source_type = '';
                    const post_form_id = '';
                    const reference_pageID = {
                        activity_type_id: removedPost.id,
                        activity_subType_id: removedPost.page_id,
                        schedule_time: removedPost.status === "2" ? removedPost.schedule_time : ""
                    };
                    const nextAPI_call_dateTime = '';
                    await activityCreate( userData.uuid, socialPage.social_userid, socialPage.page_platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime);
                }
                await UserPost.destroy({ where: { id: pagesToRemove.map(p => p.id) } });
            }
            // Handle Media
            let finalMedia = existingMedia ? JSON.parse(existingMedia) : [];
            if (removeMedia) {
                const toRemove = Array.isArray(removeMedia) ? removeMedia : JSON.parse(removeMedia);
                toRemove.forEach(filePath => {
                    const fullPath = path.join("public", filePath);
                    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                });
                finalMedia = finalMedia.filter(m => !toRemove.includes(m.path));
            }
            // console.log('requestFiles:',req.files);
            const newMedia = (req.files || []).map((f, index) => {
                const isVideo = f.mimetype.startsWith("video/");
                const servedPath = `/uploads/posts/${isVideo ? "videos" : "images"}/${f.filename}`;
                return { order: finalMedia.length + index, type: isVideo ? "video" : "image", path: servedPath };
            });
            finalMedia = [...finalMedia, ...newMedia].sort((a, b) => a.order - b.order);
            // Update existing rows
            const updateFields = { content, schedule_time: status === "2" ? schedule_time : null,
                post_media: JSON.stringify(finalMedia), status
            };
            await UserPost.update(updateFields, { where: { form_id, page_id: currentPageIds } });
            // Fetch updated posts to log update activity
            const updatedPosts = await UserPost.findAll({
                where: { form_id, page_id: currentPageIds }
            });
            for (const updatedPost of updatedPosts) {
                const socialPage = await SocialUserPage.findOne({
                    where: { pageId: updatedPost.page_id },
                    attributes: ["page_platform", "social_userid"],
                    raw: true
                });
                const activity_type = "posts";
                const activity_subType = updatedPost.status === "0" ? "Draft" : "Scheduled";
                const action = "update";
                const source_type = '';
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: updatedPost.id,
                    activity_subType_id: updatedPost.page_id,
                    schedule_time: ""
                };
                const nextAPI_call_dateTime = '';
                await activityCreate( userData.uuid, socialPage.social_userid, socialPage.page_platform, activity_type, activity_subType, action, nextAPI_call_dateTime, post_form_id, reference_pageID, source_type);
            }
            // Insert new rows for newly added pages
            if (pagesToAdd.length > 0) {
                const newRows = pagesToAdd.map(p => ({
                    form_id,
                    post_platform: p.platform,
                    page_id: p.page_id,
                    social_user_id: p.social_user_id,
                    user_uuid: p.userUUID,
                    week_date: p.week_date,
                    content,
                    schedule_time: status === "2" ? schedule_time : null,
                    post_media: JSON.stringify(finalMedia),
                    status
                }));
                // await UserPost.bulkCreate(newRows);
                const insertedRows = await UserPost.bulkCreate(newRows);
                for (const insertedPost of insertedRows) {
                    const socialPage = await SocialUserPage.findOne({
                        where: { pageId: insertedPost.page_id },
                        attributes: ["page_platform", "social_userid"],
                        raw: true
                    });
                    const activity_type = "posts";
                    const activity_subType = insertedPost.status === "0" ? "Draft" : "Scheduled";
                    const action = "create";
                    const source_type = '';
                    const post_form_id = '';
                    const reference_pageID = {
                        activity_type_id: insertedPost.id,
                        activity_subType_id: insertedPost.page_id,
                        schedule_time: ""
                    };
                    const nextAPI_call_dateTime = '';
                    await activityCreate( userData.uuid, socialPage.social_userid, socialPage.page_platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime);
                }
            }
            return res.status(200).json({ message: "Post updated successfully.", post_media: finalMedia });
        } catch (error) {
            console.error("Update error:", error);
            return res.status(500).json({ message: "Internal server error", error: error.message });
        }
    });
});
// only published post update function with its helper functions.
app.post(`/${prefix}/update-published-posts`, async (req, res) => {
    try {
        const { content, form_id } = req.body;
        if (!content || !form_id) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        const userPosts = await UserPost.findAll({ where: { form_id } });
        if (!userPosts || userPosts.length === 0) {
            return res.status(404).json({ message: "No posts found for given form_id." });
        }
        for (const userPost of userPosts) {
            const page = await SocialUserPage.findOne({
                attributes: ['token','social_userid','page_platform'],
                where: { user_uuid: userPost.user_uuid, pageId: userPost.page_id },
                raw: true
            });
            if (!page || !page.token) {
                return res.status(400).json({ message: `Access token not found for page ID ${userPost.page_id}` });
            }
            const pageAccessToken = page.token;
            const postPlatform = (userPost.post_platform || "").toLowerCase();
            let updateResponse;
            // Update based on platform type
            if (postPlatform === "facebook") {
                updateResponse = await updateFacebookPost( userPost.platform_post_id, content, pageAccessToken );
            } else if (postPlatform === "linkedin") {
                updateResponse = await updateLinkedInPost( userPost.platform_post_id, content, pageAccessToken );
            } else {
                return res.status(400).json({
                    message: `Unsupported platform: ${postPlatform}`
                });
            }
            if (!updateResponse || !updateResponse.success) {
                return res.status(500).json({
                    message: `Failed to update post on ${postPlatform}`,
                    error: updateResponse || "Unknown error"
                });
            }else{
                const now = new Date(); 
                const activity_type = "posts";
                const activity_subType = "published";
                const action = "update";
                const source_type = '';
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: userPost.id,
                    activity_subType_id: userPost.page_id,
                    schedule_time: ""
                };
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate( userPost.user_uuid, page.social_userid, page.page_platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime);
            }
        }
        await UserPost.update( { content }, { where: { form_id } } );
        return res.status(200).json({ message: "Published post updated successfully." });
    } catch (error) {
        console.error("Error in /update-published-posts:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});
async function updateFacebookPost(postId, message, accessToken) {
    try {
        const res = await fetch(`https://graph.facebook.com/${postId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, access_token: accessToken })
        });
        const data = await res.json();
        if (data.error) {
            console.error('Facebook API Error:', data);
            return { success: false, error: data.error };
        }
        return { success: true, data };
    } catch (err) {
        console.error('Facebook Post Update Failed:', err);
        return { success: false, error: err.message };
    }
}
// async function updateLinkedInPost(postId, message, accessToken) {
//     try {
//         if (!postId || !message || !accessToken) {
//             throw new Error("postId, message, and accessToken are required.");
//         }
//         const encodedPostId = encodeURIComponent(postId);
//         // Build the PATCH body for updating commentary
//         const patchBody = JSON.stringify({
//                 "patch": {
//                     "$set": {
//                         "commentary":  message,
//                         "contentCallToActionLabel": "LEARN_MORE"
//                     }
//                 }
//             });
//         console.log(`Updating LinkedIn post at: https://api.linkedin.com/rest/posts/${encodedPostId}`);
//         console.log("Payload:", patchBody);
//         // Send PATCH request
//         const res = await fetch(`https://api.linkedin.com/rest/posts/${encodedPostId}`, {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${accessToken}`,
//                 "Content-Type": "application/json",
//                 "X-Restli-Protocol-Version": "2.0.0",
//                 'X-RestLi-Method': 'PARTIAL_UPDATE',
//                 "LinkedIn-Version": "202504",
//             },
//             body: patchBody
//         });
//         const responseText = await res.text();
//         let data;
//         try {
//             data = JSON.parse(responseText);
//         } catch {
//             data = responseText;
//         }
//         if (res.ok) {
//             console.log("Post updated successfully:", data);
//             return { success: true, data: data };
//         } else {
//             console.error("LinkedIn API Error:", res.status, data);
//             return { success: false, error: data };
//         }
//     } catch (err) {
//         console.error("LinkedIn Post Update Failed:", err.message);
//         return { success: false, error: err.message };
//     }
// }
async function updateLinkedInPost(postId, message, accessToken) {
    try {
        if (!postId || !message || !accessToken) {
            throw new Error("postId, message, and accessToken are required.");
        }
        
        // Ensure the post ID is URL-encoded
        const encodedPostId = encodeURIComponent(postId);
        
        // Build the PATCH body for updating commentary
        const patchBody = JSON.stringify({
            "patch": {
                "$set": {
                    // 'commentary' is the correct field for updating the text content
                    "commentary": message 
                }
            }
        });
        
        console.log(`Attempting robust POST/PARTIAL_UPDATE on LinkedIn post: https://api.linkedin.com/rest/posts/${encodedPostId}`);
        
        const res = await fetch(`https://api.linkedin.com/rest/posts/${encodedPostId}`, {
            // FIX 1: Use POST method, which is required when using X-RestLi-Method
            method: "POST", 
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                // FIX 2: Re-introduce X-RestLi-Method to signal a partial update
                'X-RestLi-Method': 'PARTIAL_UPDATE', 
                // FIX 3: Re-introduce the X-Restli-Protocol-Version header (often required with PARTIAL_UPDATE)
                "X-Restli-Protocol-Version": "2.0.0", 
                "LinkedIn-Version": "202504", 
            },
            body: patchBody
        });
        
        // A successful POST/PARTIAL_UPDATE often returns 204 No Content.
        if (res.status === 204 || res.ok) {
            console.log("LinkedIn Post updated successfully.");
            return { success: true, data: {} }; 
        }

        const responseText = await res.text();
        let data = {};
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            data = responseText;
        }
        
        console.error("LinkedIn API Error:", res.status, data);
        return { success: false, error: data };
        
    } catch (err) {
        console.error("LinkedIn Post Update Failed:", err.message);
        return { success: false, error: err.message };
    }
}

app.post(`/${prefix}/update-type-change`, upload, async (req, res) => {
    const token = req.token;
    if (!token) return res.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) return res.status(401).json({ message: "Token not valid." });
        try {
            const { form_id, old_status, new_status, schedule_time, pages, removeMedia, existingMedia, content } = req.body;
            /** ===== VALIDATION ===== **/
            if (!form_id || !old_status || !new_status) {
                return res.status(400).json({ message: "Missing required fields: form_id, old_status, new_status." });
            }
            if (new_status === "2" && !schedule_time) {
                return res.status(400).json({ message: "Schedule time required for scheduled posts." });
            }
            if (!pages || (Array.isArray(pages) && pages.length === 0)) {
                return res.status(400).json({ message: "At least one page must be selected." });
            }
            const userData = authData.userData;
            const parsedPages = Array.isArray(pages) ? pages : JSON.parse(pages);
            /** === Fetch Current Posts from DB === **/
            const currentPosts = await UserPost.findAll({ where: { form_id }, raw: true });
            const currentPageIds = currentPosts.map(p => p.page_id);
            const incomingPageIds = parsedPages.map(p => p.page_id);
            /** === Determine Page Changes === **/
            const pagesToAdd = parsedPages.filter(p => !currentPageIds.includes(p.page_id));
            const pagesToRemove = currentPosts.filter(p => !incomingPageIds.includes(p.page_id));
            // Remove deselected pages
            if (pagesToRemove.length > 0) {
                const postsToDelete = await UserPost.findAll({
                    where: { id: pagesToRemove.map(p => p.id) },
                    raw: true
                });
                await UserPost.destroy({ where: { id: pagesToRemove.map(p => p.id) } });
                // Log activity for each deleted page
                for (const deletedPost of postsToDelete) {
                    const activity_subType = deletedPost.status === "0" ? "Draft" : deletedPost.status === "1" ? "published" : "Scheduled";
                    const reference_pageID = {
                        activity_type_id: deletedPost.id,
                        activity_subType_id: deletedPost.page_id,
                        schedule_time: deletedPost.status === "2" ? deletedPost.schedule_time || "" : ""
                    };
                    const source_type = '';
                    const nextAPI_call_dateTime = '';
                    await activityCreate(deletedPost.user_uuid, deletedPost.social_user_id, deletedPost.post_platform, "posts", activity_subType, "delete", source_type, "", reference_pageID, nextAPI_call_dateTime );
                }
            }
            /** === Media Handling === **/
            let finalMedia = [];
            // Parse existing media
            if (existingMedia) {
                try {
                    const parsedExisting = JSON.parse(existingMedia);
                    finalMedia = parsedExisting.map((item, index) => {
                        let filePath = item.path || item.url || "";
                        filePath = filePath.replace(/^https?:\/\/[^/]+/, ""); // strip domain
                        return {
                            order: index,
                            type: item.type || (/\.mp4$/i.test(filePath) ? "video" : "image"),
                            path: filePath
                        };
                    });
                } catch (err) {
                    console.error("Failed to parse existingMedia:", err.message);
                    finalMedia = [];
                }
            }
            const parsedRemoveMedia = removeMedia ? (Array.isArray(removeMedia) ? removeMedia : JSON.parse(removeMedia)) : [];
            const uploadedFiles = req.files || [];
            const noMediaChange = parsedRemoveMedia.length === 0 && uploadedFiles.length === 0;
            // If media changed, handle additions/removals
            if (!noMediaChange) {
                // Remove deleted media
                if (parsedRemoveMedia.length > 0) {
                    parsedRemoveMedia.forEach(filePath => {
                        const fullPath = path.join("public", filePath);
                        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                    });
                    finalMedia = finalMedia.filter(m => !parsedRemoveMedia.includes(m.path));
                }
                // Add new uploads
                if (uploadedFiles.length > 0) {
                    const newMedia = uploadedFiles.map((f, index) => {
                        const isVideo = f.mimetype.startsWith("video/");
                        const servedPath = `/uploads/posts/${isVideo ? "videos" : "images"}/${f.filename}`;
                        return {
                            order: finalMedia.length + index,
                            type: isVideo ? "video" : "image",
                            path: servedPath
                        };
                    });
                    finalMedia = [...finalMedia, ...newMedia].sort((a, b) => a.order - b.order);
                }
            }
            /** === Common Fields for DB === **/
            const commonFields = {
                content,
                post_media: JSON.stringify(finalMedia),
                status: new_status,
                schedule_time: new_status === "2" ? schedule_time : null
            };
            // DRAFT/SCHEDULED → PUBLISHED
            if (new_status === "1") {
                for (const page of parsedPages) {
                    try {
                        const existingPost = currentPosts.find(p => p.page_id === page.page_id);
                        let publishResult;
                        // Fetch full page details from DB
                        const socialPage = await SocialUserPage.findOne({
                            where: { pageId: page.page_id },
                            raw: true
                        });
                        if (!socialPage) {
                            console.error(`No SocialUserPage found for page_id: ${page.page_id}`);
                            continue; // Skip this page if no matching record
                        }
                        // Build full object like publish-posts expects
                        const completePageData = {
                            id: socialPage.pageId,
                            name: socialPage.pageName,        // assuming column name is pageName
                            pageSocialUser: socialPage.social_userid,
                            status: socialPage.status,
                            page_platform: socialPage.page_platform
                        };
                        const normalizedMediaFiles = finalMedia.map(m => ({
                            ...m,
                            path: path.join(__dirname, "public", m.path), // convert relative path to absolute
                            filename: m.path.split("/").pop(),
                            originalname: m.path.split("/").pop()
                        }));
                        // Publish to correct platform
                        if (completePageData.page_platform === "facebook") {
                            publishResult = await publishToFacebook(completePageData, content, normalizedMediaFiles);
                        } else if (completePageData.page_platform === "linkedin") {
                            publishResult = await publishToLinkedIn(completePageData, content, normalizedMediaFiles);
                        } else {
                            console.warn(`Unsupported platform: ${completePageData.page_platform}`);
                            continue;
                        }
                        if (!publishResult || publishResult.success === false) {
                            console.error(`Failed to publish/update on ${completePageData.page_platform}:`, publishResult?.error);
                            continue;
                        }
                        const weekDate = new Date().toISOString().split("T")[0];
                        // Update or Create
                        if (existingPost) {
                            await UserPost.update(
                                {
                                    ...commonFields,
                                    platform_post_id: publishResult.platform_post_id,
                                    post_platform: page.platform,
                                    week_date: weekDate
                                },
                                { where: { id: existingPost.id } }
                            );
                            /** === Log Activity for Update === **/
                            const now = new Date(); 
                            const activity_type = "posts";
                            const activity_subType = new_status === "0" ? "Draft" : new_status === "1" ? "published" : "Scheduled";
                            const action = "create";
                            const post_form_id = '';
                            const reference_pageID = {
                                activity_type_id: existingPost.id,
                                activity_subType_id: page.page_id,
                                schedule_time: new_status === "2" ? schedule_time : "",
                                old_status: old_status
                            };
                            const source_type = '';
                            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                            const nextAPI_call_dateTime = next24FromNow;
                            await activityCreate( userData.uuid, page.social_user_id, page.platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime );
                        } else {
                            const createdPost = await UserPost.create({
                                ...commonFields,
                                user_uuid: userData.uuid,
                                social_user_id: publishResult.social_userid,
                                form_id,
                                page_id: page.page_id,
                                platform_post_id: publishResult.platform_post_id,
                                post_platform: page.platform,
                                week_date: weekDate
                            });
                            /** === Log Activity for Create === **/
                            const now = new Date(); 
                            const activity_type = "posts";
                            const activity_subType =  new_status === "0" ? "Draft" : new_status === "1" ? "published" : "Scheduled";
                            const action = "create";
                            const post_form_id = '';
                            const reference_pageID = {
                                activity_type_id: createdPost.id,
                                activity_subType_id: page.page_id,
                                schedule_time: new_status === "2" ? schedule_time : "",
                                old_status: old_status
                            };
                            const source_type = '';
                            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                            const nextAPI_call_dateTime = next24FromNow;
                            await activityCreate(userData.uuid, page.social_user_id, page.platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime );
                        }
                    } catch (err) {
                        console.error(`Error publishing post for page ${page.page_id}:`, err.message);
                    }
                }
            } else {
                // Draft/Scheduled Update Only
                const updated = await UserPost.update(commonFields, {
                    where: { form_id, page_id: incomingPageIds }
                });
                if (updated && updated[0] > 0) {
                    for (const pageId of incomingPageIds) {
                        const updatedPost = await UserPost.findOne({ where: { form_id, page_id: pageId } });
                        if (updatedPost) {
                            const activity_subType = new_status === "0" ? "Draft" : "Scheduled";
                            const reference_pageID = {
                                activity_type_id: updatedPost.id,
                                activity_subType_id: pageId,
                                schedule_time: new_status === "2" ? schedule_time : "",
                                old_status: old_status
                            };
                            const source_type = '';
                            const nextAPI_call_dateTime = '';
                            await activityCreate(userData.uuid, updatedPost.social_user_id, updatedPost.post_platform, "posts", activity_subType, "update", source_type, '', reference_pageID, nextAPI_call_dateTime );
                        }
                    }
                }
            }
            /** === Add any brand new pages === **/
            if (pagesToAdd.length > 0) {
                const newRecords = await Promise.all(pagesToAdd.map(async p => {
                    const socialPage = await SocialUserPage.findOne({ where: { pageId: p.page_id } });
                    return {
                        user_uuid: userData.uuid,
                        social_user_id: socialPage.social_userid,
                        form_id,
                        platform: p.platform,
                        page_id: p.page_id,
                        content,
                        post_media: JSON.stringify(finalMedia),
                        status: new_status,
                        schedule_time: new_status === "2" ? schedule_time : null,
                        post_platform: p.platform,
                        week_date: new Date().toISOString().split("T")[0]
                    };
                }));
                const createdPosts = await UserPost.bulkCreate(newRecords);
                /** === Log Activity for Each Newly Added Page === **/
                const now = new Date(); 
                for (const createdPost of createdPosts) {
                    const activity_subType = new_status === "0" ? "Draft" : new_status === "1" ? "published" : "Scheduled";
                    const reference_pageID = {
                        activity_type_id: createdPost.id,
                        activity_subType_id: createdPost.page_id,
                        schedule_time: new_status === "2" ? schedule_time : "",
                        old_status: old_status
                    };
                    const source_type = '';
                    const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    const nextAPI_call_dateTime = new_status === "1" ? next24FromNow : "";
                    await activityCreate(userData.uuid, createdPost.social_user_id, createdPost.post_platform, "posts", activity_subType, "update", source_type, "", reference_pageID, nextAPI_call_dateTime );
                }
            }
            return res.status(200).json({
                message: `Post type updated from ${old_status} to ${new_status} successfully.`,
                post_media: finalMedia
            });
        } catch (error) {
            console.error("Error updating type change:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message
            });
        }
    });
});
// Helper to delete media files safely
const removeFilesFromDisk = (files) => {
    files.forEach(filePath => {
        const fullPath = path.join("public", filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });
};

app.post(`/${prefix}/delete-post`, async (req, resp) => {
    const token = req.token;
    if (!token) return resp.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        }
        try {
            const { postID, socialUserID, postPageID } = req.body;
            if (!postID || !socialUserID || !postPageID) {
                return resp.status(400).json({ message: "Missing required fields." });
            }
            // Find post
            const userPost = await UserPost.findOne({
                where: { id: postID, social_user_id: socialUserID, page_id: postPageID }
            });
            if (!userPost) {
                return resp.status(404).json({ message: "The requested resource could not be found on the server." });
            }
            // Delete files from disk
            if (userPost.post_media) {
                try {
                    const mediaArray = JSON.parse(userPost.post_media);
                    if (Array.isArray(mediaArray)) {
                        mediaArray.forEach(m => {
                            const filePath = path.join("public", m.path);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(`Deleted file: ${filePath}`);
                            }
                        });
                    }
                } catch (e) {
                    console.warn("Failed to parse post_media for deletion:", e.message);
                }
            }
            // Delete post from DB
            await userPost.destroy();
            // Return updated schedule list
            const userSchedulePosts = await UserPost.findAll({
                where: { social_user_id: socialUserID, schedule_time: { [Op.ne]: null, [Op.ne]: '' } }
            });
            const users_Posts = await Promise.all(
                userSchedulePosts.map(async (post) => {
                    const socialPageData = await SocialUserPage.findOne({ where: { pageId: post.page_id } });
                    const { category, modify_to, user_uuid, social_userid, createdAt, updatedAt, id, ...userData } = socialPageData.dataValues;
                    return { ...post.toJSON(), pageData: userData };
                })
            );
            return resp.status(200).json({ message: "Post deleted successfully", userSchedulePosts: users_Posts });
        } catch (error) {
            console.error("Error deleting post:", error);
            return resp.status(500).json({ message: "Internal server error", error: error.message });
        }
    });
});

app.post(`/${prefix}/posts`, async (req, resp) => {
    const token = req.token;
    if (!token) return resp.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) return resp.status(401).json({ message: "Token not valid." });
        const { uuid } = authData.userData;
        try {
            // 1) fetch posts and pages
            const userPostsRaw = await UserPost.findAll({
                where: { user_uuid: uuid },
                order: [['id', 'DESC']]
            });
            const socialPageDataList = await SocialUserPage.findAll({
                where: { user_uuid: uuid }
            });
            const socialPageMap = socialPageDataList.reduce((acc, socialPage) => {
                const { pageId, pageName, page_picture } = socialPage.dataValues;
                acc[pageId] = { pageName, page_picture, pageId };
                return acc;
            }, {});
            // 2) Group posts by form_id (fallback to id if missing)
            const grouped = {};
            userPostsRaw.forEach(row => {
                const p = row.toJSON();
                // Use form_id if present; otherwise fall back to a unique key (string)
                const formKey = p.form_id || `single_${p.id}`;
                // Initialize group if not present (do NOT set group-level week_date/schedule_time)
                if (!grouped[formKey]) {
                    grouped[formKey] = {
                        form_id: p.form_id || null,
                        content: p.content,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                        posts: []
                    };
                }
                const pageInfo = socialPageMap[p.page_id] || {};
                // Push the per-post object — include week_date, schedule_time, published_date, createdAt, updatedAt
                grouped[formKey].posts.push({
                    id: p.id,
                    page_id: p.page_id,
                    pageInfo,
                    pageName: pageInfo.pageName,
                    pagePicture: pageInfo.page_picture,
                    social_user_id: p.social_user_id,
                    platform: p.post_platform,
                    platform_post_id: p.platform_post_id,
                    postMedia: p.post_media,
                    status: p.status,
                    week_date: p.week_date || null,            // e.g. '2025-09-01'
                    schedule_time: p.schedule_time || null,    // e.g. unix seconds
                    published_date: p.published_date || null,  // optional iso string if you have it
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                });
            });
            // 3) convert to array and return
            const groupedPosts = Object.values(grouped).sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            return resp.status(200).json({ message: "success", posts: groupedPosts });
        } catch (error) {
            console.error("Error fetching posts:", error);
            return resp.status(500).json({ message: "Internal server error" });
        }
    });
});

//Function to determine the correct date for sorting
const getSortDate = (post) => {
    const todayStr = new Date().toISOString().split('T')[0];
    switch (post.status?.toString()) {
        case '0':
            return post.updatedAt;
        case '1':
            const createdAtDate = new Date(post.createdAt);
            const createdStr = createdAtDate.toISOString().split('T')[0].replace(/\//g, '-');
            if (post.week_date === createdStr && post.week_date === todayStr.replace(/\//g, '-')) {
                return post.createdAt;
            }
            return post.week_date;
        case '2':
            const t = Number(post.schedule_time);
            if (!Number.isNaN(t) && t > 0) return new Date(t * 1000);
            return post.schedule_time;
        default:
            return post.updatedAt;
    }
}
app.post(`/${prefix}/all-user-posts`, async (req, resp) => {
    const token = req.token;
    if (!token) return resp.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) return resp.status(401).json({ message: "Token not valid." });
        const { uuid } = authData.userData;
        try {
            const userPostsRaw = await UserPost.findAll({
                where: { user_uuid: uuid },
            });
            const socialPageDataList = await SocialUserPage.findAll({
                where: { user_uuid: uuid }
            });
            const socialPageMap = socialPageDataList.reduce((acc, socialPage) => {
                const { pageId, pageName, page_picture } = socialPage.dataValues;
                acc[pageId] = { pageId, pageName, page_picture };
                return acc;
            }, {});
            const socialUserData = await SocialUser.findAll({
                where: { user_id: uuid }
            });
            const socialUserMap = socialUserData.reduce((acc, socialPageUser) => {
                const { user_id, social_id, name, img_url } = socialPageUser.dataValues;
                acc[social_id] = { user_id, social_id, name, img_url };
                return acc;
            }, {});
            const posts = userPostsRaw.map(row => {
                const p = row.toJSON();
                const pageInfo = socialPageMap[p.page_id] || {};
                const pageUserInfo = socialUserMap[p.social_user_id] || {};
                const sortDateString = getSortDate(p);
                return {
                    id: p.id,
                    form_id: p.form_id || null,
                    content: p.content,
                    pageInfo,
                    pageUserInfo,
                    postData: {
                        likes: p.likes || 0,
                        comments: p.comments || 0,
                        shares: p.shares || 0,
                        engagement: p.engagements || 0,
                        reach: p.unique_impressions || 0,
                        impressions: p.impressions || 0
                    },
                    postPageName: socialPageMap[p.page_id]?.pageName || "",
                    postPagePicture: socialPageMap[p.page_id]?.page_picture || "",
                    social_user_id: p.social_user_id,
                    platform: p.post_platform,
                    platform_post_id: p.platform_post_id,
                    postMedia: p.post_media,
                    status: p.status,
                    week_date: p.week_date || null,
                    schedule_time: p.schedule_time || null,
                    published_date: p.published_date || null,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    // New field for frontend consumption
                    sort_date_string: sortDateString
                };
            });
            posts.sort((a, b) => new Date(b.sort_date_string) - new Date(a.sort_date_string));
            return resp.status(200).json({ message: "success", posts });
        } catch (error) {
            console.error("Error fetching posts:", error);
            return resp.status(500).json({ message: "Internal server error" });
        }
    });
});

app.post(`/${prefix}/draftPosts`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            const { uuid } = authData.userData;
            try {
                const userDraftPosts = await UserPost.findAll({
                    where: {
                        user_uuid: uuid,
                        status: '0'
                    },
                    order: [['id', 'DESC']],
                    attributes: {
                        exclude: ['schedule_time'] // Exclude unwanted fields
                    }
                });
                const socialPageDataList = await SocialUserPage.findAll({
                    where: { user_uuid: uuid }
                });
                const socialPageMap = socialPageDataList.reduce((acc, socialPage) => {
                    const { pageId, pageName, page_picture, page_cover, token } = socialPage.dataValues;
                    if (!acc[pageId]) {
                        acc[pageId] = [];
                    }
                    acc[pageId].push({ pageName, page_picture, page_cover, token, pageId });
                    return acc;
                }, {});
                const userPosts = userDraftPosts.map(post => {
                    const { page_id, user_uuid, content, status, createdAt, updatedAt } = post.toJSON();
                    const userSocialPages = socialPageMap[page_id] || [];
                    return {
                        id: post.id,
                        user_uuid,
                        page_id,
                        content,
                        status,
                        social_user_id: post.social_user_id,
                        post_media: post.post_media,
                        platform: post.post_platform,
                        form_id: post.form_id,
                        socialPages: userSocialPages,
                        createdAt,
                        updatedAt
                    };
                });
                return resp.status(200).json({ message: "success", userPosts });
            } catch (error) {
                console.error("Error fetching posts:", error);
                return resp.status(500).json({ message: "Internal server error" });
            }
        }
    });
});

app.post(`/${prefix}/post-delete`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return resp.status(401).json({ message: "Token not valid." });
        }
        const { userData } = authData;
        const { form_id, pageIds } = req.body;
        if (!form_id || !Array.isArray(pageIds) || pageIds.length === 0) {
            return resp.status(400).json({ message: "form_id and pageIds are required." });
        }
        try {
            const userPosts = await UserPost.findAll({
                where: {
                    form_id,
                    page_id: { [Op.in]: pageIds },
                    user_uuid: userData.uuid
                }
            });
            if (!userPosts || userPosts.length === 0) {
                return resp.status(404).json({ message: "No posts found for given form and pages." });
            }
            for (const userPost of userPosts) {
                const socialUserPage = await SocialUserPage.findOne({
                    attributes: ['token'],
                    where: { pageId: userPost.page_id },
                    raw: true
                });
                const access_token = socialUserPage ? socialUserPage.token : null;
                const { post_platform, platform_post_id, status } = userPost;
                if (status === "1" && post_platform && platform_post_id && access_token) {
                    try {
                        if (post_platform === "facebook") {
                            await deleteFacebookPost(platform_post_id, access_token);
                        } else if (post_platform === "linkedin") {
                            await deleteLinkedInPost(platform_post_id, access_token);
                        } else {
                            console.warn(`Unsupported platform: ${post_platform}`);
                        }
                    } catch (apiErr) {
                        console.error(`Failed to delete from ${post_platform}:`, apiErr.message);
                    }
                }
                // Log activity
                const activity_type = "posts";
                const activity_subType = userPost?.status === "0" ? "Draft" : userPost?.status === "2" ? "Scheduled" : "published";
                const action = "delete";
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: userPost?.status === "1" ? userPost?.platform_post_id : userPost?.id,
                    activity_subType_id: userPost.page_id,
                    title: {}
                };
                const source_type = '';
                const nextAPI_call_dateTime = '';
                await activityCreate( userData.uuid, userPost.social_user_id, userPost.post_platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime);
            }
            await UserPost.destroy({
                where: {
                    form_id,
                    page_id: { [Op.in]: pageIds },
                    user_uuid: userData.uuid
                }
            });
            const remainingRows = await UserPost.findAll({
                where: { form_id }
            });
            if (remainingRows.length === 0) {
                const deletedMedia = userPosts[0].post_media ? JSON.parse(userPosts[0].post_media) : [];
                if (Array.isArray(deletedMedia) && deletedMedia.length > 0) {
                    const filesToRemove = deletedMedia.map(m => m.path);
                    removeFilesFromDisk(filesToRemove);
                    console.log("Media files deleted:", filesToRemove);
                }
            }
            const updatedPosts = await UserPost.findAll({
                where: { user_uuid: userData.uuid },
                order: [['createdAt', 'DESC']]
            });
            const socialPageDataList = await SocialUserPage.findAll({
                where: { user_uuid: userData.uuid }
            });
            const socialPageMap = socialPageDataList.reduce((acc, socialPage) => {
                const { pageId, pageName, page_picture, page_cover, token } = socialPage.dataValues;
                if (!acc[pageId]) acc[pageId] = [];
                acc[pageId].push({ pageName, page_picture, page_cover, token, pageId });
                return acc;
            }, {});
            const userAllPosts = updatedPosts.map(post => ({
                id: post.id,
                user_uuid: post.user_uuid,
                social_user_id: post.social_user_id,
                page_id: post.page_id,
                content: post.content,
                schedule_time: post.schedule_time,
                post_media: post.post_media,
                platform_post_id: post.platform_post_id,
                status: post.status,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                socialPages: socialPageMap[post.page_id] || []
            }));
            return resp.status(200).json({
                message: "Posts deleted successfully",
                userPostlist: userAllPosts
            });
        } catch (error) {
            console.error("Error during post deletion:", error);
            return resp.status(500).json({
                message: "Internal server error",
                error: error.message
            });
        }
    });
});
const deleteFacebookPost = async (platform_post_id, token) => {
    const url = `https://graph.facebook.com/${platform_post_id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            access_token: token,
        })
    });
    if (!response.ok) throw new Error('Facebook post deletion failed');
};
const deleteLinkedInPost = async (platform_post_id, token) => {
    try {
        let url;
        if (platform_post_id.startsWith("urn:li:share:")) {
            const postId = platform_post_id.replace("urn:li:share:", "");
            url = `https://api.linkedin.com/v2/shares/${postId}`;
        } else if (platform_post_id.startsWith("urn:li:ugcPost:")) {
            const postId = platform_post_id.replace("urn:li:ugcPost:", "");
            url = `https://api.linkedin.com/v2/ugcPosts/${postId}`;
        } else {
            throw new Error("Invalid LinkedIn post URN format");
        }
        const response = await axios.delete(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202504",
            },
        });
        if (response.status === 204) {
            return { success: true };
        } else {
            return { success: false, error: response.data };
        }
    } catch (err) {
        console.error("LinkedIn Post Deletion Failed:", err.response?.data || err.message);
        return { success: false, error: err.response?.data || err.message };
    }
};

app.post(`/${prefix}/updatePost`, async (req, resp) => {   
    console.log('req', req.body); 
    const token = req.token;    
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    
    jwt.verify(token, secretKey, async (err) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            try {          
                const userPost = await UserPost.findOne({
                    where: { 
                        id: req.body.postid                        
                    }
                });

                if (userPost) {
                    const updatedPost = await UserPost.update({                        
                        status: req.body.postStatus || userPost.status, // Updated field name
                        platform_post_id: req.body.platform_post_id || '',
                    }, {
                        where: { id: req.body.postid }
                    });

                    if (updatedPost[0] === 0) {
                        return resp.status(500).json({ message: "Failed to update Post Data." });
                    } else {
                        return resp.status(200).json({ message: "Post updated successfully." });
                    }
                } else {
                    return resp.status(404).json({ message: "The requested resource could not be found on the server." });
                }
            } catch (error) {
                console.error("Error fetching or updating post:", error);
                return resp.status(500).json({ message: "Internal server error", error: error.message });
            }
        }
    });
});

app.post(`/${prefix}/scheduled-posts`, async (req, resp) => {
    const token = req.token;    
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }    
    jwt.verify(token, secretKey, async(err, authData) => {
        if(err) {           
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            const { id,firstName,role,otp,status,otpGeneratedAt,password,createdAt,updatedAt, ...userData } = authData.userData;
            try {
                const userSchedulePosts = await UserPost.findAll({
                    where: {
                        user_uuid: userData.uuid, 
                        //social_user_id: req.body.socialUserID,
                        schedule_time: { [Op.ne]: null, [Op.ne]: '' }, // filters out data i.e. null or an empty string
                        status: '2'
                    }            
                });
                // Add SocialUserPage data for each post
                const enrichedPosts = await Promise.all(
                    userSchedulePosts.map(async (post) => {
                        const socialPageData = await SocialUserPage.findOne({
                            where: { pageId: post.page_id }
                        });
                        const { createdAt,updatedAt,id, ...userData } = socialPageData.dataValues;
                        return { ...post.toJSON(), pageData: userData }; // Combine post and page data
                    })
                );

                return resp.status(200).json({ message: "Success", userSchedulePosts: enrichedPosts });
            } catch (error) {
                console.error("Error fetching SocialUserPage:", error);
                return resp.status(500).json({ message: "Internal server error" });
            }
        }
    });
});

app.post(`/${prefix}/user-disconnect`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            const loggedUser_uuid = authData.userData.uuid;
            try {
                const getUserData = await SocialUser.findOne({
                    where: {
                        user_id: loggedUser_uuid,
                        social_id: req.body.discount_account
                    }
                });
                if(!getUserData){
                    resp.status(403).json({ message: "invaild account"});
                }
                
                await getUserData.update({ status: "notConnected" });
                const getUserPageData = await SocialUserPage.findAll({
                    where: {
                        user_uuid: loggedUser_uuid,
                        social_userid: req.body.discount_account
                    }
                });

                // Update each page to 'notConnected'
                const disconnectedPageIds = [];

                for (const page of getUserPageData) {
                    await page.update({ status: "notConnected" });
                    disconnectedPageIds.push(page.pageId); // Collect disconnected page IDs
                }
                const userData = await User.findOne({ where: { uuid: loggedUser_uuid } });
                const { otp, otpGeneratedAt, password, ...userDatanew } = userData.dataValues;
                const social_user_data = await SocialUser.findAll({
                    where: { user_id: loggedUser_uuid }
                });
                if (social_user_data.length > 0) {
                    // Get all social pages for the user
                    const social_page_data = await SocialUserPage.findAll({
                        where: { user_uuid: loggedUser_uuid }
                    });
                    // Map social accounts with their pages
                    const socialDataWithPages = social_user_data.map((socialUser) => {
                        const socialUserValues = socialUser.dataValues;
                        // Filter pages for this specific social account
                        const pages = social_page_data
                            .filter(page => page.social_userid === socialUserValues.social_id)
                            .map(page => {
                                // Remove unnecessary fields
                                const { user_uuid, ...pageData } = page.dataValues;
                                return pageData;
                            });
                        return {
                            ...socialUserValues,
                            socialPage: pages
                        };
                    });

                    const user_uuid = loggedUser_uuid; 
                    const account_social_userid = req.body.discount_account;
                    const account_platform = getUserData.social_user_platform;
                    const activity_type = "social";
                    const activity_subType = "account";
                    const action = "disconnect";
                    const post_form_id = social_page_data.page_platform;
                    const reference_pageID = { 
                        activity_type_id: {}, 
                        activity_subType_id: {
                            pages: disconnectedPageIds, // 👈 Add disconnected page IDs here
                        }, 
                        title:getUserData.name 
                    };
                    const source_type = '';
                    const nextAPI_call_dateTime = '';
                    await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

                    resp.status(200).json({
                        message: 'Profile Disconnected successfully.',
                        userInfo: {
                            userData: userDatanew,
                            socialData: socialDataWithPages // Nested structure
                        }
                    });
                } else {
                    resp.status(200).json({
                        message: 'Profile Disconnected successfully.',
                        userInfo: {
                            userData: userDatanew,
                            socialData: null
                        }
                    });
                }
            } catch (error) {
                console.error('Error in user-disconnect:', error);
                resp.status(500).json({ message: "Server error during disconnect", error: error.message });
            }
        }
    });
});

app.post(`/${prefix}/social-account-remove`, async (req, resp) => {
    const token = req.token;
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            try {
                //const userData = await User.findOne({ where: { uuid: req.body.user_uuid } });
                const { otp, otpGeneratedAt, password, ...userDatanew } = authData.userData;
                const getUserData = await SocialUser.findOne({
                    where: {
                        user_id: authData.userData.uuid,
                        social_id: req.body.social_account_id
                    }
                });

                const deleteUserName = getUserData.name;
                const deleteUserPlatform = getUserData.social_user_platform;

                await getUserData.destroy();
                await UserPost.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        social_user_id: req.body.social_account_id
                    }
                });
                await PostComments.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        social_userid: req.body.social_account_id
                    }
                });
                await SocialUserPage.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        social_userid: req.body.social_account_id
                    }
                });
                await Analytics.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        platform: req.body.accountPlatform
                    }
                });
                await Demographics.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        platform: req.body.accountPlatform
                    }
                });
                const inboxConversations = await InboxConversations.findAll({
                    where: {
                        user_uuid: authData.userData.uuid,
                        social_userid: req.body.social_account_id
                    }
                });
                for (const conversation of inboxConversations) {
                    await InboxMessages.destroy({
                        where: {
                            conversation_id: conversation.conversation_id
                        }
                    });
                    await conversation.destroy(); // destroy the specific instance
                }
                
                //Ads Accounts tables
                await AdsAccounts.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        account_social_userid: req.body.social_account_id,
                    }
                });
                await Campaigns.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        account_social_userid: req.body.social_account_id,
                    }
                });
                await Adsets.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        account_social_userid: req.body.social_account_id,
                    }
                });
                await AdsetsAds.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        account_social_userid: req.body.social_account_id,
                    }
                });
                await AdsCreative.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        account_social_userid: req.body.social_account_id,
                    }
                });

                const social_user_data = await SocialUser.findAll({
                    where: { user_id: authData.userData.uuid }
                });
                if (social_user_data.length > 0) {
                    const social_page_data = await SocialUserPage.findAll({
                        where: { user_uuid: authData.userData.uuid }
                    });
                    const socialDataWithPages = social_user_data.map((socialUser) => {
                        const socialUserValues = socialUser.dataValues;
                        const pages = social_page_data
                            .filter(page => page.social_userid === socialUserValues.social_id)
                            .map(page => {
                                const { user_uuid, ...pageData } = page.dataValues;
                                return pageData;
                            });
                        return {
                            ...socialUserValues,
                            socialPage: pages
                        };
                    }); 
                    
                    await Activity.destroy({
                        where: {
                            user_uuid: authData.userData.uuid,
                            activity_type: {
                            [Op.in]: ['social', 'posts', 'ads']
                            }
                        }
                    });
                    
                    const user_uuid = authData.userData.uuid; 
                    const account_social_userid = req.body.social_account_id;
                    const account_platform = deleteUserPlatform;
                    const activity_type = "social";
                    const activity_subType = "account";
                    const action = "remove";
                    const post_form_id = '';
                    const reference_pageID = { activity_type_id: {}, activity_subType_id: {}, title:deleteUserName };
                    const source_type = '';
                    const nextAPI_call_dateTime = '';
                    await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

                    resp.status(200).json({
                        message: 'Account removed successfully.',
                        userInfo: {
                            userData: userDatanew,
                            socialData: socialDataWithPages // Nested structure
                        }
                    });
                } else {
                    resp.status(200).json({
                        message: 'Account removed successfully.',
                        userInfo: {
                            userData: userDatanew,
                            socialData: null
                        }
                    });
                }
            } catch (error) {
                console.error('Error in user-disconnect:', error);
                resp.status(500).json({ message: "Server error during disconnect", error: error.message });
            }
        }
    });
});

app.post(`/${prefix}/socail-account-pages`, async (req, resp) => {
    const token = req.token;    
    if (!token) {
        return resp.status(401).json({ message: "No token provided." });
    }
    
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return resp.status(401).json({ message: "Token not valid." });
        } else {
            try {
                const { id, firstName, lastName, email, role, otp, status, otpGeneratedAt, password, createdAt, updatedAt, ...userData } = authData.userData;
                const getUserData = await SocialUser.findOne({
                    where: {
                        user_id: userData.uuid,
                        social_id: req.body.social_account_id,
                        status: 'Connected'
                    }
                });          
                if (getUserData) {                    
                    const social_page_data = await SocialUserPage.findAll({ 
                        where: { social_userid: req.body.social_account_id } 
                    });                    
                    // Simplify the response by removing user_uuid and not nesting pages
                    const socialPagesData = social_page_data.map((page) => {
                        const { user_uuid, ...pageData } = page.dataValues;
                        return pageData;
                    });

                    resp.status(200).json({
                        message: 'Page get successfully.',                    
                        userInfo: { socialPagesData }
                    });
                } else {
                    resp.status(200).json({
                        message: 'Account not connected.'                  
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                resp.status(500).json({ message: "Server error", error: error.message });
            }
        }
    });    
});

app.post(`/${prefix}/create-analytics`, upload, async (req, resp) => {
    try {
        const token = req.token;
        if (!token) return resp.status(401).json({ message: "No token provided." });

        jwt.verify(token, secretKey, async (err, authData) => {
            if (err) return resp.status(401).json({ message: "Token not valid." });
            
            try {
                const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
                const analyticsData = JSON.parse(req.body.analyticsData);
                let allRecords = [];

                // Process each analytic type
                analyticsData.forEach((analyticItem) => {
                    const analyticType = analyticItem.analytic_type;

                    // Validate data structure
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

                    // Process based on analytic type
                    if (analyticType === "page_daily_follows") {
                        const records = values.filter(v => v.value != 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.socialPageId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_followers: v.value,
                            week_date: v.end_time
                        }));
                        allRecords.push(...records);
                    } else if (analyticType === "page_impressions") {
                        const records = values.filter(v => v.value != 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.socialPageId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_impressions: v.value,
                            week_date: v.end_time
                        }));
                        allRecords.push(...records);
                    } else if (analyticType === "page_impressions_unique") {
                        const records = values.filter(v => v.value != 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.socialPageId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_impressions_unique: v.value,
                            week_date: v.end_time
                        }));
                        allRecords.push(...records);
                    } else if (analyticType === "page_views_total") {
                        const records = values.filter(v => v.value != 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.socialPageId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_views: v.value,
                            week_date: v.end_time
                        }));
                        allRecords.push(...records);
                    } else if (analyticType === "page_post_engagements") {
                        const records = values.filter(v => v.value != 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.socialPageId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            page_post_engagements: v.value,
                            week_date: v.end_time
                        }));
                        allRecords.push(...records);
                    } else if (analyticType === "page_actions_post_reactions_like_total") {
                        const records = values.filter(v => v.value != 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.socialPageId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            page_actions_post_reactions_like_total: v.value,
                            week_date: v.end_time
                        }));
                        allRecords.push(...records);
                    } else {
                        console.warn(`Skipping unknown analytic type: ${analyticType}`);
                    }
                });

                // Check for existing records
                const existingEntries = await Analytics.findAll({
                    where: {
                        user_uuid: userData.uuid,
                        platform_page_Id: req.body.socialPageId,
                        [Op.or]: allRecords.map(record => ({
                            platform_page_Id: req.body.socialPageId,
                            analytic_type: record.analytic_type,
                            week_date: record.week_date
                        }))
                    },
                    attributes: ['platform_page_Id', 'analytic_type', 'week_date'],
                    raw: true,
                });

                // Create composite key set for existing entries
                const existingKeySet = new Set(
                    existingEntries.map(entry => 
                        `${entry.analytic_type}_${entry.week_date}`
                    )
                );

                // Filter out duplicates
                const newRecords = allRecords.filter(record => 
                    !existingKeySet.has(`${record.analytic_type}_${record.week_date}`)
                );

                // Save new records
                if (newRecords.length > 0) {
                    await Analytics.bulkCreate(newRecords);
                    return resp.status(200).json({ 
                        message: 'Analytics saved successfully.',
                        count: newRecords.length
                    });
                }
                return resp.status(200).json({ message: 'No new analytics to save.' });

            } catch (err) {
                console.error('Error processing analytics:', err);
                resp.status(500).json({ 
                    message: 'Failed to save analytics data',
                    error: err.message,
                    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
                });
            }
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        resp.status(500).json({ 
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { 
                error: err.message,
                stack: err.stack 
            })
        });
    }
});

// Helper function to get previous week's start and end dates
function getPreviousWeekDates(currentWeekStart) {
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
    return { prevWeekStart, prevWeekEnd };
}

app.post(`/${prefix}/get-analytics`, async (req, resp) => {
    try {
        const token = req.token;
        if (!token) return resp.status(401).json({ message: "No token provided." });

        jwt.verify(token, secretKey, async (err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return resp.status(401).json({ message: "Token not valid." });
            }

            try {
                const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
                const { lastMondayWeekDate, lastSundayWeekDate, platform, platformPageId } = req.body;

                const dateCondition = where(fn('DATE', col('week_date')), {
                    [Op.between]: [lastMondayWeekDate, lastSundayWeekDate]
                });

                const startDate = new Date(lastMondayWeekDate);
                const endDate = new Date(lastSundayWeekDate);
                const diffInTime = endDate.getTime() - startDate.getTime();
                const dateDifferenceInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

                const { prevWeekStart, prevWeekEnd } = getPreviousWeekDates(lastMondayWeekDate, dateDifferenceInDays);
                const prevWeekCondition = where(fn('DATE', col('week_date')), {
                    [Op.between]: [prevWeekStart.toISOString().split('T')[0], prevWeekEnd.toISOString().split('T')[0]]
                });

                let fetchData = [];
                let postWhereConditions = [];
                let prevPostWhereConditions = [];
                let publishedPost = 0, draftCount = 0, scheduledCount = 0;
                let prevPublishedPost = 0, prevDraftCount = 0, prevScheduledCount = 0;
                let publishedPostList = [], latestDraftPost = [], latestScheduledPost = [], prevPublishedPostList = [];

                if (platform === 'all' && platformPageId === '0') {
                    const connectedAccounts = await SocialUser.findAll({
                        where: {
                            user_id: userData.uuid,
                            status: 'Connected'
                        }
                    });

                    if (connectedAccounts.length === 0) {
                        return resp.status(200).json({
                            fetchData: [],
                            totals: {},
                            previousTotals: {},
                            growth: {},
                            publishedPostList: [],
                            latestDraftPost: [],
                            latestScheduledPost: [],
                            totalCount: 0,
                            publishedPost: 0,
                            draftCount: 0,
                            scheduledCount: 0,
                            postGrowthByPlatform: {},
                            prevPublishedPostList: [],
                            message: 'No connected accounts found.'
                        });
                    }

                    const conditions = connectedAccounts.map(acc => ({
                        platform: acc.social_user_platform,
                        //platform_page_Id: acc.page_id
                    }));

                    fetchData = await Analytics.findAll({
                        where: {
                            user_uuid: userData.uuid,
                            [Op.or]: conditions,
                            [Op.and]: [dateCondition]
                        },
                        order: [['id', 'DESC']]
                    });

                    postWhereConditions = conditions.map(acc => ({
                        user_uuid: userData.uuid,
                        post_platform: acc.platform,
                        //page_id: acc.platform_page_Id,
                        [Op.and]: [
                            where(fn('DATE', col('createdAt')), {
                                [Op.between]: [lastMondayWeekDate, lastSundayWeekDate]
                            })
                        ]
                    }));

                    prevPostWhereConditions = conditions.map(acc => ({
                        user_uuid: userData.uuid,
                        post_platform: acc.platform,
                        //page_id: acc.platform_page_Id,
                        [Op.and]: [prevWeekCondition]
                    }));
                } else {
                    fetchData = await Analytics.findAll({
                        where: {
                            user_uuid: userData.uuid,
                            platform,
                            platform_page_Id: platformPageId,
                            [Op.and]: [dateCondition]
                        },
                        order: [['id', 'DESC']]
                    });

                    postWhereConditions = [{
                        user_uuid: userData.uuid,
                        post_platform: platform,
                        page_id: platformPageId,
                        [Op.and]: [
                            where(fn('DATE', col('week_date')), {
                                [Op.between]: [lastMondayWeekDate, lastSundayWeekDate]
                            })
                        ]
                    }];

                    prevPostWhereConditions = [{
                        user_uuid: userData.uuid,
                        post_platform: platform,
                        page_id: platformPageId,
                        [Op.and]: [prevWeekCondition]
                    }];
                }

                // Post counts
                [publishedPost, draftCount, scheduledCount] = await Promise.all([
                    UserPost.count({ where: { [Op.or]: postWhereConditions, status: '1' } }),
                    UserPost.count({ where: { [Op.or]: postWhereConditions, status: '0' } }),
                    UserPost.count({ where: { [Op.or]: postWhereConditions, status: '2' } }),
                ]);

                [publishedPostList, latestDraftPost, latestScheduledPost] = await Promise.all([
                    UserPost.findAll({
                        where: { [Op.or]: postWhereConditions, status: '1' },
                        order: [['id', 'DESC']]
                    }),
                    UserPost.findAll({
                        where: { [Op.or]: postWhereConditions, status: '0' },
                        order: [['id', 'DESC']]
                    }),
                    UserPost.findAll({
                        where: { [Op.or]: postWhereConditions, status: '2' },
                        order: [['id', 'DESC']],
                        attributes: {
                            include: [
                                [Sequelize.literal(`(SELECT sup.pageName FROM social_page AS sup WHERE sup.pageId = UserPost.page_id)`), 'pageName'],
                                [Sequelize.literal(`(SELECT sup.page_picture FROM social_page AS sup WHERE sup.pageId = UserPost.page_id)`), 'page_picture']
                            ]
                        }
                    })
                ]);

                // Previous week posts
                [prevPublishedPost, prevDraftCount, prevScheduledCount, prevPublishedPostList] = await Promise.all([
                    UserPost.count({ where: { [Op.or]: prevPostWhereConditions, status: '1' } }),
                    UserPost.count({ where: { [Op.or]: prevPostWhereConditions, status: '0' } }),
                    UserPost.count({ where: { [Op.or]: prevPostWhereConditions, status: '2' } }),
                    UserPost.findAll({
                        where: { [Op.or]: prevPostWhereConditions, status: '1' },
                        order: [['id', 'DESC']]
                    })
                ]);

                // Process totals
                const totalsByPlatform = processTotals(fetchData);
                const fetchPreviousData = await Analytics.findAll({
                    where: {
                        user_uuid: userData.uuid,
                        ...(platform !== 'all' && platformPageId !== '0' && { platform, platform_page_Id: platformPageId }),
                        [Op.and]: [prevWeekCondition]
                    }
                });
                const totalsPrevByPlatform = processTotals(fetchPreviousData);

                const growthByPlatform = calculatePlatformGrowth(totalsByPlatform, totalsPrevByPlatform);
                const postGrowthByPlatform = {
                    publishedGrowth: calculateGrowthPercentage(publishedPost, prevPublishedPost),
                    draftGrowth: calculateGrowthPercentage(draftCount, prevDraftCount),
                    scheduledGrowth: calculateGrowthPercentage(scheduledCount, prevScheduledCount)
                };

                return resp.status(200).json({
                    fetchData,
                    totals: totalsByPlatform,
                    previousTotals: totalsPrevByPlatform,
                    growth: growthByPlatform,
                    publishedPostList,
                    latestDraftPost,
                    latestScheduledPost,
                    totalCount: publishedPost + draftCount + scheduledCount,
                    publishedPost,
                    draftCount,
                    scheduledCount,
                    postGrowthByPlatform,
                    prevPublishedPostList,
                    message: 'Analytics fetched successfully.'
                });

            } catch (err) {
                console.error('Error fetching analytics:', err);
                return resp.status(500).json({
                    message: 'Failed to fetch analytics data',
                    error: err.message
                });
            }
        });

    } catch (err) {
        console.error('Error:', err);
        return resp.status(500).json({
            message: err.message,
            errorDetails: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});


// Helper function to calculate growth percentage

function calculateGrowthPercentage(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return parseFloat(((current - previous) / previous * 100).toFixed(2));
}

function processTotals(data) {
    return data.reduce((acc, item) => {
        const key = item.platform || 'unknown';
        if (!acc[key]) {
            acc[key] = {
                total_page_followers: 0,
                total_page_impressions: 0,
                total_page_impressions_unique: 0,
                total_page_views: 0,
                total_page_post_engagements: 0,
                page_actions_post_reactions_like_total: 0
            };
        }
        switch (item.analytic_type) {
            case 'page_daily_follows':
                acc[key].total_page_followers += item.total_page_followers || 0;
                break;
            case 'page_impressions':
                acc[key].total_page_impressions += item.total_page_impressions || 0;
                break;
            case 'page_impressions_unique':
                acc[key].total_page_impressions_unique += item.total_page_impressions_unique || 0;
                break;
            case 'page_views_total':
                acc[key].total_page_views += item.total_page_views || 0;
                break;
            case 'page_post_engagements':
                acc[key].total_page_post_engagements += item.page_post_engagements || 0;
                break;
            case 'page_actions_post_reactions_like_total':
                acc[key].page_actions_post_reactions_like_total += item.page_actions_post_reactions_like_total || 0;
                break;
        }
        return acc;
    }, {});
}

function calculatePlatformGrowth(current, previous) {
    return Object.keys(current).reduce((acc, key) => {
        const cur = current[key];
        const prev = previous[key] || {};
        acc[key] = {
            total_page_followers: calculateGrowthPercentage(cur.total_page_followers, prev.total_page_followers || 0),
            total_page_impressions: calculateGrowthPercentage(cur.total_page_impressions, prev.total_page_impressions || 0),
            total_page_impressions_unique: calculateGrowthPercentage(cur.total_page_impressions_unique, prev.total_page_impressions_unique || 0),
            total_page_views: calculateGrowthPercentage(cur.total_page_views, prev.total_page_views || 0),
            total_page_post_engagements: calculateGrowthPercentage(cur.total_page_post_engagements, prev.total_page_post_engagements || 0),
            page_actions_post_reactions_like_total: calculateGrowthPercentage(cur.page_actions_post_reactions_like_total, prev.page_actions_post_reactions_like_total || 0)
        };
        return acc;
    }, {});
}

// Helper function to get previous week's start and end dates
function getPreviousWeekDates(currentWeekStart,dateGap) {
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - (dateGap + 1));
    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekStart.getDate() + dateGap);
    return { prevWeekStart, prevWeekEnd };
}


/* LinkedIn Functions Starts here */

// Auth functions starts with profile view and page selection
app.post(`/${prefix}/auth/linkedin`, async (req, res) => {
    const data = req.body;
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(Object.keys(data).length !== 0){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                const { token: encryptedToken, iv } = req.body;
                const encToken = decryptToken(encryptedToken, iv);
                try {
                    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                        params: {
                            grant_type: 'authorization_code',
                            code: encToken,
                            redirect_uri: data.REDIRECT_URI,
                            client_id: process.env.LINKEDIN_CLIENT_ID,
                            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                        },
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });
                    // console.log("Token Response: ",tokenRes.data.access_token);
                    const payload = encryptToken(tokenRes.data.access_token);
                    res.json({ token: payload });
                } catch (err) {
                    console.error(err.response?.data || err.message);
                    res.status(500).json({ error: 'Token exchange failed' });
                }
            }
        });
    }else{
        return res.status(401).json({ message: "No Data given to update." });
    }
});
app.post(`/${prefix}/auth/linkedin/profile`, async (req, res) => {
    const encToken = decryptToken( req.body.token.token, req.body.token.iv );
    // console.log("MyToken:", encToken);
    const data = req.body;
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(Object.keys(data).length !== 0){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                try {
                    // console.log("started with profile fetch link.".green);
                    const profileRes = await axios.get(
                        'https://api.linkedin.com/v2/userinfo', {
                        headers: {
                            'Authorization': 'Bearer ' + encToken,
                        },
                    });
                    // console.log("Profile Data: ",profileRes.data);
                    res.json({ profile: profileRes.data });
                } catch (err) {
                    console.error(err.response?.data || err.message);
                    res.status(500).json({ error: 'Profile Data fetch error.', err_data : err });
                }
            }
        });
    }else{
        return res.status(401).json({ message: "LinkedIn Token not found." });
    }
});
app.post(`/${prefix}/auth/linkedin/pages`, async (req, res) => {
    const data = req.body;
    const encToken = decryptToken(req.body.token.token,req.body.token.iv);
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(Object.keys(data).length !== 0){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                try {
                    const organizationRes = await axios.get(
                        'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED', {
                        headers: {
                            'Authorization': 'Bearer ' + encToken,
                        },
                    });
                    // console.log("Organization Data: ",organizationRes.data);
                    const orgIds = organizationRes.data.elements
                        .map(element => {
                            if (
                                element &&
                                typeof element.organization === 'string' &&
                                element.organization.includes('organization:')
                            ) {
                                const parts = element.organization.split(':');
                                return parts[parts.length - 1]; // return only the org ID
                            } else {
                                console.warn('Skipped element due to missing or malformed organization:', element);
                                return null;
                            }
                        })
                        .filter(Boolean); // Remove nulls
                    // console.log("Extracted Org IDs:", orgIds);
                    let organizationDetails = [];
                    for (const orgId of orgIds) {
                        try {
                            const orgProfileRes = await axios.get(
                                `https://api.linkedin.com/v2/organizations/${orgId}?projection=(
                                    $URN,id,localizedName,organizationType,logoV2(original~:playableStreams),industries,vanityName,websiteUrl,description,memberCountRange)`,
                                {
                                    headers: {
                                        'Authorization': 'Bearer ' + encToken,
                                    },
                                }
                            );
                            // organizationDetails.push(orgProfileRes.data);
                            const orgData = orgProfileRes.data;
                            // Fetch industry names
                            const industryNames = [];
                            if (orgData.industries && Array.isArray(orgData.industries)) {
                                for (const industryUrn of orgData.industries) {
                                    const industryId = industryUrn.split(':').pop();
                                    try {
                                        const industryRes = await axios.get(`https://api.linkedin.com/v2/industries/${industryId}`, {
                                            headers: {
                                            'Authorization': 'Bearer ' + encToken,
                                            },
                                        });
                                        const name = industryRes.data.name?.localized?.['en_US'] || 'Unknown';
                                        industryNames.push(name);
                                    } catch (err) {
                                        console.warn(`Industry fetch failed for ${industryId}:`, err.response?.data || err.message);
                                        industryNames.push('Unknown');
                                    }
                                }
                            }
                            orgData.industryNames = industryNames;
                            organizationDetails.push(orgData);
                        } catch (err) {
                            console.warn(`Failed to fetch organization ${orgId}:`, err.response?.data || err.message);
                        }
                    }
                    // console.log("All Organization Profiles:", organizationDetails);
                    res.json({ organizations: organizationDetails });
                } catch (err) {
                    console.error(err.response?.data || err.message);
                    res.status(500).json({ error: 'Organization Data fetch error.', err_data : err });
                }
            }
        });
    }else{
        return res.status(401).json({ message: "LinkedIn Token not found." });
    }
});
// Auth functions ends here

app.post(`/${prefix}/linkedin/save-social-account`, async (req, res) => {
    const linkedinToken = req.body.accessToken;
    const token = req.token;
    // console.log("Incoming Profile Token: ",linkedinToken);
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(linkedinToken || typeof linkedinToken == 'object'){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
                const encToken = decryptToken(linkedinToken.token,linkedinToken.iv);
                // Check if the social ID is used by another user
                const existingSocialId = await SocialUser.findOne({
                    where: {
                        social_id: req.body.data.sub,
                        user_id: { [Op.ne]: userData.uuid }
                    }
                });
                if (existingSocialId) {
                    return res.status(400).json({
                        message: "This account is already linked to our platform.",
                        createAccount: false
                    });
                }
                // Check if the current user already has this social ID linked
                const existingUser = await SocialUser.findOne({
                    where: {
                        user_id: userData.uuid,
                        social_id: req.body.data.sub
                    }
                });
                const pictureData = req.body.data.picture;
                if (!existingUser) {
                    // Create new social profile
                    try {
                        const newSocialUser = await SocialUser.create({
                            user_id: userData.uuid,
                            name: req.body.data.name,
                            img_url: pictureData || '',
                            social_id: req.body.data.sub,
                            social_user_platform: req.body.social_user_platform,
                            user_token: encToken,
                            status: "Connected"
                        });

                        const user_uuid = newSocialUser.user_id; 
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

                        return res.status(200).json({
                            message: "Social Profile Data Saved Successfully.",
                            createAccount: true,
                            userInfo: { socialData: newSocialUser }
                        });
                    } catch (error) {
                        console.error('Error creating social user:', error);
                        return res.status(500).json({
                            createAccountError: false,
                            message: "Failed to save Social Profile."
                        });
                    }
                } else {
                    // Update existing social profile
                    try {
                        const updatedProfile = await existingUser.update({
                            img_url: pictureData,
                            user_token: encToken,
                            token_access_expiration_time: req.body.data_access_expiration_time,
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

                        return res.status(200).json({
                            message: "User token updated.",
                            createAccount: true,
                            userInfo: { socialData: updatedProfile }
                        });
                    } catch (error) {
                        console.error('Error updating social user:', error);
                        return res.status(500).json({
                            message: "Failed to update Social Profile." ,
                            createAccountError: false,
                        });
                    }
                }
            }
        });
    }else{
        return res.status(401).json({ message: "LinkedIn Token not found." });
    }
});

app.post(`/${prefix}/linkedin/save-pages`, async (req, res) => {
    const linkedinToken = req.body.token;
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(linkedinToken || typeof linkedinToken == 'object'){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                try {
                    const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
                    const encToken = decryptToken(linkedinToken.token,linkedinToken.iv);
                    const existingUser = await SocialUser.findOne({
                        where: { user_id: userData.uuid }
                    });
                    if (!existingUser) {
                        return res.status(404).json({ message: "User Social Profile Data Not Found." });
                    }
                    // Process pages data
                    let pagesData = Array.isArray(req.body.pagesData)
                        ? req.body.pagesData
                        : [req.body.pagesData];
                    if (!req.body.token) {
                        return res.status(400).json({ message: "Linkedin Page Token not found." });
                    }
                    // Update/Create pages
                    for (const page of pagesData) {
                        const organizationPageId = page.id;
                        const headers = {
                            'Authorization': `Bearer ${encToken}`,
                            'LinkedIn-Version': '202504'
                        };
                        const followersRes = await axios.get(
                            `https://api.linkedin.com/rest/networkSizes/urn:li:organization:${organizationPageId}?edgeType=COMPANY_FOLLOWED_BY_MEMBER`,
                            { headers }
                        );
                        const followers = followersRes.data.firstDegreeSize;
                        const pageData = {
                            user_uuid: userData.uuid,
                            social_userid: req.body.social_id,
                            pageName: page.localizedName,
                            page_picture: page.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier || null,
                            page_cover: page.cover?.source || null,
                            pageId: page.id,
                            category: page.industryNames?.[0] || null,
                            total_followers: followers || 0,
                            page_platform:req.body.page_platform,
                            status: "Connected",
                            token: encToken,
                            modify_to: JSON.stringify(page.tasks || []),
                        };
                        // Check for existing page using both pageId AND user_uuid
                        const existingPage = await SocialUserPage.findOne({
                            where: {
                                pageId: page.id,
                                user_uuid: userData.uuid
                            }
                        });
                        if (existingPage) {
                            await existingPage.update(pageData);
                        } else {
                            await SocialUserPage.create(pageData);
                        }
                    }
                    // Get updated data with nested structure
                    const social_user_data = await SocialUser.findAll({
                        where: {
                            user_id: userData.uuid,
                        }
                    });
                    const social_page_data = await SocialUserPage.findAll({
                        where: { user_uuid: userData.uuid }
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
                    return res.status(200).json({
                        message: "Connected & Saved Data Successfully.",
                        userInfo: {
                            userData: userData,
                            socialData: formattedSocialData
                        }
                    });
                } catch (error) {
                    console.error('Error in social_page_submit:', error);
                    return res.status(500).json({
                        message: "Server error during page submission",
                        error: error.message
                    });
                }
            }
        });
    }else{
        return res.status(401).json({ message: "LinkedIn Token not found." });
    }
});

app.post(`/${prefix}/linkedin/fetch-page-analytics`, async (req, res) => {
    const linkedinToken = req.body.token;
    const token = req.token;

    if (!token) {
        return res.status(401).json({ message: "No user token provided." });
    }

    if (!linkedinToken || typeof linkedinToken !== 'object' || !linkedinToken.token || !linkedinToken.iv) {
        return res.status(401).json({ message: "LinkedIn token is invalid or missing." });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('❌ JWT verification failed:', err);
            return res.status(401).json({ message: "Token not valid." });
        }

        try {
            const encToken = decryptToken(linkedinToken.token, linkedinToken.iv);
            const organizationPageIds = req.body.pagesData || [];

            const loggedUser_uuid = authData.userData.uuid;
            const socailUserData = await SocialUser.findOne({ 
                where: { user_token: encToken } 
            });            

            const todayDate = new Date().toISOString().slice(0, 10);
            const activityRecord = await Activity.findAll({
                where: {
                    user_uuid: loggedUser_uuid,
                    account_social_userid: socailUserData.social_id,
                    activity_type: "social",
                    activity_subType: "account",
                    action: "disconnect",            
                },
                order: [['id', 'DESC']], // get the latest one
                raw: true,
            });

            let matchedPages = [];
            let activityPrevDate = null;

            if (activityRecord && activityRecord.length > 0) {
                //console.log('activityRecord'.green, activityRecord);
                const lastRow = activityRecord[0];
                //console.log('lastRow'.red, lastRow);
                //console.log('lastRow.activity_dateTime'.red,lastRow.activity_dateTime);
               const activityDate = new Date(lastRow.activity_dateTime).toISOString().slice(0, 10); // 'YYYY-MM-DD' 
                let disconnectedPages = [];
                try {
                    const refData = JSON.parse(lastRow.reference_pageID || "{}");
                    disconnectedPages = refData?.activity_subType_id?.pages || [];
                } catch (err) {
                    console.error("Invalid JSON in reference_pageID:", err);
                }
                disconnectedPages = disconnectedPages.map(id => String(id));
                //console.log('activityDate'.green, activityDate);
                // ✅ One day back from activityDate
                const activityPrevDateObj = new Date(activityDate);
                activityPrevDateObj.setDate(activityPrevDateObj.getDate() - 1);
                activityPrevDate = activityPrevDateObj.toISOString().slice(0, 10);
                matchedPages = organizationPageIds.filter(page => disconnectedPages.includes(String(page.id)));
                //console.log('activityPrevDateObj'.green, activityPrevDateObj);
            }
            const orgIds = organizationPageIds.map(page => page.id);
            if (!orgIds.length) {
                return res.status(400).json({ message: "No LinkedIn organization IDs provided." });
            }
           
            //console.log('activityPrevDate'.green, activityPrevDate);
            //console.log("✅ Org IDs:", orgIds);
            const headers = {
                'Authorization': `Bearer ${encToken}`,
                'LinkedIn-Version': '202504',
                'X-Restli-Protocol-Version': '2.0.0',
            };

            // const today = new Date();
            // today.setHours(0, 0, 0, 0);
            // const endDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
            // const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            // const timeIntervals = `(timeRange:(start:${startDate.getTime()},end:${endDate.getTime()}),timeGranularityType:DAY)`;

            const analyticsData = await Promise.all(
                orgIds.map(async (orgId) => {
                    const isMatched = matchedPages.some(page => String(page.id) === String(orgId));
                    const endDate = new Date(todayDate);
                    let startDate;
                    // console.log("isMatched".yellow,isMatched);
                    // console.log("matchedPages".yellow,matchedPages);
                    if (isMatched && activityPrevDate) {
                        const diffDays = Math.ceil((endDate - new Date(activityPrevDate)) / (1000 * 60 * 60 * 24));
                        //console.log("Difference Date",diffDays);
                        startDate = new Date(endDate.getTime() - diffDays * 24 * 60 * 60 * 1000);
                    } else {
                        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
                        console.log("else part for 90 days.");
                    }
                    //console.log("startDate".red ,startDate);
                    //console.log("endDateDate".red ,endDate);                   
                    const timeIntervals = `(timeRange:(start:${startDate.getTime()},end:${endDate.getTime()}),timeGranularityType:DAY)`;
                    const organizationURN = encodeURIComponent(`urn:li:organization:${orgId}`);

                    try {
                        const [ followersRes, pageViewRes, shareStatsRes ] = await Promise.all([
                            axios.get(`https://api.linkedin.com/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${organizationURN}&timeIntervals=${timeIntervals}`, { headers }),
                            axios.get(`https://api.linkedin.com/rest/organizationPageStatistics?q=organization&organization=${organizationURN}&timeIntervals=${timeIntervals}`, { headers }),
                            axios.get(`https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${organizationURN}&timeIntervals=${timeIntervals}`, { headers }),
                        ]);

                        return {
                            orgId,
                            isReconnected: isMatched,
                            fetchedDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
                            followerUpdates: {
                                data: followersRes.data?.elements || []
                            },
                            pageViewUpdates: {
                                data: pageViewRes.data?.elements || []
                            },
                            shareStatisticsUpdates: {
                                data: shareStatsRes.data?.elements || []
                            }
                        };
                    } catch (innerErr) {
                        console.error(`❌ Failed to fetch analytics for orgId ${orgId}:`, innerErr.response?.data || innerErr.message);
                        return {
                            orgId,
                            error: true,
                            message: innerErr.response?.data || innerErr.message
                        };
                    }
                })
            );

            return res.status(200).json({ analytics: analyticsData });

        } catch (err) {
            console.error('❌ Error decrypting token or processing request:', err.message);
            return res.status(500).json({ error: 'Internal server error during organization data processing.' });
        }
    });
});

app.post(`/${prefix}/linkedin/create_analytics`, upload, async (req, resp) => {
    try {
        const token = req.token;
        if (!token) return resp.status(401).json({ message: "No token provided." });
        jwt.verify(token, secretKey, async (err, authData) => {
            if (err) return resp.status(401).json({ message: "Token not valid." });
            try {
                const { otp, otpGeneratedAt, password, ...userData } = authData.userData;
                const analyticType = req.body.analyticType;
                let allRecords = [];

                // Process each analytic type
                if (analyticType === "page_daily_follows") {
                    const analyticsData = req.body.analyticsData;
                    analyticsData.forEach((analyticItem) => {
                        let values = [];
                        values.push(analyticItem.followerGains);
                        
                        // const records = values.filter(v => v.organicFollowerGain > 0).map(v => ({
                        const records = values.filter(v => v.organicFollowerGain).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.orgId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_followers: v.organicFollowerGain,
                            week_date: new Date(analyticItem.timeRange.end).toISOString()
                        }));
                        allRecords.push(...records);
                        
                    });
                } else if (analyticType === "page_impressions") {
                    const analyticsData = req.body.analyticsData;
                    analyticsData.forEach((analyticItem) => {
                        let values = [];
                        values.push(analyticItem.totalShareStatistics);

                        const records = values.filter(v => v.impressionCount > 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.orgId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_impressions: v.impressionCount,
                            week_date: new Date(analyticItem.timeRange.end).toISOString()
                        }));
                        allRecords.push(...records);
                    });
                } else if (analyticType === "page_impressions_unique") {
                    const analyticsData = req.body.analyticsData;
                    analyticsData.forEach((analyticItem) => {
                        let values = [];
                        values.push(analyticItem.totalShareStatistics);

                        const records = values.filter(v => v.uniqueImpressionsCount > 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.orgId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_impressions_unique: v.uniqueImpressionsCount,
                            week_date: new Date(analyticItem.timeRange.end).toISOString()
                        }));
                        allRecords.push(...records);

                    });
                } else if (analyticType === "page_views_total") {
                    const analyticsData = req.body.analyticsData;
                    analyticsData.forEach((analyticItem) => {
                        let values = [];
                        values.push(analyticItem.pageStats);

                        const records = values.filter(v => v.pageViews > 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.orgId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            total_page_views: v.pageViews,
                            week_date: new Date(analyticItem.timeRange.end).toISOString()
                        }));
                        allRecords.push(...records);

                    });
                } else if (analyticType === "page_post_engagements") {
                    const analyticsData = req.body.analyticsData;
                    analyticsData.forEach((analyticItem) => {
                        let values = [];
                        values.push(analyticItem.totalShareStatistics);

                        const records = values.filter(v => v.engagement > 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.orgId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            page_post_engagements: v.engagement,
                            week_date: new Date(analyticItem.timeRange.end).toISOString()
                        }));
                        allRecords.push(...records);

                    });
                } else if (analyticType === "page_actions_post_reactions_like_total") {
                    const analyticsData = req.body.analyticsData;
                    analyticsData.forEach((analyticItem) => {
                        let values = [];
                        values.push(analyticItem.totalShareStatistics);

                        const records = values.filter(v => v.likeCount > 0).map(v => ({
                            user_uuid: userData.uuid,
                            platform_page_Id: req.body.orgId,
                            platform: req.body.platform,
                            analytic_type: analyticType,
                            page_actions_post_reactions_like_total: v.likeCount,
                            week_date: new Date(analyticItem.timeRange.end).toISOString()
                        }));
                        allRecords.push(...records);

                    });
                } else {
                    console.warn(`Skipping unknown analytic type: ${analyticType}`);
                }


                // Check existing records using BOTH analytic_type and week_date
                const existingEntries = await Analytics.findAll({
                    where: {
                        user_uuid: userData.uuid,
                        platform_page_Id: req.body.orgId,
                        [Op.or]: allRecords.map(record => ({
                            platform_page_Id: req.body.orgId,
                            analytic_type: record.analytic_type,
                            week_date: record.week_date
                        }))
                    },
                    attributes: ['platform_page_Id','analytic_type', 'week_date'],
                    raw: true,
                });
                // Create unique composite keys
                const existingKeySet = new Set(
                    existingEntries.map(entry => `${entry.analytic_type}_${entry.week_date}`)
                );
                // Filter out existing combinations
                const newRecords = allRecords.filter(record =>
                    !existingKeySet.has(`${record.analytic_type}_${record.week_date}`)
                );
                if (newRecords.length > 0) {
                    await Analytics.bulkCreate(newRecords);
                    return resp.status(200).json({ message: 'Analytics saved successfully.' });
                }
                return resp.status(200).json({ message: 'No new analytics to save.' });
            } catch (err) {
                console.error('Error processing analytics:', err);
                resp.status(500).json({
                    message: 'Failed to save analytics data',
                    error: err.message
                });
            }
        });
    } catch (err) {
        console.error('Error:', err);
        resp.status(500).json({
            message: err.message,
            errorDetails: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

app.post(`/${prefix}/linkedin/save-posts`, async (req, res) => {
    const accessToken = req.body.token;
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(accessToken || typeof accessToken == 'object'){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                const encToken = decryptToken(accessToken.token,accessToken.iv);              

                try {
                    // const organizationPageId = req.body.pageId;
                    const organizationPageIds = req.body.pagesData;
                    const user_uuid = authData.userData;
                    
                    const socailUserData = await SocialUser.findOne({ 
                        where: { user_token: encToken } 
                    });

                    const todayDate = new Date().toISOString().slice(0, 10);
                    const activityRecord = await Activity.findAll({
                        where: {
                            user_uuid: user_uuid.uuid,
                            account_social_userid: socailUserData.social_id,
                            activity_type: "social",
                            activity_subType: "account",
                            action: "disconnect",            
                        },
                        order: [['id', 'DESC']], // get the latest one
                        raw: true,
                    });

                    let matchedPages = [];
                    let activityPrevDate = null;

                    if(activityRecord && activityRecord.length > 0) {
                        const lastRow = activityRecord[0];
                        const activityDate = new Date(lastRow.activity_dateTime).toISOString().slice(0, 10); // 'YYYY-MM-DD'
                        let disconnectedPages = [];
                        try {
                            const refData = JSON.parse(lastRow.reference_pageID || "{}");
                            disconnectedPages = refData?.activity_subType_id?.pages || [];
                        } catch (err) {
                            console.error("Invalid JSON in reference_pageID:", err);
                        }
                        disconnectedPages = disconnectedPages.map(id => String(id));
                        // ✅ One day back from activityDate
                        const activityPrevDateObj = new Date(activityDate);
                        activityPrevDateObj.setDate(activityPrevDateObj.getDate() - 1);
                        activityPrevDate = activityPrevDateObj.toISOString().slice(0, 10);
                        matchedPages = organizationPageIds.filter(page => disconnectedPages.includes(String(page.id)));
                    }

                    let orgIds = [];
                    for(pageIds of organizationPageIds){
                        orgIds.push(pageIds.id);
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = new Date(today); // today as end
                    const startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                    // const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const startEpoch = startDate.getTime();
                    const endEpoch = endDate.getTime();
                    // // const weekStartEpoch = weekStart.getTime();
                    // const timeIntervals = `(timeRange:(start:${startEpoch},end:${endEpoch}),timeGranularityType:DAY)`;

                    const headers = {
                        Authorization: `Bearer ${encToken}`,
                        'LinkedIn-Version': '202504',
                        'X-Restli-Protocol-Version': '2.0.0',
                    };

                    let fullData = [];

                    const organizationDetails = await Promise.all(
                        orgIds.map(async (orgId) => {
                            const isMatched = matchedPages.some(page => String(page.id) === String(orgId));
                            const endDates = new Date(todayDate);
                            let startDates;

                            if (isMatched && activityPrevDate) {
                                const diffDays = Math.ceil((endDates - new Date(activityPrevDate)) / (1000 * 60 * 60 * 24));
                                //console.log("Difference Date",diffDays);
                                startDates = new Date(endDates.getTime() - diffDays * 24 * 60 * 60 * 1000);
                            } else {
                                startDates = new Date(endDates.getTime() - 90 * 24 * 60 * 60 * 1000);
                                console.log("else part for 90 days.");
                            }
                            
                            const timeIntervals = `(timeRange:(start:${startDates.getTime()},end:${endDates.getTime()}),timeGranularityType:DAY)`;

                            const SocialPage = await SocialUserPage.findOne({
                                attributes: ['social_userid'],
                                where: {
                                    user_uuid: user_uuid.uuid,
                                    pageId: orgId,
                                },
                                raw: true,
                            });

                            const sharesRes = await axios.get(
                                `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aorganization%3A${orgId})&count=100`,
                                { headers }
                            );
                            const shares = sharesRes.data.elements || [];

                            for (const post of shares) {
                                if (!post?.id) continue;
                                const createdEpoch = post?.created?.time || null;
                                if (createdEpoch >= startEpoch && createdEpoch <= endEpoch) {
                                    const postUrn = post.id;
                                    const type = postUrn.includes("ugcPost:") ? "ugcPosts" : "shares";
                                    const encodedUrn = encodeURIComponent(postUrn);
                                    const statsUrl = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${orgId}&${type}=List(${encodedUrn})&timeIntervals=${timeIntervals}`;
                                    try {
                                        const statsRes = await axios.get(statsUrl, { headers });
                                        const statsElement = statsRes.data.elements || [];
                                        // console.log("posts stats:",statsElement);
                                        const totalStats = statsElement.reduce((acc, el) => {
                                                            acc.likeCount += el.totalShareStatistics?.likeCount || 0;
                                                            acc.commentCount += el.totalShareStatistics?.commentCount || 0;
                                                            acc.shareCount += el.totalShareStatistics?.shareCount || 0;
                                                            acc.engagement += el.totalShareStatistics?.engagement || 0;
                                                            acc.impressionCount += el.totalShareStatistics?.impressionCount || 0;
                                                            acc.uniqueImpressionsCount += el.totalShareStatistics?.uniqueImpressionsCount || 0;
                                                            return acc;
                                                        }, { likeCount: 0, commentCount: 0, shareCount: 0, engagement: 0, impressionCount: 0, uniqueImpressionsCount: 0 });
                                        const postContent = post?.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || null;
                                        const postMedia = post?.specificContent?.['com.linkedin.ugc.ShareContent']?.media?.[0]?.thumbnails?.[0]?.url || null;
                                        const weekDate = new Date(createdEpoch).toISOString().split("T")[0];
                                        const formId = crypto.randomUUID();
                                        // console.log("stats data: ",totalStats);
                                        // console.log("post content: ",postContent);

                                        const record = {
                                            user_uuid: user_uuid.uuid,
                                            social_user_id: SocialPage.social_userid,
                                            page_id: orgId,
                                            content: postContent || '',
                                            schedule_time: null,
                                            post_media: postMedia || null,
                                            platform_post_id: post.id,
                                            post_platform: "linkedin",
                                            source: "API",
                                            form_id: formId,
                                            likes: totalStats.likeCount || 0,
                                            comments: totalStats.commentCount || 0,
                                            shares: totalStats.shareCount || 0,
                                            engagements: totalStats.engagement || 0,
                                            impressions: totalStats.impressionCount || 0,   
                                            unique_impressions: totalStats.uniqueImpressionsCount || 0,
                                            week_date: weekDate,
                                            status: "1"
                                        };

                                        fullData.push(record);
                                    } catch (error) {
                                        console.error(`Failed to fetch stats for ${postUrn}`, error.response?.data || error.message);
                                    }
                                }
                            }

                        })
                    );

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

                    if(organizationDetails){
                        return res.status(200).json({
                            message: "LinkedIn Weekly posts empty.",
                            status: "success",
                        });
                    }else{
                        return res.status(200).json({
                            message: "LinkedIn Weekly posts empty.",
                            status: "error",
                        });
                    }
                    
                } catch (err) {
                    console.error(err.response?.data || err.message);
                    return res.status(500).json({ error: "LinkedIn Weekly Posts fetch error." });
                }
            }
        });
    }else{
        return res.status(401).json({ message: "LinkedIn Token not found." });
    }
});

app.post(`/${prefix}/linkedin/save-posts-comments`, async (req, res) => {
    const accessToken = req.body.token;
    const token = req.token;
    // Validate tokens
    if (!token) return res.status(401).json({ message: "No token provided." });
    if (!accessToken || typeof accessToken !== 'object') return res.status(401).json({ message: "LinkedIn Token not found." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        }
        const encToken = decryptToken(accessToken.token, accessToken.iv);
        try {
            const { userData } = authData;
            const organizationPageIds = req.body.pagesData || [];
            if (!Array.isArray(organizationPageIds) || organizationPageIds.length === 0) {
                return res.status(400).json({ message: "No LinkedIn pages provided." });
            }
            // Extract org IDs cleanly
            const orgIds = organizationPageIds.map(page => page.id);
            const headers = {
                'Authorization': `Bearer ${encToken}`,
                'LinkedIn-Version': '202505',
                'X-Restli-Protocol-Version': '2.0.0',
            };
            // Helper function: format LinkedIn timestamp
            const formatLinkedInDate = (timestamp) => {
                const date = new Date(timestamp);
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T` +
                    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+0000`;
            };
            // Recursive fetch function for comments + replies
            async function fetchAndFlattenComments(postUrn, findPageInfo, postCommentData, parentUrn = null) {
                const endpoint = parentUrn
                    ? `https://api.linkedin.com/v2/socialActions/${parentUrn}/comments`
                    : `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;
                try {
                    const response = await axios.get(endpoint, { headers });
                    const comments = response.data.elements || [];
                    for (const comment of comments) {
                        const flattened = {
                            user_uuid: findPageInfo.user_uuid || userData.uuid,
                            social_userid: findPageInfo.social_userid,
                            platform_page_Id: findPageInfo.pageId,
                            platform: findPageInfo.page_platform,
                            activity_id: comment.object,
                            comment_id: comment.id,
                            post_id: postUrn,
                            comment: comment.message?.text || '',
                            comment_created_time: comment.created?.time ? formatLinkedInDate(comment.created.time) : null,
                            parent_comment_id: parentUrn || null,
                            from_id: comment.actor || null,
                            from_name: comment.created?.impersonator ? 'Page Admin' : 'LinkedIn User',
                            comment_type: parentUrn ? 'reply' : 'top_level',
                            reaction_like: comment.likesSummary?.totalLikes || 0
                        };
                        postCommentData.push(flattened);
                        // Fetch replies recursively if exists
                        if (comment.commentsSummary?.totalFirstLevelComments > 0) {
                            const activityId = comment.object.split(':').pop();
                            const commentUrn = `urn%3Ali%3Acomment%3A%28urn%3Ali%3Aactivity%3A${activityId}%2C${comment.id}%29`;
                            await fetchAndFlattenComments(postUrn, findPageInfo, postCommentData, commentUrn);
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching comments for ${parentUrn || postUrn}:`, error.response?.data || error.message);
                }
            }
            // Process each organization in sequence to avoid rate-limit issues
            for (const orgId of orgIds) {
                const findPageInfo = await SocialUserPage.findOne({ where: { user_uuid: userData.uuid, pageId: orgId } });
                if (!findPageInfo) {
                    console.warn(`No page info found for orgId: ${orgId}`);
                    continue;
                }
                const posts = await UserPost.findAll({
                    attributes: ['platform_post_id'],
                    where: { user_uuid: userData.uuid, page_id: orgId, status: '1' },
                    order: [['createdAt', 'DESC']],
                    raw: true,
                });
                const platformPostIds = posts.map(post => post.platform_post_id);
                if (platformPostIds.length === 0) {
                    console.info(`No published posts found for page: ${orgId}`);
                    continue;
                }
                const postCommentData = [];
                // Fetch comments for each post
                for (const postUrn of platformPostIds) {
                    await fetchAndFlattenComments(postUrn, findPageInfo, postCommentData);
                }
                // Save or update comments
                for (const comment of postCommentData) {
                    await PostComments.findOrCreate({
                        where: { user_uuid: userData.uuid, comment_id: comment.comment_id },
                        defaults: comment,
                    });
                }
                //console.log(`:white_check_mark: Comments synced for LinkedIn page: ${orgId}`);
            }

            // N8N Bulk Comments Sentiment update function
                try {
                    const response = await axios.post(`${process.env.N8N_BULK_COMMENT_WEBHOOK_URL}`, {
                        user_id: userData.uuid
                    });
                    //console.log("N8N bulk comment sentiment updated response: ",response.data);
                } catch(err){
                    console.error('LinkedIn bulk comment sentiment update error:', err.response?.data || err.message);
                }
            // N8N function ends here

            return res.status(200).json({
                message: "LinkedIn comments fetched and saved successfully.",
                status: "success"
            });
        } catch (err) {
            console.error('LinkedIn comment fetch error:', err.response?.data || err.message);
            return res.status(500).json({ error: 'Internal server error while fetching LinkedIn comments.' });
        }
    });
});

// linkedin detail page functions start here
app.post(`/${prefix}/linkedin/fetch-detail-analytics`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async(err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            try {
                const pageId = req.body.pageId;
                
                try {
                    const organizationDetails = await Analytics.findAll({
                        where: {
                            platform_page_Id : pageId,
                            platform: "linkedin"
                        }
                    });
                    // console.log("Analytics Data:", organizationDetails);
                    return res.status(200).json({ analytics: organizationDetails });

                } catch (error) {
                    console.error("Error fetching analytics data:", error.response?.data || error.message);
                    return res.status(500).json({
                        error: "Failed to fetch LinkedIn analytics",
                        details: error.response?.data || error.message
                    });
                }

            } catch (err) {
                console.error(err.response?.data || err.message);
                res.status(500).json({ error: 'Organization Data fetch error.' });
            }
        }
    });
});
app.post(`/${prefix}/linkedin/top_posts`, async (req, res) => {
    const linkedinToken = req.body.accessToken;
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    if(linkedinToken != null){
        jwt.verify(token, secretKey, async(err, authData) => {
            if (err) {
                console.error('Error verifying token:', err);
                return res.status(401).json({ message: "Token not valid." });
            } else {
                // console.log("Linkedin pageId: ",req.body.pageId);
                // console.log("Access token: ",req.body.accessToken);

                try {
                    const organizationPageId = req.body.pageId;

                    const headers = {
                        'Authorization': `Bearer ${linkedinToken}`,
                        'LinkedIn-Version': '202504',
                        'X-Restli-Protocol-Version': '2.0.0',
                    };

                    const sharesRes = await axios.get(
                        `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aorganization%3A${organizationPageId})&count=10`,
                        { headers }
                    );

                    const shares = sharesRes.data.elements;

                    if (!shares || shares.length === 0) {
                        return res.status(404).json({ message: "No posts found for this LinkedIn Page." });
                    }

                    for (const post of shares) {
                        if (!post?.id) continue;

                        const postUrn = post.id;
                        const type = postUrn.includes('ugcPost:') ? 'ugcPosts' : 'shares';
                        const postId = postUrn.split(':').pop();

                        const encodedUrn = encodeURIComponent(postUrn);

                        try {
                            const statsUrl = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${organizationPageId}&${type}=List(${encodedUrn})`;

                            const statsRes = await axios.get(statsUrl, { headers });
                            const stats = statsRes.data.elements?.[0]?.totalShareStatistics;

                            // Attach stats directly to the post object
                            post.postStat = stats || {};

                        } catch (error) {
                            console.error(`Failed to fetch stats for ${postUrn}`, error.response?.data || error.message);
                            post.postStat = null; // Optionally mark as failed
                        }
                    }

                    // Filter and sort the posts with valid stats
                    const topPosts = shares
                        .filter(post => post.postStat?.impressionCount)
                        .sort((a, b) => (b.postStat.impressionCount || 0) - (a.postStat.impressionCount || 0))
                        .slice(0, 5);

                    return res.status(200).json({
                        message: "LinkedIn posts with statistics fetched successfully.",
                        data: topPosts,
                        status: "fulfilled"
                    });

                } catch (err) {
                    console.error(err.response?.data || err.message);
                    res.status(500).json({ error: 'LinkedIn Top Posts fetch error.' });
                }
            }
        });
    }else{
        return res.status(401).json({ message: "LinkedIn Token not found." });
    }
});
app.post(`/${prefix}/linkedin/demographics`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async(err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            try {
                const metricTypes = ['geo', 'industry'];
                const promises = metricTypes.map((type) => {
                    return Demographics.findAll({
                        where: {
                            user_uuid: authData.userData.uuid,
                            platform_page_Id: req.body.organizationId,
                            platform: "linkedin",
                            social_userid: req.body.social_userid || null,
                            metric_type: type
                        },
                        attributes: ['metric_key', 'metric_value'],
                        order: [['metric_value', 'DESC']],
                        limit: 10
                    });
                });

                Promise.all(promises)
                    .then((results) => {
                        const data = {};
                        metricTypes.forEach((type, index) => {
                            data[type] = results[index];
                        });

                        res.status(200).json({ data, status: "fulfilled" });
                    }).catch((error) => {
                        console.error('Database Error:', error);
                        res.status(500).json({ error: 'Failed to fetch LinkedIn demographic data.' });
                    });

            } catch (error) {
                console.error('LinkedIn Demographics Error:', error.response?.data || error.message);
                res.status(500).json({ error: 'Failed to fetch LinkedIn demographic data.' });
            }
        }
    });
});

// save demographics functions starts here
const getIdFromUrn = (urn) => urn?.split(':').pop();
async function fetchIndustryLabel(id, accessToken, locale = 'en_US') {
    const url = `https://api.linkedin.com/v2/industryTaxonomyVersions/V2_7/industries/${id}`;
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202504',
        'X-Restli-Protocol-Version': '2.0.0'
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data?.name?.localized?.[locale] || `Industry ${id}`;
    } catch (err) {
        console.warn(`⚠️ Failed to fetch industry name for ID ${id}:`, err.response?.data || err.message);
        return `Industry ${id}`;
    }
}
async function fetchGeoLabel(id, accessToken, locale = 'en_US') {
    const url = `https://api.linkedin.com/v2/geo/${id}`;
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202504',
        'X-Restli-Protocol-Version': '2.0.0'
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data?.defaultLocalizedName?.value || `Country ${id}`;
    } catch (err) {
        console.warn(`⚠️ Failed to fetch country name for ID ${id}:`, err.response?.data || err.message);
        return `Country ${id}`;
    }
}
app.post(`/${prefix}/linkedin/save-demographics`, async (req, res) => {
    const accessToken = req.body.token;
    const token = req.token;

    if (!token) return res.status(401).json({ message: "No user token provided." });
    if (!accessToken) return res.status(401).json({ message: "LinkedIn access token missing." });

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('❌ JWT verification failed:', err);
            return res.status(401).json({ message: "Token not valid." });
        }

        const encToken = decryptToken(accessToken.token, accessToken.iv);
        const pagesData = req.body.pagesData || [];

        if (!Array.isArray(pagesData) || pagesData.length === 0) {
            return res.status(400).json({ message: "No pages provided." });
        }

        const user_uuid = authData.userData.uuid;
        // const allResponseData = [];

        for (const page of pagesData) {
            const orgId = page.id;
            const pageName = page.localizedName;
            const social_userid = req.body.social_userid || null;

            const encodedURN = encodeURIComponent(`urn:li:organization:${orgId}`);
            const url = `https://api.linkedin.com/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodedURN}`;
            const headers = {
                Authorization: `Bearer ${encToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202504'
            };

            try {
                const response = await axios.get(url, { headers });
                const data = response.data?.elements?.[0];

                if (!data) {
                    console.warn(`No data for page: ${orgId}`);
                    continue;
                }

                const entriesToInsert = [];

                // INDUSTRY
                if (Array.isArray(data.followerCountsByIndustry)) {
                    for (const entry of data.followerCountsByIndustry) {
                        const industryId = getIdFromUrn(entry.industry);
                        const industryLabel = await fetchIndustryLabel(industryId, encToken);

                        entriesToInsert.push({
                            user_uuid,
                            platform_page_Id: orgId,
                            page_name: pageName,
                            social_userid,
                            platform: 'linkedin',
                            metric_type: 'industry',
                            metric_key: industryLabel,
                            metric_value: entry.followerCounts?.organicFollowerCount || 0,
                            source: 'API'
                        });
                    }
                }

                // GEO
                if (Array.isArray(data.followerCountsByGeoCountry)) {
                    for (const countryCode of data.followerCountsByGeoCountry) {
                        const geoId = getIdFromUrn(countryCode.geo);
                        const geoCountryLabel = await fetchGeoLabel(geoId, encToken);

                        entriesToInsert.push({
                            user_uuid,
                            platform_page_Id: orgId,
                            page_name: pageName,
                            social_userid,
                            platform: 'linkedin',
                            metric_type: 'geo',
                            metric_key: geoCountryLabel.toUpperCase(),
                            metric_value: countryCode.followerCounts?.organicFollowerCount || 0,
                            source: 'API'
                        });
                    }
                }

                // Remove previous records for this page
                await Demographics.destroy({
                    where: {
                        user_uuid,
                        platform_page_Id: orgId,
                        platform: 'linkedin',
                        social_userid
                    }
                });

                // Insert new records
                if (entriesToInsert.length) {
                    await Demographics.bulkCreate(entriesToInsert);
                }

                // Fetch top metrics after saving
                // const metricTypes = ['industry', 'geo'];
                // const fetchPromises = metricTypes.map(type =>
                //     Demographics.findAll({
                //         where: {
                //             user_uuid,
                //             platform_page_Id: orgId,
                //             platform: 'linkedin',
                //             social_userid,
                //             metric_type: type
                //         },
                //         attributes: ['metric_key', 'metric_value'],
                //         order: [['metric_value', 'DESC']],
                //         limit: 10
                //     })
                // );

                // const results = await Promise.all(fetchPromises);
                // const pageData = {};
                // metricTypes.forEach((type, index) => {
                //     pageData[type] = results[index];
                // });

                // allResponseData.push({
                //     platform_page_Id: orgId,
                //     page_name: pageName,
                //     data: pageData
                // });

            } catch (error) {
                console.error(`❌ Error fetching data for page ${orgId}:`, error.response?.data || error.message);
                continue;
            }
        }

        return res.status(200).json({
            message: "Demographics processed for all pages.",
            // pages: allResponseData
        });
    });
});
// save demographics functions ends here

// linkedin detail page functions ends here

// linkedin post comments functions start
app.post(`/${prefix}/linkedin/get-post-comments`, async (req, res) => {
    const token = req.token;
    if (!token) return res.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        }
        try {
            const { userData } = authData;
            const orgId = req.body.pageID;
            const fetchPostIds = await UserPost.findAll({
                attributes: ['platform_post_id'],
                where: { user_uuid: userData.uuid, page_id: orgId, status: '1' },
                order: [['createdAt', 'DESC']],
                raw: true,
            });
            const platformPostIds = fetchPostIds.map(post => post.platform_post_id);
            if (!platformPostIds.length) {
                return res.status(200).json({ message: "No posts found for this LinkedIn Page.", postsData: {} });
            }
            // Return top 10 latest comments
            const latestComments = await PostComments.findAll({
                where: {
                    post_id: platformPostIds,
                },
                include: [
                    {
                    model: UserPost,
                        attributes: ['post_media', 'content', 'likes', 'week_date'],
                    },
                ],
                order: [['comment_created_time', 'DESC']],
                limit: 25,
            });
            return res.status(200).json({
                message: "Comments fetched successfully.",
                postsData: latestComments,
            });
        } catch (err) {
            console.error(err.response?.data || err.message);
            res.status(500).json({ error: 'LinkedIn comment fetch error.' });
        }
    });
});
app.post(`/${prefix}/linkedin/fetch-comments`, async (req, res) => {
    const accessToken = req.body.accessToken;
    const token = req.token;
    if (!token) return res.status(401).json({ message: "No token provided." });
    if (!accessToken) return res.status(401).json({ message: "LinkedIn Token not found." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        }
        try {
            const { userData } = authData;
            const orgId = req.body.pageID;
            const findPageInfo = await SocialUserPage.findOne({
                where: { pageId: orgId }
            });
            const fetchPostIds = await UserPost.findAll({
                attributes: ['platform_post_id'],
                where: { user_uuid: userData.uuid, page_id: orgId, status: '1' },
                order: [['createdAt', 'DESC']],
                raw: true,
            });
            const platformPostIds = fetchPostIds.map(post => post.platform_post_id);
            if (!platformPostIds.length) {
                return res.status(404).json({ message: "No posts found for this LinkedIn Page." });
            }
            const headers = {
                'Content-Type':'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202505',
                'X-Restli-Protocol-Version': '2.0.0',
            };
            const postCommentData = [];
            const formatLinkedInDate = (timestamp) => {
                const date = new Date(timestamp);
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T` +
                    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+0000`;
            };
            // Recursive function to fetch and flatten all comments and replies
            async function fetchAndFlattenComments(postUrn, parentUrn = null) {
                const endpoint = parentUrn
                    ? `https://api.linkedin.com/v2/socialActions/${parentUrn}/comments`
                    : `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;
                const res = await axios.get(endpoint, { headers });
                const comments = res.data.elements || [];
                for (const comment of comments) {
                    const flattened = {
                        user_uuid: userData.uuid,
                        social_userid: findPageInfo.social_userid,
                        platform_page_Id: findPageInfo.pageId,
                        platform: findPageInfo.page_platform,
                        activity_id: comment.object,
                        comment_id: comment.id,
                        post_id: postUrn,
                        comment: comment.message?.text || '',
                        comment_created_time: comment.created?.time ? formatLinkedInDate(comment.created.time) : null,
                        parent_comment_id: parentUrn || null,
                        from_id: comment.actor || null,
                        from_name: comment.created?.impersonator ? 'Page Admin' : 'Linkedin User',
                        comment_type: parentUrn ? 'reply' : 'top_level',
                        reaction_like: comment.likesSummary?.totalLikes || 0
                    };
                    postCommentData.push(flattened);
                    // Fetch replies if available using $URN
                    if (comment.commentsSummary) {
                        const activityId = comment.object.split(':').pop();
                        const commentUrn = `urn%3Ali%3Acomment%3A%28urn%3Ali%3Aactivity%3A${activityId}%2C${comment.id}%29`;
                        // console.log("Fetching replies for:", commentUrn);
                        await fetchAndFlattenComments(postUrn, commentUrn);
                    }
                }
            }
            // Iterate each post to collect all comments and replies
            for (const postUrn of platformPostIds) {
                try {
                    await fetchAndFlattenComments(postUrn);
                } catch (error) {
                    console.error(`Error fetching comments for post ${postUrn}:`, error.response?.data || error.message);
                }
            }
            // Save comments
            for (const comment of postCommentData) {
                await PostComments.findOrCreate({
                    where: { comment_id: comment.comment_id },
                    defaults: comment,
                });
            }
            // Return top 10 latest comments
            const latestComments = await PostComments.findAll({
                where: {
                    post_id: {
                            [Op.in]: platformPostIds, // :white_check_mark: match multiple IDs
                        },
                },
                include: [
                    {
                    model: UserPost,
                        attributes: ['post_media', 'content', 'likes', 'week_date'],
                    },
                ],
                order: [['comment_created_time', 'DESC']],
                limit: 25,
            });
            return res.status(200).json({
                message: "Comments fetched and saved successfully.",
                postsData: latestComments,
            });
        } catch (err) {
            console.error(err.response?.data || err.message);
            res.status(500).json({ error: 'LinkedIn comment fetch error.' });
        }
    });
});
app.post(`/${prefix}/linkedin/create-comment`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async(err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            const { userData } = authData;
            const page_id = req.body.pageID;
            const post_id = req.body.post_id;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token','social_userid','page_platform'],
                where: { pageId: page_id },
                raw:true
            });
            const accessToken = socialPageData.token;
            const organizationURN = `urn:li:organization:${page_id}`;
            const encodedPostURN = encodeURIComponent(post_id);
            const reply = req.body.comment;
            const formatLinkedInDate = (timestamp) => {
                const date = new Date(timestamp);
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T` +
                    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+0000`;
            };
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202505',
                'X-Restli-Protocol-Version': '2.0.0',
            };
            try{
                const commentRes = await axios.post(
                    `https://api.linkedin.com/v2/socialActions/${encodedPostURN}/comments`,
                    {
                        "actor": organizationURN,
                        "message": { "text": reply }
                    },
                    { headers }
                );
                const commentData = commentRes.data;
                const createComment = await PostComments.create({
                    user_uuid: userData.uuid,
                    social_userid: socialPageData.social_userid,
                    platform_page_Id: page_id,
                    platform: socialPageData.page_platform,
                    activity_id: commentData.object,
                    comment_id: commentData.id,
                    post_id: post_id,
                    comment: reply || '',
                    comment_created_time: commentData.created?.time ? formatLinkedInDate(commentData.created.time) : null,
                    parent_comment_id: null,
                    from_id: commentData.actor || null,
                    from_name: 'Page Admin',
                    comment_type: 'top_level',
                    reaction_like: 0
                });
                const commentDataFetch = await PostComments.findOne({
                    where: { id: createComment.id },
                    include: [
                        { model: UserPost,
                            attributes: ['post_media', 'content', 'likes', 'week_date'],
                        },
                    ]
                });
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: post_id
                    }
                });
                await userPost.increment('comments', { by: 1 });
                const user_UUID = userData.uuid;
                const account_social_userid = socialPageData.social_userid;
                const account_platform = 'facebook';
                const activity_type = "comment";
                const activity_subType = "posts";
                const action = "create";
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: commentData.id,
                    activity_subType_id: post_id,
                };
                const source_type = '';
                const now = new Date();
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                // console.log("CommentData: ",commentDataFetch);
                return res.status(200).json({ message: "Comment posted successfully.", reply:commentDataFetch });
            } catch (error) {
                console.error('LinkedIn comment posting Error:', error.response?.data || error.message);
                res.status(500).json({ error: 'Failed to comment on post.' });
            }
        }
    });
});
app.post(`/${prefix}/linkedin/comment-reply`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async(err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            const { userData } = authData;
            const page_id = req.body.page_id;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token','social_userid','page_platform'],
                where: { pageId: page_id },
                raw:true
            });
            const commentData = await PostComments.findOne({
                where:{ comment_id: req.body.commentId }
            });
            const accessToken = socialPageData.token;
            const organizationURN = `urn:li:organization:${page_id}`;
            const activityURN = commentData.activity_id;
            const activityId = activityURN.split("activity:")[1].split(",")[0];
            const commentUrn = `urn%3Ali%3Acomment%3A%28urn%3Ali%3Aactivity%3A${activityId}%2C${commentData.comment_id}%29`;
            const decodedCommentURN = decodeURIComponent(commentUrn);
            const reply = req.body.message;
            const formatLinkedInDate = (timestamp) => {
                const date = new Date(timestamp);
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T` +
                    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+0000`;
            };
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202505',
                'X-Restli-Protocol-Version': '2.0.0',
            };
            try{
                const registerRes = await axios.post(
                    `https://api.linkedin.com/v2/socialActions/${commentUrn}/comments`,
                    {
                        "actor": organizationURN,
                        "message": {
                            "text": reply
                        },
                        "object": commentData.post_id,
                        "parentComment": decodedCommentURN
                    },
                    { headers }
                );
                const replyData = registerRes.data;
                const createReply = await PostComments.create({
                    user_uuid: userData.uuid,
                    social_userid: socialPageData.social_userid,
                    platform_page_Id: page_id,
                    platform: socialPageData.page_platform,
                    activity_id: replyData.object,
                    comment_id: replyData.id,
                    post_id: commentData.post_id,
                    comment: reply || '',
                    comment_created_time: replyData.created?.time ? formatLinkedInDate(replyData.created.time) : null,
                    parent_comment_id: commentUrn || null,
                    from_id: replyData.actor || null,
                    from_name: 'Page Admin',
                    comment_type: 'reply',
                    reaction_like: 0
                });
                const replyDataFetch = await PostComments.findOne({
                    where: { id: createReply.id },
                    include: [
                        { model: UserPost,
                            attributes: ['post_media', 'content', 'likes', 'week_date'],
                        },
                    ]
                });
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: commentData.post_id
                    }
                });
                await userPost.increment('comments', { by: 1 });
                const user_uuid = userData.uuid;
                const account_social_userid = socialPageData.social_userid;
                const account_platform = socialPageData.page_platform;
                const activity_type = "comments";
                const activity_subType = "posts";
                const action = "reply";
                const post_form_id = '';
                const reference_pageID = { activity_type_id: replyData.id, activity_subType_id: commentData.post_id, title:reply || '' };
                const source_type = '';
                const nextAPI_call_dateTime = '';
                await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                return res.status(200).json({ message: "Comment replied successfully.", reply:replyDataFetch });
            } catch (error) {
                console.error('LinkedIn comment posting Error:', error.response?.data || error.message);
                res.status(500).json({ error: 'Failed to reply on comment.' });
            }
        }
    });
});
app.post(`/${prefix}/linkedin/comment-update`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error("Error verifying token:", err);
            return res.status(401).json({ message: "Token not valid." });
        }
        const { userData } = authData;
        const commentID = req.body.commentId;
        const updatedComment = req.body.message?.trim();
        if (!updatedComment) {
            return res.status(400).json({ message: "Comment message is required." });
        }
        try {
            const commentRecord = await PostComments.findOne({
                where: { id: commentID },
            });
            if (!commentRecord) {
                return res.status(404).json({ message: "Comment not found." });
            }
            const { platform_page_Id: page_id, post_id, comment_id: linkedinCommentId } = commentRecord;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token', 'social_userid', 'page_platform'],
                where: { pageId: page_id },
                raw: true,
            });
            if (!socialPageData || !socialPageData.token) {
                return res.status(403).json({ message: "Page access token not found." });
            }
            const accessToken = socialPageData.token;
            const organizationURN = `urn:li:organization:${page_id}`;
            const encodedPostURN = encodeURIComponent(post_id);
            const encodedOrgURN = encodeURIComponent(organizationURN);
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202505',
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json',
            };
            await axios.post(
                `https://api.linkedin.com/v2/socialActions/${encodedPostURN}/comments/${linkedinCommentId}?actor=${encodedOrgURN}`,
                {
                    "patch":{
                        "message":{
                            "$set":{ "text": updatedComment }
                        }
                    }
                },
                { headers }
            );
            // Update local DB
            await PostComments.update(
                { comment: updatedComment },
                { where: { id: commentID } }
            );
            const updatedCommentData = await PostComments.findOne({
                where: { id: commentID },
                include: [
                    {
                        model: UserPost,
                        attributes: ['post_media', 'content', 'likes', 'week_date'],
                    },
                ],
            });
            const user_UUID = userData.uuid;
            const account_social_userid = commentRecord.social_userid;
            const account_platform = commentRecord.platform;
            const activity_type = "comment";
            const activity_subType = "posts";
            const action = "update";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: commentRecord.comment_id,
                activity_subType_id: commentRecord.post_id,
            };
            const source_type = '';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            return res.status(200).json({
                message: "Comment updated successfully.",
                comment: updatedCommentData,
            });
        } catch (error) {
            console.error('LinkedIn comment update error:', error.response?.data || error.message);
            return res.status(500).json({ error: 'Failed to update comment on LinkedIn.' });
        }
    });
});
app.delete(`/${prefix}/linkedin/comment-delete`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error("Error verifying token:", err);
            return res.status(401).json({ message: "Token not valid." });
        }
        const commentID = req.body.commentId;
        const { userData } = authData;
        if (!commentID) {
            return res.status(400).json({ message: "Comment ID is required." });
        }
        try {
            const commentRecord = await PostComments.findOne({ where: { id: commentID } });
            if (!commentRecord) {
                return res.status(404).json({ message: "Comment not found." });
            }
            const { platform_page_Id: page_id, post_id, comment_id: linkedinCommentId, activity_id } = commentRecord;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token'],
                where: { pageId: page_id },
                raw: true,
            });
            if (!socialPageData || !socialPageData.token) {
                return res.status(403).json({ message: "Page access token not found." });
            }
            const accessToken = socialPageData.token;
            const organizationURN = `urn:li:organization:${page_id}`;
            const encodedPostURN = encodeURIComponent(post_id);
            const encodedOrgURN = encodeURIComponent(organizationURN);
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202505',
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json',
            };
            // LinkedIn API: Delete comment
            await axios.delete(
                `https://api.linkedin.com/v2/socialActions/${encodedPostURN}/comments/${linkedinCommentId}?actor=${encodedOrgURN}`,
                { headers }
            );
            // DB Clean-up Logic
            const allRelatedComments = await PostComments.findAll({
                where: { activity_id },
            });
            // const encodedCommentURN = encodeURIComponent(`urn:li:comment:(urn:li:activity:${activity_id},${linkedinCommentId})`);
            const relatedReplyIdsToDelete = allRelatedComments
                .filter(item =>
                item.parent_comment_id && decodeURIComponent(item.parent_comment_id).includes(linkedinCommentId)
                )
                .map(item => item.id);
            // Always delete the main comment
            const idsToDelete = [commentID, ...relatedReplyIdsToDelete];
            const totalDeletedCount = idsToDelete.length;
            await PostComments.destroy({
                where: { id: idsToDelete },
            });
            const userPost = await UserPost.findOne({
                where: {
                    platform_post_id: post_id
                }
            });
            if (!userPost) {
                return res.status(404).json({ message: "Post not found." });
            }
            if (userPost.comments > 0) {
                await userPost.decrement('comments', { by: totalDeletedCount });
            }
            const user_UUID = userData.uuid;
            const account_social_userid = userPost.social_user_id;
            const account_platform = userPost.post_platform;
            const activity_type = "comment";
            const activity_subType = "posts";
            const action = "delete";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: '',
                activity_subType_id: post_id,
            };
            const source_type = '';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            return res.status(200).json({
                message: "Comment and its related replies (if any) deleted successfully.",
                deletedIds: idsToDelete,
            });
        } catch (error) {
            console.error('LinkedIn comment deletion error:', error.response?.data || error.message);
            return res.status(500).json({ error: 'Failed to delete comment from LinkedIn Post.' });
        }
    });
});
// linkedin post comment functions ends here

// linkedin functions ends here

app.post(`/${prefix}/publish-posts`, (req, res, next) => {
    upload(req, res, function(err) {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large. Max 50MB.' });
                if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Too many files. Max 10.' });
                if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ message: 'Unexpected field name.' });
            }
            if (err.message === 'Only image and video files are allowed!') {
                return res.status(400).json({ message: err.message });
            }
            return res.status(500).json({ message: 'File upload failed.' });
        }
        next();
    });
}, async (req, res) => {
  const token = req.token;
  if (!token) return res.status(401).json({ message: "No token provided." });
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        }
        try {
            const { postContent: content, platforms: platformsRaw, linkedinMediaType } = req.body;
            const platforms = JSON.parse(platformsRaw);
            const userUuid = authData.userData.uuid;
            const results = [];
            const failed = [];
            // --- Normalize uploaded files like in create-post ---
            const uploadedFiles = (req.files || []).map(f => {
                const isVideo = f.mimetype.startsWith("video/");
                return {
                    path: f.path,
                    publicPath: `/uploads/posts/${isVideo ? "videos" : "images"}/${f.filename}`,
                    type: isVideo ? "video" : "image",
                    filename: f.filename,
                    originalname: f.originalname,
                    mimetype: f.mimetype,
                    size: f.size
                };
            });
            for (let i = 0; i < platforms.length; i++) {
                const platform = platforms[i];
                try {
                    let result;
                    let platformMediaFiles = [...uploadedFiles];
                    // If LinkedIn & type filter is set
                    if (platform.page_platform === 'linkedin' && linkedinMediaType) {
                        platformMediaFiles = uploadedFiles.filter(f => f.type === linkedinMediaType);
                    }
                    if (platform.page_platform === 'facebook') {
                        result = await publishToFacebook(platform, content, platformMediaFiles);
                    } else if (platform.page_platform === 'linkedin') {
                        result = await publishToLinkedIn(platform, content, platformMediaFiles);
                    } else {
                        throw new Error(`Unsupported platform: ${platform.name}`);
                    }
                    results.push({ ...result, status: 'success' });
                } catch (err) {
                    console.warn(`:x: ${platform.page_platform} publish failed:`, err.message);
                    failed.push({
                        platform: platform.page_platform,
                        pageId: platform.id,
                        pageName: platform.name,
                        status: 'failed',
                        error: err.message
                    });
                }
            }
            await savePostResults(results, userUuid);
            res.json({
                results: [
                    ...results,
                    ...failed.map(f => ({
                        platform: f.platform,
                        pageId: f.pageId,
                        pageName: f.pageName || 'Unknown',
                        status: 'failed',
                        error: f.error,
                    }))
                ]
            });
        } catch (error) {
            console.error("Publish error:", error);
            return res.status(500).json({ message: "Internal server error." });
        }
    });
});
// ✅ Facebook Publisher - Updated to use file objects instead of paths
async function publishToFacebook(platform, content, mediaFiles) {
    const { id: pageId, name: pageName, pageSocialUser, status: isPageActive } = platform;
    const socialPageData = await SocialUserPage.findOne({ where: { pageId, social_userid: pageSocialUser } });
    const user = socialPageData && socialPageData.page_platform === "facebook" && socialPageData.status === "Connected" ? socialPageData : null;
    if (!user || isPageActive === "notConnected") {
        throw new Error(`Facebook page or user is inactive.`);
    }
    const pageAccessToken = socialPageData.token;
    let attachedMedia = [];
    try {
        // Upload all media files first
        if (mediaFiles.length > 0) {
            for (const file of mediaFiles) {
                if (file.type === "image") {
                    // Image upload
                    const formData = new FormData();
                    formData.append("access_token", pageAccessToken);
                    formData.append("source", fs.createReadStream(file.path));
                    formData.append("published", "false");
                    const mediaRes = await axios.post(
                        `https://graph.facebook.com/v22.0/${pageId}/photos`,
                        formData,
                        { headers: formData.getHeaders(), timeout: 300000 }
                    );
                    if (mediaRes?.data?.id) {
                        attachedMedia.push({ media_fbid: mediaRes.data.id });
                        console.log(`Uploaded image with ID: ${mediaRes.data.id}`);
                    }
                } else if (file.type === "video") {
                    // Video upload - for videos, we need to publish them directly, not as unpublished
                    const formData = new FormData();
                    formData.append("access_token", pageAccessToken);
                    formData.append("source", fs.createReadStream(file.path));
                    formData.append("description", content); // Add description for videos
                    const mediaRes = await axios.post(
                        `https://graph.facebook.com/v22.0/${pageId}/videos`,
                        formData,
                        {
                            headers: formData.getHeaders(),
                            timeout: 300000,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity
                        }
                    );
                    if (mediaRes?.data?.id) {
                        // For videos, return immediately as they're published directly
                        console.log(`Uploaded video with ID: ${mediaRes.data.id}`);
                        return {
                            platform: "facebook",
                            pageId,
                            pageName,
                            platform_post_id: mediaRes.data.id,
                            media: JSON.stringify([{ type: "video", file: file.filename, originalname: file.originalname }]),
                            content,
                            social_userid: pageSocialUser,
                        };
                    }
                }
            }
        }
        // If we have only images or no media, create a regular post
        if (attachedMedia.length > 0 || content.trim()) {
            // Use form-data for the final post to ensure proper formatting
            const formData = new FormData();
            formData.append("message", content);
            formData.append("access_token", pageAccessToken);
            // Add attached media in the correct format
            if (attachedMedia.length > 0) {
                attachedMedia.forEach((media, index) => {
                    formData.append(`attached_media[${index}]`, JSON.stringify(media));
                });
            }
            console.log("Final post data with form-data");
            const postRes = await axios.post(
                `https://graph.facebook.com/v22.0/${pageId}/feed`,
                formData,
                {
                    timeout: 30000,
                    headers: formData.getHeaders()
                }
            );
            console.log("Post created successfully:", postRes.data);
            return {
                platform: "facebook",
                pageId,
                pageName,
                platform_post_id: postRes.data.id,
                // media: mediaFiles.length
                //     ? JSON.stringify(mediaFiles.map(f => ({ type: f.type, path: f.filename, originalname: f.originalname })))
                //     : null,
                media: mediaFiles.length
                    ? JSON.stringify(mediaFiles.map((f, idx) => {
                        const isVideo = f.type === 'video';
                        return {
                            order: idx,
                            type: f.type,
                            path: `/uploads/posts/${isVideo ? "videos" : "images"}/${f.filename}`, 
                            originalname: f.originalname || null,
                        };
                    }))
                    : null,
                content,
                social_userid: pageSocialUser,
            };
        } else {
            throw new Error("No content or media to post");
        }
    } catch (error) {
        console.error('Error in Facebook publishing:', {
            message: error.message,
            response: error.response?.data,
            config: {
                url: error.config?.url,
                data: error.config?.data
            }
        });
        throw new Error(`Facebook publishing failed: ${error.response?.data?.error?.message || error.message}`);
    }
}
// ✅ LinkedIn Publisher - Updated to use file objects instead of paths
async function publishToLinkedIn(platform, content, mediaFiles) {
    const { id: pageId, name: pageName, pageSocialUser, status: isPageActive } = platform;
    // --- Guardrails: connection + token ---
    const socialPageData = await SocialUserPage.findOne({
        where: { pageId, social_userid: pageSocialUser }
    });
    const isLinkedInConnected =
        socialPageData &&
        socialPageData.page_platform === "linkedin" &&
        socialPageData.status === "Connected" &&
        isPageActive !== "notConnected";
    if (!isLinkedInConnected) {
        throw new Error("LinkedIn page or user is inactive.");
    }
    const userToken = socialPageData.token;
    // --- Normalize media input into an array of { path, mimetype?, type? } ---
    const normalizeMedia = (input) => {
        if (!input) return [];
        if (typeof input === "string") return [{ path: input }];
        if (Array.isArray(input)) {
            return input.map((m) => (typeof m === "string" ? { path: m } : m));
        }
        if (typeof input === "object" && input.path) return [input];
        // Unknown shape → treat as no media
        return [];
    };
    const files = normalizeMedia(mediaFiles).map((f) => {
        const p = f.path || f.filepath || f.location || f.tempFilePath; // support common field names
        const guessedMime = f.mimetype || (p ? mime.lookup(p) : null) || "application/octet-stream";
        let kind = f.type;
        if (!kind && guessedMime.startsWith("image/")) kind = "image";
        if (!kind && guessedMime.startsWith("video/")) kind = "video";
        return {
            path: p,
            mimetype: guessedMime,
            type: kind || "unknown",
            filename: f.filename || f.originalname || (p ? p.split(/[\\/]/).pop() : "file")
        };
    });
    // --- Validate media set ---
    const hasImages = files.some((f) => f.type === "image");
    const hasVideos = files.some((f) => f.type === "video");
    if (hasImages && hasVideos) {
        throw new Error("LinkedIn does not support mixing images and videos in a single post.");
    }
    if (hasVideos && files.length > 1) {
        throw new Error("LinkedIn supports a single video per UGC post.");
    }
    // --- Upload helper (images + small/medium videos) ---
    const registerAndUpload = async (file) => {
        if (!file.path) throw new Error("Media file missing path.");
        // 1) Register upload
        const recipe = file.type === "video"
            ? "urn:li:digitalmediaRecipe:feedshare-video"
            : "urn:li:digitalmediaRecipe:feedshare-image";
        const registerRes = await axios.post(
            "https://api.linkedin.com/v2/assets?action=registerUpload",
            {
                registerUploadRequest: {
                    owner: `urn:li:organization:${pageId}`, // Page URN
                    recipes: [recipe],
                    serviceRelationships: [
                        {
                            relationshipType: "OWNER",
                            identifier: "urn:li:userGeneratedContent" // required by LinkedIn
                        }
                    ]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
        const uploadInfo = registerRes.data?.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
        if (!uploadInfo?.uploadUrl) {
            throw new Error("LinkedIn did not return an uploadUrl.");
        }
        const uploadUrl = uploadInfo.uploadUrl;
        const assetUrn = registerRes.data.value.asset;
        // 2) Upload bytes
        const buffer = fs.readFileSync(file.path);
        await axios.put(uploadUrl, buffer, {
            headers: {
                // Using Authorization on PUT keeps parity with your previously working flow
                Authorization: `Bearer ${userToken}`,
                "Content-Type": file.mimetype || "application/octet-stream",
                "Content-Length": buffer.length
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        return assetUrn;
    };
    // --- Upload all media (if any) ---
    const assetUrns = [];
    for (const f of files) {
        if (f.type !== "image" && f.type !== "video") {
            throw new Error(`Unsupported media type for ${f.filename} (${f.mimetype}).`);
        }
        const urn = await registerAndUpload(f);
        assetUrns.push({ urn, file: f });
    }
    // --- Build UGC payload ---
    const shareMediaCategory = assetUrns.length === 0 ? "NONE" : hasVideos ? "VIDEO" : "IMAGE";
    const postData = {
        author: `urn:li:organization:${pageId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: content || "" },
                shareMediaCategory
            }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
    };
    if (assetUrns.length > 0) {
        postData.specificContent["com.linkedin.ugc.ShareContent"].media = assetUrns.map((a, i) => ({
            status: "READY",
            description: { text: (content || "").slice(0, 200) },
            media: a.urn,
            title: { text: hasVideos ? "Video" : `Image ${i + 1}` }
        }));
    }
    // --- Publish ---
    const postRes = await axios.post("https://api.linkedin.com/v2/ugcPosts", postData, {
        headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202505"
        }
    });
    // --- Return payload for persistence ---
    return {
        platform: "linkedin",
        pageId,
        pageName,
        platform_post_id: postRes.data.id,
        media: assetUrns.length > 0 ? JSON.stringify(
                assetUrns.map((a, idx) => ({ 
                    order: idx, 
                    type: a.file.type, 
                    path: `/uploads/posts/${a.file.type === "video" ? "videos" : "images"}/${a.file.filename}`,
                    platformId: a.urn
                }))
            ) : null,
        content,
        social_userid: pageSocialUser
    };
}
async function savePostResults(results,user_uuid) {
    const formId = crypto.randomUUID();
    for (const result of results) {
        if (result.status === 'success') {
            const PostData = await UserPost.create({
                post_platform: result.platform|| '',
                form_id: formId,
                page_id: result.pageId,
                platform_post_id: result.platform_post_id|| '',
                content: result.content,
                status: '1',
                social_user_id: result.social_userid,
                post_media: result.media,
                user_uuid: user_uuid,
                schedule_time: null,
                week_date: new Date().toISOString().split('T')[0]
            });
            const now = new Date(); 
            const user_UUID = PostData.user_uuid;
            const account_social_userid = PostData.social_user_id;
            const account_platform = PostData.post_platform;
            const activity_type = "posts";
            const activity_subType = "published";
            const action = "create";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: PostData.platform_post_id,
                activity_subType_id: PostData.page_id,
                schedule_time: ''
            };
            const source_type = '';
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
        }
    }
}
// Draft Post to published Post function
app.post(`/${prefix}/publish-draft-post`, upload, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }

    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            try {
                const { postContent: content, page_id, postID } = req.body;

                // Validate required fields
                if (!content || !page_id || !postID) {
                    return res.status(400).json({ message: 'Missing required fields.' });
                }

                const file = req.files?.[0];
                const mediaPath = file?.filename
                    ? path.join("public", "uploads", "posts", file.filename)
                    : null;

                // Get user UUID
                const userUuid = authData.userData.uuid;

                // Get platform info from DB
                const socialPageData = await SocialUserPage.findOne({ where: { pageId: page_id } });

                if (!socialPageData) {
                    return res.status(404).json({ message: "Page not found or not connected." });
                }

                const platform = {
                    id: socialPageData.pageId,
                    name: socialPageData.page_name, // make sure your DB has this field
                    page_platform: socialPageData.page_platform,
                    pageSocialUser: socialPageData.social_userid,
                    status: socialPageData.status,
                };

                // Validate platform connection
                if (platform.status !== 'Connected') {
                    return res.status(400).json({ message: 'Page is not connected.' });
                }

                let result;
                if (platform.page_platform === 'facebook') {
                    result = await publishToFacebook(platform, content, mediaPath);
                } else if (platform.page_platform === 'linkedin') {
                    result = await publishToLinkedIn(platform, content, mediaPath);
                } else {
                    throw new Error(`Unsupported platform: ${platform.page_platform}`);
                }

                // Return minimal response for frontend to trigger updatePost
                res.status(200).json({
                    success: true,
                    message: 'Post published successfully.',
                    platform_post_id: result.platform_post_id,
                    platform: result.platform,
                    pageName: result.pageName,
                });

            } catch (error) {
                console.error("Publish draft error:", error);
                res.status(500).json({ success: false, message: "Internal server error." });
            }
        }
    });
});
// Draft Post to published Post function ends here

//Facebook comments section
app.post(`/${prefix}/getPlatformPostComments`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return res.status(401).json({ message: "Token not valid." });
        }
        try {
            const { getDataFormDate, getDataToDate, pageInfoID, platform } = req.body;
            const allcomments = await PostComments.findAll({
                where: {
                    user_uuid: authData.userData.uuid,
                    platform_page_Id: pageInfoID,
                    platform:platform,
                    [Op.and]: [
                        where(fn('DATE', col('PostComments.comment_created_time')), {
                            [Op.between]: [getDataFormDate, getDataToDate],
                        }),
                    ],
                },
                include: [
                    {
                        model: UserPost,
                        attributes: ['post_media', 'content', 'likes', 'week_date'],
                    },
                ],
                order: [['comment_created_time', 'DESC']],                
                group: ['PostComments.comment_id'],
                limit: 50,
            });
            //console.log('allcomments'.red, allcomments);
            return res.json({
                success: true,
                message: "Comments fetched successfully.",
                //totalSaved: uniqueComments.size,
                commentData: allcomments
            });
        } catch (error) {
            console.error("Internal error:", error);
            return res.status(500).json({ message: "Internal server error.", error });
        }
    });
});
app.post(`/${prefix}/create-comment`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async(err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            const { userData } = authData;
            const page_id = req.body.pageID;
            const post_id = req.body.post_id;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token','social_userid','page_platform','pageName'],
                where: { pageId: page_id },
                raw:true
            });
            const accessToken = socialPageData.token;
            const reply = req.body.comment;
            const now = new Date();
            const formattedDate = now.toISOString().replace(/\.\d+Z$/, '+0000');
            try{
                const commentRes = await axios.post(
                        `https://graph.facebook.com/v22.0/${post_id}/comments`,
                        {
                            message: reply,
                            access_token: accessToken
                        }
                    );
                const commentData = commentRes.data;
                const createComment = await PostComments.create({
                    user_uuid: userData.uuid,
                    social_userid: socialPageData.social_userid,
                    platform_page_Id: page_id,
                    platform: socialPageData.page_platform,
                    activity_id: commentData.object,
                    comment_id: commentData.id,
                    post_id: post_id,
                    comment: reply || '',
                    comment_created_time: formattedDate,
                    parent_comment_id: null,
                    from_id: page_id || null,
                    from_name: socialPageData?.pageName || 'Page Admin',
                    comment_type: 'top_level',
                    reaction_like: 0
                });
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: post_id
                    }
                });
                await userPost.increment('comments', { by: 1 });
                const commentDataFetch = await PostComments.findOne({
                    where: { id: createComment.id },
                    include: [
                        { model: UserPost,
                            attributes: ['post_media', 'content', 'likes', 'week_date'],
                        },
                    ]
                });
                io.to(`post:${post_id}`).emit('comment:new', {
                    originSocketId: req.headers['x-socket-id'] || null,
                    data: commentDataFetch         // plain JSON with UserPost relation included
                });
                const user_UUID = userData.uuid;
                const account_social_userid = socialPageData.social_userid;
                const account_platform = 'facebook';
                const activity_type = "comment";
                const activity_subType = "posts";
                const action = "create";
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: commentData.id,
                    activity_subType_id: post_id,
                };
                const source_type = '';
                const now = new Date();
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                return res.status(200).json({ message: "Comment posted successfully.", reply:commentDataFetch });
            } catch (error) {
                console.error('Facebook comment posting Error:', error.response?.data || error.message);
                res.status(500).json({ error: 'Failed to comment on post.' });
            }
        }
    });
});
app.post(`/${prefix}/comment-reply`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async(err, authData) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.status(401).json({ message: "Token not valid." });
        } else {
            const { userData } = authData;
            const page_id = req.body.page_id;
            const commentID = req.body.commentId;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token','social_userid','page_platform','pageName'],
                where: { pageId: page_id },
                raw:true
            });
            const commentData = await PostComments.findOne({
                where:{ comment_id: commentID }
            });
            const accessToken = socialPageData.token;
            const reply = req.body.message;
            const now = new Date();
            const formattedDate = now.toISOString().replace(/\.\d+Z$/, '+0000');
            try{
                const registerRes = await axios.post(
                    `https://graph.facebook.com/v22.0/${commentID}/comments`,
                    {
                        message: reply,
                        access_token: accessToken
                    }
                );
                const replyData = registerRes.data;
                const createReply = await PostComments.create({
                    user_uuid: userData.uuid,
                    social_userid: socialPageData.social_userid,
                    platform_page_Id: page_id,
                    post_id: commentData.post_id,
                    platform: socialPageData.page_platform,
                    activity_id: null,
                    comment_id: replyData.id,
                    parent_comment_id: commentID || null,
                    comment: reply || '',
                    from_id: page_id || null,
                    from_name: socialPageData.pageName||'Page Admin',
                    comment_type: 'reply',
                    reaction_like: 0,
                    comment_created_time: formattedDate
                });
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: commentData.post_id
                    }
                });
                await userPost.increment('comments', { by: 1 });
                const replyDataFetch = await PostComments.findOne({
                    where: { id: createReply.id },
                    include: [
                        { model: UserPost,
                            attributes: ['post_media', 'content', 'likes', 'week_date'],
                        },
                    ]
                });
                const user_uuid = userData.uuid;
                const account_social_userid = socialPageData.social_userid;
                const account_platform = socialPageData.page_platform;
                const activity_type = "comments";
                const activity_subType = "posts";
                const action = "reply";
                const post_form_id = '';
                const reference_pageID = { activity_type_id: replyData.id, activity_subType_id: commentData.post_id, title:reply || '' };
                const source_type = '';
                const nextAPI_call_dateTime = '';
                await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                io.to(`post:${commentData.post_id}`).emit('comment:new', {
                    originSocketId: req.headers['x-socket-id'] || null,
                    data: replyDataFetch         // plain JSON with UserPost relation included
                });
                return res.status(200).json({ message: "Comment replied successfully.", reply:replyDataFetch });
            } catch (error) {
                console.error('Facebook comment posting Error:', error.response?.data || error.message);
                res.status(500).json({ error: 'Failed to reply on comment.' });
            }
        }
    });
});
app.post(`/${prefix}/comment-update`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error("Error verifying token:", err);
            return res.status(401).json({ message: "Token not valid." });
        }
        const { userData } = authData;
        const commentID = req.body.commentId;
        const updatedComment = req.body.message?.trim();
        if (!updatedComment) {
            return res.status(400).json({ message: "Comment message is required." });
        }
        try {
            const commentRecord = await PostComments.findOne({
                where: { id: commentID },
            });
            if (!commentRecord) {
                return res.status(404).json({ message: "Comment not found." });
            }
            const { platform_page_Id: page_id, post_id, comment_id: linkedinCommentId } = commentRecord;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token', 'social_userid', 'page_platform'],
                where: { pageId: page_id },
                raw: true,
            });
            if (!socialPageData || !socialPageData.token) {
                return res.status(403).json({ message: "Page access token not found." });
            }
            const accessToken = socialPageData.token;
            const response = await fetch(`https://graph.facebook.com/v22.0/${commentRecord.comment_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: updatedComment,
                    access_token: accessToken,
                }),
            });
            // console.log("update response",response);
            // Update local DB
            await PostComments.update(
                { comment: updatedComment },
                { where: { id: commentID } }
            );
            const updatedCommentData = await PostComments.findOne({
                where: { id: commentID },
                include: [
                    {
                        model: UserPost,
                        attributes: ['post_media', 'content', 'likes', 'week_date'],
                    },
                ],
            });
            const user_UUID = userData.uuid;
            const account_social_userid = commentRecord.social_userid;
            const account_platform = commentRecord.platform;
            const activity_type = "comment";
            const activity_subType = "posts";
            const action = "update";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: commentRecord.comment_id,
                activity_subType_id: commentRecord.post_id,
            };
            const source_type = '';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            io.to(`post:${post_id}`).emit('comment:updated', {
                originSocketId: req.headers['x-socket-id'] || null,
                data: updatedCommentData          // plain JSON with UserPost relation included
            });
            return res.status(200).json({
                message: "Comment updated successfully.",
                comment: updatedCommentData,
            });
        } catch (error) {
            console.error('Facebook comment update error:', error.response?.data || error.message);
            return res.status(500).json({ error: 'Failed to update comment on Facebook.' });
        }
    });
});
app.post(`/${prefix}/comment-delete`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error("Error verifying token:", err);
            return res.status(401).json({ message: "Token not valid." });
        }
        const { userData } = authData;
        const commentID = req.body.commentId;
        if (!commentID) {
            return res.status(400).json({ message: "Comment ID is required." });
        }
        try {
            const commentRecord = await PostComments.findOne({ where: { id: commentID } });
            if (!commentRecord) {
                return res.status(404).json({ message: "Comment not found." });
            }
            const { platform_page_Id: page_id, post_id, comment_id: facebookCommentId, activity_id } = commentRecord;
            const socialPageData = await SocialUserPage.findOne({
                attributes: ['token'],
                where: { pageId: page_id },
                raw: true,
            });
            if (!socialPageData || !socialPageData.token) {
                return res.status(403).json({ message: "Page access token not found." });
            }
            const accessToken = socialPageData.token;
            // Facebook API: Delete comment
            const response = await fetch(
                `https://graph.facebook.com/v22.0/${facebookCommentId}?access_token=${accessToken}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            // DB Clean-up Logic
            const allRelatedComments = await PostComments.findAll({
                where: { activity_id },
            });
            // const encodedCommentURN = encodeURIComponent(`urn:li:comment:(urn:li:activity:${activity_id},${facebookCommentId})`);
            const relatedReplyIdsToDelete = allRelatedComments
                .filter(item =>item.parent_comment_id && item.parent_comment_id.includes(facebookCommentId))
                .map(item => item.id);
            // Always delete the main comment
            const idsToDelete = [commentID, ...relatedReplyIdsToDelete];
            const totalDeletedCount = idsToDelete.length;
            await PostComments.destroy({
                where: { id: idsToDelete },
            });
            io.to(`post:${post_id}`).emit('comment:deleted', {
                originSocketId: req.headers['x-socket-id'] || null,
                data: idsToDelete          // plain JSON with UserPost relation included
            });
            const userPost = await UserPost.findOne({
                where: {
                    platform_post_id: post_id
                }
            });
            if(!userPost) {
                return res.status(404).json({ message: "Post not found." });
            }
            if (userPost.comments > 0) {
                await userPost.decrement('comments', { by: totalDeletedCount });
            }
            const user_UUID = userData.uuid;
            const account_social_userid = userPost.social_user_id;
            const account_platform = userPost.post_platform;
            const activity_type = "comment";
            const activity_subType = "posts";
            const action = "delete";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: '',
                activity_subType_id: post_id,
            };
            const source_type = '';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            return res.status(200).json({
                message: "Comment and its related replies (if any) deleted successfully.",
                deletedIds: idsToDelete,
            });
        } catch (error) {
            console.error('Facebook comment deletion error:', error.response?.data || error.message);
            return res.status(500).json({ error: 'Failed to delete comment from Facebook Post.' });
        }
    });
});

// Start Delete selected comments
app.post(`/${prefix}/delete-selected-comments`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            console.error("Error verifying token:", err);
            return res.status(401).json({ message: "Token not valid." });
        }
        const { userData } = authData;
        const commentIDs = req.body.deleteComments; // e.g. [1193, 1194, 1195]
        const commentPlatform = req.body.commentPlatform;
        const selectPageID = req.body.selectPageID;
        if(!Array.isArray(commentIDs) || commentIDs.length === 0) {
            return res.status(400).json({ message: "Comment IDs are required." });
        }
        if (!selectPageID) {
            return res.status(400).json({ message: "Invalid request." });
        }
        const socialPageData = await SocialUserPage.findOne({
            attributes: ['token'],
            where: { pageId: req.body.selectPageID },
            raw: true,
        });
        if (!socialPageData || !socialPageData.token) {
            return res.status(403).json({ message: "Page access token not found." });
        }
        const accessToken = socialPageData.token;
        const deletedIds = [];
        if (commentPlatform === 'facebook') {
            // Loop and delete comments one by one
            const results = [];
            for (const facebookCommentId of commentIDs) {
                const commentDetails = await PostComments.findOne({
                    where: { id: facebookCommentId },
                });
                if (!commentDetails) continue;
                try {
                    const response = await fetch(
                        `https://graph.facebook.com/v22.0/${commentDetails.comment_id}?access_token=${accessToken}`,
                        {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                    const result = await response.json();
                    if (response.ok) {
                        // DB Clean-up Logic
                        const deletedCount = await PostComments.destroy({
                            where: {
                                [Op.or]: [
                                    { comment_id: commentDetails.comment_id },
                                    { parent_comment_id: commentDetails.comment_id },
                                ],
                            },
                        });
                        const userPost = await UserPost.findOne({
                            where: {
                                platform_post_id: commentDetails.post_id
                            }
                        });
                        if(!userPost) {
                            //return res.status(404).json({ message: "Post not found." });
                        }
                        if (userPost.comments > 0) {
                            await userPost.decrement('comments', { by: deletedCount });
                        }
                        const user_UUID = userData.uuid;
                        const account_social_userid = userPost.social_user_id;
                        const account_platform = 'facebook';
                        const activity_type = "comment";
                        const activity_subType = "posts";
                        const action = "delete";
                        const post_form_id = '';
                        const reference_pageID = {
                            activity_type_id: '',
                            activity_subType_id: commentDetails.post_id,
                        };
                        const source_type = '';
                        const now = new Date();
                        const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                        const nextAPI_call_dateTime = next24FromNow;
                        await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                        deletedIds.push(facebookCommentId);
                    }
                } catch (err) {
                    console.error(`Error deleting comment ${facebookCommentId}:`, err);
                    results.push({
                        deletedIds: facebookCommentId,
                        success: false,
                        error: err.message,
                    });
                }
            }
            return res.status(200).json({
                message: "Comments delete operation completed.",
                deletedIds,
            });
        } else if (commentPlatform === 'linkedin') {
            const organizationURN = `urn:li:organization:${selectPageID}`;
            for (const facebookCommentId of commentIDs) {
                const commentDetails = await PostComments.findOne({
                    where: { id: facebookCommentId },
                });
                if (!commentDetails) continue;
                const encodedPostURN = encodeURIComponent(commentDetails.post_id);
                const encodedOrgURN = encodeURIComponent(organizationURN);
                const headers = {
                    'Authorization': `Bearer ${accessToken}`,
                    'LinkedIn-Version': '202505',
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json',
                };
                // LinkedIn API: Delete comment
                await axios.delete(
                    `https://api.linkedin.com/v2/socialActions/${encodedPostURN}/comments/${commentDetails.comment_id}?actor=${encodedOrgURN}`,
                    { headers }
                );
                const deletedCount = await PostComments.destroy({
                    where: {
                        [Op.or]: [
                            { comment_id: commentDetails.comment_id },
                            { parent_comment_id: commentDetails.comment_id },
                        ],
                    },
                });
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: commentDetails.post_id
                    }
                });
                if(!userPost) {
                    return res.status(404).json({ message: "Post not found." });
                }
                if (userPost.comments > 0) {
                    await userPost.decrement('comments', { by: deletedCount });
                }
                const user_UUID = userData.uuid;
                const account_social_userid = userPost.social_user_id;
                const account_platform = 'linkedin';
                const activity_type = "comment";
                const activity_subType = "posts";
                const action = "delete";
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: '',
                    activity_subType_id: commentDetails.post_id,
                };
                const source_type = '';
                const now = new Date();
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                deletedIds.push(facebookCommentId);
            }
            return res.status(200).json({
                message: "Comments delete operation completed.",
                deletedIds,
            });
        }
    });
});
// End Delete selected comments

app.post(`/${prefix}/get-comments-sentiment`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return res.status(401).json({ message: "Token not valid." });
        }

        try {
            const allcomments = await PostComments.findAll({
                where: {
                    user_uuid: authData.userData.uuid,
                    platform_page_Id: req.body.platformPageId,
                    platform: req.body.platform,
                    comment_behavior: {
                        [Op.not]: null
                    },
                    comment_created_time: {
                        [Op.between]: [
                            `${req.body.lastMondayWeekDate}T00:00:00+0000`,
                            `${req.body.lastSundayWeekDate}T23:59:59+0000`
                        ]
                    }
                }
            });

            const sentimentCounts = {
                POSITIVE: 0,
                NEGATIVE: 0,
                NEUTRAL: 0
            };

            allcomments.forEach(comment => {
                const behavior = comment.comment_behavior?.toUpperCase();
                if (sentimentCounts.hasOwnProperty(behavior)) {
                    sentimentCounts[behavior]++;
                }
            });

            const total = sentimentCounts.POSITIVE + sentimentCounts.NEGATIVE + sentimentCounts.NEUTRAL;

            // Compute percentages
            // const sentimentPercentages = {
            //     POSITIVE: total ? ((sentimentCounts.POSITIVE / total) * 100).toFixed(2) : "0.00",
            //     NEGATIVE: total ? ((sentimentCounts.NEGATIVE / total) * 100).toFixed(2) : "0.00",
            //     NEUTRAL: total ? ((sentimentCounts.NEUTRAL / total) * 100).toFixed(2) : "0.00"
            // };
            const sentimentPercentages = {
            POSITIVE: total
                ? parseFloat(((sentimentCounts.POSITIVE / total) * 100).toFixed(2))
                : 0.00,
            NEGATIVE: total
                ? parseFloat(((sentimentCounts.NEGATIVE / total) * 100).toFixed(2))
                : 0.00,
            NEUTRAL: total
                ? parseFloat(((sentimentCounts.NEUTRAL / total) * 100).toFixed(2))
                : 0.00
            };

            return res.json({
                success: true,
                message: "Comment sentiment summary.",
                counts: sentimentCounts,
                percentages: sentimentPercentages,
                //total,
                //allcomments
            });
        } catch (error) {
            console.error("Internal error:", error);
            return res.status(500).json({ message: "Internal server error.", error });
        }       
        
    });
});

//  Facebook Webhook Verification (GET) manjeet

app.get('/facebook/webhook', (req, res) => {
    const VERIFY_TOKEN = 'Aronasoft_web';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified successfully!');
            return res.status(200).send(challenge); // :white_check_mark: Respond with challenge
        } else {
            return res.sendStatus(403); // :x: Invalid token
        }
    }
    res.sendStatus(400); // :x: Missing parameters
});

app.post('/facebook/webhook', async (req, res) => {    
    //console.log("webhook request count ");
    res.status(200).send('EVENT_RECEIVED');
    try {
        const webhookResponse = req.body;
        //console.log("webhook received:",webhookResponse);
        //console.log('webhook entry:',webhookResponse.entry[0]);
        //console.log('webhook changes:',webhookResponse.entry[0]?.changes);
        const changeValue = webhookResponse.entry[0]?.changes?.[0]?.value;
        if(changeValue && changeValue.item === 'reaction' && changeValue.reaction_type==='like' && changeValue.verb==='add') {
            //console.log("👍 New reaction:", changeValue);
            const userPost = await UserPost.findOne({
                where: {
                    platform_post_id: changeValue.post_id
                }
            });

            if (!userPost) {
                console.log('Post not found.');
                //return res.status(404).json({ message: "Post not found." });
            }

            await userPost.increment('likes', { by: 1 });               
            const user_UUID = userPost.user_uuid;
            const account_social_userid = userPost.social_user_id;
            const account_platform = userPost.post_platform;
            const activity_type = "like";
            const activity_subType = "posts";
            const action = "create";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: '',
                activity_subType_id: changeValue.post_id,
            };
            const source_type = 'webhook';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            
        } else if(changeValue && changeValue.item === 'reaction' && changeValue.reaction_type==='like' && changeValue.verb==='remove') {
            const userPost = await UserPost.findOne({
                where: {
                    platform_post_id: changeValue.post_id
                }
            });

            if (!userPost) {
                console.log('Post not found.');
                //return res.status(404).json({ message: "Post not found." });
            }

            if (userPost.likes > 0) {
                await userPost.decrement('likes', { by: 1 });
            }            

            const user_UUID = userPost.user_uuid;
            const account_social_userid = userPost.social_user_id;
            const account_platform = userPost.post_platform;
            const activity_type = "like";
            const activity_subType = "posts";
            const action = "delete";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: '',
                activity_subType_id: changeValue.post_id,
            };
            const source_type = 'webhook';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);

        } else if(changeValue && changeValue.item === 'share' && changeValue.verb==='add') {            
            //console.log("👍 New share:", changeValue);
            const userPost = await UserPost.findOne({
                where: {
                    platform_post_id: changeValue.post_id
                }
            });
            if (!userPost) {
                console.log('Post not found.');
                //return res.status(404).json({ message: "Post not found." });
            }

            await userPost.increment('shares', { by: 1 });           

            const user_UUID = userPost.user_uuid;
            const account_social_userid = userPost.social_user_id;
            const account_platform = userPost.post_platform;
            const activity_type = "share";
            const activity_subType = "posts";
            const action = "create";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: '',
                activity_subType_id: changeValue.post_id,
            };
            const source_type = 'webhook';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            
        } else if(changeValue && changeValue.item === 'share' && changeValue.verb==='remove') {            
            console.log("share remove :", changeValue);
            const userPost = await UserPost.findOne({
                where: {
                    platform_post_id: changeValue.post_id
                }
            });
            if (!userPost) {
                console.log('Post not found.');
                //return res.status(404).json({ message: "Post not found." });
            }

            if (userPost.shares > 0) {
                await userPost.decrement('shares', { by: 1 });
            }            

            const user_UUID = userPost.user_uuid;
            const account_social_userid = userPost.social_user_id;
            const account_platform = userPost.post_platform;
            const activity_type = "share";
            const activity_subType = "posts";
            const action = "delete";
            const post_form_id = '';
            const reference_pageID = {
                activity_type_id: '',
                activity_subType_id: changeValue.post_id,
            };
            const source_type = 'webhook';
            const now = new Date();
            const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const nextAPI_call_dateTime = next24FromNow;
            await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            
        } else if(changeValue && changeValue.item === 'comment' && changeValue.verb==='add') {
            //console.log("add comment: ",changeValue);

            // 1. Deduplication Check
            const checkCommentExist = await PostComments.findOne({
                where: { comment_id: changeValue.comment_id }
            });
            if(!checkCommentExist){
                // 2. Find User Post (CRITICAL: Must be found to proceed)
                const userPost = await UserPost.findOne({
                    where: { platform_post_id: changeValue.post_id }
                });
                console.log(`userPost Data: ${userPost}`.green);

                if (!userPost) {
                    console.log(`Post not found for ID: ${changeValue.post_id}. Cannot process comment.`);
                }

                const io = req.app.get('io');

                // 3. Prepare and Create Incoming Comment Record
                const commentData = {
                    user_uuid: userPost.user_uuid,
                    social_userid: userPost.social_user_id,
                    platform_page_Id: userPost.page_id,
                    platform: userPost.post_platform,
                    post_id: changeValue.post_id,
                    comment_id: changeValue.comment_id || null,
                    from_id: changeValue.from.id || null,
                    from_name: changeValue.from.name || null,
                    comment: changeValue.message || '',
                    parent_comment_id: changeValue?.parent_id===changeValue.post_id ? null : changeValue?.parent_id,
                    comment_type: changeValue?.parent_id===changeValue.post_id ? 'top_level' : 'reply',
                    comment_created_time: new Date(changeValue.created_time * 1000).toISOString().replace('Z', '+0000')
                };
                //console.log('commentData', commentData);

                try {
                    // Create comment
                    const createdComment = await PostComments.create(commentData);

                    // 4. Update Post Count for the INCOMING comment
                    await userPost.increment('comments', { by: 1 });

                    // 5. Fetch full comment for Socket.IO event
                    const fullComment = await PostComments.findOne({
                        where: { id: createdComment.id },
                        include: [
                            { model: UserPost,
                            attributes: ['post_media', 'content', 'likes', 'comments', 'shares', 'engagements', 'impressions', 'unique_impressions', 'week_date']
                            },
                        ]
                    });
                    
                    // 6. Log Activity for the INCOMING comment
                    const activityDetails = {
                        user_uuid : userPost.user_uuid,
                        account_social_userid : userPost.social_user_id,
                        account_platform : userPost.post_platform,
                        activity_type : "comment",
                        activity_subType : "posts",
                        action : "create",
                        source_type : 'webhook',
                        post_form_id : '',
                        reference_pageID : {
                            activity_type_id: changeValue.comment_id,
                            activity_subType_id: changeValue.post_id,
                        },
                        nextAPI_call_dateTime : new Date(Date.now() + 24 * 60 * 60 * 1000)
                    }
                    await activityCreate(
                        activityDetails.user_uuid,
                        activityDetails.account_social_userid,
                        activityDetails.account_platform,
                        activityDetails.activity_type,
                        activityDetails.activity_subType,
                        activityDetails.action,
                        activityDetails.source_type,
                        activityDetails.post_form_id,
                        activityDetails.reference_pageID,
                        activityDetails.nextAPI_call_dateTime
                    );
                    //console.log("comment Data: ",fullComment);

                    // 7. Emit Socket.IO event for the INCOMING comment
                    io.to(`post:${String(commentData.post_id)}`).emit('comment:new', {
                        originSocketId: null,
                        data: fullComment
                    });
                    
                    // 8. Build image URL
                    let imageUrl = '';
                    if (userPost.source === 'Platform') {
                        try {
                            // Ensure post_media is treated as JSON if it's a string
                            let media = typeof userPost.post_media === 'string'
                                ? JSON.parse(userPost.post_media)
                                : userPost.post_media;
                            const host = req.get('host');
                            const protocol = req.protocol;
                            imageUrl = media?.img_path ? `${protocol}://${host}/uploads/images/${media.img_path}` : '';
                        } catch (e) {
                            console.error("Error parsing post_media for image URL:", e.message);
                        }
                    } else if (userPost.source === 'API') {
                        imageUrl = userPost.post_media;
                    }

                    // 9. Prepare formatted response for N8N Webhook 1 (Behavior)
                    const formattedResponse = {
                        Post_content: userPost.content,
                        Image_url: imageUrl,
                        Comment: changeValue.message,
                        CommentID: changeValue.comment_id
                    };

                    let commentBehavior;
                    let aiReplyData = null;

                    try {
                        // 10. Call N8N Webhook 1 (Behavior Analysis)
                        const behaviorResponse = await axios.post(`${process.env.N8N_COMMENT_WEBHOOK_URL}`, {
                            formattedResponse
                        });
                        if (behaviorResponse.data && behaviorResponse.data.output) {
                            let objectData = {};
                            if (typeof behaviorResponse.data.output === 'string') {
                                // Fragile string parsing retained from original code for Comment_id and Comment_reply
                                behaviorResponse.data.output.split(',').forEach(part => {
                                    const [key, value] = part.split(':').map(s => s.trim());
                                    if (key && value) {
                                        objectData[key] = value;
                                    }
                                });
                                commentBehavior = objectData.Comment_reply;
                            } else if (typeof behaviorResponse.data.output === 'object') {
                                // Preferred: if N8N returns a JSON object directly
                                objectData = behaviorResponse.data.output;
                                commentBehavior = objectData.Comment_reply;
                            } else {
                                console.warn('N8N webhook 1 returned an unhandled data type for output.');
                            }

                            // 11. Update the original comment with the behavior
                            if (objectData.Comment_id === changeValue.comment_id && commentBehavior) {
                                await PostComments.update(
                                    { comment_behavior: commentBehavior },
                                    { where: { comment_id: objectData.Comment_id } }
                                );
                                console.log("Comment behavior added successfully.");
                            } else {
                                console.warn("Could not find/update comment with behavior data from N8N.");
                            }

                            // 12. Check Auto-Reply Settings
                            const CommentAutoReplySettings = await Settings.findOne({
                                where: { user_uuid: userPost.user_uuid, module_name: "Comment", module_status: "1" },
                                raw: true
                            });

                            if(CommentAutoReplySettings){
                                console.log("auto comment is allowed".green);

                                // 13. Call N8N Webhook 2 (AI Reply Generation)
                                const AI_Reply = await axios.post(`${process.env.N8N_POST_COMMENT_AUTO_REPLY_WEBHOOK}`, {
                                    formattedResponse
                                });
                                
                                // FIX: Ensure AI_Reply data structure is correctly accessed and validated
                                if (AI_Reply.data && AI_Reply.data.output && AI_Reply.data.output.reply) {
                                    aiReplyData = AI_Reply.data.output;
                                    console.log("Received Reply from AI:", aiReplyData);
                                } else {
                                    console.warn('AI Reply webhook returned invalid or empty reply data.');
                                }
                                console.log("Received Reply from AI:" ,AI_Reply.data);
                            }else{
                                console.log("Post comment auto reply is not allowed.".red);
                            }
                        } else {
                            console.warn('N8N webhook 1 returned no output or invalid data.');
                        }
                    } catch (axiosError) {
                        console.error('Error triggering N8N webhook 1 (Behavior):', axiosError.message);
                    }

                    // --- Execute Auto-Reply if data exists ---
                    if (aiReplyData) {
                        try {
                            const socialPageData = await SocialUserPage.findOne({
                                attributes: ['user_uuid', 'token', 'social_userid', 'page_platform', 'pageName'],
                                where: { pageId: userPost.page_id },
                                raw: true
                            });

                            const commentRecord = await PostComments.findOne({
                                where: { comment_id: changeValue.comment_id } // Use the original comment ID
                            });

                            if (!socialPageData || !commentRecord) {
                                console.warn("Cannot auto-reply: Missing page data or original comment record.");
                                return;
                            }

                            const accessToken = socialPageData.token;
                            const replyMessage = aiReplyData.reply;

                            // 14. Post Reply to Social Platform (Assuming Facebook Graph API)
                            const registerRes = await axios.post(
                                `https://graph.facebook.com/v22.0/${changeValue.comment_id}/comments`,
                                {
                                    message: replyMessage,
                                    access_token: accessToken
                                }
                            );

                            const replyData = registerRes.data; // Should contain the new comment ID (replyData.id)
                            console.log("API Reply Data:", replyData);
                            const now = new Date();
                            const formattedDate = now.toISOString().replace(/\.\d+Z$/, '+0000'); // Date format preserved

                            // 15. Create Reply Comment Record
                            const createReply = await PostComments.create({
                                user_uuid: socialPageData.user_uuid,
                                social_userid: socialPageData.social_userid,
                                platform_page_Id: userPost.page_id,
                                post_id: commentRecord.post_id,
                                platform: socialPageData.page_platform,
                                activity_id: null,
                                comment_id: replyData.id,
                                parent_comment_id: changeValue.comment_id, // Reply to the original comment
                                comment: replyMessage || '',
                                from_id: userPost.page_id || null, // Assuming page_id is the source of the reply
                                from_name: socialPageData.pageName || 'Page Admin',
                                comment_type: 'reply',
                                comment_behavior: aiReplyData.behaviour,
                                reaction_like: 0,
                                comment_created_time: formattedDate
                            });

                            // 16. Update Post Count for the AUTO-REPLY
                            // FIX: Comment increment is already done in step 4. This is an auto-reply *to* the comment,
                            // and depending on platform webhooks, the auto-reply may trigger a separate webhook event
                            // where it would be counted. If this code is responsible for counting ALL comments,
                            // then this increment is correct. If the original design relies on the webhook system
                            // to eventually capture this reply as a new 'comment add' event, this is a DUPLICATE increment.
                            // Assuming it must be counted *now* for immediate UI update:
                            // await userPost.increment('comments', { by: 1 }); // **REMOVED TO PREVENT DOUBLE COUNTING**
                            // Rationale: The original incoming comment was counted in step 4. If the platform sends
                            // a new webhook for the page's reply, it will be counted later. If not, the original
                            // logic risks double-counting. We will rely on the initial count.

                            const replyDataFetch = await PostComments.findOne({
                                where: { id: createReply.id },
                                include: [
                                    {
                                        model: UserPost,
                                        attributes: ['post_media', 'content', 'likes', 'week_date'],
                                    },
                                ]
                            });

                            // 17. Log Activity for the AUTO-REPLY
                            const replyActivityDetails = {
                                user_uuid: socialPageData.user_uuid,
                                account_social_userid: socialPageData.social_userid,
                                account_platform: socialPageData.page_platform,
                                activity_type: "comments",
                                activity_subType: "posts",
                                action: "reply",
                                post_form_id: '',
                                reference_pageID: {
                                    activity_type_id: replyData.id,
                                    activity_subType_id: commentRecord.post_id,
                                    title: replyMessage || ''
                                },
                                source_type: 'auto-reply', // Use a meaningful source
                                nextAPI_call_dateTime: '' // Placeholder from original
                            };
                            await activityCreate(
                                replyActivityDetails.user_uuid,
                                replyActivityDetails.account_social_userid,
                                replyActivityDetails.account_platform,
                                replyActivityDetails.activity_type,
                                replyActivityDetails.activity_subType,
                                replyActivityDetails.action,
                                replyActivityDetails.source_type,
                                replyActivityDetails.post_form_id,
                                replyActivityDetails.reference_pageID,
                                replyActivityDetails.nextAPI_call_dateTime
                            );

                            // 18. Emit Socket.IO event for the AUTO-REPLY
                            io.to(`post:${commentRecord.post_id}`).emit('comment:new', {
                                originSocketId: req.headers['x-socket-id'] || null, // Assuming the request context is available
                                data: replyDataFetch
                            });

                            console.log("Comment replied successfully.");

                        } catch (error) {
                            console.error('Facebook comment posting Error:', error.response?.data || error.message);
                        }
                    }
                } catch (e) {
                    console.error('CRITICAL ERROR during initial comment creation/processing:', e.message);
                }
            } else {
                console.log('Comment already found in DB. Skipping processing.');
            }
        } else if(changeValue && changeValue.item === 'comment' && changeValue.verb==='edited'){
            //console.log('webhook comment edit: ',changeValue);
            const fullComment = await PostComments.findOne({
            where: {
                    [Op.or]: [
                        { comment_id: changeValue.comment_id },
                        { parent_comment_id: changeValue.comment_id }
                    ]
                }
            });
            if(fullComment && fullComment.comment!=changeValue.message){
                await fullComment.update({ comment: changeValue.message });
                const user_UUID = fullComment.user_uuid;
                const account_social_userid = fullComment.social_user_id;
                const account_platform = fullComment.post_platform;
                const activity_type = "comment";
                const activity_subType = "posts";
                const action = "update";
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: changeValue.comment_id,
                    activity_subType_id: changeValue.post_id,
                };
                const source_type = 'webhook';
                const now = new Date();
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
                const io = req.app.get('io');           // retrieve the same io instance
                io.to(`post:${String(fullComment.post_id)}`).emit('comment:new', {
                    originSocketId: null,                 // webhook is backend‑originated
                    data: fullComment
                });
                // Call N8N webhook
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: fullComment.post_id
                    }
                });
                if(userPost)
                {
                    let imageUrl = '';
                    if (userPost.source === 'Platform') {
                        let media = typeof userPost.post_media === 'string'
                            ? JSON.parse(userPost.post_media)
                            : userPost.post_media;
                        const host = req.get('host');
                        const protocol = req.protocol;
                        imageUrl = `${protocol}://${host}/uploads/images/${media.img_path}`;
                    } else if (userPost.source === 'API') {
                        imageUrl = userPost.post_media;
                    }
                    // Prepare formattedResponse
                    const formattedResponse = {
                        Post_content: userPost.content,
                        Image_url: imageUrl,
                        Comment: changeValue.message,
                        CommentID: changeValue.comment_id
                    };
                    // Prepare commentData
                    try {
                        const response = await axios.post(`${process.env.N8N_COMMENT_WEBHOOK_URL}`, {
                            formattedResponse
                        });
                        if (response.data && response.data.output) {
                            const commentBehaviorData = response.data.output;
                            const objectData = commentBehaviorData.split(',').reduce((acc, part) => {
                                const [key, value] = part.split(':').map(s => s.trim());
                                acc[key] = value;
                                return acc;
                            }, {});
                            console.log('N8N webhook response:', response.data);
                            // Update the comment_behavior
                            const findComment = await PostComments.findOne({
                                where: {
                                    [Op.or]: [
                                        { comment_id: objectData.Comment_id },
                                        { parent_comment_id: objectData.Comment_id }
                                    ]
                                }
                            });
                            if (findComment) {
                                await findComment.update({
                                    comment_behavior: objectData.Comment_reply
                                });
                            }
                            console.log("Comment behavior added successfully.");
                            // return res.json({
                            //     success: true,
                            //     message: "Comment behavior added successfully."
                            // });
                        } else {
                            console.warn('N8N webhook returned no output.');
                            // return res.status(500).json({
                            //     success: false,
                            //     message: "N8N webhook returned invalid data."
                            // });
                        }
                    } catch (axiosError) {
                        console.error('Error triggering N8N webhook:', axiosError.message);
                        // return res.status(500).json({
                        //     success: false,
                        //     message: "Failed to trigger N8N webhook."
                        // });
                    }
                }
            }
        } else if(changeValue && changeValue.item === 'comment' && changeValue.verb==='remove'){
            //console.log('webhook comment remove: ',changeValue);
            const fullComment = await PostComments.findOne({
            where: {
                    [Op.or]: [
                    { comment_id: changeValue.comment_id },
                    { parent_comment_id: changeValue.comment_id }
                    ]
                }
            });
            if (fullComment) {
                await fullComment.destroy();
                const userPost = await UserPost.findOne({
                    where: {
                        platform_post_id: changeValue.post_id
                    }
                });
                if (!userPost) {
                    console.log('Post not found.');
                    //return res.status(404).json({ message: "Post not found." });
                }
                if (userPost.comments > 0) {
                    await userPost.decrement('comments', { by: 1 });
                }
                const user_UUID = userPost.user_uuid;
                const account_social_userid = userPost.social_user_id;
                const account_platform = userPost.post_platform;
                const activity_type = "comment";
                const activity_subType = "posts";
                const action = "delete";
                const post_form_id = '';
                const reference_pageID = {
                    activity_type_id: '',
                    activity_subType_id: changeValue.post_id,
                };
                const source_type = 'webhook';
                const now = new Date();
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate(user_UUID,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
            }
        } else if(webhookResponse.object === 'page' &&  Array.isArray(webhookResponse.entry) && webhookResponse.entry.some(entry =>
                Array.isArray(entry.messaging) && entry.messaging.some(m => m.message && !m.message.is_echo)
            )) {
            if (req.body.object !== 'page') return;
            const io = req.app.get('io');
            if (!io) return console.error(':warning:  Socket.IO missing');
            /*  Handle every page → every messaging event */
            for (const entry of req.body.entry || []) {
                const pageId = entry.id;
                for (const evt of entry.messaging || []) {
                    try {
                        if (!evt.message || evt.message.is_echo) continue;

                        const text     = evt.message.text || '';
                        const mid      = evt.message.mid;
                        const senderId = evt.sender.id;
                        const tsISO    = new Date(evt.timestamp).toISOString();

                        // 0) dedupe incoming platform message (skip if already stored)
                        if (mid) {
                            const dup = await InboxMessages.findOne({ where: { platform_message_id: mid } });
                            if (dup) {
                                // already processed this incoming message
                                continue;
                            }
                        }

                        // 1) find conversation and page info
                        let convo = await InboxConversations.findOne({
                            where: { external_userid: senderId, social_pageid: pageId }
                        });

                        const socialPage = await SocialUserPage.findOne({
                            where: { pageId, status: 'Connected' },
                            raw: true
                        });
                        if (!socialPage) {
                            console.warn(':no_entry_sign:  Unknown pageId, skip:', pageId);
                            continue;
                        }

                        // 2) if no convo -> create it properly (generate uuid)
                        if (!convo) {
                            convo = await InboxConversations.create({
                                conversation_id : uuidv4(),      // <- create new uuid
                                user_uuid       : socialPage.user_uuid,
                                social_userid   : socialPage.social_userid,
                                social_pageid   : pageId,
                                social_platform : 'facebook',
                                external_userid : senderId,
                                external_username: 'Visitor',
                                snippet         : text,
                                updatedAt       : new Date()
                            });
                        }

                        // 3) is chat open? (safe fetchSockets fallback)
                        let isChatOpen = false;
                        try {
                            const socketsInRoom = await io.in(convo.conversation_id).fetchSockets();
                            isChatOpen = socketsInRoom && socketsInRoom.length > 0;
                        } catch (e) {
                            // older socket.io or unexpected: best-effort fallback
                            try {
                                const room = io.sockets.adapter.rooms.get(convo.conversation_id);
                                isChatOpen = room ? room.size > 0 : false;
                            } catch (ee) {
                                isChatOpen = false;
                            }
                        }

                        // 4) Persist incoming visitor message (now that convo exists)
                        const saved = await InboxMessages.create({
                            conversation_id     : convo.conversation_id,
                            platform_message_id : mid || null,
                            sender_type         : 'visitor',
                            message_text        : text,
                            message_type        : 'text',
                            is_read             : isChatOpen ? 'yes' : 'no',
                            timestamp           : tsISO
                        });

                        // 5) Update convo snippet & updatedAt
                        await convo.update({
                            snippet   : text,
                            updatedAt : new Date()
                        });

                        // 6) Real-time emits for visitor message
                        io.to(convo.conversation_id).emit('receive_message', {
                            ...saved.toJSON(),
                            external_username : convo.external_username,
                            social_platform   : 'facebook',
                            page_id           : convo.social_pageid,
                            sender_id         : convo.external_userid,
                        });

                        if (!isChatOpen) {
                            io.to(convo.conversation_id).emit('refresh_sidebar', {
                                conversation_id : convo.conversation_id,
                                snippet         : text,
                                unread_delta    : 1
                            });
                        }

                        io.to(convo.user_uuid).emit('global_inbox_update', {
                            conversation_id     : convo.conversation_id,
                            external_username   : convo.external_username,
                            social_platform     : 'facebook',
                            page_id             : convo.social_pageid,
                            sender_id           : convo.external_userid,
                            message_text        : text,
                            platform_message_id : mid || null,
                            sender_type         : 'visitor',
                            is_read             : isChatOpen ? 'yes' : 'no',
                            timestamp           : tsISO
                        });

                        // 7) activityCreate (keeps your existing audit)
                        const user_UUID = convo.user_uuid;
                        const account_social_userid = convo.social_userid;
                        const account_platform = 'facebook';
                        const activity_type = "message";
                        const activity_subType = "page";
                        const action = "create";
                        const post_form_id = '';
                        const reference_pageID = {
                            activity_type_id: convo.social_pageid,
                            activity_subType_id: mid,
                        };
                        const source_type = 'webhook';
                        const now = new Date();
                        const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                        const nextAPI_call_dateTime = next24FromNow;
                        await activityCreate(user_UUID, account_social_userid, account_platform, activity_type, activity_subType, action, source_type, post_form_id, reference_pageID, nextAPI_call_dateTime);

                        // 8) Optional: trigger N8N (only if settings + knowledge base exist)
                        const settings = await Settings.findOne({
                            where: { user_uuid: socialPage.user_uuid, module_name: "Message", module_status: '1' },
                            raw: true
                        });

                        const knowledgeBaseMeta = await KnowledgebaseMeta.findOne({
                            where: { user_uuid: socialPage.user_uuid, pages_id: pageId },
                            raw: true
                        });

                        const knowledgeBaseData = knowledgeBaseMeta ? await KnowledgeBase.findOne({
                            where: { user_uuid: socialPage.user_uuid, id: knowledgeBaseMeta.knowledgeBase_id, status: "Connected" },
                            raw: true
                        }) : null;

                        if (socialPage && settings && knowledgeBaseMeta && knowledgeBaseData) {
                            try {
                                const response = await axios.post(`${process.env.N8N_USER_MESSAGE_AUTO_REPLY_WEBHOOK}`, {
                                    message: text,
                                    meta_data: knowledgeBaseMeta.namespace_id
                                }, { timeout: 15_000 });

                                console.log("🤖 N8N auto-reply response", response.data);

                                // Accept both shapes: { reply: '...' } or { output: { reply: '...' } }
                                const replyText = (response.data && (response.data.reply || (response.data.output && response.data.output.reply))) || null;

                                if (replyText && replyText.trim()) {
                                    // 8.a) send reply to Facebook and capture the fb returned message id if any
                                    const pageToken = socialPage.token;
                                    const fbSendUrl = `https://graph.facebook.com/v22.0/me/messages`;
                                    let fbSendResult = null;
                                    try {
                                        fbSendResult = await axios.post(
                                            fbSendUrl,
                                            {
                                                recipient: { id: senderId },
                                                message: { text: replyText },
                                            },
                                            { params: { access_token: pageToken } }
                                        );
                                    } catch (fbErr) {
                                        console.error('❌ Error sending reply to FB:', fbErr.response?.data || fbErr.message);
                                        // don't throw — still try to save+emit the AI reply locally so the inbox shows it
                                    }

                                    const fbMessageId = fbSendResult?.data?.message_id || fbSendResult?.data?.message?.mid || null;

                                    // 8.b) save AI reply in DB
                                    const nowUtc = new Date().toISOString().replace('Z', '+0000');
                                    const aiMsg = await InboxMessages.create({
                                        conversation_id     : convo.conversation_id,
                                        platform_message_id : fbMessageId,
                                        sender_type         : 'page',
                                        message_text        : replyText,
                                        message_type        : 'text',
                                        is_read             : 'yes',
                                        timestamp           : nowUtc
                                    });

                                    // 8.c) update conversation snippet & updatedAt
                                    await convo.update({
                                        snippet   : replyText,
                                        updatedAt : new Date()
                                    });

                                    // ✅ Always emit to both rooms (conversation + global inbox)
                                    // React already handles deduplication by comparing conversation_id

                                    // 1️⃣ Emit to conversation room (if open or later joined)
                                    io.to(convo.conversation_id).emit('receive_message', {
                                        ...aiMsg.toJSON(),
                                        external_username : convo.external_username,
                                        social_platform   : 'facebook',
                                        page_id           : convo.social_pageid,
                                        sender_id         : convo.social_pageid,
                                        is_auto_reply     : true
                                    });

                                    // 2️⃣ Always emit to global inbox (this triggers sidebar refresh)
                                    io.to(convo.user_uuid).emit('global_inbox_update', {
                                        conversation_id     : convo.conversation_id,
                                        external_username   : convo.external_username,
                                        social_platform     : 'facebook',
                                        page_id             : convo.social_pageid,
                                        sender_id           : convo.social_pageid,
                                        message_text        : replyText,
                                        sender_type         : 'page',
                                        is_auto_reply       : true,
                                        timestamp           : nowUtc
                                    });

                                    // 3️⃣ Force-refresh sidebar so unread badge/snippet update
                                    io.to(convo.user_uuid).emit('refresh_sidebar', {
                                        conversation_id : convo.conversation_id,
                                        snippet         : replyText,
                                        unread_delta    : 1
                                    });

                                    console.log(`✅ Auto-reply emitted for conversation ${convo.conversation_id}`);

                                } // end if replyText
                            } catch (err) {
                                console.error('❌ N8N auto-reply error:', err.response?.data || err.message);
                            }
                        } // end if settings + knowledge base
                    } catch (outerErr) {
                        console.error('Webhook message processing error:', outerErr && (outerErr.response?.data || outerErr.message || outerErr));
                        // continue with next evt
                        continue;
                    }
                } // end for evt

            }
        }
        
    } catch (error) {
        console.error('Webhook processing error:', error.message);
        // return res.status(500).json({
        //     success: false,
        //     message: "Error processing webhook."
        // });
    }
    
}); 

//End Facebook comments section

//start setting
app.post(`/${prefix}/settings/system_auto_functions`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) {
            return res.status(401).json({ message: "Token not valid." });
        }
        const { module_name, module_status } = req.body;        
        const user_uuid = authData?.userData?.uuid;
        if (!module_name || typeof module_status === 'undefined' || !user_uuid) {
            return res.status(400).json({ message: "Invalid or missing data." });
        }
        try {            
            if(module_name==='Message' && module_status===true){
                const knowledgeBaseCount = await KnowledgeBase.count({
                    where: {
                        user_uuid: authData.userData.uuid,
                        //status: 'Connected'
                    }
                });

                if(knowledgeBaseCount > 0){
                    const [setting, created] = await Settings.findOrCreate({
                        where: {
                            user_uuid,
                            module_name,
                        },
                        defaults: {
                            module_status,
                        },
                    });

                    await setting.update({ module_status });
                    return res.status(200).json({
                        success: true,
                        message: "System auto-functions setting update successfully.",
                    });
                } else {
                    return res.status(401).json({
                        success: false,
                        message: "Required knowledge base setup for messages auto reply.",
                    });
                }
            } else {
                const [setting, created] = await Settings.findOrCreate({
                    where: {
                        user_uuid,
                        module_name,
                    },
                    defaults: {
                        module_status,
                    },
                });
                if (!created) {
                    await setting.update({ module_status });
                }
                return res.status(200).json({
                    success: true,
                    message: "System auto-functions setting saved successfully.",
                });
            }
        } catch (error) {
            console.error("Settings save error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error.",
                error: error.message || error,
            });
        }
    });
});

app.get(`/${prefix}/settings`, async (req, res) => {
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
        const settingData = await Settings.findAll({
            where: {
                user_uuid: authData.userData.uuid                    
            },
            attributes: {
                exclude: ["user_uuid","createdAt", "updatedAt"]
            },
        });

        const knowledgeBaseCount = await KnowledgeBase.count({
            where: {
                user_uuid: authData.userData.uuid,
                //status: 'Connected'
            }
        });

        if(settingData){
            return res.json({
                success: true,
                settingData: settingData,
                knowledgeBaseCount:knowledgeBaseCount
            });
        } else {
            return res.json({
                success: false,
                settingData: ''
            });
        }        

    });
});

app.get(`/${prefix}/account-overview`, async (req, res) => {
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
        try {
        // 1. Get connected social users
        const social_user_data = await SocialUser.findAll({
            where: {
                user_id: authData.userData.uuid,
                status: "Connected"
            },
            attributes: ["social_id"],
            raw: true
        });

        const userSocialIds = social_user_data.map(su => su.social_id);        
        const social_user_pages = await SocialUserPage.findAll({
            where: {
                user_uuid: authData.userData.uuid,
                social_userid: userSocialIds, 
                status: "Connected"
            },
            attributes: ["pageId"],
            raw: true
        }); 
        
        const userPosts = social_user_pages.map(pageID => pageID.pageId);
        // const social_user_pages_posts = await UserPost.findAll({
        //     where: {
        //         page_id: userPosts, 
        //         status: "1"
        //     },            
        //     raw: true
        // });

        const social_user_pages_posts_count = await UserPost.count({
            where: {
                page_id: userPosts, 
                status: "1"
            }
        });

        return res.json({
            success: true,
            totalCreatedPosts: social_user_pages_posts_count
        });
        } catch (error) {
        console.error("Error fetching social users/pages:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
        }
    });
});
//End setting

app.post(`/${prefix}/page/status`, async (req, res) => {
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

        const findPageinfo = await SocialUserPage.findOne({
            where: {
                user_uuid: authData.userData.uuid,
                pageId: req.body.pageId
            }
        });

        await findPageinfo.update({
            status: req.body.pageStatus
        }); 
        
        const user_uuid = authData.userData.uuid; 
        const account_social_userid = findPageinfo.social_userid;
        const account_platform = findPageinfo.page_platform;
        const activity_type = "social";
        const activity_subType = "page";
        const post_form_id = '';
        const action = req.body.pageStatus === "Connected" ? "connect" : "disconnect";
        const reference_pageID = { activity_type_id: {}, activity_subType_id: findPageinfo.pageId, title:findPageinfo.pageName };
        const source_type = '';
        const nextAPI_call_dateTime = '';
        await activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime);
        
        if(findPageinfo){
            return res.json({
                success: true,
                message:'Page status update succssfully.'
            });
        } else {
            return res.json({
                success: false,
                message:'Something went wrong while update status.'
            });
        }       

    });
});

// Inbox Page API starts
app.get(`/${prefix}/messages`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) return res.status(401).json({ message: 'Token not valid.' });
        try {
            /* Fetch all “Connected” Facebook pages for this user */
            const connectedPages = await SocialUserPage.findAll({
                attributes: ['pageId', 'page_picture', 'pageName'],
                where: { user_uuid: authData.userData.uuid, page_platform: 'facebook', status: 'Connected' },
                raw: true
            });
            if (!connectedPages.length) {
                return res.status(200).json({ success: true, data: [], message: 'No connected pages.' });
            }
            /* Build quick lookup: pageId → pageData */
            const pageLookup = {};
            connectedPages.forEach(p => {
                pageLookup[p.pageId] = p; // { page_picture, pageName }
            });
            const connectedPageIds = Object.keys(pageLookup);
            /* Get conversations ONLY for those connected pages */
            const dbConversations = await InboxConversations.findAll({
                where: { user_uuid: authData.userData.uuid, social_platform: 'facebook', social_pageid: connectedPageIds },
                raw: true
            });
            if (!dbConversations.length) {
                return res.status(200).json({ success: true, data: [] });
            }
            /* Fetch all messages for those conversations */
            const convoIds = dbConversations.map(c => c.conversation_id);
            const dbMessages = await InboxMessages.findAll({
                where: { conversation_id: convoIds },
                order: [['timestamp', 'DESC']],
                raw: true
            });
            /* Group messages per conversation */
            const msgByConvo = {};
            for (const m of dbMessages) {
                if (!msgByConvo[m.conversation_id]) msgByConvo[m.conversation_id] = [];
                msgByConvo[m.conversation_id].push({
                    platform_message_id: m.platform_message_id,
                    message_text: m.message_text,
                    sender_type: m.sender_type,
                    message_type: m.message_type,
                    is_read: m.is_read,
                    timestamp: m.timestamp
                });
            }
            /* Assemble payload */
            const payload = dbConversations.map(c => {
                const messages = msgByConvo[c.conversation_id] || [];
                messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp) );
                const latestMsgTs = messages.length > 0 ? new Date(messages[0].timestamp).getTime() : 0;
                const pageData = pageLookup[c.social_pageid]; // always exists here
                const unreaded_messages = messages.filter( m => m.is_read === 'no' && m.sender_type === 'visitor' ).length;
                return {
                    page_id: c.social_pageid,
                    page_img: pageData.page_picture,
                    pageName: pageData.pageName,
                    platform: c.social_platform,
                    conversation_id: c.conversation_id,
                    snippet: c.snippet,
                    unreaded_messages,
                    external_userid: c.external_userid,
                    external_username: c.external_username,
                    messages,
                    latestMessageTime: latestMsgTs
                };
            });
            /* Sort newest‑first and strip helper field */
            payload.sort((a, b) => b.latestMessageTime - a.latestMessageTime);
            payload.forEach(c => delete c.latestMessageTime);
            return res.status(200).json({
                success: true,
                message: 'Conversations and messages synced (Connected pages only).',
                data: payload
            });
        } catch (fatal) {
            console.error(':fire:  Fatal in /messages:', fatal);
            return res.status(500).json({
                success: false,
                message: 'Internal server error.',
                error: fatal.message
            });
        }
    });
});
app.patch(`/${prefix}/messages/mark-read/:conversationId`, async (req, res) => {
    const { conversationId } = req.params;
    console.log("update Unreaded: ",req.params);
    try {
        await InboxMessages.update(
            { is_read: 'yes' },
            {
                where: {
                    conversation_id: conversationId,
                    is_read: 'no',
                    sender_type: 'visitor'
                }
            }
        );
        return res.json({ success: true, message: 'Messages marked as read.' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});
//Inbox Page API Ends

// fetch top post function
app.post(`/${prefix}/top_posts`, async (req, res) => {
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

        const User_uuid = req.body.userUuid;
        const platform = req.body.platform;
        const pageId = req.body.pageId;
        try{
            const UserTopPosts = await UserPost.findAll({
                where: {
                    user_uuid : User_uuid,
                    post_platform : platform,
                    page_id : pageId,
                },
                order: [['unique_impressions', 'DESC']],   // <-- sort by views, highest first
                limit: 5,  
                raw: true
            });
            // console.log("User Top post data",UserTopPosts);
            return res.status(200).json({
                success: true,
                message: `${platform} posts fetched successfully.`,
                data: UserTopPosts,
                status: "fulfilled"
            });
        } catch (error){
            console.error('Top Posts fetch error:', error.response?.data || error.message);
            return res.status(500).json({ success: false, error: 'Failed to get Top Posts.' });
        }
    });
});

app.post(`/${prefix}/fetch-profileAnalytics`, async (req, res) => {
    const token = req.token;
    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided." });
    }
    jwt.verify(token, secretKey, async (err, authData) => {
        if (err) { return res.status(401).json({ success: false, message: "Token not valid." }); }
        const userData = authData.userData;
        // Week ranges (DATE for Analytics / week_date; UNIX for schedule_time)
        const startOfThisWeekDate = moment().startOf('isoWeek').format('YYYY-MM-DD');
        const endOfThisWeekDate   = moment().endOf('isoWeek').format('YYYY-MM-DD');
        const startOfLastWeekDate = moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD');
        const endOfLastWeekDate   = moment().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD');
        const startOfThisWeekUnix = moment().startOf('isoWeek').unix();
        const endOfThisWeekUnix   = moment().endOf('isoWeek').unix();
        const connectedPagesData = await SocialUserPage.findAll({
            attributes: ['pageId', 'social_userid'],
            where: { user_uuid: userData.uuid, status: "Connected" },
            raw: true
        });
        const pageToSocialUserMap = {};
        connectedPagesData.forEach(p => {
            pageToSocialUserMap[p.pageId] = p.social_userid;
        });
        const connectedPageIds = connectedPagesData.map(p => p.pageId);
        try {
            const calcGrowth = (thisVal, lastVal) => {
                if (lastVal > 0) return (((thisVal - lastVal) / lastVal) * 100).toFixed(2);
                return thisVal > 0 ? "100.00" : "0.00";
            };
            const sumCounts = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
            // ---------------- 1) POSTS ----------------
            const getSocialUserIdFromRow = (row) => {
                return row?.social_user_id ?? row?.social_userid ?? row?.socialuserid ?? row?.socialUserId ?? null;
            };
            const getNumericCountFromRow = (row) => {
                if (!row) return 0;
                if (row.count !== undefined && row.count !== null) {
                    const n = Number(row.count);
                    if (!Number.isNaN(n)) return n;
                }
                const candidateKeys = Object.keys(row).filter(k => /count|COUNT|cnt|_count/i.test(k));
                for (const k of candidateKeys) {
                    const v = row[k];
                    const n = Number(v);
                    if (!Number.isNaN(n)) return n;
                }
                for (const v of Object.values(row)) {
                    const n = Number(v);
                    if (!Number.isNaN(n)) return n;
                    if (v && typeof v === 'object') {
                        for (const inner of Object.values(v)) {
                            const nn = Number(inner);
                            if (!Number.isNaN(nn)) return nn;
                        }
                    }
                }
                return 0;
            };
            const sumCountsFromRows = (rows) => Array.isArray(rows) ? rows.reduce((s, r) => s + getNumericCountFromRow(r), 0) : 0;
            const postsThisWeek = await UserPost.findAll({
                attributes: ['social_user_id', [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('id'))), 'count']],
                where: { user_uuid: userData.uuid, page_id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfThisWeekDate, endOfThisWeekDate] } },
                group: ['social_user_id'],
                raw: true
            });
            const postsLastWeek = await UserPost.findAll({
                attributes: ['social_user_id', [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('id'))), 'count']],
                where: { user_uuid: userData.uuid, page_id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfLastWeekDate, endOfLastWeekDate] } },
                group: ['social_user_id'],
                raw: true
            });
            const postsTotal = await UserPost.findAll({
                attributes: ['social_user_id', [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('id'))), 'count']],
                where: { user_uuid: userData.uuid, page_id: { [Op.in]: connectedPageIds } },
                group: ['social_user_id'],
                raw: true
            });
            const postsBySocialUser = { socialUsers: [], summary: {} };
            postsTotal.forEach(p => {
                const id = getSocialUserIdFromRow(p);
                const totalPosts = getNumericCountFromRow(p);
                postsBySocialUser.socialUsers.push({ id, totalPosts });
            });
            const totalPostsThisWeek = sumCountsFromRows(postsThisWeek);
            const totalPostsLastWeek = sumCountsFromRows(postsLastWeek);
            const grandTotalPosts = sumCountsFromRows(postsTotal);
            postsBySocialUser.summary = {
                growthRate: calcGrowth(totalPostsThisWeek, totalPostsLastWeek),
                totalPosts: grandTotalPosts
            };
            // ---------------- 2) FOLLOWERS ----------------
            const followersThisWeekRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('total_page_followers')), 'followers'] ],
                where: { user_uuid: userData.uuid, analytic_type: 'page_daily_follows', platform_page_Id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfThisWeekDate, endOfThisWeekDate] } },
                group: ['platform_page_Id'],
                raw: true
            });
            const followersLastWeekRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('total_page_followers')), 'followers'] ],
                where: { user_uuid: userData.uuid, analytic_type: 'page_daily_follows', platform_page_Id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfLastWeekDate, endOfLastWeekDate] } },
                group: ['platform_page_Id'],
                raw: true
            });
            const followersTotalRaw = await SocialUserPage.findAll({
                attributes: ['pageId', 'social_userid', [sequelize.fn('SUM', sequelize.col('total_followers')), 'followers'] ],
                where: { user_uuid: userData.uuid, pageId: { [Op.in]: connectedPageIds } },
                group: ['pageId', 'social_userid'],
                raw: true
            });
            const mergeFollowersBySocialUser = (rawData) => {
                const combined = {};
                rawData.forEach(row => {
                    const socialUserId = pageToSocialUserMap[row.platform_page_Id] || row.social_userid;
                    if (!combined[socialUserId]) combined[socialUserId] = 0;
                    combined[socialUserId] += Number(row.followers || 0);
                });
                return combined;
            };
            const followersThisWeek = mergeFollowersBySocialUser(followersThisWeekRaw);
            const followersLastWeek = mergeFollowersBySocialUser(followersLastWeekRaw);
            const followersTotal = mergeFollowersBySocialUser(followersTotalRaw);
            const followersBySocialUser = { socialUsers: [], summary: {} };
            Object.keys(followersTotal).forEach(id => {
                followersBySocialUser.socialUsers.push({ id, totalFollowers: followersTotal[id] });
            });
            followersBySocialUser.summary = {
                growthRate: calcGrowth(sumCounts(followersThisWeek), sumCounts(followersLastWeek)),
                totalFollowers: sumCounts(followersTotal)
            };
            // ---------------- 3) ENGAGEMENT ----------------
            const engagementThisWeekRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('page_post_engagements')), 'engagement'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfThisWeekDate, endOfThisWeekDate] } },
                group: ['platform_page_Id'],
                raw: true
            });
            const engagementLastWeekRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('page_post_engagements')), 'engagement'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfLastWeekDate, endOfLastWeekDate] } },
                group: ['platform_page_Id'],
                raw: true
            });
            const engagementTotalRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('page_post_engagements')), 'engagement'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds } },
                group: ['platform_page_Id'],
                raw: true
            });
            const reachTotalForEngRateRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('total_page_impressions_unique')), 'reach'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds } },
                group: ['platform_page_Id'],
                raw: true
            });
            const mergeBySocialUser = (rawData, field) => {
                const combined = {};
                rawData.forEach(row => {
                    const socialUserId = pageToSocialUserMap[row.platform_page_Id];
                    if (!combined[socialUserId]) combined[socialUserId] = 0;
                    combined[socialUserId] += Number(row[field] || 0);
                });
                return combined;
            };
            const engagementThisWeek = mergeBySocialUser(engagementThisWeekRaw, 'engagement');
            const engagementLastWeek = mergeBySocialUser(engagementLastWeekRaw, 'engagement');
            const engagementTotal = mergeBySocialUser(engagementTotalRaw, 'engagement');
            const reachForEngRate = mergeBySocialUser(reachTotalForEngRateRaw, 'reach');
            const engagementBySocialUser = { socialUsers: [], summary: {} };
            Object.keys(engagementTotal).forEach(id => {
                const totalEngagement = engagementTotal[id];
                const totalReach = reachForEngRate[id] || 0;
                const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : "0.00";
                engagementBySocialUser.socialUsers.push({ id, totalEngagement, engagementRate });
            });
            const totalEngThisWeek = sumCounts(engagementThisWeek);
            const totalEngLastWeek = sumCounts(engagementLastWeek);
            const grandEngagement = sumCounts(engagementTotal);
            const grandReachForRate = sumCounts(reachForEngRate);
            const overallEngRate = grandReachForRate > 0 ? ((grandEngagement / grandReachForRate) * 100).toFixed(2) : "0.00";
            engagementBySocialUser.summary = {
                growthRate: calcGrowth(totalEngThisWeek, totalEngLastWeek),
                totalEngagement: grandEngagement,
                engagementRate: overallEngRate
            };
            // ---------------- 4) REACH ----------------
            const reachThisWeekRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('total_page_impressions_unique')), 'reach'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfThisWeekDate, endOfThisWeekDate] } },
                group: ['platform_page_Id'],
                raw: true
            });
            const reachLastWeekRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('total_page_impressions_unique')), 'reach'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds }, week_date: { [Op.between]: [startOfLastWeekDate, endOfLastWeekDate] } },
                group: ['platform_page_Id'],
                raw: true
            });
            const reachTotalRaw = await Analytics.findAll({
                attributes: ['platform_page_Id', [sequelize.fn('SUM', sequelize.col('total_page_impressions_unique')), 'reach'] ],
                where: { user_uuid: userData.uuid, platform_page_Id: { [Op.in]: connectedPageIds } },
                group: ['platform_page_Id'],
                raw: true
            });
            const reachThisWeek = mergeBySocialUser(reachThisWeekRaw, 'reach');
            const reachLastWeek = mergeBySocialUser(reachLastWeekRaw, 'reach');
            const reachTotal = mergeBySocialUser(reachTotalRaw, 'reach');
            const reachBySocialUser = { socialUsers: [], summary: {} };
            Object.keys(reachTotal).forEach(id => {
                reachBySocialUser.socialUsers.push({ id, totalReach: reachTotal[id] });
            });
            reachBySocialUser.summary = {
                growthRate: calcGrowth(sumCounts(reachThisWeek), sumCounts(reachLastWeek)),
                totalReach: sumCounts(reachTotal)
            };
            // ---------------- 5) SCHEDULED POSTS (status=2) ----------------
            const scheduledPosts = await UserPost.findAll({
                where: {
                    user_uuid: userData.uuid,
                    page_id: { [Op.in]: connectedPageIds },
                    schedule_time: { [Op.between]: [startOfThisWeekUnix, endOfThisWeekUnix] },
                    status: '2',
                },
                order: [['schedule_time', 'ASC']],
                raw: true
            });
            const enrichedPosts = await Promise.all(
                scheduledPosts.map(async (post) => {
                const socialPageData = await SocialUserPage.findOne({
                    where: { pageId: post.page_id }
                });
                const { createdAt, updatedAt, id, token, ...pageData } = socialPageData?.dataValues || {};
                    return { ...post, pageData: pageData || null };
                })
            );
            // ---------------- RESPONSE ----------------
            return res.status(200).json({
                success: true,
                profileAnalytics: {
                    posts: postsBySocialUser,
                    followers: followersBySocialUser,
                    engagement: engagementBySocialUser,
                    reach: reachBySocialUser
                },
                scheduledPostsThisWeek: enrichedPosts
            });
        } catch (error) {
            console.error('Profile analytics fetch error:', error);
            return res.status(500).json({ success: false, error: 'Failed to fetch profile analytics.' });
        }
    });
});

// start recent activities api
app.post(`/${prefix}/recent/activities`, async (req, res) => {
    const token = req.token;
    try {
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
            const now = new Date(req.body.dateTime);
            const cutoff24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const findUserLessThan24Hours = await Activity.findAll({
                where: {
                    user_uuid: authData.userData.uuid,
                    activity_dateTime: {
                        [Op.gte]: cutoff24
                    },
                    activity_type: {
                        [Op.notIn]: ["user"],
                    }
                },
                order: [["createdAt", "DESC"]]
            });
            const activitiesWithContent = [];
            for(const activityData of findUserLessThan24Hours){
                const activityByUser = await User.findOne({
                            where: { uuid :activityData.user_uuid },
                            attributes: [ "firstName", "lastName" ],
                            raw: true
                        });
                if(activityData.activity_type==='posts'){
                    const ref = JSON.parse(activityData.reference_pageID);
                    if(activityData.action =='delete'){
                        const postPageData = await SocialUserPage.findOne({
                            where: { pageId :ref.activity_subType_id },
                            attributes: ["pageName", "page_picture"],
                            raw: true
                        });
                        const finalData = {
                            id: ref.activity_type_id,
                            activityByUserID: activityData.user_uuid,
                            activityByUserName: `${activityByUser.firstName} ${activityByUser.lastName}`,
                            activity_type: activityData.activity_type,
                            activity_subType: activityData.activity_subType,
                            activity_action: activityData.action,
                            account_platform: activityData.account_platform,
                            activity_dateTime: activityData.activity_dateTime,
                            pageOrSocialUserName: postPageData?.pageName ?? '',
                            pageImage: postPageData?.page_picture ?? '',
                            postSchedule_time: '',
                        }
                        activitiesWithContent.push(finalData);
                    } else {
                        const ref = JSON.parse(activityData.reference_pageID);
                        const postPageData = await SocialUserPage.findOne({
                            where: { pageId :ref.activity_subType_id },
                            attributes: ["pageName", "page_picture"],
                            raw: true
                        });
                        // const UserPosts = await UserPost.findAll({
                        //     where: { id :ref.activity_type_id, source:'Platform' },
                        //     attributes: [ "id", "schedule_time" ],
                        //     raw: true
                        // });
                        // for(const postData of UserPosts){
                            const finalData = {
                                id: ref.activity_type_id,
                                activityByUserID: activityData.user_uuid,
                                activityByUserName: `${activityByUser.firstName} ${activityByUser.lastName}`,
                                activity_type: activityData.activity_type,
                                activity_subType: activityData.activity_subType,
                                activity_action: activityData.action,
                                account_platform: activityData.account_platform,
                                activity_dateTime: activityData.activity_dateTime,
                                pageOrSocialUserName: postPageData?.pageName ?? '',
                                pageImage: postPageData?.page_picture ?? '',
                                postSchedule_time: ref.schedule_time || '',
                                references: activityData.reference_pageID
                            }
                            activitiesWithContent.push(finalData);
                        // }
                    }
                } else if(activityData.activity_type==='social' && activityData.activity_subType==='page'){
                    const ref = JSON.parse(activityData.reference_pageID);
                    const postPageData = await SocialUserPage.findOne({
                        where: {
                            pageId :ref.activity_subType_id,
                        },
                        attributes: [
                            "pageName",
                            "page_picture",
                        ],
                        raw: true
                    });
                    const finalData = {
                        id: ref.activity_subType_id,
                        activityByUserID: activityData.user_uuid,
                        activityByUserName: `${activityByUser.firstName} ${activityByUser.lastName}`,
                        activity_type: activityData.activity_type,
                        activity_subType: activityData.activity_subType,
                        activity_action: activityData.action,
                        account_platform: activityData.account_platform,
                        activity_dateTime: activityData.activity_dateTime,
                        pageOrSocialUserName: ref.title,
                        pageImage: postPageData?.page_picture ?? '',
                        postSchedule_time: '',
                    }
                    activitiesWithContent.push(finalData);
                } else if(activityData.activity_type==='social' && activityData.activity_subType==='account'){
                    const ref = JSON.parse(activityData.reference_pageID);
                    const finalData = {
                        id: '',
                        activityByUserID: activityData.user_uuid,
                        activityByUserName: `${activityByUser.firstName} ${activityByUser.lastName}`,
                        activity_type: activityData.activity_type,
                        activity_subType: activityData.activity_subType,
                        activity_action: activityData.action,
                        account_platform: activityData.account_platform,
                        activity_dateTime: activityData.activity_dateTime,
                        pageOrSocialUserName: ref.title,
                        pageImage: '',
                        postSchedule_time: '',
                    }
                    activitiesWithContent.push(finalData);
                } else if(activityData.activity_type==='ads'){
                    const ref = JSON.parse(activityData.reference_pageID);
                    const finalData = {
                        id: ref.activity_subType_id,
                        activityByUserID: activityData.user_uuid,
                        activityByUserName: `${activityByUser.firstName} ${activityByUser.lastName}`,
                        activity_type: activityData.activity_type,
                        activity_subType: activityData.activity_subType,
                        activity_action: activityData.action,
                        account_platform: activityData.account_platform,
                        activity_dateTime: activityData.activity_dateTime,
                        pageOrSocialUserName: ref.title,
                        pageImage: '',
                        postSchedule_time: '',
                    }
                    activitiesWithContent.push(finalData);
                }
            }
            return res.status(200).json({
                success: true,
                data: activitiesWithContent,
                message: "Fetched last 24 hours activities successfully.",
            });
        });
    } catch (err) {
        console.error("Error fetching activities:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// end recent activities api

// Extend facebook page and user access token
cron.schedule('0 0 1 * *', async () => {    
    try {
        const users = await SocialUser.findAll();
        const socialPageData = await SocialUserPage.findAll({
            where: {
                social_userid: users.map(user => user.social_id) 
            }
        });
        const userWithPageData = [];
        for (const user of users) {            
            try {
                const userPages = socialPageData.filter(page => page.social_userid === user.social_id);
                if (userPages.length === 0) {
                    console.log(`User ${user.social_id} has no pages.`);
                    continue;
                }
                // Exchange user token for a new one
                const appId = facebookAPPID;
                const appSecret = facebookAPPSecret;    
                const url = `https://graph.facebook.com/v12.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${user.user_token}`;
                const response = await axios.get(url);
                const newUserToken = response.data.access_token;

                // Update the user's token
                await user.update({ user_token: newUserToken });

                // Update each page's token
                for (const page of userPages) {
                    try {
                        await extendPageToken(newUserToken, page.pageId);
                    } catch (pageError) {
                        console.error(`Error updating page ${page.pageId} for user ${user.social_id}:`, pageError.message);
                    }
                }

                // Prepare user data with all pages
                const { id, email, img_url, user_id, status, createdAt, updatedAt, ...userData } = user.toJSON();
                const pagesData = userPages.map(page => {
                    const { createdAt: pageCreatedAt, updatedAt: pageUpdatedAt, id: pageId, category: pageCategory, modify_to: pageModifyTo, social_userid, ...pageData } = page.dataValues;
                    return pageData;
                });
                userWithPageData.push({
                    ...userData,
                    pageData: pagesData
                });
            } catch (userError) {
                console.error(`Error processing user ${user.social_id}:`, userError.message);
            }
        }
        console.log('Successfully extended tokens and retrieved user data.');
    } catch (error) {
        console.error('Error in scheduled task:', error.message);
    }
});

async function extendPageToken(userToken, page_Id) {
    const url = `https://graph.facebook.com/v12.0/${page_Id}?fields=access_token&access_token=${userToken}`;    
    try {
        const response = await axios.get(url);        
        const updatePageToken = await SocialUserPage.findOne({ where: { pageId: page_Id } });
        await updatePageToken.update({
            token: response.data.access_token
        });
    } catch (error) {
        console.error('Error extending page token:', error);
        throw error;
    }
}
// End Extend facebook page and user access token

// Get posts published with cron jobs on facebook & linkedin pages
cron.schedule('* * * * *', async () => {
    console.log('Cron started at', new Date().toISOString());
    try {
        const currentTimestamp = moment.tz(localTimezone).unix();
        // Fetch only scheduled posts that are due
        const scheduledPosts = await UserPost.findAll({
            where: {
                schedule_time: {
                    [Op.and]: [
                        { [Op.ne]: null },
                        { [Op.ne]: '' },
                        { [Op.lte]: currentTimestamp }
                    ]
                },
                status: '2', // scheduled
            },
            raw: true
        });
        if (!scheduledPosts.length) {
            console.log('No scheduled posts to process.');
            return;
        }
        console.log(`Found ${scheduledPosts.length} scheduled posts to publish.`);
        // Get unique page IDs
        const pageIds = [...new Set(scheduledPosts.map(post => post.page_id))];
        // Fetch connected pages
        const socialPages = await SocialUserPage.findAll({
            where: {
                pageId: { [Op.in]: pageIds },
                status: 'Connected'
            },
            raw: true
        });
        const pageMap = socialPages.reduce((acc, page) => {
            acc[page.pageId] = page;
            return acc;
        }, {});
        const results = [];
        await Promise.all(scheduledPosts.map(async (post) => {
            try {
                const pageData = pageMap[post.page_id];
                if (!pageData) {
                    console.error(`No connected page data found for page_id: ${post.page_id}`);
                    return;
                }
                // :white_check_mark: Parse post_media saved in DB
                let mediaFiles = [];
                if (post.post_media) {
                    try {
                        const parsedMedia = JSON.parse(post.post_media);
                        const mediaArray = Array.isArray(parsedMedia) ? parsedMedia : [parsedMedia];
                        // Match the same structure as `publish-posts`
                        mediaFiles = mediaArray.map(media => ({
                            path: path.join(__dirname, 'public', media.path || media.filename), // actual file path
                            publicPath: `/uploads/posts/${media.type === 'video' ? 'videos' : 'images'}/${media.path || media.filename}`,
                            type: media.type,
                            filename: media.path || media.filename,
                            originalname: media.originalname || media.path || media.filename,
                            mimetype: media.type === 'video'
                                ? 'video/mp4'
                                : 'image/jpeg',
                            size: media.size || 0
                        }));
                    } catch (err) {
                        console.error(`Failed to parse media for post ${post.id}:`, err.message);
                    }
                }
                const platformPayload = {
                    id: post.page_id,
                    name: pageData.pageName,
                    pageSocialUser: pageData.social_userid,
                    status: pageData.status
                };
                // :white_check_mark: Publish using existing functions
                let result;
                if (post.post_platform === 'facebook') {
                    console.log(`Publishing Facebook post ID: ${post.id}`);
                    result = await publishToFacebook(platformPayload, post.content, mediaFiles);
                } else if (post.post_platform === 'linkedin') {
                    console.log(`Publishing LinkedIn post ID: ${post.id}`);
                    result = await publishToLinkedIn(platformPayload, post.content, mediaFiles);
                } else {
                    console.warn(`Unsupported platform "${post.post_platform}" for post ID: ${post.id}`);
                    return;
                }
                // :white_check_mark: Update the post status to published
                await UserPost.update(
                    {
                        status: '1', // published
                        schedule_time: null,
                        platform_post_id: result?.platform_post_id || null,
                        week_date: new Date().toISOString().split('T')[0]
                    },
                    { where: { id: post.id } }
                );
                // --- Activity logging ---
                const reference_pageID = {
                    activity_type_id: result?.platform_post_id || post.id,
                    activity_subType_id: post.page_id,
                    schedule_time: post.schedule_time,
                    published: "scheduled"
                };
                const source_type = '';
                const now = new Date();
                const next24FromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextAPI_call_dateTime = next24FromNow;
                await activityCreate( post.user_uuid, post.social_user_id, post.post_platform, "posts", "published", "create", source_type, "", reference_pageID,nextAPI_call_dateTime );
                results.push({ ...result, status: 'success' });
                console.log(`Post ID ${post.id} published successfully.`);
            } catch (err) {
                console.error(`Error publishing post ID ${post.id}:`, err.message);
            }
        }));
        console.log('Cron job completed.', results);
    } catch (error) {
        console.error('Fatal error in cron job:', error.message);
    }
});
// End Get schedule posts for cron job post to facebook & linkedin page

// Start crop job for check user activity between last 24 to 72 hours 
//app.get(`/activities/last24`, async (req, res) => {
cron.schedule('*/30 * * * *', async () => {
    try{
        const now = new Date();
        const cutoff24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const cutoff72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        // console.log("cutoff24",cutoff24);
        // console.log("cutoff72",cutoff72);
        // console.log("Now : ",now);
        // Step 1: Get last login per user
        const findUserGrater24Hours = await Activity.findAll({
            attributes: ["user_uuid", [Sequelize.fn("MAX", Sequelize.col("activity_dateTime")), "last_activity"] ],
            where: {
                activity_type: "user",
                activity_subType: "profile",
                action: "login",
                activity_dateTime: {
                    [Op.between]: [cutoff72, cutoff24],
                },
            },
            group: ["user_uuid"],
            order: [[Sequelize.fn("MAX", Sequelize.col("activity_dateTime")), "DESC"]],
            raw: true,
        });
        const findUserLessThan24Hours = await Activity.findAll({
            attributes: ["user_uuid", [Sequelize.fn("MAX", Sequelize.col("activity_dateTime")), "last_activity"] ],
            where: {
                activity_type: "user",
                activity_subType: "profile",
                action: "login",
                activity_dateTime: {
                    [Op.gte]: cutoff24
                },
            },
            group: ["user_uuid"],
            order: [[Sequelize.fn("MAX", Sequelize.col("activity_dateTime")), "DESC"]],
            raw: true,
        });
        // Step 2: Attach hoursAgo + related activities
        const UserActivitiesWithHours = [];
        if( (findUserGrater24Hours.length > 0 || findUserLessThan24Hours.length > 0) ||
            (findUserGrater24Hours.length > 0 && findUserLessThan24Hours.length > 0) )
        {
            const combinedUsers = [...findUserGrater24Hours, ...findUserLessThan24Hours];
            const uniqueUsersMap = new Map();
            combinedUsers.forEach(user => {
                if (!uniqueUsersMap.has(user.user_uuid)) {
                    uniqueUsersMap.set(user.user_uuid, user);
                }
            });
            // Final array with unique users
            const uniqueUsers = Array.from(uniqueUsersMap.values());
            // console.log("uniqueUsers",uniqueUsers);
            for (const UserActivity of uniqueUsers) {
                const diffMs = now - new Date(UserActivity.last_activity);
                const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60));
                const minutesAgo = Math.floor((diffMs / (1000 * 60)) % 60);
                // fetch related activities (ads/posts within 48–24h window)
                const relatedActivitiesRaw  = await Activity.findAll({
                    where: {
                        user_uuid: UserActivity.user_uuid,
                        activity_dateTime: { [Op.between]: [cutoff72, cutoff24] },
                        activity_type: { [Op.in]: ["ads", "posts"] },
                        action: { [Op.in]: ["create", "update"] },
                    },
                    order: [["activity_dateTime", "DESC"]],
                    raw: true,
                });
                const relatedActivities = [];
                for (const ra of relatedActivitiesRaw) {
                    // check analytics table nextAPI_call_dateTime
                    const activityRecord = await Activity.findOne({
                        where: { id: ra.id },
                        attributes: ["nextAPI_call_dateTime","activity_dateTime"],
                        raw: true,
                    });
                    const nextApiTime = new Date(activityRecord.nextAPI_call_dateTime);
                    if (!activityRecord || !activityRecord.nextAPI_call_dateTime || nextApiTime > now) {
                        // skip if null
                        continue;
                    }
                    // push only if nextAPI_call_dateTime is in the future
                    const diff = now - new Date(ra.activity_dateTime);
                    relatedActivities.push({
                        ...ra,
                        hoursAgo: Math.floor(diff / (1000 * 60 * 60)),
                        minutesAgo: Math.floor((diff / (1000 * 60)) % 60),
                    });
                }
                UserActivitiesWithHours.push({
                    ...UserActivity,
                    hoursAgo,
                    minutesAgo,
                    relatedActivities,
                });
                const PlatformAdsData = [];
                const PlatformPostsData = [];
                if(UserActivitiesWithHours.length > 0) {
                    for (const userActivity of UserActivitiesWithHours) {
                        if (userActivity.relatedActivities.length > 0) {
                            for (const related of userActivity.relatedActivities) {
                                try {
                                    const ref = JSON.parse(related.reference_pageID);
                                    if (related.activity_type === "ads" &&
                                        (related.action === "create" || related.action === "update") &&
                                        ref.activity_type_id
                                    ) {
                                        PlatformAdsData.push({
                                            loggedUser_uuid: related.user_uuid,
                                            user_social_id: related.account_social_userid,
                                            account_platform: related.account_platform,
                                            adAccountId: ref.activity_type_id,
                                            campaignId: ref.activity_subType_id || null,
                                        });
                                    } else if (related.activity_type === "posts" &&
                                        related.activity_subType === "published" &&
                                        (related.action === "create" || related.action === "update") &&
                                        ref.activity_type_id
                                    ) {
                                        PlatformPostsData.push({
                                            activity_id: related.id,
                                            activity_time: related.nextAPI_call_dateTime,
                                            loggedUser_uuid: related.user_uuid,
                                            user_social_id: related.account_social_userid,
                                            account_platform: related.account_platform,
                                            platform_post_id: ref.activity_type_id,
                                            post_page_id: ref.activity_subType_id || null,
                                        });
                                    }
                                } catch (e) {
                                    console.error("Invalid JSON in reference_pageID:", related.reference_pageID);
                                }
                            }
                        }
                    }
                    //res.json({ success: true, data: facebboAdsData });
                }
                // console.log('PlatformAdsData.length',PlatformAdsData);
                if(PlatformAdsData.length > 0) {
                    await adsCampaignData(PlatformAdsData);
                }
                //console.log('PlatformPostsData.length',PlatformPostsData);
                if(PlatformPostsData.length > 0) {
                    await platformPostsData(PlatformPostsData);
                }
            }
        }
        //res.json({ success: true, data: facebboAdsData });
    } catch (err) {
        console.error("Error fetching >24h activities:", err);
        // res.status(500).json({ success: false, error: err.message });
    }
});
// End crop job for check user activity between last 24 to 72 hours

// Start crop job for get facebook pages and posts analytics  
function formatLocalToMinutes(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

//app.get(`/activities/last72`, async (req, res) => {
cron.schedule('* * * * *', async () => {
    try {
        const findPostsActivity = await Activity.findAll({
            attributes: [
                "id",
                "user_uuid",
                "account_platform",
                "reference_pageID",
                "activity_dateTime",
                "nextAPI_call_dateTime"
            ],
            where: {
                    activity_type: { [Op.in]: ["like", "share", "comment"] },
                    activity_subType: { [Op.in]: ["posts"] },
                    action: { [Op.in]: ["create", "delete", "update"] },
                    activity_dateTime: { [Op.ne]: "0000-00-00 00:00:00" },
                    nextAPI_call_dateTime: { [Op.ne]: "0000-00-00 00:00:00" }
                },
            includeIgnoreAttributes: false,
            having: Sequelize.literal(`
                activity_dateTime = (
                    SELECT MAX(a2.activity_dateTime)
                    FROM activity AS a2
                    WHERE a2.user_uuid = activity.user_uuid
                    AND a2.activity_type IN ('like','share','comment')
                    AND a2.activity_subType IN ('posts')
                    AND a2.action IN ('create','delete','update')
                    AND a2.activity_dateTime <> '0000-00-00 00:00:00'
                )
            `),
            order: [["activity_dateTime", "ASC"]],
            //raw: true,
        });

        const activitiesData = []; 
        const now = new Date();
        const currentDateTimeFormatted = formatLocalToMinutes(now);
        //console.log('findPostsActivity',findPostsActivity);
        if (findPostsActivity.length > 0) { 
            for (const filterData of findPostsActivity) {
                const rawDate = filterData.nextAPI_call_dateTime;                
                // skip invalid or empty values early
                if (!rawDate || rawDate === '0000-00-00 00:00:00') {
                    console.log(`Skipping invalid date for id ${filterData.id}:`, rawDate);
                    continue;
                }

                const parsedDate = new Date(rawDate);
                // check if the parsed date is valid
                if (isNaN(parsedDate.getTime())) {
                    console.log(`Invalid JS Date for id ${filterData.id}:`, rawDate);
                    continue;
                }
                const nextCallUTC = new Date(filterData.nextAPI_call_dateTime)
                                    .toISOString()
                                    .slice(0, 16)
                                    .replace("T", " ");
                if(currentDateTimeFormatted === nextCallUTC){               
                    activitiesData.push({
                        id:filterData.id,
                        platform:filterData.account_platform,
                        reference_pageID:filterData.reference_pageID,
                    });
                } else if(nextCallUTC < currentDateTimeFormatted){               
                    activitiesData.push({
                        id:filterData.id,
                        platform:filterData.account_platform,
                        reference_pageID:filterData.reference_pageID,
                    });
                } else {
                    console.log('No data for api');
                }
            }
            if(activitiesData.length > 0){                
                await findAndFilterPost(activitiesData);
                //res.json({ success: true, data: activitiesData });
            }
            
        } else {
           console.log({ success: false, data: 'Data not found' });
        }
    } catch (err) {
        console.error("Error fetching posts activities:", err);
        console.log({ success: false, error: err.message });
    }
});

async function findAndFilterPost(activitiesData) {
    //console.log('activitiesData: ',activitiesData);
    const singlePostInfo = [];
    const facebookPageAnalytics = [];
    for (const filterData of activitiesData) {
        // Skip if reference_pageID is null, undefined, or empty
        if (!filterData.reference_pageID) {
            console.warn(`Skipping empty reference_pageID for activity id ${filterData.id}`);
            continue;
        }
        let ref;
        try {
            ref = JSON.parse(filterData.reference_pageID);
        } catch (e) {
            console.warn(`Skipping invalid JSON in reference_pageID for activity id ${filterData.id}: ${filterData.reference_pageID}`);
            continue;
        }        
        if (ref.activity_subType_id) {
            const postInfo = await UserPost.findOne({
                where: { platform_post_id: ref.activity_subType_id }
            });

            if (!postInfo) continue; // Skip if no matching post

            const socialPages = await SocialUserPage.findOne({
                where: {
                    pageId: postInfo.page_id,
                    status: 'Connected'
                }
            });
            // Skip if no connected page found
            if (!socialPages || socialPages.length === 0) continue;
            // Push all valid combinations            
            singlePostInfo.push({
                activities_id:filterData.id,
                platform:filterData.platform,           
                post_id: postInfo.id,
                platform_post_id: ref.activity_subType_id,
                page_id: socialPages.pageId,
                page_token: socialPages.token,
            }); 
            
            facebookPageAnalytics.push({
                platform:filterData.platform,
                user_uuid: socialPages.user_uuid,
                page_id: socialPages.pageId,
                pageToken: socialPages.token
            });
            
        }
    }

    if(singlePostInfo.length>0){
        //console.log('singlePostInfo: ',singlePostInfo);        
        await callPostInsights(singlePostInfo);
    }

    if(facebookPageAnalytics.length>0){
        await fetchFacebookPageAnalytics(facebookPageAnalytics);
    }
}
// End crop job for get facebook pages and posts analytics 

// Start fetch single post insights
async function callPostInsights(PlatformPostsData, retries = 3, delay = 2000) {
    setImmediate(async () => {
        let attempt = 0;
        let lastError = null;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to auto-sync posts data...`);
                await saveSinglePostsInsights(PlatformPostsData);
                console.log(`Background posts data auto-sync completed successfully.`);
                return true; // :white_check_mark: Exit on success
            } catch (err) {
                lastError = err;
                console.error(`Auto-sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    console.log(`Retrying in ${delay / 1000} seconds...`);
                    await new Promise(res => setTimeout(res, delay));
                }
            }
        }
        console.error(`[platformPostsData] :x: All retry attempts failed for posts data.`, lastError?.message || lastError);
        return false; // :x: Exit with failure after all retries
    });
}

async function saveSinglePostsInsights(postsData) {
    //const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    //console.log('single posts insight: ', postsData);
    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() - 1);
    const sinceDate = new Date(untilDate);
    sinceDate.setDate(untilDate.getDate() - 90);
    const timestampUntil = Math.floor(untilDate.getTime() / 1000);
    const timestampSince = Math.floor(sinceDate.getTime() / 1000);    
    if(postsData[0].platform==='facebook')
    {    
        //console.log('if platform:', postsData[0].platform);
        try {
            const postUrl = `https://graph.facebook.com/v22.0/${postsData[0].platform_post_id}`;
            const response = await axios.get(postUrl, {
                params: {
                    access_token: postsData[0].page_token,
                    fields: "id,message,created_time,shares,likes.summary(true),comments.summary(true)"
                },
            });
            const post = response.data;

            const insightsUrl = `https://graph.facebook.com/v22.0/${postsData[0].platform_post_id}/insights`;
            const insightsResponse = await axios.get(insightsUrl, {
                params: {
                    access_token: postsData[0].page_token,
                    metric: "post_impressions,post_impressions_unique,",
                    since: timestampSince,
                    until: timestampUntil,
                },
            });
            const insightsMap = {};
            for (const metric of insightsResponse.data.data) {
                insightsMap[metric.name] = metric.values?.[0]?.value || 0;
            }      
            
            const likesCount = post.likes?.summary?.total_count || 0;
            const commentsCount = post.comments?.summary?.total_count || 0;
            const sharesCount = post.shares?.count || 0;
            const engagements = sharesCount
                ? likesCount + commentsCount + sharesCount / 3
                : likesCount + commentsCount / 2;        
            const existing = await UserPost.findOne({ where: { platform_post_id: postsData[0].platform_post_id } });
            if(existing) {
                await existing.update({ 
                    likes:likesCount,
                    comments:commentsCount,
                    shares:sharesCount,          
                    impressions: insightsMap.post_impressions,
                    unique_impressions: insightsMap.post_impressions, 
                    engagements: engagements,      
                });

                const FindActivity = await Activity.findOne({ where: { id: postsData[0].activities_id } });
                
                if(FindActivity){
                    await FindActivity.update({           
                        nextAPI_call_dateTime: '0000-00-00 00:00:00',      
                    });
                }
            }
        } catch (err) {
            console.error("[Error fetching token]:", err.message);
        }
    } else if(postsData[0].platform==='linkedin'){
        console.log("Call linkedin post insights");
    }
    await sleep(300);    
}
// End fetch single post insights

async function updateNextApiCall(activity_id, activity_time) {
    const now = new Date(activity_time);
    const nextCall = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day later
    await Activity.update(
        { nextAPI_call_dateTime: nextCall },
        { where: { id: activity_id } }
    );
    console.log(`[Updated] nextAPI_call_dateTime set to ${nextCall.toISOString()} for activity_id: ${activity_id}`);
}

async function adsCampaignData(adsDatas, retries = 3, delay = 2000) {
    //console.log('adsData',adsData);   
    setImmediate(async () => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                console.log(`Attempt ${attempt + 1} to auto sync campaign`);
                await saveAdsCampaignData(adsDatas);
                console.log('Background campaign auto sync completed.');
                break; // success, exit loop
            } catch (err) {
                console.error(`Auto Sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    await new Promise(res => setTimeout(res, delay)); // wait before retry
                } else {
                    console.error(' All retry auto attempts failed for campaign.');
                }
            }
        }
    });
}
async function saveAdsCampaignData(adsDatas) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const combinedSocialUserData = adsDatas;
    for (const adsData of combinedSocialUserData) {
        try {
            const socialUser = await SocialUser.findOne({
                where: { social_id: adsData.user_social_id },
                attributes: ["user_token"],  
                raw: true,
            });
            if(socialUser) {
                adsData.token = socialUser.user_token;
            }
        } catch (err) {
            console.error("Error fetching token:", err);
        }

        try {
            const findCampaignAds = await AdsetsAds.findAll({
                where: { campaign_id: adsData.campaignId }
            });
            if (findCampaignAds && findCampaignAds.length > 0) {
                adsData.campaignAds = findCampaignAds; // ✅ push into object
            } else {
                adsData.campaignAds = []; // empty if none found
            }
        } catch (err) {
            console.error("Error fetching token:", err);
        }        
    }   

    for (const campaignData of combinedSocialUserData) {
        //console.log('combinedSocialUserData', adsData.campaignAds);
        if(campaignData.account_platform==='facebook'){           
            for (const adsData of campaignData.campaignAds) {
                //console.log('data ', adsData.campaign_id, adsData.adsets_id, adsData.ads_id );            
                try {
                    const response = await axios.get(
                        `https://graph.facebook.com/v20.0/${adsData.campaign_id}/insights`,
                        {
                        params: {
                            fields:
                            "impressions,clicks,spend,reach,ctr,cpc,cpm,cpp,actions,date_start,date_stop",
                            date_preset: "last_90d",
                            access_token: campaignData.token,
                        },
                        }
                    );
                    const data = response.data;
                    
                    if (data.data && data.data.length > 0) {
                        // ✅ first row of insights
                        const campaignInsight = data.data[0];
                        // ✅ find existing campaign record
                        const existingCampaign = await Campaigns.findOne({
                            where: { campaign_id: adsData.campaign_id },
                        });

                        if (existingCampaign) {
                            const campaignRecord = {};
                            // map insights to record
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
                                campaign_insights_actions: campaignInsight.actions || null,
                            });
                            // ✅ calculate cost per result (if actions exist)
                            const resultAction = campaignInsight.actions?.find((action) =>
                                ["link_click", "offsite_conversion", "lead"].includes(action.action_type)
                            );

                            if (
                                resultAction &&
                                parseFloat(resultAction.value) > 0 &&
                                parseFloat(campaignInsight.spend) > 0
                            ) {
                                campaignRecord.campaign_insights_cost_per_result = (
                                    parseFloat(campaignInsight.spend) / parseFloat(resultAction.value)
                                ).toFixed(2);
                                campaignRecord.campaign_result_type = resultAction.action_type;
                                campaignRecord.campaign_insights_results = parseInt(resultAction.value);
                            }

                            // ✅ update DB record
                            await Campaigns.update(campaignRecord, {
                                where: { campaign_id: adsData.campaign_id },
                            });
                            console.log(
                                `Updated campaign ${adsData.campaign_id} with impressions: ${campaignInsight.impressions}`
                            );
                        }
                    } else {
                        console.log(
                        `No insights found for campaign ${adsData.campaign_id} in last 90 days`
                        );
                    }
                } catch (error) {
                    console.error(
                        "Error fetching campaign insights:",
                        error.response ? error.response.data : error.message
                    );
                }
            }  
        } else if(campaignData.account_platform==='linkedin'){ 
            console.log('linkedin ads not there');
        }  
    }
    await sleep(800);
}

async function platformPostsData(PlatformPostsData, retries = 3, delay = 2000) {
    setImmediate(async () => {
        let attempt = 0;
        let lastError = null;
        while (attempt < retries) {
            try {
                console.log(`[platformPostsData] Attempt ${attempt + 1} to auto-sync posts data...`);
                await savePlatformPostsData(PlatformPostsData);
                console.log(`[platformPostsData] Background posts data auto-sync completed successfully.`);
                return true; // :white_check_mark: Exit on success
            } catch (err) {
                lastError = err;
                console.error(`[platformPostsData] Auto-sync failed on attempt ${attempt + 1}:`, err.message || err);
                attempt++;
                if (attempt < retries) {
                    console.log(`[platformPostsData] Retrying in ${delay / 1000} seconds...`);
                    await new Promise(res => setTimeout(res, delay));
                }
            }
        }
        console.error(`[platformPostsData] :x: All retry attempts failed for posts data.`, lastError?.message || lastError);
        return false; // :x: Exit with failure after all retries
    });
}

async function savePlatformPostsData(postsData) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    // Step 1: Attach tokens to posts
    const allPageIds = [...new Set(postsData.map(p => p.post_page_id))];
    const pageTokens = await SocialUserPage.findAll({
        where: { pageId: allPageIds },
        attributes: ["pageId", "token", "social_userid", "page_platform"],
        raw: true,
    });

    // Build a map for quick token lookup
    const tokenMap = {};
    for (const record of pageTokens) {
        tokenMap[record.pageId] = record.token;
    }

    for (const post of postsData) {
        post.token = tokenMap[post.post_page_id] || null;
    }

    // Step 2: Define 90-day time window
    const today = new Date();
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() - 1); // yesterday
    const sinceDate = new Date(untilDate);
    sinceDate.setDate(untilDate.getDate() - 90);

    const timestampUntil = Math.floor(untilDate.getTime() / 1000);
    const timestampSince = Math.floor(sinceDate.getTime() / 1000);

    // Results
    const postResults = [];
    const facebookPageAnalytics = [];
    const linkedinPageAnalytics = [];
    const allLinkedInComments = [];

    // Utility function to format LinkedIn timestamps
    const formatLinkedInDate = (timestamp) => {
        const date = new Date(timestamp);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T` +
            `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+0000`;
    };

    // Recursive LinkedIn comment fetcher
    const fetchLinkedInComments = async (postUrn, pageInfo, headers, parentUrn = null, allComments = []) => {
        const endpoint = parentUrn
            ? `https://api.linkedin.com/v2/socialActions/${parentUrn}/comments`
            : `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`;

        try {
            const res = await axios.get(endpoint, { headers });
            const comments = res.data.elements || [];

            for (const comment of comments) {
                const flattened = {
                    user_uuid: pageInfo.user_uuid,
                    social_userid: pageInfo.social_user_id,
                    platform_page_Id: pageInfo.pageId,
                    platform: 'linkedin',
                    activity_id: comment.object,
                    comment_id: comment.id,
                    post_id: postUrn,
                    comment: comment.message?.text || '',
                    comment_created_time: comment.created?.time ? formatLinkedInDate(comment.created.time) : null,
                    parent_comment_id: parentUrn || null,
                    from_id: comment.actor || null,
                    from_name: comment.created?.impersonator ? 'Page Admin' : 'LinkedIn User',
                    comment_type: parentUrn ? 'reply' : 'top_level',
                    reaction_like: comment.likesSummary?.totalLikes || 0,
                };

                allComments.push(flattened);

                // If there are replies, recursively fetch them
                if (comment.commentsSummary) {
                    const activityId = comment.object.split(':').pop();
                    const replyUrn = `urn%3Ali%3Acomment%3A%28urn%3Ali%3Aactivity%3A${activityId}%2C${comment.id}%29`;
                    await fetchLinkedInComments(postUrn, pageInfo, headers, replyUrn, allComments);
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching LinkedIn comments for ${postUrn} ${parentUrn ? '(reply)' : '(top-level)'}:`,
                error.response?.data || error.message);
        }
    };

    // Step 3: Process posts
    for (const platformPost of postsData) {
        try {
            const existingPost = await UserPost.findOne({
                where: { platform_post_id: platformPost.platform_post_id }
            });

            if (!existingPost) {
                console.warn(`[Post Missing] Skipping analytics for unknown post: ${platformPost.platform_post_id}`);
                continue;
            }

            if (platformPost.account_platform === 'facebook') {
                // ----- Facebook Post Analytics -----
                try {
                    const postUrl = `https://graph.facebook.com/v22.0/${platformPost.platform_post_id}`;
                    const response = await axios.get(postUrl, {
                        params: {
                            access_token: platformPost.token,
                            fields: "id,message,created_time,shares,likes.summary(true),comments.summary(true)"
                        },
                    });
                    const post = response.data;

                    // Fetch insights
                    const insightsUrl = `https://graph.facebook.com/v22.0/${platformPost.platform_post_id}/insights`;
                    const insightsResponse = await axios.get(insightsUrl, {
                        params: {
                            access_token: platformPost.token,
                            metric: "post_impressions,post_impressions_unique",
                            since: timestampSince,
                            until: timestampUntil,
                        },
                    });

                    const insightsMap = {};
                    for (const metric of insightsResponse.data.data) {
                        insightsMap[metric.name] = metric.values?.[0]?.value || 0;
                    }

                    const likesCount = post.likes?.summary?.total_count || 0;
                    const commentsCount = post.comments?.summary?.total_count || 0;
                    const sharesCount = post.shares?.count || 0;
                    const engagements = sharesCount
                        ? likesCount + commentsCount + sharesCount / 3
                        : likesCount + commentsCount / 2;                    

                    const fbData = {
                        id: platformPost.platform_post_id,
                        message: post.message || null,
                        created_time: post.created_time || null,
                        shares: sharesCount,
                        likes: likesCount,
                        comments: commentsCount,
                        impressions: insightsMap.post_impressions || 0,
                        unique_impressions: insightsMap.post_impressions_unique || 0,
                        engagements: engagements,
                    };

                    postResults.push(fbData);
                    facebookPageAnalytics.push({
                        user_uuid: existingPost.user_uuid,
                        page_id: platformPost.post_page_id,
                        pageToken: platformPost.token
                    });

                    await updateNextApiCall(platformPost.activity_id, platformPost.activity_time);
                } catch (fbErr) {
                    console.error(`[Facebook Error] Post ID ${platformPost.platform_post_id}:`,
                        fbErr.response?.data || fbErr.message);
                }
            } else if (platformPost.account_platform === 'linkedin') {
                // ----- LinkedIn Post Analytics & Comments -----
                try {
                    const endDate = new Date();
                    endDate.setHours(23, 59, 59, 999);
                    const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
                    const startEpoch = startDate.getTime();
                    const endEpoch = endDate.getTime();

                    const type = platformPost.platform_post_id.includes("ugcPost:") ? "ugcPosts" : "shares";
                    const encodedUrn = encodeURIComponent(platformPost.platform_post_id);

                    // Fetch LinkedIn Post Analytics
                    const linkedinUrl = `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn%3Ali%3Aorganization%3A${platformPost.post_page_id}&${type}=List(${encodedUrn})&timeIntervals=(timeRange:(start:${startEpoch},end:${endEpoch}),timeGranularityType:DAY)`;

                    const analyticsResponse = await axios.get(linkedinUrl, {
                        headers: {
                            Authorization: `Bearer ${platformPost.token}`,
                            'LinkedIn-Version': '202504',
                            'X-Restli-Protocol-Version': '2.0.0',
                        }
                    });

                    const stats = analyticsResponse.data?.elements?.[0]?.totalShareStatistics || {};
                    const liData = {
                        id: platformPost.platform_post_id,
                        message: null,
                        created_time: null,
                        shares: stats.shareCount || 0,
                        likes: stats.likeCount || 0,
                        comments: stats.commentCount || 0,
                        impressions: stats.impressionCount || 0,
                        unique_impressions: stats.uniqueImpressionsCount || 0,
                        engagements: (stats.likeCount || 0) + (stats.commentCount || 0) + (stats.shareCount || 0),
                    };

                    postResults.push(liData);

                    linkedinPageAnalytics.push({
                        user_uuid: existingPost.user_uuid,
                        page_id: platformPost.post_page_id,
                        pageToken: platformPost.token
                    });

                    // Fetch LinkedIn Post Comments
                    const pageInfo = {
                        user_uuid: existingPost.user_uuid,
                        pageId: platformPost.post_page_id,
                        social_userid: existingPost.social_user_id
                    };

                    const headers = {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${platformPost.token}`,
                        'LinkedIn-Version': '202505',
                        'X-Restli-Protocol-Version': '2.0.0',
                    };

                    const commentsForPost = [];
                    await fetchLinkedInComments(platformPost.platform_post_id, pageInfo, headers, null, commentsForPost);
                    allLinkedInComments.push(...commentsForPost);

                    await updateNextApiCall(platformPost.activity_id, platformPost.activity_time);
                } catch (liErr) {
                    console.error(`[LinkedIn Error] Post ID ${platformPost.platform_post_id}:`,
                        liErr.response?.data || liErr.message);
                }
            }

            await sleep(300); // Rate limit protection

        } catch (err) {
            console.error("[General Post Processing Error]:", err.message);
        }
    }

    // Step 4: Fetch Page-Level Analytics
    if (facebookPageAnalytics.length > 0) {
        await fetchFacebookPageAnalytics(facebookPageAnalytics);
    }
    if (linkedinPageAnalytics.length > 0) {
        await fetchLinkedInPageAnalytics(linkedinPageAnalytics);
    }

    // Step 5: Bulk Insert LinkedIn Comments
    if (allLinkedInComments.length > 0) {
        await PostComments.bulkCreate(allLinkedInComments, {
            updateOnDuplicate: [
                "comment",
                "reaction_like",
                "comment_created_time",
                "from_name",
                "comment_type"
            ]
        });
        console.log(`✅ Inserted/Updated ${allLinkedInComments.length} LinkedIn comments.`);
    } else {
        console.log('ℹ️ No new LinkedIn comments to insert.');
    }

    // Step 6: Update DB with latest post analytics
    for (const record of postResults) {
        if (!record) continue;
        const existing = await UserPost.findOne({ where: { platform_post_id: record.id } });
        if (existing) {
            await existing.update({
                likes: record.likes,
                comments: record.comments,
                shares: record.shares,
                impressions: record.impressions,
                unique_impressions: record.unique_impressions,
                engagements: record.engagements,
            });
        }
    }
}

async function fetchFacebookPageAnalytics(pagedetail){
    //console.log(pagedetail);
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
    for (const page of pagedetail) {
        //console.log('page:',page);
        try {        
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.page_id}/insights`,
                {
                    params: {
                        metric: 'page_daily_follows',
                        period: 'day',
                        access_token: page.pageToken,
                        since: timestampSince,
                        until: timestampUntil
                    }
                }
            ); 
            const analyticsData = response.data;            
            analyticsData.page_id = page.page_id;
            analyticsData.loggedUser_uuid = page.user_uuid;
            responses.push({ analytic_type: 'page_daily_follows', data: analyticsData });        
        } catch (error) {
            console.error('Daily follows API Error:', error);
            errors.push({ type: 'page_daily_follows', error });
        }

        try {           
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.page_id}/insights`,
                {
                    params: {
                        metric: 'page_impressions',
                        period: 'day',
                        access_token: page.pageToken,
                        since: timestampSince,
                        until: timestampUntil
                    }
                }
            ); 
            const analyticsData = response.data;
            analyticsData.page_id = page.page_id;
            analyticsData.loggedUser_uuid = page.user_uuid;           
            responses.push({ analytic_type: 'page_impressions', data: analyticsData });            
        } catch (error) {
            console.error('Daily follows API Error:', error);
            errors.push({ type: 'page_impressions', error });
        }

        try {        
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.page_id}/insights`,
                {
                    params: {
                        metric: 'page_impressions_unique',
                        period: 'day',
                        access_token: page.pageToken,
                        since: timestampSince, 
                        until: timestampUntil
                    }
                }
            ); 
            const analyticsData = response.data;
            analyticsData.page_id = page.page_id;
            analyticsData.loggedUser_uuid = page.user_uuid; 
            responses.push({ analytic_type: 'page_impressions_unique', data: analyticsData });
        } catch (error) {
            console.error('Daily impressions unique API Error:', error);
            errors.push({ type: 'page_impressions_unique', error });
        }

        try {          
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.page_id}/insights`,
                {
                    params: {
                        metric: 'page_views_total',
                        period: 'day',
                        access_token: page.pageToken,
                        since: timestampSince,
                        until: timestampUntil
                    }
                }
            ); 
            const page_views_total = response.data;
            page_views_total.page_id = page.page_id;
            page_views_total.loggedUser_uuid = page.user_uuid;
            responses.push({ analytic_type: 'page_views_total', data: page_views_total });
        } catch (error) {
            console.error('Daily page_views_total API Error:', error);
            errors.push({ type: 'page_views_total', error });
        }

        try {
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.page_id}/insights`,
                {
                    params: {
                        metric: 'page_post_engagements',
                        period: 'day',
                        access_token: page.pageToken,
                        since: timestampSince, 
                        until: timestampUntil 
                    }
                }
            );
            const page_post_engagements = response.data;
            page_post_engagements.page_id = page.page_id;
            page_post_engagements.loggedUser_uuid = page.user_uuid;
            responses.push({ analytic_type: 'page_post_engagements', data: page_post_engagements });
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
        }

        try {
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${page.page_id}/insights`,
                {
                    params: {
                        metric: 'page_actions_post_reactions_like_total',
                        period: 'day',
                        access_token: page.pageToken,
                        since: timestampSince, 
                        until: timestampUntil 
                    }
                }
            );
            const page_actions_post_reactions_like_total = response.data;
            page_actions_post_reactions_like_total.page_id = page.page_id;
            page_actions_post_reactions_like_total.loggedUser_uuid = page.user_uuid;
            responses.push({ analytic_type: 'page_actions_post_reactions_like_total', data: page_actions_post_reactions_like_total });           
        } catch (error) {
            console.error('API Error:', error.response?.data || error.message);
        }
    } 
    
    if (errors.length > 0) {        
        const errorMessage = errors.map(e => `${e.type}: ${e.error.message}`).join('\n');
        throw new Error(`Some analytics failed:\n${errorMessage}`);
    } else {
        await saveFacebookAnalyticsData(responses);
    }   
}

async function saveFacebookAnalyticsData(analyticsData) {
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

// Linkedin Page Analytics updates
async function fetchLinkedInPageAnalytics(pagedetail) {
    const today = new Date();
    
    // Yesterday as the end date
    const untilDate = new Date(today);
    untilDate.setDate(today.getDate() - 1);

    // Start date: 90 days before untilDate
    const sinceDate = new Date(untilDate);
    sinceDate.setDate(untilDate.getDate() - 90);

    const timestampUntil = untilDate.getTime();
    const timestampSince = sinceDate.getTime();

    const allRecords = [];
    const errors = [];

    for (const page of pagedetail) {
        const organizationURN = encodeURIComponent(`urn:li:organization:${page.page_id}`);
        const headers = {
            'Authorization': `Bearer ${page.pageToken}`,
            'LinkedIn-Version': '202504',
            'X-Restli-Protocol-Version': '2.0.0',
        };
        const timeIntervals = `(timeRange:(start:${timestampSince},end:${timestampUntil}),timeGranularityType:DAY)`;

        try {
            // Fetch all three analytics endpoints in parallel
            const [followersRes, pageViewsRes, shareStatsRes] = await Promise.all([
                axios.get(`https://api.linkedin.com/rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${organizationURN}&timeIntervals=${timeIntervals}`,{ headers }),
                axios.get(`https://api.linkedin.com/rest/organizationPageStatistics?q=organization&organization=${organizationURN}&timeIntervals=${timeIntervals}`,{ headers }),
                axios.get(`https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${organizationURN}&timeIntervals=${timeIntervals}`,{ headers }),
            ]);

            const followerData = followersRes.data?.elements || [];
            const pageViewData = pageViewsRes.data?.elements || [];
            const shareData = shareStatsRes.data?.elements || [];

            // 1. PAGE DAILY FOLLOWS
            followerData.forEach(item => {
                const gain = item?.organicFollowerGain || 0;
                if (gain > 0) {
                    allRecords.push({
                        user_uuid: page.user_uuid,
                        platform_page_Id: page.page_id,
                        platform: 'linkedin',
                        analytic_type: 'page_daily_follows',
                        total_page_followers: gain,
                        week_date: new Date(item.timeRange.end).toISOString()
                    });
                }
            });

            // 2. PAGE VIEWS TOTAL
            pageViewData.forEach(item => {
                const views = item?.pageViews || 0;
                if (views > 0) {
                    allRecords.push({
                        user_uuid: page.user_uuid,
                        platform_page_Id: page.page_id,
                        platform: 'linkedin',
                        analytic_type: 'page_views_total',
                        total_page_views: views,
                        week_date: new Date(item.timeRange.end).toISOString()
                    });
                }
            });

            // 3. SHARE (POST) STATS
            shareData.forEach(item => {
                const stats = item?.totalShareStatistics || {};
                const endDate = new Date(item.timeRange.end).toISOString();

                if ((stats.engagement || 0) > 0) {
                    allRecords.push({
                        user_uuid: page.user_uuid,
                        platform_page_Id: page.page_id,
                        platform: 'linkedin',
                        analytic_type: 'page_post_engagements',
                        page_post_engagements: stats.engagement,
                        week_date: endDate
                    });
                }

                if ((stats.likeCount || 0) > 0) {
                    allRecords.push({
                        user_uuid: page.user_uuid,
                        platform_page_Id: page.page_id,
                        platform: 'linkedin',
                        analytic_type: 'page_actions_post_reactions_like_total',
                        page_actions_post_reactions_like_total: stats.likeCount,
                        week_date: endDate
                    });
                }

                if ((stats.impressionCount || 0) > 0) {
                    allRecords.push({
                        user_uuid: page.user_uuid,
                        platform_page_Id: page.page_id,
                        platform: 'linkedin',
                        analytic_type: 'page_impressions',
                        total_page_impressions: stats.impressionCount,
                        week_date: endDate
                    });
                }

                if ((stats.uniqueImpressionsCount || 0) > 0) {
                    allRecords.push({
                        user_uuid: page.user_uuid,
                        platform_page_Id: page.page_id,
                        platform: 'linkedin',
                        analytic_type: 'page_impressions_unique',
                        total_page_impressions_unique: stats.uniqueImpressionsCount,
                        week_date: endDate
                    });
                }
            });

        } catch (err) {
            console.error(`❌ Error fetching analytics for LinkedIn page ${page.page_id}:`, err.response?.data || err.message);
            errors.push({ page: page.page_id, error: err.message });
        }
    }

    //console.log("✅ Prepared LinkedIn analytics records:", allRecords.length);

    if (errors.length > 0) {
        console.warn('⚠️ Some LinkedIn analytics failed:', errors);
    }

    /**
     * SAVE TO DATABASE
     */
    if (allRecords.length > 0) {
        const whereConditions = allRecords.map(record => ({
            user_uuid: record.user_uuid,
            platform_page_Id: record.platform_page_Id,
            analytic_type: record.analytic_type,
            week_date: record.week_date
        }));

        const existingEntries = await Analytics.findAll({
            where: { [Op.or]: whereConditions },
            attributes: ['user_uuid', 'platform_page_Id', 'analytic_type', 'week_date'],
            raw: true
        });

        const existingKeySet = new Set(
            existingEntries.map(entry =>
                `${entry.user_uuid}_${entry.platform_page_Id}_${entry.analytic_type}_${entry.week_date}`
            )
        );

        const newRecords = allRecords.filter(record =>
            !existingKeySet.has(
                `${record.user_uuid}_${record.platform_page_Id}_${record.analytic_type}_${record.week_date}`
            )
        );

        if (newRecords.length > 0) {
            await Analytics.bulkCreate(newRecords);
            console.log(`Inserted ${newRecords.length} new LinkedIn analytics records.`);
        } else {
            console.log('No new LinkedIn analytics data to insert.');
        }
    } else {
        console.log('No LinkedIn analytics records fetched.');
    }
}

// Knowledge base functions
    app.get(`/${prefix}/knowledgebase`, async (req, res) => {
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
            try {
                const findUserKnowledgeBase = await KnowledgeBase.findAll({
                    where: {
                        user_uuid: authData.userData.uuid,
                    },
                    attributes: {
                        exclude: ["updatedAt", "user_uuid"]
                    },
                    order: [["createdAt", "DESC"]]
                });
                if (findUserKnowledgeBase.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Records not found.",
                    });
                }
                const knowledgeBaseData = [];
                for (const knowledgeBase of findUserKnowledgeBase) {
                    const FindKnowledgeBaseMeta = await KnowledgebaseMeta.findAll({
                        where: { knowledgeBase_id: knowledgeBase.id },
                        attributes: ["social_account_id", "pages_id", "social_platform"],
                    });
                    // :white_check_mark: Collect pages for this knowledge base
                    //const pages = FindKnowledgeBaseMeta.map(meta => meta.pages_id).filter(Boolean);
                    //const social_platforms = [...new Set(FindKnowledgeBaseMeta.map(meta => meta.social_platform))];
                    // :white_check_mark: Build platformdata only for this KB
                    //const platformdata = {};
                    // for (const meta of FindKnowledgeBaseMeta) {
                    //     const platform = meta.social_platform || "unknown";
                    //     const accountId = meta.social_account_id || "unknown";
                    //     const pageId = meta.pages_id;
                    //     if (!platformdata[platform]) {
                    //         platformdata[platform] = {};
                    //     }
                    //     if (!platformdata[platform][accountId]) {
                    //         platformdata[platform][accountId] = [{ pages: [] }];
                    //     }
                    //     if (!platformdata[platform][accountId][0].pages.includes(pageId)) {
                    //         platformdata[platform][accountId][0].pages.push(pageId);
                    //     }
                    // }
                    //const socialDataDetail = JSON.stringify([{ pages }]);
                    knowledgeBaseData.push({
                        ...knowledgeBase.dataValues,
                        ///social_platform: JSON.stringify(social_platforms),
                        //socialDataDetail,
                        //platformdata, // :white_check_mark: added per KB
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: "Records fetched successfully.",
                    data: knowledgeBaseData
                });
            } catch (error) {
                console.error(error);
                return res.status(500).json({
                    success: false,
                    message: "Something went wrong while fetching knowledge base.",
                });
            }
        });
    });
    app.post(`/${prefix}/save-knowledgebase`, uploadUserProfileImage, async (req, resp) => {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return resp.status(401).json({ success: false, message: "No token provided." });
        }
        jwt.verify(token, secretKey, async (err, authData) => {
            if (err) {
                return resp.status(401).json({ success: false, message: "Invalid token" });
            }
            try {
                let { knowledgeBaseData, selectedPages } = req.body;
                // :jigsaw: Parse JSON strings into objects/arrays
                if (typeof knowledgeBaseData === "string") {
                    knowledgeBaseData = JSON.parse(knowledgeBaseData);
                }
                if (typeof selectedPages === "string") {
                    selectedPages = JSON.parse(selectedPages);
                }
                if (
                    !knowledgeBaseData.knowledgeBaseTitle ||
                    !knowledgeBaseData.knowledgeBaseContent ||
                    !Array.isArray(selectedPages) ||
                    selectedPages.length === 0
                ) {
                    return resp.status(400).json({
                        success: false,
                        message: "Missing required fields or selected pages.",
                    });
                }
                // :brain: Extract platforms (unique)
                const platforms = [...new Set(selectedPages.map(p => p.page_platform))];
                 // :jigsaw: Group pages by their social_userid
                const socialDataMap = {};
                for (const page of selectedPages) {
                    if (!socialDataMap[page.social_userid]) {
                        socialDataMap[page.social_userid] = [];
                    }
                    socialDataMap[page.social_userid].push(page.pageId);
                }
                // :receipt: Format final socialDataDetail array
                const socialDataDetail = Object.entries(socialDataMap).map(([socialAccount, pages]) => ({
                    socialAccount,
                    pages,
                }));
                // :jigsaw: Save only ONE record
                const savedRecord = await KnowledgeBase.create({
                    user_uuid: authData.userData.uuid,
                    knowledgeBase_title: knowledgeBaseData.knowledgeBaseTitle,
                    knowledgeBase_content: knowledgeBaseData.knowledgeBaseContent,
                    social_platform: JSON.stringify(platforms),
                    socialDataDetail: JSON.stringify(socialDataDetail),
                    status: "Connected",
                });

                const namespace_id = crypto.randomUUID();
                for (const page of selectedPages) {
                    const savedKnowledgebaseMeta = await KnowledgebaseMeta.create({
                        user_uuid: authData.userData.uuid,
                        knowledgeBase_id:savedRecord.id,
                        pages_id:page.pageId,
                        social_account_id:page.social_userid,
                        social_platform:page.page_platform,
                        namespace_id: namespace_id,
                    });
                }

                const settings = await Settings.findOne({
                    where: { 
                        user_uuid: authData.userData.uuid, 
                        module_name: 'Message'
                    }
                });

                if(!settings){
                   await Settings.create({
                        user_uuid: authData.userData.uuid,
                        module_name: 'Message',
                        module_status: '1' 
                    });
                }
                // const savedRecords = [];
                // for (const page of selectedPages) {
                //     const saved = await KnowledgeBase.create({
                //         user_uuid: authData.userData.uuid,
                //         knowledgeBase_title: knowledgeBaseData.knowledgeBaseTitle,
                //         knowledgeBase_content: knowledgeBaseData.knowledgeBaseContent,
                //         social_userid: page.social_userid,
                //         page_id: page.pageId,
                //         social_platform: page.page_platform,
                //         status: "Connected",
                //     });
                //     savedRecords.push(saved);
                // }
                // knowledgebase N8N
                    try {
                        const response = await axios.post(`${process.env.N8N_KNOWLEDGEBASE_WEBHOOK_URL}`, {
                            knowledgebase_id: savedRecord.id
                        });
                        //console.log("knowledgebase N8N response: ",response.data);
                    } catch(err){
                        console.error('error while call knowledgebase N8N :', err.response?.data || err.message);
                    }
                // knowledgebase N8N
                return resp.status(200).json({
                    success: true,
                    message: "Knowledge base saved successfully.",
                });
            } catch (error) {
                console.error(error);
                return resp.status(500).json({
                    success: false,
                    message: "Something went wrong while saving knowledge base.",
                });
            }
        });
    });
    app.post(`/${prefix}/update-knowledgebase`, uploadUserProfileImage, async (req, resp) => {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return resp.status(401).json({ success: false, message: "No token provided." });
        }
        jwt.verify(token, secretKey, async (err, authData) => {
            if (err) {
                return resp.status(401).json({ success: false, message: "Invalid token" });
            }
            try {
                let { knowledgeBaseData } = req.body;
                if (typeof knowledgeBaseData === "string") {
                    knowledgeBaseData = JSON.parse(knowledgeBaseData);
                }
                if(!knowledgeBaseData.knowledgeBase || !knowledgeBaseData.knowledgeBase_title || !knowledgeBaseData.knowledgeBase_content) {
                    return resp.status(400).json({
                        success: false,
                        message: "Missing required fields or selected pages.",
                    });
                }
                const knowledgeBaseId = knowledgeBaseData.knowledgeBase;
                // Define the namespace constant here, as the user specified 'facebook'
                //const NAMESPACE = 'facebook';
                // 1. Find and validate the main KnowledgeBase record
                const findUserKnowledgeBase = await KnowledgeBase.findOne({
                    where: {
                        user_uuid: authData.userData.uuid,
                        id: knowledgeBaseId,
                    }
                });
                if(!findUserKnowledgeBase) {
                    return resp.status(404).json({
                        success: false,
                        message: "Knowledge base record not found.",
                    });
                }
                // 2. Prepare fields for main KnowledgeBase update (KnowledgeBase table)
                const updatedFields = {
                    knowledgeBase_title: knowledgeBaseData.knowledgeBase_title,
                    knowledgeBase_content: knowledgeBaseData.knowledgeBase_content,
                };
                if (knowledgeBaseData.socialDataDetail) {
                    updatedFields.socialDataDetail = knowledgeBaseData.socialDataDetail;
                }
                if (knowledgeBaseData.knowledgeBase_status === "notConnected") {
                    updatedFields.status = "notConnected";
                } else if (knowledgeBaseData.knowledgeBase_status === "Connected") {
                    updatedFields.status = "Connected";
                }
                await findUserKnowledgeBase.update(updatedFields);
                // 3. Synchronization Logic for KnowledgebaseMeta
                let selectedPages = [];
                // Handle parsing if socialDataDetail is passed as a string
                if (knowledgeBaseData.socialDataDetail) {
                    try {
                        selectedPages = typeof knowledgeBaseData.socialDataDetail === "string"
                            ? JSON.parse(knowledgeBaseData.socialDataDetail)
                            : knowledgeBaseData.socialDataDetail;
                    } catch (e) {
                        console.error("Failed to parse socialDataDetail:", e);
                        // Continue without updating meta if parsing fails
                    }
                }
                // Flatten the incoming data into a unique Set of keys (e.g., "accountID:pageID:namespaceID")
                const newKnowledgebaseMetaKeys = new Set();
                const newMetaRecords = [];
                const findKnowledgeBaseNamesapace = await KnowledgebaseMeta.findOne({
                    where: {
                        knowledgeBase_id: knowledgeBaseId,
                    },
                    attributes: ["social_platform", "namespace_id"],
                });
                for (const item of selectedPages) {
                    if (item.pages && Array.isArray(item.pages)) {
                        for (const pageId of item.pages) {
                            // Key now includes the hardcoded namespace
                            const key = `${item.socialAccount}:${pageId}:${findKnowledgeBaseNamesapace.social_platform}`;
                            newKnowledgebaseMetaKeys.add(key);
                            // Prepare records for potential creation, including namespace_id
                            newMetaRecords.push({
                                knowledgeBase_id: knowledgeBaseId,
                                social_account_id: item.socialAccount,
                                pages_id: pageId,
                                social_platform: findKnowledgeBaseNamesapace.social_platform,
                                namespace_id: findKnowledgeBaseNamesapace.namespace_id, // Added namespace_id: 'facebook'
                            });
                        }
                    }
                }
                // Fetch all existing KnowledgebaseMeta records for this knowledgeBase
                const existingMetaRecords = await KnowledgebaseMeta.findAll({
                    where: { knowledgeBase_id: knowledgeBaseId }
                });
                const deletionPromises = [];
                const creationPromises = [];
                // A. Identify and Queue for Deletion (Stale Records)
                const existingMetaKeys = new Set();
                for (const existingRecord of existingMetaRecords) {
                    // Key now includes the existing record's namespace_id for correct matching
                    const key = `${existingRecord.social_account_id}:${existingRecord.pages_id}:'facebook':${existingRecord.namespace_id}`;
                    existingMetaKeys.add(key);
                    // If the existing key is NOT in the new set, it must be deleted
                    if (!newKnowledgebaseMetaKeys.has(key)) {
                        deletionPromises.push(existingRecord.destroy());
                    }
                }
                // B. Identify and Queue for Creation (New Records)
                for (const newRecord of newMetaRecords) {
                    const key = `${newRecord.social_account_id}:${newRecord.pages_id}:${newRecord.namespace_id}`;
                    // If the new key is NOT in the existing set, it must be created
                    if (!existingMetaKeys.has(key)) {
                        creationPromises.push(KnowledgebaseMeta.create(newRecord));
                    }
                }
                // C. Execute all pending database operations concurrently
                await Promise.all([...deletionPromises, ...creationPromises]);
                // 4. Send final response
                return resp.status(200).json({
                    success: true,
                    message: "Knowledge base and associated metadata updated successfully.",
                });
            } catch (error) {
                console.error(error);
                return resp.status(500).json({
                    success: false,
                    message: "Something went wrong while saving knowledge base.",
                });
            }
        });
    });
    app.post(`/${prefix}/knowledgebase-delete`, async (req, resp) => {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) {
            return resp.status(401).json({ success: false, message: "No token provided." });
        }
        jwt.verify(token, secretKey, async (err, authData) => {
            if (err) {
                return resp.status(401).json({ success: false, message: "Invalid token" });
            }
            let { knowledgeBaseId } = req.body;
            if (!knowledgeBaseId) {
                return resp.status(400).json({
                    success: false,
                    message: "Missing required fields.",
                });
            }
            const findUserKnowledgeBase = await KnowledgeBase.findOne({
                where: {
                    user_uuid: authData.userData.uuid,
                    id: knowledgeBaseId,
                }
            });
            if(!findUserKnowledgeBase){
                return resp.status(400).json({
                    success: false,
                    message: "Knowledge base not found.",
                });
            } else {
                await KnowledgeBase.destroy({
                    where: {
                        user_uuid: authData.userData.uuid,
                        id: knowledgeBaseId,
                    }
                });
                await KnowledgebaseMeta.destroy({
                    where: {
                        knowledgeBase_id: findUserKnowledgeBase.id,
                    },
                });
                const knowledgebaseData = {
                    id: findUserKnowledgeBase.id,
                    knowledgeBase_title: findUserKnowledgeBase.knowledgeBase_title,
                    knowledgeBase_content: findUserKnowledgeBase.knowledgeBase_content,
                    social_platform: findUserKnowledgeBase.social_platform,
                    socialDataDetail: findUserKnowledgeBase.socialDataDetail,
                    status: findUserKnowledgeBase.status,
                };

                const CountKnowledgeBase = await KnowledgeBase.count({
                    where: {
                        user_uuid: authData.userData.uuid
                    }
                });

                if(CountKnowledgeBase===0){
                    await Settings.destroy({
                        where: {
                            user_uuid: authData.userData.uuid,
                            module_name:'Message',
                        }
                    });
                }                

                // knowledgebase N8N
                    // try {
                    //     const response = await axios.post(`${process.env.N8N_KNOWLEDGEBASE_WEBHOOK_URL}`, {
                    //         knowledgebaseData: knowledgebaseData
                    //     });
                    //     //console.log("knowledgebase N8N response: ",response.data);
                    // } catch(err){
                    //     console.error('error while call knowledgebase N8N :', err.response?.data || err.message);
                    // }
                // knowledgebase N8N
                return resp.status(200).json({
                    success: true,
                    message: "Knowledge base delete successfully.",
                });
            }
        });
    });

// End knowledge base functions

server.listen(serverPort, () => {
    console.log(`Server is running on port ${serverPort}`);
});

// Connect to the database and start the server
// connectDB().then(() => {
//     app.listen(serverPort, () => {
//         console.log(`Server is running on port ${serverPort}`);
//     });
// }).catch(err => {
//     console.error("Database connection failed:", err);
//     process.exit(1);
// });
