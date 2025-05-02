import React from "react";
import { io } from "socket.io-client";
import { useState, useEffect, useRef } from "react";

const Test = () => {
  const [first, setfirst] = useState("");
  const [recivedMessage, setrecivedMessage] = useState("");
  let client = useRef(null);

  useEffect(() => {
    client.current = io("http://localhost:3000/");

    client.current.on("message", (msg) => {
      console.log(msg);
      setrecivedMessage(msg);
    });
  }, []);

  const handleSendmessage = () => {
    client.current.emit("message", first);
  };

  const Joinroom = () => {
    client.current.emit("joinRoom", {
      from: "vansh",
      to: "saara",
    });
  };

  return (
    <div>
      <h1>{recivedMessage}</h1>
      <input
        type="text"
        onChange={(e) => {
          setfirst(e.target.value);
        }}
      />
      <button onClick={handleSendmessage}>send message</button>
      <button onClick={Joinroom}>Join room</button>
    </div>
  );
};

export default Test;
