import prisma from '../../prisma.js';
import bcrypt from 'bcryptjs';
const addUserToDB1 = async () => {
    const password = await bcrypt.hash('12345678Aa@', 8);
    return await prisma.user.create({
        data: {
            id: 'cloudezgg0000356mmmnro8ze',
            email: 'ibrahim.Eman83@gmail.com',
            phone: '01285043196',
            username: 'sara_2121',
            name: 'Sara',
            birthdayDate: new Date('10-17-2023').toISOString(),
            password,
        },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            birthdayDate: true,
            bio: true,
        },
    });
};

const addUserToDB2 = async () => {
    const password = await bcrypt.hash('12345678Aa@', 8);
    return await prisma.user.create({
        data: {
            email: 'nesmaShafie342@gmail.com',
            phone: '01122429966',
            username: 'sara_3333',
            name: 'Sara',
            birthdayDate: new Date('10-17-2023').toISOString(),
            password,
        },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            birthdayDate: true,
            bio: true,
        },
    });
};

const addUserToDB3 = async () => {
    const password = await bcrypt.hash('12345678Aa@', 8);
    return await prisma.user.create({
        data: {
            email: 'aliaagheis@gmail.com',
            phone: '01069871745',
            username: 'aliaagheis',
            name: 'aliaa',
            birthdayDate: new Date('10-17-2023').toISOString(),
            password,
        },
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            birthdayDate: true,
            bio: true,
        },
    });
};

const addFollow = async (followerId, followingId) => {
    await prisma.follow.create({
        data: {
            userID: followerId,
            followingUserID: followingId,
        },
    });
};

const findFollow = async (followerId, followingId) => {
    return await prisma.follow.findUnique({
        where: {
            userID_followingUserID: {
                userID: followerId,
                followingUserID: followingId,
            },
        },
    });
};

const deleteFollows = async () => {
    return await prisma.follow.deleteMany({});
};

const deleteUsers = async () => {
    return await prisma.$queryRaw`DELETE FROM User;`;
};

const deleteBlockedTokens = async () => {
    return await prisma.blockedTokens.deleteMany();
};

const deleteEmailVerification = async () => {
    return await prisma.emailVerificationToken.deleteMany();
};

module.exports = {
    addUserToDB1,
    addUserToDB2,
    addUserToDB3,
    addFollow,
    findFollow,
    deleteFollows,
    deleteUsers,
    deleteEmailVerification,
    deleteBlockedTokens,
};
