import {
  localSignup,
  localSignIn,
  googleAuth,
  findUserById,
} from "../services/authService.js";

const localSignupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await localSignup(name, email, password);
    res.status(201).json({
      status: true,
      message: "Account created successfully",
      token,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

const localSignInController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await localSignIn(email, password);
    const userResponse = { ...user._doc };
    delete userResponse.password;
    res.json({
      status: true,
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

export const googleAuthController = async (req, res) => {
  try {
    const { credential } = req.body;
    const { user, token } = await googleAuth(credential);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        authMethod: user.authMethod,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google login failed" });
  }
};

export const getUserByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await findUserById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

export {
  localSignupController as localSignup,
  localSignInController as localSignIn,
  googleAuthController as googleAuth,
};
