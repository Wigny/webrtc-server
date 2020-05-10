const peerConnections = {};

const config = {
  iceServers: [{
    urls: ['stun:stun.l.google.com:19302']
  }]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector('video');

const constraints = {
  video: true,
  audio: true,
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(stream => {
    video.srcObject = stream;
    socket.emit('broadcaster');
  })
  .catch(console.error);

socket.on('watcher', id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  const stream = video.srcObject;

  stream
    .getTracks()
    .forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('candidate', id, candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => socket.emit('offer', id, peerConnection.localDescription));
});

socket.on('answer', (id, description) =>
  peerConnections[id].setRemoteDescription(description)
);

socket.on('candidate', (id, candidate) =>
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
);

socket.on('disconnectPeer', id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => socket.close();