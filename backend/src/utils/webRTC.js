let local;
let remote;

let peerConnection;

const rtcConfig = {
  iceServer: [{ urls: "stun3.l.google.com:19302" }],
};

const initialise = async () => {
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

  iniitateOffer();
};

const iniitateOffer = async () => {
  await createPeerConnection();
};

const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection(rtcConfig);

  new MediaStream = new MediaStream()
  document.querySelector("#remoteVideo").srcObject = remoteMediaStream;
  document.querySelector("#remoteVideo").style.display = "block";
  document.querySelector("#localVideo").classList.add("smallFrame");
};

initialise();
