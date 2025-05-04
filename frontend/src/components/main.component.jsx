import React, { use } from "react";
import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const Main = () => {
  const [message, setmessage] = useState("");
  const [recivedMessage, setrecivedMessage] = useState("");
  const [to, setto] = useState("");
  const [getUsers, setgetUsers] = useState([]);

  const [from, setfrom] = useState("vansh");

  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;

  let socket = useRef();

  //axios req
  //get usernames

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUsers`)
      .then((res) => {
        console.log(res.data.data);
        setgetUsers(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  //connects to server and listen for message
  useEffect(() => {
    socket.current = io.connect(backendUri);
    socket.current.on("message", (msg) => {
      console.log("message from server", msg);
      setrecivedMessage(msg);
    });
  }, []);

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
    <div>
      <input
        type="text"
        onChange={(e) => {
          setmessage(e.target.value);
        }}
      />
      <div className="text-white">{recivedMessage}</div>

      <button onClick={sendMessage} className="bg-red-500">
        send
      </button>

      <div className="inboxUsers border-black border">
        <div>
          {getUsers.map((user, index) => {
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
    </div>
  );
};

export default Main;
