import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

declare var require: any;
const { Socket } = require('phoenix-channels');

@Component({
  selector: 'app-transmissor',
  templateUrl: './transmissor.component.html',
  styleUrls: ['./transmissor.component.scss']
})
export class TransmissorComponent implements OnInit, OnDestroy {
  public socket: any;
  public channel: any;

  private peerConnection: RTCPeerConnection;
  private config: RTCConfiguration = {
    iceServers: [{
      urls: ['stun:stun.l.google.com:19302']
    }]
  };

  private constraints: MediaStreamConstraints = {
    video: true,
    audio: true
  };

  @ViewChild('transmissorVideo', { static: true }) video: ElementRef<HTMLVideoElement>;

  constructor() {
    this.socket = new Socket('ws://localhost:4000/socket');
    this.socket.connect();
  }

  ngOnInit(): void {
    this.channel = this.socket.channel('rtc');
    this.channel.join();

    this.connection();
  }

  ngOnDestroy(): void {
    this.channel.push('disconnect');
    this.peerConnection.close();
  }

  public connection(): void {
    this.peerConnection = new RTCPeerConnection(this.config);

    navigator.mediaDevices
      .getUserMedia(this.constraints)
      .then(stream => {
        this.video.nativeElement.srcObject = stream;

        stream
          .getTracks()
          .forEach(track => this.peerConnection
            .addTrack(track, stream),
          );

        this.channel.push('transmissor_on');
      })
      .catch(console.error);

    this.channel.on('receptor_on', () => {
      this.peerConnection
        .createOffer()
        .then(offer => {
          this.channel.push('offer', offer);
          this.peerConnection.setLocalDescription(offer);
        })
        .catch(console.error);

      this.peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          this.channel.push('transmissor_candidate', candidate);
        }
      };
    });

    this.channel.on('receptor_candidate', (candidate: RTCIceCandidate) => this.peerConnection.addIceCandidate(candidate));

    this.channel.on('answer', (answer: RTCSessionDescriptionInit) => this.peerConnection.setRemoteDescription(answer));

    this.channel.on('disconnect', () => this.peerConnection.close());
  }
}
