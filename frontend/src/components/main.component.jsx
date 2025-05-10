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
  const [from, setfrom] = useState("");
  const [to, setto] = useState("");
  const [reciverUserName, setreciverUserName] = useState("");
  const [messageArr, setmessageArr] = useState([]);
  const [SeacrchedUser, setSeacrchedUser] = useState([]);
  const [HideSearchedUser, setHideSearchedUser] = useState(false);
  const [Contacts, setContacts] = useState([]);
  const [HideContact, setHideContact] = useState(true);
  const [HideMessages, setHideMessages] = useState(false);
  const [toStatus, settoStatus] = useState("");
  const [isTyping, setisTyping] = useState(false);

  const InputBox = useRef(null);
  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;
  let socket = useRef();

  useEffect(() => {
    if (!to) return;

    //get status in every 2 sec
    const intervalId = setInterval(() => {
      axios
        .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUserStatus`, {
          params: { to },
          withCredentials: true,
        })
        .then((res) => {
          console.log(res.data.isOnline);
          if (res.data.isWriting || res.data.isOnline) {
            settoStatus(res.data.isWriting ? "typing...." : "online");
          } else {
            const time = new Date(res.data.lastSeen).getTime();
            const currentTime = Date.now();

            const difference = currentTime - time;
            const differenceInMin = difference / 1000 / 60;
            const differenceInHour = differenceInMin / 60;

            console.log(time);

            if (!time) {
              return settoStatus("last seen a long time ago");
            }

            if (differenceInHour >= 1) {
              settoStatus(
                `last seen ${Math.floor(differenceInHour)} hours ago`
              );
            } else if (differenceInMin > 1) {
              settoStatus(
                `last seen ${Math.floor(differenceInMin)} minutes ago`
              );
            } else {
              settoStatus("last seen just now");
            }
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [to]);

  useEffect(() => {
    socket.current = io.connect(backendUri, {
      withCredentials: true,
    });

    socket.current.on("myId", (msg) => {
      setfrom(msg.senderId);
    });

    socket.current.on("message", (msg) => {
      setmessageArr((prev) => [
        ...prev,
        {
          message: msg.message,
          receiver: msg.to,
          sender: msg.from,
          createdAt: msg.time,
        },
      ]);
      console.log(msg);
    });

    console.log(to);

    socket.current.on("joinedRoomAck", () => {
      axios
        .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getcontact`, {
          withCredentials: true,
        })
        .then((res) => {
          setContacts(res.data);
        })
        .catch((err) => {
          console.log(err.message);
        });
    });

    //get contact
    axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getcontact`, {
        withCredentials: true,
      })
      .then((res) => {
        setContacts(res.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  useEffect(() => {
    if (!to) {
      return;
    }

    //get messages

    axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getMessages`, {
        params: { sender: from, receiver: to },
        withCredentials: true,
      })
      .then((res) => {
        setmessageArr(res.data);
      })
      .catch((err) => {
        console.log(err.message);
      });

    socket.current.emit("joinroom", {
      to,
      message: `joined`,
    });
  }, [to]);

  const canEmitRef = useRef(true);

  useEffect(() => {
    if (isTyping) {
      socket.current.emit("isTyping");
    } else {
      socket.current.emit("notTyping");
    }
  }, [isTyping]);

  const inputIsEmptyUpdateStaus = (e) => {
    if (e.target.value === "") {
      setisTyping(false);
    }
  };

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

  // get search users
  const GetUsers = (e) => {
    setHideSearchedUser(true);
    setHideContact(false);
    const Inputparams = e.target.value;
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
          <RiMenuLine className=" w-10 text-gray-500  hover:text-gray-300 transition-all duration-150" />
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
              className="absolute top-1/2 right-2  -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 transition-all duration-150"
              onClick={() => {
                InputBox.current.value = "";
                setHideSearchedUser(false);
                setHideContact(true);
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
                    className="cursor-pointer flex  items-center justify-between p-[10px] hover:bg-contactHover"
                    onClick={() => {
                      setto(user._id);
                      setreciverUserName(user.username);
                      setHideSearchedUser(false);
                      setHideContact(true);
                      setHideMessages(true);
                      InputBox.current.value = "";
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
            : ""}
        </div>
        <div>
          {HideContact
            ? Contacts.map((user, index) => {
                return (
                  <div
                    key={index}
                    className={`cursor-pointer flex  items-center justify-between p-[10px]  ${
                      to === user.contact._id
                        ? "bg-contactSelected"
                        : "hover:bg-contactHover"
                    }`}
                    onClick={() => {
                      setto(user.contact._id);
                      setreciverUserName(user.contact.username);
                      setHideMessages(true);
                    }}
                  >
                    <div className=" flex  items-center gap-3">
                      <div>
                        <img
                          src={user.contact.avatar}
                          alt=""
                          className="rounded-full w-[45px] h-[45px]  object-cover"
                        />
                      </div>
                      <div className="text-sm">
                        <div>{user.contact.username} </div>
                      </div>
                    </div>
                    <div></div>
                  </div>
                );
              })
            : ""}
        </div>
      </div>

      {HideMessages ? (
        <div className=" flex-col w-3/4 max-sm:w-full max-md:w-full h-screen backgroundColor">
          <div className=" text-white flex justify-between mx-4 h-14">
            <div className="flex flex-col justify-center items-start">
              <div>{reciverUserName}</div>
              <div className="text-gray-500 text-sm ">
                <span>{toStatus}</span>
              </div>
            </div>
            <div className="flex justify-center items-center gap-4">
              <RiSearchLine />
              <RiPhoneFill />
              <RiSideBarLine />
              <RiMore2Fill />
            </div>
          </div>
          <div className="textBoxColor flex flex-col  text-white h-[calc(100%-50px-56px)] px-3 overflow-y-auto scroll-auto p-2">
            {messageArr.map((msg, index) => {
              if (msg.sender === from) {
                return (
                  <div key={index} className=" flex justify-end">
                    <div className="senderMessageColor flex flex-row gap-2 rounded-full py-1 px-3 m-[1.1px]">
                      <div>{msg.message}</div>
                      <div className="senderTimerColor text-[13px] translate-y-1.5">
                        {msg.createdAt}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex justify-start">
                    <div className="reciverColor flex flex-row gap-2 rounded-full py-1 px-3 m-[1.1px]">
                      <div>{msg.message}</div>
                      <div className="RecivertimerColor text-[13px] translate-y-1.5">
                        {msg.createdAt}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault(); // ✅ this stops the reload
              sendMessage();
              setmessage("");
              setisTyping(false);
            }}
            className="flex flex-row justify-between h-[50px] pr-6 text-white"
          >
            <input
              type="text"
              className="w-[90%] backgroundColor mx-4 focus:outline-none focus:border-none"
              placeholder="write a message... "
              value={message}
              onChange={(e) => {
                setmessage(e.target.value);
                setisTyping(true);
                inputIsEmptyUpdateStaus(e);
              }}
            />

            <button>send</button>
          </form>
        </div>
      ) : (
        <div className="selectmessageMessageBackground  max-sm:w-full max-md:w-full w-3/4 h-screen text-white flex justify-center items-center">
          <div className="selectMessageColor px-2  py-1 text-sm rounded-full">
            Select a chat to start messaging
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
