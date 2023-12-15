import AppError from '../errors/appError.js';
import intercationServices from '../services/interactionService.js';
import userService from '../services/userService.js';
import {
    separateMentionsTrends,
    catchAsync,
    getOffsetAndLimit,
    calcualtePaginationData,
    mapInteractions,
} from '../utils/index.js';

import { uploadMultipleFile } from '../utils/aws.js';
import fs from 'fs';
import util from 'util';
const unlinkFile = util.promisify(fs.unlink);

const createTweet = catchAsync(async (req, res, next) => {
    const userID = req.user.id;
    const text = req.body.text;

    //check if there is no text or media
    if (!text && (req.files == null || req.files.length <= 0)) {
        return next(new AppError('tweet can not be empty', 400));
    }
    const { mentions, trends } = separateMentionsTrends(text);
    //check that all mentions are users
    const filteredMentions = await intercationServices.checkMentions(mentions);

    const tweet = await intercationServices.addTweet(
        req.files,
        text,
        filteredMentions,
        trends,
        userID
    );
    const mentionedUserData = filteredMentions.map((mention) => ({
        id: mention.id,
        username: mention.username,
        name: mention.name,
        email: mention.email,
    }));

    const media = !req.files ? [] : req.files.map((file) => file.filename);
    /////upload medio on S3
    if (req.files) {
        await uploadMultipleFile(req.files);

        await Promise.all(
            req.files.map(async (file) => {
                await unlinkFile(file.path);
            })
        );
    }
    return res.status(201).send({
        data: { tweet, mentionedUserData, trends, media },
        status: 'success',
    });
});

const searchForTweets = catchAsync(async (req, res, next) => {
    const myId = req.user.id;
    const searchedUserId = req.query.id;
    const keyword = req.params.keyword;
    let { offset, limit } = getOffsetAndLimit(req);
    const totalCount = await intercationServices.getMatchingTweetsCount(
        keyword,
        searchedUserId
    );
    offset = Math.min(offset, totalCount);
    let searchedTweets;
    if (searchedUserId) {
        const user = await userService.getUserById(searchedUserId);
        if (!user) {
            return next(new AppError('no user found', 404));
        }
        searchedTweets = await intercationServices.searchForTweetsInProfile(
            myId,
            keyword,
            searchedUserId,
            offset,
            limit
        );
    } else
        searchedTweets = await intercationServices.searchForTweets(
            myId,
            keyword,
            offset,
            limit
        );

    // eslint-disable-next-line no-unused-vars
    const { ids: tweetsID, data: tweets } = mapInteractions(searchedTweets);

    const pagination = calcualtePaginationData(
        req,
        offset,
        limit,
        totalCount,
        tweets
    );

    return res.status(200).send({
        data: { items: tweets },
        pagination,
        status: 'success',
    });
});

const suggestTweets = catchAsync(async (req, res, next) => {
    let { offset, limit } = getOffsetAndLimit(req);
    const { keyword } = req.query;
    const totalCount =
        await intercationServices.getSuggestionsTotalCount(keyword);
    offset = Math.min(offset, totalCount);

    const suggestions = await intercationServices.searchSuggestions(
        keyword,
        limit,
        offset
    );

    const pagination = calcualtePaginationData(
        req,
        offset,
        limit,
        totalCount,
        suggestions
    );

    return res.json({
        status: 'success',
        data: { items: suggestions },
        pagination,
    });
});

export { createTweet, searchForTweets, suggestTweets };
