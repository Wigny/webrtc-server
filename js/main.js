const mediaStreamConstraints = {
  video: true,
  audio: true
};

const offerOptions = {
  offerToReceiveVideo: 1,
};

let startTime = null;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

const gotLocalMediaStream = stream => {
  localVideo.srcObject = stream;
  localStream = stream;
  trace('Received local stream.');
  callButton.disabled = false;
}

const handleLocalMediaStreamError = error => {
  trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

const gotRemoteMediaStream = ({ stream }) => {
  remoteVideo.srcObject = stream;
  remoteStream = stream;
  trace('Remote peer connection received remote stream.');
}

const logVideoLoaded = ({ target }) => {
  const { id, videoWidth, videoHeight } = target;

  trace(`${id} videoWidth: ${videoWidth}px, videoHeight: ${videoHeight}px.`);
}

const logResizedVideo = (event) => {
  logVideoLoaded(event);

  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    startTime = null;
    trace(`Setup time: ${elapsedTime.toFixed(3)}ms.`);
  }
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);

const handleConnection = ({ target, candidate }) => {
  if (candidate) {
    const newIceCandidate = new RTCIceCandidate(candidate);
    const otherPeer = getOtherPeer(target);

    otherPeer
      .addIceCandidate(newIceCandidate)
      .then(() => handleConnectionSuccess(target))
      .catch(error => handleConnectionFailure(target, error));

    trace(`${getPeerName(target)} ICE candidate: ${candidate.candidate}.`);
  }
}

const handleConnectionSuccess = peerConnection => {
  trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
};

const handleConnectionFailure = (peerConnection, error) => {
  trace(`${getPeerName(peerConnection)} failed to add ICE Candidate: ${error.toString()}.`);
}

const handleConnectionChange = (event) => {
  const peerConnection = event.target;

  console.log('ICE state change event: ', event);
  trace(`${getPeerName(peerConnection)} ICE state: ${peerConnection.iceConnectionState}.`);
}

const setSessionDescriptionError = error => {
  trace(`Failed to create session description: ${error.toString()}.`);
}

const setDescriptionSuccess = (peerConnection, functionName) => {
  const peerName = getPeerName(peerConnection);
  trace(`${peerName} ${functionName} complete.`);
}

const setLocalDescriptionSuccess = peerConnection => {
  setDescriptionSuccess(peerConnection, 'setLocalDescription');
}

const setRemoteDescriptionSuccess = peerConnection => {
  setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

const createdOffer = description => {
  trace(`Offer from localPeerConnection: ${description.sdp}`);

  trace('localPeerConnection setLocalDescription start.');
  localPeerConnection
    .setLocalDescription(description)
    .then(() => setLocalDescriptionSuccess(localPeerConnection))
    .catch(setSessionDescriptionError);

  trace('remotePeerConnection setRemoteDescription start.');
  remotePeerConnection
    .setRemoteDescription(description)
    .then(() => setRemoteDescriptionSuccess(remotePeerConnection))
    .catch(setSessionDescriptionError);

  trace('remotePeerConnection createAnswer start.');
  remotePeerConnection.createAnswer()
    .then(createdAnswer)
    .catch(setSessionDescriptionError);
}

const createdAnswer = description => {
  trace(`Answer from remotePeerConnection: ${description.sdp}.`);

  trace('remotePeerConnection setLocalDescription start.');
  remotePeerConnection.setLocalDescription(description)
    .then(() => setLocalDescriptionSuccess(remotePeerConnection))
    .catch(setSessionDescriptionError);

  trace('localPeerConnection setRemoteDescription start.');
  localPeerConnection.setRemoteDescription(description)
    .then(() => setRemoteDescriptionSuccess(localPeerConnection))
    .catch(setSessionDescriptionError);
}

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

callButton.disabled = true;
hangupButton.disabled = true;

function startAction() {
  startButton.disabled = true;
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .catch(handleLocalMediaStreamError);
  trace('Requesting local stream.');
}

function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  trace('Starting call.');
  startTime = window.performance.now();

  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();

  if (videoTracks.length > 0) {
    trace(`Using video device: ${videoTracks[0].label}.`);
  }

  if (audioTracks.length > 0) {
    trace(`Using audio device: ${audioTracks[0].label}.`);
  }

  const servers = {
    iceServers: [
      { url: 'stun:stun.l.google.com:19302' },
      { url: 'stun.services.mozilla.com: 3478' },
    ]
  };

  localPeerConnection = new RTCPeerConnection(servers);
  trace('Created local peer connection object localPeerConnection.');

  localPeerConnection.addEventListener('icecandidate', handleConnection);
  localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);

  remotePeerConnection = new RTCPeerConnection(servers);
  trace('Created remote peer connection object remotePeerConnection.');

  remotePeerConnection.addEventListener('icecandidate', handleConnection);
  remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
  remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

  localPeerConnection.addStream(localStream);
  trace('Added local stream to localPeerConnection.');

  trace('localPeerConnection createOffer start.');
  localPeerConnection
    .createOffer(offerOptions)
    .then(createdOffer)
    .catch(setSessionDescriptionError);
}

function hangupAction() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  trace('Ending call.');
}

startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

const getOtherPeer = peerConnection => (peerConnection === localPeerConnection) ?
  remotePeerConnection :
  localPeerConnection;

const getPeerName = peerConnection => (peerConnection === localPeerConnection) ?
  'localPeerConnection' :
  'remotePeerConnection';

function trace(text) {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
}