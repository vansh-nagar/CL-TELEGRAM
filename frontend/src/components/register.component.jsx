import React from "react";
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

const RegisterUser = () => {
  return (
    <div className="cursor-pointer" onClick={navigate("/")}>
      RegisterUser
    </div>
  );
};

export default RegisterUser;
