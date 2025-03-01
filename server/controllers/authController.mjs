import { logError } from '../config/loggerFunctions.mjs';
import { getUserByEmail } from '../models/userModel.mjs';
import { createPasswordResetToken } from '../models/passwordResetTokensModel.mjs';

export const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (user) {
      await createPasswordResetToken(user.id);
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
