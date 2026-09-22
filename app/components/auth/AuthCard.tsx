import React, {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@contexts/AuthContext";
import { useToast } from "@contexts/ToastContext";
import { TermsOfServiceModal } from "@modals/TermsOfServiceModal";
import { PrivacyPolicyModal } from "@modals/PrivacyPolicyModal";
import type { LoginFormData, SignUpFormData } from "@app-types";
import "./AuthCard.css";

export interface AuthCardProps {
  initialMode?: "signin" | "signup";
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialMode = "signin",
}) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === "signup");

  // Keep state in sync if initialMode prop changes (e.g. browser navigation)
  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  // Password visibility states
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form loading & error states
  const [isSignInLoading, setIsSignInLoading] = useState(false);
  const [isSignUpLoading, setIsSignUpLoading] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  // Email verification screen state
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Terms & Privacy Modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Sign In Controlled State
  const [signInData, setSignInData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Sign Up Controlled State
  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    name: "",
    company_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  // Validation Error States
  const [signInErrors, setSignInErrors] = useState<
    Partial<Record<keyof LoginFormData, string>>
  >({});
  const [signUpErrors, setSignUpErrors] = useState<
    Partial<Record<keyof SignUpFormData, string>>
  >({});

  const handleSwitchToSignUp = () => {
    setIsSignUp(true);
    setSignInError("");
    setSignUpError("");
    setUnverifiedEmail("");
    navigate("/signup", { replace: true });
  };

  const handleSwitchToSignIn = () => {
    setIsSignUp(false);
    setSignInError("");
    setSignUpError("");
    setUnverifiedEmail("");
    navigate("/login", { replace: true });
  };

  const handleSocialClick = (e: React.MouseEvent, provider: string) => {
    e.preventDefault();
    showToast(
      `${provider} sign-in will be available soon. Please use email.`,
      "info",
    );
  };

  const validateSignIn = (): boolean => {
    const errors: Partial<Record<keyof LoginFormData, string>> = {};
    if (!signInData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      errors.email = "Email is invalid";
    }

    if (!signInData.password) {
      errors.password = "Password is required";
    } else if (signInData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setSignInErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignUp = (): boolean => {
    const errors: Partial<Record<keyof SignUpFormData, string>> = {};
    if (!signUpData.name.trim()) {
      errors.name = "Full name is required";
    }

    if (!signUpData.company_name.trim()) {
      errors.company_name = "Company name is required";
    }

    if (!signUpData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      errors.email = "Email is invalid";
    }

    if (!signUpData.password) {
      errors.password = "Password is required";
    } else if (signUpData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!signUpData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the terms & privacy policy";
    }

    setSignUpErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignInSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignInError("");

    if (!validateSignIn()) return;

    setIsSignInLoading(true);
    try {
      await login(signInData.email, signInData.password);
      navigate("/");
    } catch (error: any) {
      if (
        error.response?.status === 403 &&
        error.response?.data?.requiresVerification
      ) {
        setUnverifiedEmail(signInData.email);
        setSignInError("Please verify your email address before logging in.");
      } else {
        setSignInError(
          error.response?.data?.error || "Login failed. Please try again.",
        );
      }
    } finally {
      setIsSignInLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignUpError("");

    if (!validateSignUp()) return;

    setIsSignUpLoading(true);
    try {
      await register({
        name: signUpData.name,
        company_name: signUpData.company_name,
        email: signUpData.email,
        password: signUpData.password,
      });
      setRegisteredEmail(signUpData.email);
      setRequiresVerification(true);
    } catch (error: any) {
      setSignUpError(
        error.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setIsSignUpLoading(false);
    }
  };

  if (requiresVerification) {
    return (
      <div className="auth-card-container">
        <div className="container verification-mode">
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[440px] w-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] mb-4">
              <svg
                className="w-8 h-8 text-[#D4AF37]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#F5E6C8] mb-2 font-serif">
              Check Your Email
            </h2>
            <p className="text-[#a0a5ad] mb-4 text-sm max-w-sm">
              Account created successfully! We sent a verification link to:
            </p>
            <p className="text-sm font-semibold text-[#D4AF37] break-all bg-[#171717] border border-[rgba(107,114,128,0.25)] px-4 py-2 rounded-lg mb-6">
              {registeredEmail}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => navigate("/resend-verification")}
                className="auth-btn w-full"
              >
                Didn't receive email?
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequiresVerification(false);
                  setIsSignUp(false);
                  navigate("/login");
                }}
                className="ghost-btn w-full"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card-container">
      <div
        className={`container ${isSignUp ? "right-panel-active" : ""}`}
        id="container"
      >
        {/* Sign Up Container */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUpSubmit} noValidate>
            <h1>Create Account</h1>

            <span className="auth-subtitle">
              or use your email for registration
            </span>

            <div className="input-group">
              <input
                type="text"
                placeholder="Full Name"
                value={signUpData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSignUpData({ ...signUpData, name: e.target.value })
                }
                className={signUpErrors.name ? "input-error" : ""}
                required
              />
              {signUpErrors.name && (
                <span className="error-text">{signUpErrors.name}</span>
              )}
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="Company Name"
                value={signUpData.company_name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSignUpData({
                    ...signUpData,
                    company_name: e.target.value,
                  })
                }
                className={signUpErrors.company_name ? "input-error" : ""}
                required
              />
              {signUpErrors.company_name && (
                <span className="error-text">{signUpErrors.company_name}</span>
              )}
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder="Email Address"
                value={signUpData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSignUpData({ ...signUpData, email: e.target.value })
                }
                className={signUpErrors.email ? "input-error" : ""}
                required
              />
              {signUpErrors.email && (
                <span className="error-text">{signUpErrors.email}</span>
              )}
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signUpData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSignUpData({ ...signUpData, password: e.target.value })
                  }
                  className={signUpErrors.password ? "input-error" : ""}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="toggle-password-btn"
                  title={showSignUpPassword ? "Hide password" : "Show password"}
                >
                  {showSignUpPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {signUpErrors.password && (
                <span className="error-text">{signUpErrors.password}</span>
              )}
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={signUpData.confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSignUpData({
                      ...signUpData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={signUpErrors.confirmPassword ? "input-error" : ""}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password-btn"
                  title={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {signUpErrors.confirmPassword && (
                <span className="error-text">
                  {signUpErrors.confirmPassword}
                </span>
              )}
            </div>

            <div className="terms-checkbox-group">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={signUpData.agreeToTerms}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSignUpData({
                    ...signUpData,
                    agreeToTerms: e.target.checked,
                  })
                }
              />
              <label htmlFor="agreeToTerms">
                I agree to the{" "}
                <button
                  type="button"
                  className="link-inline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                >
                  Terms
                </button>{" "}
                &{" "}
                <button
                  type="button"
                  className="link-inline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            {signUpErrors.agreeToTerms && (
              <span className="error-text">{signUpErrors.agreeToTerms}</span>
            )}

            {signUpError && (
              <div className="auth-alert-box">
                <p>{signUpError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSignUpLoading}
              className="auth-btn"
            >
              {isSignUpLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
            </button>

            {/* Mobile-only toggle fallback */}
            <div className="mobile-toggle-wrapper">
              <span>Already have an account?</span>
              <button
                type="button"
                onClick={handleSwitchToSignIn}
                className="mobile-toggle-btn"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>

        {/* Sign In Container */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignInSubmit} noValidate>
            <h1>Sign in</h1>

            <span className="auth-subtitle">or use your account</span>

            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={signInData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSignInData({ ...signInData, email: e.target.value })
                }
                className={signInErrors.email ? "input-error" : ""}
                required
              />
              {signInErrors.email && (
                <span className="error-text">{signInErrors.email}</span>
              )}
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <input
                  type={showSignInPassword ? "text" : "password"}
                  placeholder="Password"
                  value={signInData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSignInData({ ...signInData, password: e.target.value })
                  }
                  className={signInErrors.password ? "input-error" : ""}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="toggle-password-btn"
                  title={showSignInPassword ? "Hide password" : "Show password"}
                >
                  {showSignInPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {signInErrors.password && (
                <span className="error-text">{signInErrors.password}</span>
              )}
            </div>

            <div className="form-helper-links">
              <Link to="/forgot-password" className="auth-link">
                Forgot your password?
              </Link>
              <Link to="/resend-verification" className="auth-link">
                Verify Email
              </Link>
            </div>

            {signInError && (
              <div className="auth-alert-box">
                <p>{signInError}</p>
                {unverifiedEmail && (
                  <button
                    type="button"
                    onClick={() => navigate("/resend-verification")}
                    className="link-inline mt-1 text-xs underline font-semibold"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSignInLoading}
              className="auth-btn"
            >
              {isSignInLoading ? "SIGNING IN..." : "SIGN IN"}
            </button>

            {/* Mobile-only toggle fallback */}
            <div className="mobile-toggle-wrapper">
              <span>Don't have an account?</span>
              <button
                type="button"
                onClick={handleSwitchToSignUp}
                className="mobile-toggle-btn"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>

        {/* Sliding Overlay Container */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Left Overlay (shown when Sign Up active, clicking switches to Sign In) */}
            <div className="overlay-panel overlay-left">
              <div className="overlay-brand">
                <div className="overlay-logo-box">
                  <img
                    src="/logo/logo-icon.svg"
                    alt="HireDesk Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="overlay-brand-title">HireDesk</span>
              </div>
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with HireDesk please login with your personal
                info
              </p>
              <button
                type="button"
                className="ghost"
                id="signIn"
                onClick={handleSwitchToSignIn}
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay (shown when Sign In active, clicking switches to Sign Up) */}
            <div className="overlay-panel overlay-right">
              <div className="overlay-brand">
                <div className="overlay-logo-box">
                  <img
                    src="/logo/logo-icon.svg"
                    alt="HireDesk Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="overlay-brand-title">HireDesk</span>
              </div>
              <h1>Hello, Friend!</h1>
              <p>
                Enter your personal details and start your hiring journey with
                us
              </p>
              <button
                type="button"
                className="ghost"
                id="signUp"
                onClick={handleSwitchToSignUp}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};

export default AuthCard;
