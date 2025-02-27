export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'If the user exists, it will receive an email with instructions on how to reset the password',
      });
    }

    const randomPassword = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await updateUserPasswordInDB(user.id, hashedPassword);

    // TODO - Implement email sending
    // return await sendGeneratedPasswordToUser(email, randomPassword);
    return res.status(200).json({
      success: true,
      message: 'If the user exists, it will receive an email with instructions on how to reset the password',
    });
  } catch (error) {
    logError('Error generating new password', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating a new password',
    });
  }
};
