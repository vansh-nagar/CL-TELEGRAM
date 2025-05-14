import {
  RiPhoneFill,
  RiCloseFill,
  RiVideoOnFill,
  RiCloseLine,
} from "@remixicon/react";
import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import io from "socket.io-client";

const Call = () => {
  const socket = useRef(null);
  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;
  //
  const remoteRef = useRef(null);
  //

  const [localVideoStream, setlocalVideoStream] = useState(null);
  const localRef = useRef(null);
  const [toggeLocalVideo, settoggeLocalVideo] = useState(false);
  //

  const [publicConnection, setpublicConnection] = useState(null);

  useEffect(() => {
    socket.current = io.connect(backendUri, {
      withCredentials: true,
    });
  }, []);
  //
  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localRef.current.srcObject = stream;
    return stream;
  };
  //
  // const toggleVideoHandler = async () => {
  //   if (toggeLocalVideo) {
  //     localVideoStream.getTracks().forEach((track) => {
  //       track.stop();
  //     });
  //     localRef.current.srcObject = null;
  //     settoggeLocalVideo(false);
  //   } else {
  //     const newStream = await navigator.mediaDevices.getUserMedia({
  //       audio: true,
  //       video: true,
  //     });
  //     localRef.current.srcObject = newStream;
  //     setlocalVideoStream(newStream);
  //     settoggeLocalVideo(true);
  //     return newStream;
  //   }
  // };
  //
  const createConnection = async () => {
    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });

    connection.onicecandidate = (e) => {
      console.log("ice candidate", e.candidate);
      socket.current.emit("iceCandidate", {
        candidate: e.candidate,
      });
    };

    connection.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    return connection;
  };
  //
  const startCall = async () => {
    const stream = await getMedia();
    const lc = await createConnection();
    stream.getTracks().forEach((track) => {
      lc.addTrack(track, stream);
    });

    const offer = await lc.createOffer();
    await lc.setLocalDescription(offer);

    setpublicConnection(lc);
    socket.current.emit("offer", {
      offer,
    });
  };
  //
  useEffect(() => {
    socket.current.on("offerArrived", async (msg) => {
      const stream = await getMedia();
      const rc = await createConnection();

      stream.getTracks().forEach((track) => {
        rc.addTrack(track, stream);
      });

      await rc.setRemoteDescription(msg.offer);
      const answer = await rc.createAnswer();
      await rc.setLocalDescription(answer);

      setpublicConnection(rc);
      socket.current.emit("answerOffer", { answer });
    });

    socket.current.on("offerAccepted", async (msg) => {
      console.log(msg.answer);
      await publicConnection.setRemoteDescription(msg.answer);
    });

    socket.current.on("iceCandidate", async (msg) => {
      await publicConnection.addIceCandidate(
        new RTCIceCandidate(msg.candidate)
      );
    });
  }, [publicConnection]);

  return (
    <div className="fixed w-full h-screen  flex justify-center items-center  text-white ">
      <div className="absolute w-2/4 h-3/4  bg-overlay  flex  flex-col justify-between rounded-md max-sm:w-[90%]">
        <button
          onClick={() => {
            startCall();
          }}
          className="bg-red-950"
        >
          startcall
        </button>
        <div>
          <div className="flex justify-end m-4">
            <RiCloseFill className="text-gray-500 cursor-pointer hover:text-gray-300  w-6 h-6 " />
          </div>
          <div className="mt-[6vw] px-7  flex justify-center flex-col items-center gap-6   ">
            <div className="w-[140px] h-[140px]">
              <img className="rounded-full w-full h-full  object-cover" />
            </div>

            <div className="text-[23px]">vanshnagar</div>
            <div className="w-[40%] max-sm:w-[80%] text-center text-sm -mt-3 text-gray-400">
              Click on the Camera icon if you want to start a video call.
            </div>
          </div>
        </div>

        {/*        */}
        <div className="flex  flex-row justify-center gap-5 mb-6  ">
          <video
            ref={localRef}
            autoPlay
            muted
            className="w-32 bg-green-500"
          ></video>
          <video ref={remoteRef} autoPlay className="w-32 bg-red-500"></video>

          <div
            onClick={() => {
              console.log("video is ready");
              toggleVideoHandler();
            }}
            className="flex flex-col justify-center items-center gap-1"
          >
            <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
              <RiVideoOnFill className="" />
            </div>
            <div className="text-xs text-gray-300 ">Start Video</div>
          </div>

          <div className="flex flex-col justify-center items-center gap-1">
            <div className="w-12 h-12 flex justify-center items-center rounded-full bg-white">
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
  );
};

export default Call;
