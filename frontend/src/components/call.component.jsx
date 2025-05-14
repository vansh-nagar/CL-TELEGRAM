import {
  RiPhoneFill,
  RiCloseFill,
  RiVideoOnFill,
  RiCloseLine,
  RiMic2AiFill,
} from "@remixicon/react";
import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import io from "socket.io-client";

const Call = () => {
  const socket = useRef(null);
  const backendUri = import.meta.env.VITE_BACKEND_SOCKET;

  const remoteRef = useRef(null);
  const localRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(false);

  const [peerConnection, setPeerConnection] = useState(null);
  const [isCalling, setIsCalling] = useState(false);

  const [incomingCallHandler, setIncomingCallHandler] = useState(null); // Not used
  const [callStatusText, setCallStatusText] = useState("");

  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [showStartCallIcons, setShowStartCallIcons] = useState(true);
  const [showEndCallIcons, setShowEndCallIcons] = useState(false);
  const [hasCallStarted, setHasCallStarted] = useState(false);

  useEffect(() => {
    socket.current = io.connect(backendUri, {
      withCredentials: true,
    });
  }, []);

  const getMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);
    localRef.current.srcObject = stream;
    return stream;
  };

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
      socket.current.emit("iceCandidate", {
        candidate: e.candidate,
      });
    };

    connection.ontrack = (e) => {
      remoteRef.current.srcObject = e?.streams[0];
    };

    return connection;
  };

  const startCall = async () => {
    setCallStatusText("ringing...");
    setShowStartCallIcons(false);
    setShowEndCallIcons(true);

    setIsCalling(true);
    const stream = await getMedia();
    const lc = await createConnection();
    stream.getTracks().forEach((track) => {
      lc.addTrack(track, stream);
    });

    const offer = await lc.createOffer();
    await lc.setLocalDescription(offer);

    setPeerConnection(lc);
    socket.current.emit("offer", {
      offer,
    });
  };

  useEffect(() => {
    socket.current.on("offerArrived", async (msg) => {
      setHasCallStarted(true);
      setShowStartCallIcons(false);
      setShowEndCallIcons(true);

      setIsIncomingCall(true);
      const stream = await getMedia();
      const rc = await createConnection();

      stream.getTracks().forEach((track) => {
        rc.addTrack(track, stream);
      });

      await rc.setRemoteDescription(msg.offer);
      const answer = await rc.createAnswer();
      await rc.setLocalDescription(answer);

      setPeerConnection(rc);
      socket.current.emit("answerOffer", { answer });
    });

    socket.current.on("offerAccepted", async (msg) => {
      setCallStatusText("");
      await peerConnection?.setRemoteDescription(msg.answer);
    });

    socket.current.on("iceCandidate", async (msg) => {
      await peerConnection?.addIceCandidate(msg.candidate);
    });

    socket.current.on("callClosed", () => {
      if (!peerConnection) return;

      localStream.getTracks().forEach((track) => {
        track.stop();
      });

      peerConnection?.close();
      setPeerConnection(null);

      if (!remoteRef || !localRef) return;

      remoteRef.current.srcObject = null;
      localRef.current.srcObject = null;
      setLocalStream(null);
      setIsCalling(false);
      setCallStatusText("");
      setIsIncomingCall(false);
      setShowStartCallIcons(true);
      setShowEndCallIcons(false);
      setHasCallStarted(false);
      window.location.reload(); // 🔄 Refresh the whole page
    });
  }, [peerConnection]);

  const toggleLocalVideoHandler = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
    }
  };

  const toggleLocalAudioHandler = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
    }
  };

  return (
    <div className="fixed w-full h-screen flex justify-center items-center text-white">
      <div className="absolute w-2/4 h-3/4 bg-overlay flex flex-col justify-between rounded-md max-sm:w-[90%]">
        <div>
          <div className="flex justify-end m-4">
            <RiCloseFill className="text-gray-500 cursor-pointer hover:text-gray-300 w-6 h-6" />
          </div>
          <div className="mt-[6vw] px-7 flex justify-center flex-col items-center gap-6">
            <div className="w-[140px] h-[140px]">
              <img className="rounded-full w-full h-full object-cover" />
            </div>
            <div className="text-[23px]">vansh nagar</div>
            <div className="w-[40%] max-sm:w-[80%] text-center text-sm -mt-3 text-gray-400">
              {callStatusText}
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <video ref={localRef} autoPlay muted className="w-32 bg-green-500" />
          <video ref={remoteRef} autoPlay className="w-32 bg-red-500" />
        </div>

        <div className="flex flex-row justify-center gap-5 mb-6">
          <div
            onClick={() => {
              if (!hasCallStarted) {
                startCall();
              }
              setHasCallStarted(true);
              toggleLocalVideoHandler();
            }}
            className="flex flex-col justify-center items-center gap-1"
          >
            <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
              <RiVideoOnFill />
            </div>
            <div className="text-xs text-gray-300">
              {hasCallStarted ? "Stop Video" : "Start Video"}
            </div>
          </div>

          {showStartCallIcons && (
            <div className="flex flex-col justify-center items-center gap-1">
              <div className="w-12 h-12 flex justify-center items-center rounded-full bg-white">
                <RiCloseLine className="text-black" />
              </div>
              <div className="text-xs text-gray-300">Cancel</div>
            </div>
          )}

          {showEndCallIcons && (
            <div
              onClick={() => {
                setHasCallStarted(false);
                if (!peerConnection) return;
                socket.current.emit("closeCall");
                localStream.getTracks().forEach((track) => {
                  track.stop();
                });
                peerConnection.close();
                setPeerConnection(null);
                toggleLocalVideoHandler();
                if (!remoteRef || !localRef) return;
                remoteRef.current.srcObject = null;
                localRef.current.srcObject = null;
                //
                setLocalStream(null);
                setIsCalling(false);
                setCallStatusText("");
                setIsIncomingCall(false);
                setShowStartCallIcons(true);
                setShowEndCallIcons(false);
                setHasCallStarted(false);
                window.location.reload(); // 🔄 Refresh the whole page
              }}
              className="flex flex-col justify-center items-center gap-1"
            >
              <div className="w-12 h-12 flex justify-center items-center rounded-full bg-red-600">
                <RiPhoneFill className="rotate-[135deg]" />
              </div>
              <div className="text-xs text-gray-300">End Call</div>
            </div>
          )}

          {showStartCallIcons && (
            <div className="flex flex-col justify-center items-center gap-1">
              <div className="w-12 h-12 flex justify-center items-center rounded-full bg-ovelayIconColor1">
                <RiPhoneFill />
              </div>
              <div className="text-xs text-gray-300">
                {isIncomingCall ? "Accept" : "Start call"}
              </div>
            </div>
          )}

          {showEndCallIcons && (
            <div className="flex flex-col justify-center items-center gap-1">
              <div
                onClick={() => {
                  toggleLocalAudioHandler();
                }}
                className="w-12 h-12 flex justify-center items-center rounded-full bg-TrackOn"
              >
                <RiMic2AiFill />
              </div>
              <div className="text-xs text-gray-300">Mute</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Call;
