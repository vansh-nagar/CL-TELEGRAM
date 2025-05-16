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
  RiVideoOffFill,
  RiMicAiFill,
  RiMailCloseFill,
  RiMicOffFill,
} from "@remixicon/react";
import gsap from "gsap";

const Main = () => {
  //message
  const [message, setmessage] = useState(""); // Message content
  const [messageArr, setmessageArr] = useState([]); // Chat messages array
  const [reciverTimeInAmPm, setreciverTimeInAmPm] = useState(""); // Timestamp

  // users
  const [from, setfrom] = useState(""); // Sender ID
  const [to, setto] = useState(""); // Receiver ID
  const [reciverUserName, setreciverUserName] = useState(""); // Receiver name
  const [recieverPfp, setrecieverPfp] = useState(""); // Receiver profile picture
  const [toStatus, settoStatus] = useState(""); // Receiver online/offline

  //search
  const [SeacrchedUser, setSeacrchedUser] = useState([]); // Search result list
  const [HideSearchedUser, setHideSearchedUser] = useState(false); // Hide/show search result

  //contact
  const [Contacts, setContacts] = useState([]); // Contact list
  const [HideContact, setHideContact] = useState(true); // Hide/show contact list

  //chat ui
  const [HideMessages, setHideMessages] = useState(false); // Hide/show messages
  const [isTyping, setisTyping] = useState(false); // Typing indicator
  const [classOverlay, setclassOverlay] = useState(false); // Overlay state

  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;

  const InputBox = useRef(null); // Input DOM ref
  const socket = useRef(); // Socket ref
  const messagesEndRef = useRef(null); // Scroll to bottom
  const imputBoxRef = useRef(null); // Input box container
  const sideBar = useRef(null); // Sidebar DOM
  const constactDiv = useRef(null); // Contact container
  const messageDiv = useRef(null); // Message container

  /////////////////////////////////////////

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const incomingOffer = useRef(null);
  const incomingOfferSender = useRef(null);
  const iceCandidateQueue = useRef([]);

  const [PeerConnection, setPeerConnection] = useState(null);
  const [LocalStream, setLocalStream] = useState(null);
  const [videoCallStarted, setvideoCallStarted] = useState(false);
  const [videoCallArived, setvideoCallArived] = useState(false);
  const [callAccepted, setcallAccepted] = useState(false);

  const [cameraButton, setcameraButton] = useState(false);
  const [micButton, setmicButton] = useState(false);

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
          // setcallReciverScoketId(res.data.currentSocketId);
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

    const currentSocket = socket.current;

    const handleMyId = (msg) => {
      setfrom(msg.senderId);
    };

    const handleMessage = (msg) => {
      setmessageArr((prev) => [
        ...prev,
        {
          message: msg.message,
          receiver: msg.to,
          sender: msg.from,
          createdAt: msg.time,
        },
      ]);
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    };

    const handleJoinedRoomAck = () => {
      axios
        .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getcontact`, {
          withCredentials: true,
        })
        .then((res) => {
          setContacts(res.data);
        })
        .catch((err) => console.log(err.message));
    };

    currentSocket.on("myId", handleMyId);
    currentSocket.on("message", handleMessage);
    currentSocket.on("joinedRoomAck", handleJoinedRoomAck);

    // Initial contact fetch
    axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getcontact`, {
        withCredentials: true,
      })
      .then((res) => {
        setContacts(res.data);
      })
      .catch((err) => console.log(err.message));

    return () => {
      currentSocket.off("myId", handleMyId);
      currentSocket.off("message", handleMessage);
      currentSocket.off("joinedRoomAck", handleJoinedRoomAck);
      currentSocket.disconnect(); // ✅ Disconnect socket on unmount
    };
  }, []);

  useEffect(() => {
    if (!to) return;

    axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getMessages`, {
        params: { sender: from, receiver: to },
        withCredentials: true,
      })
      .then((res) => {
        setmessageArr(res.data);
      })
      .catch((err) => console.log(err.message));

    socket.current?.emit("joinroom", {
      to,
      message: `joined`,
    });

    imputBoxRef.current?.focus();

    // ✅ Optional cleanup: leave room if needed
    return () => {
      socket.current?.emit("leaveroom", { to });
    };
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

  /////////////////////////////////////////////////////////////////////////////////////

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localRef.current.srcObject = stream;
    setLocalStream(stream);

    setcameraButton(true);
    setmicButton(true);
    return stream;
  };

  const createConnection = async (
    ReciverCurrentSocketId,
    SenderCurrentSocketId
  ) => {
    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "18f3711655c3f5e3f66eb51b",
          credential: "KkGALMmLqzOtAXC8",
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "18f3711655c3f5e3f66eb51b",
          credential: "KkGALMmLqzOtAXC8",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "18f3711655c3f5e3f66eb51b",
          credential: "KkGALMmLqzOtAXC8",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "18f3711655c3f5e3f66eb51b",
          credential: "KkGALMmLqzOtAXC8",
        },
      ],
      iceTransportPolicy: "relay", // or try "relay" for testing
    });

    connection.onicecandidate = (e) => {
      console.log("ice candidate send");
      socket.current.emit("iceCandidate", {
        candidate: e.candidate,
        ReciverCurrentSocketId,
        SenderCurrentSocketId,
      });
    };

    connection.ontrack = (e) => {
      console.log("track came ");
      remoteRef.current.srcObject = e?.streams[0];
    };

    return connection;
  };

  const startCall = async () => {
    if (!classOverlay) {
      return;
    }
    if (!to) {
      return;
    }

    let ReciverCurrentSocketId;
    let SenderCurrentSocketId;
    await axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUserStatus`, {
        params: { to },
        withCredentials: true,
      })
      .then((res) => {
        ReciverCurrentSocketId = res.data.currentSocketId;
      })
      .catch((err) => {
        console.log(err);
      });
    await axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUserStatus`, {
        params: { to: from },
        withCredentials: true,
      })
      .then((res) => {
        SenderCurrentSocketId = res.data.currentSocketId;
      })
      .catch((err) => {
        console.log(err);
      });

    console.log(ReciverCurrentSocketId, SenderCurrentSocketId);
    incomingOfferSender.current = ReciverCurrentSocketId;

    if (!ReciverCurrentSocketId) {
      return;
    }

    setvideoCallStarted(true);

    const stream = await getMedia();

    console.log("whhoooooooooooooooooooooooooooooooooo", stream);

    const lc = await createConnection(
      ReciverCurrentSocketId,
      SenderCurrentSocketId
    );
    stream.getTracks().forEach((track) => {
      lc.addTrack(track, stream);
    });

    const offer = await lc.createOffer();
    await lc.setLocalDescription(offer);

    setPeerConnection(lc);

    socket.current.emit("offer", {
      offer,
      ReciverCurrentSocketId,
      SenderCurrentSocketId,
    });
  };

  useEffect(() => {
    socket.current.on("offerArrived", async (msg) => {
      incomingOffer.current = msg.offer;
      incomingOfferSender.current = msg.SenderCurrentSocketId;
      setvideoCallArived(true);
      setclassOverlay(true);
    });

    socket.current.on("offerAccepted", async (msg) => {
      console.log("offer accepted ", msg.SenderCurrentSocketId);

      console.log(msg.answer);
      await PeerConnection?.setRemoteDescription(msg.answer);

      console.log("adding icecandidates");
      while (iceCandidateQueue.current.length) {
        const candidate = iceCandidateQueue.current.shift();
        await PeerConnection?.addIceCandidate(candidate);
        console.log("Queued ICE candidate added");
      }
    });

    socket.current.on("iceCandidate", async (msg) => {
      if (
        PeerConnection?.remoteDescription &&
        PeerConnection?.remoteDescription.type
      ) {
        await PeerConnection?.addIceCandidate(msg.candidate);
      } else {
        iceCandidateQueue.current?.push(msg.candidate);
        console.log("ice candidate added to queue");
      }
    });
  }, [PeerConnection]);

  useEffect(() => {
    socket.current.on("callDeclined", () => {
      Reset();
    });
  }, [LocalStream]);

  const Reset = () => {
    console.log("declini9ng call");
    setclassOverlay(false);
    console.log(
      "locallllllllllllllllllllllllllstreammmmmmmmmmmmm",
      LocalStream
    );
    if (LocalStream) {
      LocalStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }

    if (localRef.current) {
      localRef.current.srcObject = null;
    }
    if (remoteRef.current) {
      remoteRef.current.srcObject = null;
    }

    incomingOffer.current = null;
    incomingOfferSender.current = null;
    iceCandidateQueue.current = [];
    // track where not removed fom peer important ✅✅✅✅✅
    if (PeerConnection) {
      PeerConnection.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video") {
          sender.track.stop();
          PeerConnection.removeTrack(sender);
        }
      });
      PeerConnection.close();
      setPeerConnection(null);
    }
    setvideoCallStarted(false);
    setvideoCallArived(false);
    setcallAccepted(false);

    setcameraButton(false);
    setmicButton(false);
  };

  const handleAnswerCall = async (offer) => {
    if (!incomingOfferSender.current) {
      return;
    }
    if (!from) {
      return;
    }
    let SenderCurrentSocketId;
    await axios
      .get(`${import.meta.env.VITE_BAKCEND_BASEURL}/getUserStatus`, {
        params: { to: from },
        withCredentials: true,
      })
      .then((res) => {
        console.log(res.data.currentSocketId);
        SenderCurrentSocketId = res.data.currentSocketId;
      })
      .catch((err) => {
        console.log(err);
      });

    if (!SenderCurrentSocketId) {
      return;
    }

    console.log("contructing answering the call");
    const stream = await getMedia();

    //reciver sender
    const rc = await createConnection(
      incomingOfferSender.current,
      SenderCurrentSocketId
    );

    stream.getTracks().forEach((track) => {
      rc.addTrack(track, stream);
    });

    await rc.setRemoteDescription(offer);
    const answer = await rc.createAnswer();
    await rc.setLocalDescription(answer);

    setPeerConnection(rc);
    console.log("answering offer");
    socket.current.emit("answerOffer", {
      answer,
      incomingOfferSender: incomingOfferSender.current,
      SenderCurrentSocketId,
    });
  };

  const handleDeclineCall = async () => {
    console.log("incomingOfferSender", incomingOfferSender);
    socket.current.emit("DeclineCall", {
      incomingOfferSender: incomingOfferSender.current,
    });
    Reset();
  };

  const handleToggleVideo = async () => {
    const videoTrack = LocalStream.getVideoTracks()[0];
    console.log(LocalStream);
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      if (cameraButton) {
        setcameraButton(false);
      } else {
        setcameraButton(true);
      }
    }
  };
  const handleToggleAudio = () => {
    console.log("toggle video");
    console.log(LocalStream);
    const audioTrack = LocalStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
    }
    if (micButton) {
      setmicButton(false);
    } else {
      setmicButton(true);
    }
  };
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
                        messageDiv.current.style.display = "inline";
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
                  setclassOverlay(true);
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
            {messageArr?.map((msg, index) => {
              if (msg.sender === from) {
                return (
                  <div key={index} className=" flex justify-end">
                    <div className="senderMessageColor flex flex-row gap-4 rounded-full py-1 px-3 m-[1.1px]">
                      <div>{msg.message}</div>
                      <div className="senderTimerColor text-[13px] translate-y-1.5">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true, // This enables AM/PM format
                        })}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index} className="flex justify-start">
                    <div className="reciverColor flex flex-row gap-4 rounded-full py-1 px-3 m-[1.1px]">
                      <div>{msg.message}</div>
                      <div className="RecivertimerColor text-[13px] translate-y-1.5">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true, // This enables AM/PM format
                        })}
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

      {classOverlay && (
        <div className="fixed w-full h-screen  flex justify-center items-center  text-white ">
          <div className=" relative w-2/4 h-3/4  bg-overlay  flex  flex-col justify-between rounded-md max-sm:w-[90%]">
            {videoCallStarted ? (
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="rounded-sm   pointer-events-none    scale-x-[-1] h-full  w-full absolute"
              ></video>
            ) : (
              <div>
                <div className="absolute right-0 top-0 m-4">
                  <RiCloseFill
                    onClick={() => {
                      setclassOverlay(false);
                    }}
                    className="text-gray-500 cursor-pointer hover:text-gray-300  w-6 h-6 "
                  />
                </div>
                <div className="mt-[6vw] px-7  flex justify-center flex-col items-center gap-6   ">
                  <div className="w-[140px] h-[140px]">
                    <img
                      src={recieverPfp || null}
                      className="rounded-full w-full h-full  object-cover"
                    />
                  </div>

                  <div className="text-[23px]">{reciverUserName}</div>
                  <div className="w-[40%] max-sm:w-[80%] text-center text-sm -mt-3 text-gray-400">
                    Click on the Camera icon if you want to start a video call.
                  </div>
                </div>
              </div>
            )}

            {/*        */}
            <div className="flex  flex-row justify-center gap-5 mb-6 absolute bottom-0 left-1/2 -translate-x-1/2">
              {videoCallStarted || videoCallArived ? null : (
                <div
                  onClick={() => {
                    if (videoCallStarted) {
                      return;
                    }
                    startCall();
                  }}
                  className="flex flex-col justify-center items-center gap-1"
                >
                  <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
                    <RiVideoOnFill className="" />
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    Start Video
                  </div>
                </div>
              )}
              {videoCallStarted || videoCallArived ? (
                <div
                  onClick={() => {
                    handleToggleVideo();
                  }}
                  className="flex flex-col justify-center items-center gap-1"
                >
                  <div
                    className={`w-12 h-12 flex justify-center items-center rounded-full  bg-white   ${
                      cameraButton
                        ? "bg-opacity-10 "
                        : "bg-opacity-100 text-black"
                    }`}
                  >
                    {cameraButton ? (
                      <RiVideoOnFill className="" />
                    ) : (
                      <RiVideoOffFill className="" />
                    )}
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    {cameraButton ? "Stop Video" : "Start Video"}
                  </div>
                </div>
              ) : null}
              {videoCallStarted || videoCallArived ? null : (
                <div className="flex flex-col justify-center items-center gap-1">
                  <div
                    onClick={() => {
                      setclassOverlay(false);
                    }}
                    className="w-12 h-12 flex justify-center items-center rounded-full bg-white"
                  >
                    <RiCloseLine className="text-black" />
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    Cencel
                  </div>
                </div>
              )}
              {videoCallStarted || videoCallArived ? null : (
                <div className="flex flex-col justify-center items-center gap-1">
                  <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
                    <RiPhoneFill />
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    Not W
                  </div>
                </div>
              )}
              {videoCallStarted ? (
                <div
                  onClick={() => {
                    handleDeclineCall();
                  }}
                  className="flex flex-col justify-center items-center gap-1"
                >
                  <div className="w-12 h-12 flex justify-center items-center rounded-full bg-red-400">
                    <RiPhoneFill className=" rotate-[135deg]" />
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    End Call
                  </div>
                </div>
              ) : null}
              {videoCallStarted || videoCallArived ? (
                <div
                  onClick={() => {
                    handleToggleAudio();
                  }}
                  className="flex flex-col justify-center items-center gap-1 "
                >
                  <div
                    className={`w-12 h-12 flex justify-center items-center rounded-full bg-white  ${
                      micButton ? "bg-opacity-10" : "bg-opacity-100 text-black"
                    }`}
                  >
                    {micButton ? <RiMicAiFill /> : <RiMicOffFill />}
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    {micButton ? "Mute" : "Un-Mute"}
                  </div>
                </div>
              ) : null}
              {videoCallArived ? (
                <div
                  onClick={() => {
                    handleAnswerCall(incomingOffer.current);

                    setvideoCallArived(false);
                    setcallAccepted(true);
                    setvideoCallStarted(true);
                  }}
                  className="flex flex-col justify-center items-center gap-1 "
                >
                  <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1 ">
                    <RiPhoneFill />
                  </div>
                  <div className="text-xs text-gray-300  text-nowrap">
                    Accept
                  </div>
                </div>
              ) : null}
              {videoCallArived ? (
                <div
                  onClick={() => {
                    handleDeclineCall();
                  }}
                  className="flex flex-col justify-center items-center gap-1 "
                >
                  <div className="w-12 h-12 flex justify-center items-center rounded-full bg-red-400 ">
                    <RiPhoneFill className=" rotate-[135deg]" />
                  </div>
                  <div className="text-xs text-gray-300 text-nowrap">
                    Decline
                  </div>
                </div>
              ) : null}
            </div>

            <video
              ref={localRef}
              muted
              autoPlay
              className=" rounded-sm   w-32 scale-x-[-1] absolute right-3 bottom-3 max-sm:bottom-32 max-md:bottom-32 "
            ></video>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
