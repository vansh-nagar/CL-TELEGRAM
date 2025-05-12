import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterUser = () => {
  const navigate = useNavigate();

  const [username, setusername] = useState("");
  const [password, setpassword] = useState("");
  const [avatar, setavatar] = useState(null);
  const [error, seterror] = useState("");

  const SignUp = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("avatar", avatar);

    axios
      .post(`${import.meta.env.VITE_BAKCEND_BASEURL}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      })
      .then((res) => {
        console.log(res.data.statusCode);
        if (res.data.statusCode === 201) {
          navigate("/main");
        }
      })
      .catch((err) => {
        console.log(err.response.data.message);
        seterror(err.response.data.message);
      });
  };

  return (
    <div className="h-screen w-full flex flex-col gap-4 justify-center items-center">
      <div className="bg-neutral-100 p-5 rounded-md w-1/3 max-sm:w-full max-md:w-2/3">
        <div className="flex flex-col items-start text-3xl font-semibold  mb-5 mt-2">
          Sign Up
          <span className="text-black text-xs ">
            or
            <span
              onClick={() => {
                navigate("/");
              }}
              className="text-blue-600 text-xs underline cursor-pointer"
            >
              Sign in to your account
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
          <input
            type="file"
            onChange={(e) => {
              setavatar(e.target.files[0]);
            }}
            className="mt-3 mb-10"
            name=""
            id=""
          />

          <button
            type="submit"
            className="w-full h-14 px-5   border border-black rounded-md  mt-3 bg-blue-500 text-white "
          >
            Sign Up
          </button>
        </form>
      </div>
      <div className="text-red-500">{error}</div>
    </div>
  );
};

export default RegisterUser;
