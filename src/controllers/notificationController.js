import AppError from '../errors/appError.js';
import nofiticationService from '../services/nofiticationService.js';
import { sendNotification, catchAsync, pagination } from '../utils/index.js';
const addFollowNotification = catchAsync(async (req, res, next) => {
    await nofiticationService.addFollowNotificationDB(
        req.user,
        req.follwedUser
    );
    const androidTokens = await nofiticationService.getFirebaseToken(
        req.follwedUser.id,
        'A'
    );
    const webTokens = await nofiticationService.getFirebaseToken(
        req.follwedUser.id,
        'W'
    );
    sendNotification(androidTokens, webTokens, 'FOLLOW', req.username, null);
    return res;
});

const addLikeNotification = catchAsync(async (req, res, next) => {
    await nofiticationService.addLikeNotificationDB(req.user, req.interaction);
    const androidTokens = await nofiticationService.getFirebaseToken(
        req.interaction.user.id,
        'A'
    );
    const webTokens = await nofiticationService.getFirebaseToken(
        req.interaction.user.id,
        'W'
    );
    sendNotification(
        androidTokens,
        webTokens,
        'LIKE',
        req.username,
        req.interaction
    );
    return res;
});

const addAndoridToken = catchAsync(async (req, res, next) => {
    if (nofiticationService.checkTokens(req.body.token, 'A')) {
        return next(new AppError('this token already exists', 400));
    }
    await nofiticationService.addToken(req.user.id, req.body.token, 'A');
    res.status(201).send({
        status: 'success',
        data: null,
    });
});

const addWebToken = catchAsync(async (req, res, next) => {
    if (nofiticationService.checkTokens(req.body.token, 'W')) {
        return next(new AppError('this token already exists', 400));
    }
    await nofiticationService.addToken(req.user.id, req.body.token, 'W');
    res.status(201).send({
        status: 'success',
        data: null,
    });
});

const addReplyNotification = catchAsync(async (req, res, next) => {
    await nofiticationService.addReplyNotificationDB(req.user, req.interaction);
    const androidTokens = await nofiticationService.getFirebaseToken(
        req.interaction.user.id,
        'A'
    );
    const webTokens = await nofiticationService.getFirebaseToken(
        req.interaction.user.id,
        'W'
    );
    sendNotification(
        androidTokens,
        webTokens,
        'REPLY',
        req.username,
        req.interaction
    );
    return res;
});
const getNotiication = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    const schema = {
        where: {
            userID: userId,
        },
        orderBy: {
            createdDate: 'desc', // 'desc' for descending order, 'asc' for ascending order
        },
        select: {
            createdDate: true,
            action: true,
            interaction: true,
            fromUser: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    };

    const paginationData = await pagination(req, 'notifications', schema);
    const items = paginationData.data.items;
    let notificationCount = 0;
    const notifications = [];
    for (const item of items) {
        if (
            notificationCount > 0 &&
            notifications[notificationCount - 1].action == item.action &&
            item.action == 'FOLLOW'
        ) {
            notifications[notificationCount - 1].text = `${
                notifications[notificationCount - 1].fromUser.username
            } and others have followed you`;
        } else if (
            notificationCount > 0 &&
            notifications[notificationCount - 1].action == item.action &&
            item.action == 'LIKE' &&
            item.interaction.id ==
                notifications[notificationCount - 1].interaction.id
        ) {
            notifications[notificationCount - 1].text = `${
                notifications[notificationCount - 1].fromUser.username
            } and others have Liked your ${item.interaction.type}`;
        } else if (
            notificationCount > 0 &&
            notifications[notificationCount - 1].action == item.action &&
            item.action == 'REPLY' &&
            item.interaction.id ==
                notifications[notificationCount - 1].interaction.id
        ) {
            notifications[notificationCount - 1].text = `${
                notifications[notificationCount - 1].fromUser.username
            } and others have replied to your ${item.interaction.type}`;
        } else {
            notifications.push(item);
            if (item.action == 'MENTION')
                notifications[
                    notificationCount
                ].text = `${item.fromUser.username} has mentioned you in a ${item.interaction.type}`;
            else if (item.action == 'LIKE')
                notifications[
                    notificationCount
                ].text = `${item.fromUser.username} has Liked your ${item.interaction.type}`;
            else if (item.action == 'REPLY')
                notifications[
                    notificationCount
                ].text = `${item.fromUser.username} has replied to your ${item.interaction.type}`;
            else if (item.action == 'FOLLOW')
                notifications[
                    notificationCount
                ].text = `${item.fromUser.username} has followed you`;
            notificationCount++;
        }
    }
    const paginationDetails = {
        itemsNumber: paginationData.pagination.itemsCount,
        nextPage: paginationData.pagination.nextPage,
        prevPage: paginationData.pagination.prevPage,
    };

    return res.status(200).send({
        data: { notifications },
        pagination: paginationDetails,
        status: 'success',
    });
});

export default {
    addFollowNotification,
    addLikeNotification,
    addAndoridToken,
    addWebToken,
    addReplyNotification,
    getNotiication,
};
