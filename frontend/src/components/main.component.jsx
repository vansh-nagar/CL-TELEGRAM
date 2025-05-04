import React, { use, useDebugValue } from "react";
import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const Main = () => {
  const [message, setmessage] = useState("");
  const [to, setto] = useState("");
  const [getUsers, setgetUsers] = useState([]);
  const [from, setfrom] = useState("");
  const [messageArr, setmessageArr] = useState([]);

  let socket = useRef();
  useEffect(() => {
    socket.current = io.connect(backendUri);
    socket.current.on("message", (msg) => {
      console.log(`message from ${msg.from}`, msg);

      console.log(messageArr);

      messageArr.push({
        message: msg.message,
        from: msg.from,
        to: msg.to,
      });
    });

    const cookies = document.cookie
      .split(";")
      .map((cookie) => {
        return cookie.split("=");
      })
      .reduce(
        (accumulator, [key, value]) => ({
          ...accumulator,
          [key.trim()]: decodeURIComponent(value),
        }),
        {}
      );
    setfrom(cookies.username);

    axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUsers`)
      .then((res) => {
        setgetUsers(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;

  //connects to server and listen for message

  // join room
  useEffect(() => {
    if (!to) {
      return;
    }

    socket.current.emit("joinroom", {
      from,
      to,
      message: "hello",
    });
  }, [to]);

  //send message
  const sendMessage = () => {
    if (!(to && message)) {
      return;
    }

    socket.current.emit("message", {
      from,
      to,
      message,
    });
  };

  return (
    <div className="flex flex-row bg-gray-500">
      <div className="inboxUsers w-1/4 h-screen bg-neutral-700 text-white">
        <div>
          {getUsers.map((user, index) => {
            if (user === from) {
              user = "Saved Messages";
            }
            return (
              <div
                key={index}
                className="cursor-pointer"
                onClick={(e) => {
                  setto(e.target.textContent);
                }}
              >
                {user}
              </div>
            );
          })}
        </div>
      </div>

      <div className=" flex-col w-3/4 h-screen">
        <div className="bg-red-300 h-[calc(100%-40px)]">
          {messageArr.map((msg, index) => {
            if (message.from === from) {
              return <div key={index}>{msg.message}</div>;
            } else {
              return <div key={index}>{msg.message}</div>;
            }
          })}
        </div>
        <div
          className="flex flex-row justify-between h-[40px] pr-6
        "
        >
          <input
            type="text"
            className="w-[90%]"
            onChange={(e) => {
              setmessage(e.target.value);
            }}
          />

          <button onClick={sendMessage} className="">
            send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Main;
