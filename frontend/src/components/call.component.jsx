import React, { useEffect, useState, useRef } from "react";

const Call = () => {
  const LocalVideoRef = useRef(null);
  const [toggleVideo, settoggleVideo] = useState(false);

  useEffect(() => {
    const getStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      LocalVideoRef.current.srcObject = stream;
    };
    getStream();
  }, []);

  const toggleVideoHandler = () => {
    const stream = LocalVideoRef.current.srcObject;
    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack.readyState === "live") {
      videoTrack.stop();
    } else {
      const stream = navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      LocalVideoRef.current.srcObject = stream;
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          toggleVideoHandler();
        }}
      >
        turn on video
      </button>
      <video autoPlay muted ref={LocalVideoRef}></video>
    </div>
  );
};

export default Call;
