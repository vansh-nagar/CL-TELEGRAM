import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginUser = () => {
  const navigate = useNavigate();

  const [username, setusername] = useState("");
  const [password, setpassword] = useState("");

  const SignUp = (e) => {
    e.preventDefault();

    axios
      .post(
        `${import.meta.env.VITE_BAKCEND_BASEURL}/login`,
        {
          username,
          password,
        },
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        if (res.data.statusCode === 200) {
          navigate("/Main");
        }
      })
      .catch((err) => {
        console.log(err.response);
      });
  };

  return (
    <div className="h-screen w-full flex flex-col gap-4 justify-center items-center">
      <div className="bg-neutral-100 p-5 rounded-md w-1/3 max-sm:w-full max-md:w-2/3">
        <div className="flex flex-col items-start text-3xl font-semibold  mb-5 mt-2">
          Log In
          <span className="text-black text-xs ">
            or
            <span
              onClick={() => {
                navigate("/RegisterUser");
              }}
              className="text-blue-600 text-xs underline cursor-pointer"
            >
              Sign up to your account
            </span>
          </span>
        </div>
        <form onSubmit={SignUp}>
          <input
            type="text"
            placeholder="Username"
            onChange={(e) => setusername(e.target.value)}
            className="w-full h-14 px-5   border border-black rounded-md mt-3 max-sm:h-14 max-sm:w-full"
          />
          <input
            type="text"
            placeholder="Password"
            onChange={(e) => {
              setpassword(e.target.value);
            }}
            className="w-full h-14  px-5   border border-black rounded-md  mt-3 "
          />

          <button
            type="submit"
            className="w-full h-14 px-5   border border-black rounded-md  mt-3 bg-blue-500 text-white "
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginUser;
