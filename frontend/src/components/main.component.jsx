import React, { use, useDebugValue } from "react";
import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import {
  RiMenuLine,
  RiSearchLine,
  RiPhoneFill,
  RiSideBarLine,
  RiMore2Fill,
  RiCloseFill,
} from "@remixicon/react";

const Main = () => {
  const [message, setmessage] = useState("");
  const [to, setto] = useState("");
  const [messageArr, setmessageArr] = useState([]);
  const [SeacrchedUser, setSeacrchedUser] = useState([]);
  const [HideSearchedUser, setHideSearchedUser] = useState(false);

  const InputBox = useRef(null);

  let socket = useRef();
  useEffect(() => {
    socket.current = io.connect(backendUri, {
      withCredentials: true,
    });

    socket.current.on("message", (msg) => {
      setmessageArr((prev) => [
        ...prev,
        {
          message: msg.message,
          to: msg.to,
        },
      ]);
    });
    console.log(messageArr);
  }, []);

  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;

  //connects to server and listen for message

  // join room
  useEffect(() => {
    if (!to) {
      return;
    }

    socket.current.emit("joinroom", {
      to,
      message: `joined`,
    });
  }, [to]);

  //send message
  const sendMessage = () => {
    if (!(to && message)) {
      return;
    }

    socket.current.emit("message", {
      to,
      message,
    });
  };

  const GetUsers = (e) => {
    setHideSearchedUser(true);
    const Inputparams = e.target.value;
    console.log(Inputparams);
    axios
      .get(
        `${import.meta.env.VITE_BAKCEND_BASEURL}/getUsers`,
        {
          params: { input: Inputparams },
        },
        {
          withCredentials: true,
        }
      )
      .then((res) => {
        console.log(res.data);
        setSeacrchedUser(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="flex flex-row bg-gray-500">
      <div className="inboxUsers  h-screen backgroundColor text-white max-md:hidden  border-r border-black">
        <div className="flex gap-5 justify-between items-center mx-6 my-3">
          <RiMenuLine className=" w-10 text-gray-500" />
          <div className="relative  w-80 min-w-8">
            <input
              className="textBoxColor text-white w-full h-9 rounded-full pl-3 text-sm  focus:border-none focus:outline-none"
              type="text"
              ref={InputBox}
              placeholder="Search"
              onChange={(e) => {
                GetUsers(e);
              }}
            />
            <RiCloseFill
              className="absolute top-1/2 right-2  -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 "
              onClick={() => {
                InputBox.current.value = "";
                setHideSearchedUser(false);
              }}
            />
          </div>
        </div>
        <div>
          {HideSearchedUser
            ? SeacrchedUser.map((user, index) => {
                return (
                  <div
                    key={index}
                    className="cursor-pointer flex  items-center justify-between p-[10px] "
                    onClick={() => {
                      setto(user._id);
                    }}
                  >
                    <div className=" flex  items-center gap-3">
                      <div>
                        <img
                          src={user.avatar}
                          alt=""
                          className="rounded-full w-[45px] h-[45px]  object-cover"
                        />
                      </div>
                      <div className="text-sm">
                        <div>{user.username} </div>
                      </div>
                    </div>
                    <div></div>
                  </div>
                );
              })
            : console.log("hidden")}
        </div>
      </div>

      <div className=" flex-col w-3/4 h-screen backgroundColor">
        <div className=" text-white flex justify-between mx-4 h-14">
          <div className="flex flex-col justify-center items-start">
            <div>{to}</div>
            <div className="text-gray-500 text-sm ">last seen time</div>
          </div>
          <div className="flex justify-center items-center gap-4">
            <RiSearchLine />
            <RiPhoneFill />
            <RiSideBarLine />
            <RiMore2Fill />
          </div>
        </div>
        <div className="textBoxColor flex flex-col  text-white h-[calc(100%-50px-56px)] px-3">
          {messageArr.map((msg, index) => {
            if (msg.from === from) {
              return (
                <div className=" flex justify-end">
                  <div
                    className="senderMessageColor rounded-full py-1 px-3"
                    key={index}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            } else {
              return (
                <div className="flex justify-start">
                  <div
                    className="reciverColor  rounded-full py-1 px-3 "
                    key={index}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            }
          })}
        </div>

        <form className="flex flex-row justify-between h-[50px] pr-6 text-white">
          <input
            type="text"
            className="w-[90%] backgroundColor mx-4 focus:outline-none focus:border-none"
            placeholder="write a message... "
            onChange={(e) => {
              setmessage(e.target.value);
            }}
          />

          <button onClick={sendMessage} className="">
            send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Main;
