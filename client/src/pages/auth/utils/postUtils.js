import moment from 'moment';

export const formatPostTimeForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    
    const momentDate = moment(dateString);
    const now = moment();

    // Handle invalid dates
    if (!momentDate.isValid()) return 'Invalid date';

    const diffInMinutes = now.diff(momentDate, 'minutes');
    const diffInMonths = now.diff(momentDate, 'months');

    // Check if it's a future date
    if (momentDate.isAfter(now)) {
        const futureDiffInMinutes = momentDate.diff(now, 'minutes');
        const futureDiffInMonths = momentDate.diff(now, 'months');

        if (futureDiffInMinutes < 1) {
            return 'in a few seconds';
        } else if (futureDiffInMonths >= 3) {
            // Far future — show exact date
            return momentDate.format('DD/MM/YYYY');
        } else {
            // Near future — show relative time
            return 'in ' + momentDate.fromNow(true);
        }
    }

    // Handle past dates
    if (diffInMinutes < 1) {
        return 'just now';
    } else if (diffInMonths >= 3) {
        // Older than 3 months — show exact date
        return momentDate.format('DD/MM/YYYY');
    } else {
        // Within 3 months — show relative time
        return momentDate.fromNow(true) + ' ago';
    }
};

export const getPostPreviewImage = (post) => {
    const media = post.postMedia || post.post_media;
    if (media) {
        try {
            const mediaArray = JSON.parse(media);
            const imageUrl = mediaArray[0]?.path || mediaArray[0]?.url;
            if (imageUrl) {
                return imageUrl.startsWith('http') ? imageUrl : `${process.env.REACT_APP_BACKEND_URL}${imageUrl}`;
            }
        } catch (e) {
            console.error("Error parsing media JSON for post:", post.id, e);
        }
    }
    return null; 
};