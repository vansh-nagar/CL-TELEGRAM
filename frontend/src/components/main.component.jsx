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
  RiVideoOnFill,
  RiCloseLine,
  RiArrowLeftLine,
} from "@remixicon/react";
import gsap from "gsap";

const Main = () => {
  const [message, setmessage] = useState("");
  const [from, setfrom] = useState("");
  const [to, setto] = useState("");
  const [reciverUserName, setreciverUserName] = useState("");
  const [recieverPfp, setrecieverPfp] = useState("");
  const [reciverTimeInAmPm, setreciverTimeInAmPm] = useState("");
  const [messageArr, setmessageArr] = useState([]);
  const [SeacrchedUser, setSeacrchedUser] = useState([]);
  const [HideSearchedUser, setHideSearchedUser] = useState(false);
  const [Contacts, setContacts] = useState([]);
  const [HideContact, setHideContact] = useState(true);
  const [HideMessages, setHideMessages] = useState(false);
  const [toStatus, settoStatus] = useState("");
  const [isTyping, setisTyping] = useState(false);
  const [callOverlay, setcallOverlay] = useState(false);
  const [videoOverlay, setvideoOverlay] = useState(false);

  const InputBox = useRef(null);
  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;
  let socket = useRef();
  const messagesEndRef = useRef(null);
  const imputBoxRef = useRef(null);
  const sideBar = useRef(null);
  const constactDiv = useRef(null);
  const messageDiv = useRef(null);
  const canEmitRef = useRef(true);
  //for video accessing
  const [pc, setPc] = useState(null); // Peer connection
  const localRef = useRef(null); // Local video
  const remoteRef = useRef(null); // Remote video

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

            const timeinampm = new Date(res.data.lastSeen).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );
            setreciverTimeInAmPm(timeinampm);

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

      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
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

    imputBoxRef.current?.focus();
  }, [to]);

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

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localRef.current.srcObject = stream;
    return stream;
  };

  // Create a new RTCPeerConnection
  const createConnection = (reciverCurrentSocketId) => {
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun3.l.google.com:19302" }],
    });

    // Handle ICE candidates
    connection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.current.emit("icecandidate", {
          candidate: e.candidate,
          reciverCurrentSocketId,
        });
      }
    };

    // Handle incoming media track from remote peer
    connection.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    return connection;
  };

  // Start the video call by creating an offer
  const startVideoCall = async () => {
    let reciverCurrentSocketId;
    await axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUserStatus`, {
        params: { to },
        withCredentials: true,
      })
      .then((res) => {
        reciverCurrentSocketId = res.data.currentSocketId;
      })
      .catch((err) => console.log(err.message));

    console.log("reciverCurrentSocketId", reciverCurrentSocketId);

    const stream = await getMedia();
    const lc = createConnection(reciverCurrentSocketId);
    stream.getTracks().forEach((track) => lc.addTrack(track, stream));
    const offer = await lc.createOffer();
    await lc.setLocalDescription(offer);

    socket.current.emit("call", { offer, reciverCurrentSocketId, from });
    setPc(lc);
  };

  useEffect(() => {
    socket.current.on("ReciveCall", async (msg) => {
      const findSenderStatus = async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_BAKCEND_BASEURL}/getUserStatus`,
            {
              params: { to: msg.from },
              withCredentials: true,
            }
          );

          return res.data.currentSocketId;
        } catch (error) {
          console.error("Error fetching sender status:", error);
          return null;
        }
      };

      const SenderCurrentSocketId = await findSenderStatus();

      console.log("Incoming call from:", SenderCurrentSocketId);
      setvideoOverlay(true);
      setcallOverlay(false);

      const stream = await getMedia();
      const rc = createConnection();
      stream.getTracks().forEach((track) => rc.addTrack(track, stream));
      await rc.setRemoteDescription(msg.offer);
      const answer = await rc.createAnswer();
      await rc.setLocalDescription(answer);
      socket.current.emit("answerCall", { answer, SenderCurrentSocketId });

      setPc(rc);
    });

    // Listen for the answer to the call
    socket.current.on("callAccepted", async ({ answer }) => {
      console.log("Call accepted");
      await pc.setRemoteDescription(answer);
    });

    // Handle ICE candidates from other peer
    socket.current.on("icecandidate", async ({ candidate }) => {
      console.log("Received ICE candidate:");
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  }, [pc]);

  return (
    <div className="flex flex-row bg-gray-500 ">
      <div
        ref={constactDiv}
        className="inboxUsers max-sm:flex-col  h-screen backgroundColor text-white max-sm:w-full  border-r border-black"
      >
        <div className="flex gap-5 justify-between items-center mx-6 my-3">
          <RiMenuLine className=" w-10 text-gray-500  hover:text-gray-300 transition-all duration-150" />
          <div className="relative  w-full sm:w-80">
            <input
              className="textBoxColor text-white w-full h-9 rounded-full pl-3 text-sm  focus:border-none focus:outline-none"
              type="text"
              ref={InputBox}
              placeholder="Search"
              onChange={(e) => {
                GetUsers(e);
              }}
              onFocus={() => {
                gsap.to(".closeButton", {
                  rotate: -90,
                  opacity: 1,
                  scale: 1,
                  duration: 0.1,
                  ease: "power1.out",
                });
              }}
            />

            <RiCloseFill
              className="closeButton absolute scale-0 opacity-0 top-1/2 right-2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300 "
              onClick={() => {
                InputBox.current.value = "";
                setHideSearchedUser(false);
                setHideContact(true);

                gsap.to(".closeButton", {
                  rotate: 0,
                  opacity: 0,
                  scale: 0,
                  duration: 0.1,
                  ease: "power1.out",
                });
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
                    className="cursor-pointer flex  items-center justify-between p-[10px] hover:bg-contactHover "
                    onClick={() => {
                      setto(user._id);
                      setreciverUserName(user.username);
                      setHideSearchedUser(false);
                      setHideContact(true);
                      setHideMessages(true);
                      setrecieverPfp(user.avatar);
                      InputBox.current.value = "";
                      gsap.to(".closeButton", {
                        rotate: 0,
                        opacity: 0,
                        scale: 0,
                        duration: 0.1,
                        ease: "power1.out",
                      });
                      if (window.innerWidth < 640) {
                        constactDiv.current.style.display = "none";
                        messageDiv.current.style.display = "flex";
                      }
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
                    onClick={(e) => {
                      setto(user.contact._id);
                      setreciverUserName(user.contact.username);
                      setHideMessages(true);
                      setrecieverPfp(user.contact.avatar);

                      console.log(user);

                      gsap.to(".closeButton", {
                        rotate: 0,
                        opacity: 0,
                        scale: 0,
                        duration: 0.1,
                        ease: "power1.in",
                      });
                      if (window.innerWidth < 640) {
                        constactDiv.current.style.display = "none";
                        messageDiv.current.style.display = "flex";
                      }
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
        <div
          ref={messageDiv}
          className=" flex-col w-3/4 max-sm:w-full max-md:w-full h-screen backgroundColor"
        >
          <div className=" text-white flex justify-between mx-4 h-14">
            <div className=" flex gap-6 flex-row justify-center items-center">
              <div className="sm:hidden">
                <RiArrowLeftLine
                  onClick={() => {
                    if (window.innerWidth < 640) {
                      constactDiv.current.style.display = "flex";
                      messageDiv.current.style.display = "none";
                    }
                  }}
                />
              </div>
              <div className="flex flex-col justify-center items-start">
                <div>{reciverUserName}</div>
                <div className="text-gray-500 text-sm tail truncate overflow-hidden ">
                  <span>{toStatus}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center gap-4 text-IconNotActive  ">
              <RiSearchLine
                className=" hover:text-IconOnHover transition-all duration-150 max-sm:hidden
              "
              />
              <RiPhoneFill
                className=" hover:text-IconOnHover transition-all duration-150 "
                onClick={() => {
                  setcallOverlay(true);
                }}
              />
              <RiSideBarLine
                className=" hover:text-IconOnHover transition-all duration-150  max-sm:hidden"
                onClick={() => {
                  const currentDsiplay = window.getComputedStyle(
                    sideBar.current
                  ).display;

                  console.log("cheaking");
                  if (currentDsiplay === "none") {
                    sideBar.current.style.display = "flex";
                    console.log("flex");
                  } else {
                    sideBar.current.style.display = "none";
                  }
                }}
              />
              <RiMore2Fill className=" hover:text-IconOnHover transition-all duration-150" />
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
            <div ref={messagesEndRef} className="mt-7"></div>
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
              ref={imputBoxRef}
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
        <div className="selectmessageMessageBackground  max-sm:w-full max-md:w-full w-3/4 h-screen text-white flex justify-center items-center max-sm:hidden">
          <div className="selectMessageColor px-2  py-1 text-sm rounded-full">
            Select a chat to start messaging
          </div>
        </div>
      )}

      <div
        ref={sideBar}
        className=" flex-col w-[28vw] backgroundColor border-l border-black text-white hidden max-md:hidden"
      >
        <div className=" h-14 flex justify-between w-full items-center pl-8 pr-5 text-sm">
          <div> User Info</div>
          <RiCloseFill
            className="text-gray-500 cursor-pointer hover:text-gray-300  w-6 h-6"
            onClick={() => {
              const currentDsiplay = window.getComputedStyle(
                sideBar.current
              ).display;

              if (currentDsiplay === "flex") {
                sideBar.current.style.display = "none";
              }
            }}
          />
        </div>

        <div className="mt-6 px-7  flex items-center gap-6">
          <div className="w-[80px] h-[80px]">
            <img
              src={recieverPfp || null}
              className="rounded-full w-[80px] h-[80px]  object-cover"
              alt=""
            />
          </div>

          <div>
            <div>{reciverUserName}</div>
            <div className="text-sm truncate whitespace-nowrap text-gray-500 ">
              last seen today at {reciverTimeInAmPm}
            </div>
          </div>
        </div>
      </div>

      {callOverlay ? (
        <div className="fixed w-full h-screen  flex justify-center items-center  text-white ">
          <div className="absolute w-2/4 h-3/4  bg-overlay  flex  flex-col justify-between rounded-md max-sm:w-[90%]">
            <div>
              {" "}
              <div className="flex justify-end m-4">
                <RiCloseFill
                  onClick={() => {
                    setcallOverlay(false);
                  }}
                  className="text-gray-500 cursor-pointer hover:text-gray-300  w-6 h-6 "
                />
              </div>
              <div className="mt-[6vw] px-7  flex justify-center flex-col items-center gap-6   ">
                <div className="w-[140px] h-[140px]">
                  <img
                    src={recieverPfp}
                    className="rounded-full w-full h-full  object-cover"
                  />
                </div>

                <div className="text-[23px]">{reciverUserName}</div>
                <div className="w-[40%] max-sm:w-[80%] text-center text-sm -mt-3 text-gray-400">
                  Click on the Camera icon if you want to start a video call.
                </div>
              </div>
            </div>

            {/*        */}
            <div className="flex  flex-row justify-center gap-5 mb-6  ">
              <div className="flex flex-col justify-center items-center gap-1">
                <div
                  onClick={() => {
                    setcallOverlay(false);
                    setvideoOverlay(true);
                    startVideoCall();
                  }}
                  className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1"
                >
                  <RiVideoOnFill className="" />
                </div>
                <div className="text-xs text-gray-300 ">Start Video</div>
              </div>
              <div className="flex flex-col justify-center items-center gap-1">
                <div
                  onClick={() => {
                    setcallOverlay(false);
                  }}
                  className="w-12 h-12 flex justify-center items-center rounded-full bg-white"
                >
                  <RiCloseLine className="text-black" />
                </div>
                <div className="text-xs text-gray-300">Cencel</div>
              </div>
              <div className="flex flex-col justify-center items-center gap-1">
                <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
                  <RiPhoneFill />
                </div>
                <div className="text-xs text-gray-300">Start call</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
      {videoOverlay ? (
        <div className="fixed w-full h-screen  flex justify-center items-center  text-white ">
          <div className=" w-2/4 h-3/4 relative  bg-overlay  flex  flex-col justify-between  rounded-md max-sm:w-[90%] overflow-hidden">
            <div className="">
              <video
                ref={remoteRef}
                autoPlay
                className="  absolute w-[40%] h-[20%] right-3 bottom-3"
              />
            </div>
            <div className="  h-full w-full  flex justify-center items-center">
              <video
                ref={localRef}
                autoPlay
                muted
                className="h-screen w-full"
              />
              <div className="flex  flex-row justify-center gap-5 mb-6 absolute bottom-3 ">
                <div className="flex flex-col justify-center items-center gap-1">
                  <div
                    onClick={() => {
                      setcallOverlay(false);
                      setvideoOverlay(true);
                      startVideoCall();
                    }}
                    className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1"
                  >
                    <RiVideoOnFill className="" />
                  </div>
                  <div className="text-xs text-gray-300 ">Start Video</div>
                </div>
                <div className="flex flex-col justify-center items-center gap-1">
                  <div
                    onClick={() => {
                      setcallOverlay(false);
                    }}
                    className="w-12 h-12 flex justify-center items-center rounded-full bg-white"
                  >
                    <RiCloseLine className="text-black" />
                  </div>
                  <div className="text-xs text-gray-300">Cencel</div>
                </div>
                <div className="flex flex-col justify-center items-center gap-1">
                  <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
                    <RiPhoneFill />
                  </div>
                  <div className="text-xs text-gray-300">Start call</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default Main;
