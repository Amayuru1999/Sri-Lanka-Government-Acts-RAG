import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaRegEyeSlash } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import signup from "../assets/images/sign.jpg";
import footerbackheight from "../assets/images/footerbackheight.png";

export default function SignUpPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left: Sign-up form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          {/* Logo & Back */}
          <div className="mb-6 flex items-center gap-2">
            <button
              className="text-2xl font-extrabold text-green-800 cursor-pointer"
              onClick={() => (window.location.href = "/")}
              aria-label="Go back to home page"
            >
              <FaArrowLeft className="w-4 text-[#0a1117]" />
            </button>
            <span className="text-2xl font-bold text-[#0a1117]">GovDocLex</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Create Account</h2>
          <p className="mb-6 text-gray-500">
            Already have an account?{" "}
            <a
              href="/signin"
              className="text-green-800 font-semibold hover:underline"
            >
              Sign in
            </a>
          </p>
          <form className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-800"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <FaRegEyeSlash className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <FaRegEyeSlash className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <input type="checkbox" className="accent-green-800 mr-2" />
              I agree to the{" "}
              <a href="#" className="text-green-800 ml-1 hover:underline">
                Terms & Conditions
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-[#0a1117] text-white py-2 rounded font-semibold hover:bg-green-900 transition"
            >
              Sign up
            </button>
          </form>
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const response = await axios.post(
                  `${import.meta.env.VITE_SERVER_API}/google-auth`,
                  { credential: credentialResponse.credential }
                );
                localStorage.setItem('token', response.data.token);
                navigate('/chatbot');
              } catch (error) {
                console.error('Google auth failed', error);
              }
            }}
            onError={() => {
              console.log('Google sign-up failed');
            }}
            useOneTap
            text="continue_with"
            shape="rectangular"
            width="100%"
            logo_alignment="left"
          />
        </div>
      </div>

      {/* Right: Promo and features */}
      <div className="hidden md:flex flex-col flex-1 bg-[#0a1117] text-white justify-center px-12 py-8 relative items-center">
        <div className="rounded-xl p-6 mb-8 max-w-md">
          <img
            src={signup}
            alt="Sign Up"
            className="w-full h-96 object-cover rounded-xl mb-4"
          />
        </div>
        <div className="flex items-center justify-center flex-col text-center">
          <h3 className="text-4xl font-semibold mb-3">
            Join GovDocLex Today
          </h3>
          <p className="text-gray-200 max-w-md text-xl">
            Get started with secure and accurate document extraction from government documents.
          </p>
        </div>
        <img
          src={footerbackheight}
          alt="Background"
          className="absolute bottom-0 left-0 w-full object-cover opacity-50"
        />
      </div>
    </div>
  );
}
