import { useState, FormEvent } from "react";
import axios from "axios";
import { FaRegEyeSlash, FaArrowLeft, FaRegEye } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import signin from "../assets/images/sign.jpg";
import footerbackheight from "../assets/images/footerbackheight.png";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export default function SignInPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // const response = await axios.post<LoginResponse>(
      //   `${import.meta.env.VITE_SERVER_API}/login`,
      //   { email, password }
      // );
      // toast.success('Signed in successfully!');
      // const { token } = response.data;
      // localStorage.setItem("token", token);
      navigate("/chatbot");
    } catch (err: any) {
      // setError(
      //   err.response?.data?.message || "Login failed. Please try again."
      // );
      navigate("/chatbot");
      // toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 max-w-[1920px] mx-auto">
      {/* Left side: Login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 flex items-center gap-2">
            <button
              className="text-2xl font-extrabold text-green-800 cursor-pointer"
              onClick={() => (window.location.href = "/")}
              aria-label="Go back to home"
            >
              <FaArrowLeft className="w-4 text-[#0a1117]" />
            </button>
            <span className="text-2xl font-bold text-[#0a1117]">GovDocLex</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Sign in</h2>
          <p className="mb-6 text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-green-800 font-semibold hover:underline"
            >
              Create now
            </button>
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-800"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="@#*%"
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-800"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaRegEye className="w-5 h-5" />
                  ) : (
                    <FaRegEyeSlash className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="accent-green-800" />
                Remember me
              </label>
              <a href="#" className="text-sm text-green-800 hover:underline">
                Forgot Password?
              </a>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded font-semibold transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0a1117] hover:bg-green-900 text-white"
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div className="space-y-3">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                console.log(credentialResponse.credential);
                try {
                  const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_API}/google-auth`,
                    { credential: credentialResponse.credential }
                  );
                  localStorage.setItem("token", response.data.token);
                  navigate("/chatbot");
                } catch (err: any) {
                  setError("Google login failed. Please try again.");
                }
              }}
              onError={() => {
                setError("Google login failed. Please try again.");
              }}
              useOneTap
              size="large"
              shape="rectangular"
              text="continue_with"
              width={350}
              logo_alignment="left"
            />
          </div>
        </div>
      </div>

      {/* Right side: Promo */}
      <div className="hidden md:flex flex-col flex-1 bg-[#0a1117] text-white justify-center px-12 py-8 relative items-center">
        <div className="rounded-xl p-6 mb-8 max-w-md">
          <img
            src={signin}
            alt="Sign In"
            className="w-full h-96 object-cover rounded-xl mb-4"
          />
        </div>

        <div className="flex items-center justify-center flex-col text-center">
          <h3 className="text-4xl font-semibold mb-3">
            Welcome to the Government Document Extraction Portal
          </h3>
          <p className="text-gray-200 max-w-lg text-xl">
            This secure platform enables authorized users to upload, extract,
            and manage critical information from official documents with speed
            and accuracy.
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
