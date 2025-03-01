import { logError } from '../config/loggerFunctions.mjs';
import { getUserByEmail } from '../models/userModel.mjs';
import { createPasswordResetToken } from '../models/passwordResetTokensModel.mjs';
import { sendResetPasswordTokenToUser } from '../integrations/brevo/transactionalEmails/sendResetPasswordTokenToUser.mjs';

export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (user) {
      const tokenCreation = await createPasswordResetToken(user.id);

      await sendResetPasswordTokenToUser(email, tokenCreation.tokenId);
    }

    return res.status(200).json({
      success: true,
      message: 'If this email exists, a reset link will been sent',
    });
  } catch (error) {
    logError('Error in forgotPasswordRequest function', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred, please try again later',
      error: error,
    });
  }
};
