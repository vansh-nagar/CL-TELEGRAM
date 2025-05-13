import React from "react";

const Calling = () => {
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

  return <div>Calling</div>;
};

export default Calling;
