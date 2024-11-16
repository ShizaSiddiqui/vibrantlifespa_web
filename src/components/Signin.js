import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import logo from "../images/logo.png";

const SignIn = ({ setClientId, onClose }) => {
  const [isMobile, setIsMobile] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cartOwnershipCodeId, setCartOwnershipCodeId] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();
  const [resendEnabled, setResendEnabled] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setResendEnabled(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSignIn = async () => {
    try {
      setOtpError("");
      setOtpMessage("");
      setResendEnabled(false);

      let otpResponse;
      if (isMobile) {
        otpResponse = await axios.post(
          "http://localhost:8000/sendOTPforLoginViaNumber",
          {
            mobilePhone: inputValue,
          },
        );
      } else {
        otpResponse = await axios.post(
          "http://localhost:8000/sendOTPforLoginViaEmail",
          {
            email: inputValue,
          },
        );
      }

      if (otpResponse.data?.data?.errors) {
        const error = otpResponse.data.data.errors[0];
        setOtpError(
          error.message || "Failed to send Code. Please check your input.",
        );
        return;
      }

      const ownershipCodeId = isMobile
        ? otpResponse.data?.data?.data?.sendCartOwnershipCodeBySms
            ?.cartOwnershipCodeId
        : otpResponse.data?.data?.data?.sendCartOwnershipCodeByEmail
            ?.cartOwnershipCodeId;

      if (ownershipCodeId) {
        setCartOwnershipCodeId(ownershipCodeId);
        setOtpSent(true);
        setOtpMessage(
          "Code has been sent to your " + (isMobile ? "phone." : "email."),
        );
        setTimer(30);
      } else {
        setOtpError("Failed to generate Code. Please try again.");
      }
    } catch (error) {
      console.error("Error in sign-in process:", error);
      setOtpError("Error sending Code. Please try again.");
    }
  };

  const handleResendOtp = () => {
    handleSignIn(); // Resend the OTP using the same function
  };

  const handleVerifyOtp = async () => {
    try {
      setOtpError("");

      const cartResponse = await axios.post(
        "http://localhost:8000/createCartforUser",
        {
          clientInformation: isMobile
            ? { phoneNumber: inputValue }
            : { email: inputValue },
          locationId: "urn:blvd:Location:90184c75-0c8b-48d8-8a8a-39c9a22e6099",
        },
      );

      const verifyResponse = await axios.post(
        "http://localhost:8000/verifyLoginUsingOTP",
        {
          cartId: cartResponse.data.data.data.createCart.cart.id,
          cartOwnershipCodeId,
          cartOwnershipCodeValue: parseInt(otp, 10),
        },
      );

      if (verifyResponse.data?.data?.errors || !verifyResponse.data?.status) {
        setOtpError("Invalid Code. Please try again.");
        return;
      }

      let clientInfoResponse;
      if (isMobile) {
        clientInfoResponse = await axios.post(
          "http://localhost:8000/getClientInfoViaNumber",
          {
            mobilePhone: inputValue,
          },
        );
      } else {
        clientInfoResponse = await axios.post(
          "http://localhost:8000/getClientInfo",
          {
            email: inputValue,
          },
        );
      }

      const clientId =
        clientInfoResponse?.data?.data?.data?.clients?.edges?.[0]?.node?.id;

      if (!clientId) {
        setOtpError("Failed to fetch client information.");
        return;
      }

      setClientId(clientId);
      onClose();
    } catch (error) {
      console.error("Error in verification process:", error);
      setOtpError("Error during verification. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black-100 p-6 relative">
      <div className="w-full max-w-md bg-gray-400 shadow-md rounded-lg p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        >
          <X size={24} />
        </button>

        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-[8rem] w-auto" />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Sign In
        </h2>

        <div
          className={`flex flex-col sm:flex-row justify-center mb-4 ${otpSent ? "hidden" : ""}`}
        >
          <button
            className={`py-2 px-4 rounded-lg focus:outline-none text-white w-full sm:w-1/2 sm:m-2 ml-0 ${isMobile ? "bg-[#5cd4d3]" : "bg-gray-500 text-gray-900"}`}
            onClick={() => {
              setIsMobile(true);
              setOtpSent(false);
              setOtpError("");
              setOtpMessage("");
              setInputValue("");
              setOtp("");
            }}
          >
            Phone
          </button>
          <button
            className={`py-2 px-4 rounded-lg focus:outline-none text-white w-full sm:w-1/2 sm:m-2 ml-0 ${!isMobile ? "bg-[#5cd4d3]" : "bg-gray-500 text-gray-900"}`}
            onClick={() => {
              setIsMobile(false);
              setOtpSent(false);
              setOtpError("");
              setOtpMessage("");
              setInputValue("");
              setOtp("");
            }}
          >
            Email
          </button>
        </div>

        <div className={`w-full rounded-lg mb-4 ${otpSent ? "hidden" : ""}`}>
          <input
            type={isMobile ? "tel" : "email"}
            placeholder={isMobile ? "Phone" : "Email"}
            className="w-full p-2 border border-gray-300 rounded-lg mb-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        {otpSent ? (
          <>
            <div className="w-full border-gray-300 rounded-lg mb-4 mt-4">
              <input
                type="text"
                placeholder="Enter Code"
                className="w-full p-2 border-0 focus:ring-0 rounded-lg focus:outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button
              className="w-full py-2 text-white rounded-lg transition duration-200 bg-[#5cd4d3]"
              onClick={handleVerifyOtp}
            >
              Verify Code
            </button>

            {timer > 0 && (
              <div className="mt-2 text-gray-800 text-center">
                Resend Code in {timer}s
              </div>
            )}

            {resendEnabled && (
              <div
                className="mt-2 text-[#ffffff] text-center cursor-pointer hover:text-[#000000]"
                onClick={handleResendOtp}
              >
                Resend Code
              </div>
            )}
          </>
        ) : (
          <button
            className="w-full py-2 text-white rounded-lg transition duration-200 bg-[#5cd4d3]"
            onClick={handleSignIn}
            disabled={!inputValue}
          >
            Send Code
          </button>
        )}

        {otpError && (
          <p className="text-red-600 text-center mt-4">{otpError}</p>
        )}
        {otpMessage && (
          <p className="text-[#5cd4d3] text-center mt-4">{otpMessage}</p>
        )}
      </div>
    </div>
  );
};

export default SignIn;
