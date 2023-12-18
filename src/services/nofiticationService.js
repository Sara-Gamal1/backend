import prisma from '../prisma.js';

/**
 * @namespace Service.Notifications
 */

/**
 * Gets the count of unseen notifications for a user.
 *
 * @memberof Service.Notifications
 * @method getUnseenNotificationsCount
 * @async
 * @param {String} userID - User ID.
 * @returns {Promise<number>} A promise that resolves to the count of unseen notifications for the user.
 */
const getUnseenNotificationsCount = async (userID) => {
    const user = await prisma.user.findFirst({
        where: {
            id: userID,
        },
        select: {
            _count: {
                select: {
                    notificationsTOMe: {
                        where: {
                            seen: false,
                        },
                    },
                },
            },
        },
    });
    return user._count.notificationsTOMe;
};

/**
 * Gets the total count of notifications for a user.
 *
 * @memberof Service.Notifications
 * @method getAllNotificationsCount
 * @async
 * @param {String} userID - User ID.
 * @returns {Promise<number>} A promise that resolves to the total count of notifications for the user.
 */
const getAllNotificationsCount = async (userID) => {
    const user = await prisma.user.findFirst({
        where: {
            userID,
        },
        select: {
            _count: {
                select: {
                    notificationsTOMe: true,
                },
            },
        },
    });
    return user._count.notificationsTOMe;
};
/**
 * Adds a follow notification to the database.
 *
 * @memberof Service.Notifications
 * @async
 * @param {Object} follower - The id of the user initiating the follow action.
 * @param {Object} followed - The id of the user being followed.
 * @throws {Error} If there is an issue creating the follow notification in the database.
 */
const addFollowNotificationDB = async (followerID, followedID) => {
    await prisma.notifications.create({
        data: {
            action: 'FOLLOW',
            seen: false,
            userID: followedID,
            fromUserID: followerID,
        },
    });
};

/**
 * Adds a Like notification to the database.
 *
 * @memberof Service.Notifications
 * @async
 * @param {Object} userID - The id of the  user who liked the interaction.
 * @param {Object} interaction - The interaction object representing the Like action.
 * @throws {Error} If there is an issue creating the Like notification in the database.
 */
const addLikeNotificationDB = async (userID, interaction) => {
    await prisma.notifications.create({
        data: {
            action: 'LIKE',
            seen: false,
            userID: interaction.user.id,
            fromUserID: userID,
            interactionID: interaction.id,
        },
    });
};
/**
 * Adds a Reply notification to the database.
 *
 * @memberof Service.Notifications
 * @async
 * @param {string} fromUserID - The ID of the user who replied to the interaction.
 * @param {Object} interaction - The interaction object representing the reply action.
 * @param {string} userID - The ID of the user receiving the notification.
 * @throws {Error} If there is an issue creating the reply notification in the database.
 */
const addReplyNotificationDB = async (fromUserID, interaction, userID) => {
    await prisma.notifications.create({
        data: {
            action: 'REPLY',
            seen: false,
            userID: userID,
            fromUserID: fromUserID,
            interactionID: interaction.id,
        },
    });
};

/**
 * Adds a device token to the database for push notifications.
 *
 * @memberof Service.Notifications
 * @async
 * @param {string} id - The user ID associated with the token.
 * @param {string} token - The device token for push notifications.
 * @param {string} type - The type of device (e.g., 'W' for web, 'A' for Android).
 * @throws {Error} If there is an issue creating the token in the database.
 */
const addToken = async (id, token, type) => {
    if (type == 'W') {
        await prisma.webTokens.create({
            data: {
                userID: id,
                token: token,
            },
        });
    } else {
        await prisma.andoridTokens.create({
            data: {
                userID: id,
                token: token,
            },
        });
    }
};

/**
 * Checks if a given token exists in the database.
 *
 * @memberof Service.Notifications
 * @async
 * @param {string} token - The device token for push notifications.
 * @param {string} type - The type of device (e.g., 'A' for Android, 'W' for web).
 * @returns {Promise<Object | null>} A promise that resolves to the token record if found, otherwise null.
 */
const checkTokens = async (token, type) => {
    let tokens;
    if (type == 'A')
        tokens = await prisma.andoridTokens.findFirst({
            where: {
                token: token,
            },
        });
    else
        tokens = await prisma.webTokens.findFirst({
            where: {
                token: token,
            },
        });
    return tokens;
};
/**
 * Gets Firebase tokens for a given list of user IDs.
 *
 * @memberof Service.Notifications
 * @async
 * @param {string[]} userIds - An array of user IDs.
 * @param {string} type - The type of device (e.g., 'W' for web, 'A' for Android).
 * @returns {Promise<string[]>} A promise that resolves to an array of Firebase tokens.
 */
const getFirebaseToken = async (userIds, type) => {
    if (type == 'W') {
        const res = await prisma.webTokens.findMany({
            where: {
                userID: {
                    in: userIds,
                },
            },
            select: {
                token: true,
            },
        });

        return res.map((item) => item.token);
    }
    const res = await prisma.andoridTokens.findMany({
        where: {
            userID: {
                in: userIds,
            },
        },
        select: {
            token: true,
        },
    });
    return res.map((item) => item.token);
};
/**
 * Adds mention notifications to the database for multiple users.
 *
 * @memberof Service.Notifications
 * @async
 * @param {Object} userID - The ids of user  mentioning others.
 * @param {Object} interaction - The interaction object representing the mention action.
 * @param {string[]} mentionIds - An array of user IDs being mentioned.
 * @throws {Error} If there is an issue creating mention notifications in the database.
 */
const addMentionNotificationDB = async (userID, interaction, mentionIds) => {
    const notificationsData = mentionIds.map((userId) => ({
        action: 'MENTION',
        seen: false,
        userID: userId,
        fromUserID: userID,
        interactionID: interaction.id,
    }));

    // Using createMany to insert multiple rows at once
    await prisma.notifications.createMany({
        data: notificationsData,
    });
};
/**
 * Updates the 'seen' status of multiple notifications.
 *
 * @memberof Service.Notifications
 * @async
 * @param {Object[]} items - An array of notification items to update.
 * @throws {Error} If there is an issue updating the 'seen' status in the database.
 */
const updateSeen = async (items) => {
    const ids = items.map((item) => item.id);
    await prisma.notifications.updateMany({
        where: {
            id: { in: ids },
        },
        data: {
            seen: true,
        },
    });
};

/**
 * Adds a Retweet notification to the database.
 *
 * @memberof Service.Notifications
 * @async
 * @param {Object} userID - The id of the  user who Retweet the interaction.
 * @param {Object} interaction - The interaction object representing the Retweeted action.
 * @throws {Error} If there is an issue creating the Retweet notification in the database.
 */
const addRetweetNotificationDB = async (userID, interaction) => {
    await prisma.notifications.create({
        data: {
            action: 'RETWEET',
            seen: false,
            userID: interaction.user.id,
            fromUserID: userID,
            interactionID: interaction.id,
        },
    });
};
export default {
    getAllNotificationsCount,
    getUnseenNotificationsCount,
    addFollowNotificationDB,
    addLikeNotificationDB,
    getFirebaseToken,
    addToken,
    checkTokens,
    addReplyNotificationDB,
    addMentionNotificationDB,
    updateSeen,
    addRetweetNotificationDB,
};
