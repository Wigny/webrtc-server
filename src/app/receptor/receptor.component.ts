import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';

declare var require: any;
const { Socket } = require('phoenix-channels');

@Component({
  selector: 'app-receptor',
  templateUrl: './receptor.component.html',
  styleUrls: ['./receptor.component.scss']
})
export class ReceptorComponent implements OnInit, OnDestroy {
  public socket: any;
  public channel: any;

  private peerConnection: RTCPeerConnection;
  private config: RTCConfiguration = {
    iceServers: [{
      urls: ['stun:stun.l.google.com:19302']
    }]
  };

  @ViewChild('receptorVideo', { static: true }) video: ElementRef<HTMLVideoElement>;

  constructor() {
    this.socket = new Socket('ws://locahost:4000/socket');
    this.socket.connect();
  }

  public ngOnInit(): void {
    this.channel = this.socket.channel('rtc');
    this.channel.join();
    this.channel.push('receptor_on');

    this.connection();
  }

  ngOnDestroy(): void {
    this.channel.push('disconnect');
    this.peerConnection.close();
  }

  private connection(): void {
    this.peerConnection = new RTCPeerConnection(this.config);

    this.channel.on('transmissor_candidate', (candidate: RTCIceCandidate) => this.peerConnection.addIceCandidate(candidate));

    this.channel.on('offer', (offer: RTCSessionDescriptionInit) => {
      this.peerConnection.setRemoteDescription(offer);

      this.peerConnection
        .createAnswer()
        .then(answer => {
          this.peerConnection.setLocalDescription(answer);
          this.channel.push('answer', answer);
        })
        .catch(console.error);
    });

    this.peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.channel.push('receptor_candidate', candidate);
      }
    };

    this.peerConnection.ontrack = ({ streams }) => this.video.nativeElement.srcObject = streams[0];

    this.channel.on('transmissor_on', () => this.channel.push('receptor_on'));

    this.channel.on('disconnect', () => this.peerConnection.close());
  }
}
