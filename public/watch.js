let peerConnection;

const config = {
  iceServers: [{
    urls: ['stun:stun.l.google.com:19302']
  }]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector('video');

socket.on('offer', (id, description) => {
  peerConnection = new RTCPeerConnection(config);

  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => socket.emit('answer', id, peerConnection.localDescription));

  peerConnection.ontrack = ({ streams }) => video.srcObject = streams[0];

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('candidate', id, candidate);
    }
  };
});

socket.on('candidate', (_id, candidate) => peerConnection
  .addIceCandidate(new RTCIceCandidate(candidate))
  .catch(console.error));

socket.on('connect', () => socket.emit('watcher'));

socket.on('broadcaster', () => socket.emit('watcher'));

socket.on('disconnectPeer', () => peerConnection.close());

window.onunload = window.onbeforeunload = () => socket.close();
