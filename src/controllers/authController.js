import AppError from '../errors/appError.js';
import catchAsync from '../utils/catchAsync.js';
import userService from '../services/userService.js';
import {
    getEmailVerificationToken,
    updateEmailVerificationToken,
    createEmailVerificationToken,
} from '../services/emailVerificationTokenService.js';
import createRandomByteToken from '../utils/createRandomByteToken.js';
import { sendVerificationEmail } from '../utils/sendEmail.js';

const SendEmailVerification = catchAsync(async (req, res, next) => {
    const RESEND_AFTER_SECONDS = 30;
    const { email } = req.body;
    // 1) check if email is not in the user database
    const isUserExists = await userService.checkUserEmailExists(email);

    if (isUserExists) {
        return next(new AppError('Email is already exists and verified', 400));
    }
    // 2) retrieve the emailVerificationToken from the database if exist
    const tokenInfo = await getEmailVerificationToken(email);

    // 3) if exist, check if the token created less than 30 seconds
    if (
        tokenInfo &&
        (Date.now() - tokenInfo.lastUpdatedAt) / 1000 < RESEND_AFTER_SECONDS
    ) {
        return next(
            new AppError(
                `More than one request in less than ${RESEND_AFTER_SECONDS} seconds`,
                429
            )
        );
    }
    // 4) create a new token
    const newVerificationToken = createRandomByteToken(4);

    // 5) send email
    await sendVerificationEmail(email, newVerificationToken.token);
    // 4) stored in the emailVerificationTokens database
    if (tokenInfo) {
        await updateEmailVerificationToken(
            email,
            newVerificationToken.encryptedToken
        );
    } else {
        await createEmailVerificationToken(
            email,
            newVerificationToken.encryptedToken
        );
    }
    // 6) return success

    return res.status(200).json({
        status: 'success',
        data: null,
    });
});
export default { SendEmailVerification };
