// utils/activityCreate.js
const Activity = require("../models/mysql/Activity");

function getFormattedDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

async function activityCreate(user_uuid,account_social_userid,account_platform,activity_type,activity_subType,action,source_type,post_form_id,reference_pageID,nextAPI_call_dateTime, activity_dateTime = getFormattedDateTime()) {
    try {
        const activity = await Activity.create({
            user_uuid,
            account_social_userid,
            account_platform,
            activity_type,
            activity_subType,
            action,
            source_type,
            post_form_id,
            reference_pageID,
            activity_dateTime,
            nextAPI_call_dateTime
        });
        return activity;
    } catch (error) {
        console.error("Activity creation failed:", error);
        throw error;
    }
}

module.exports = activityCreate;
