var localVideo;
var remoteVideo;
var peerConnection;
var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

function pageReady() {
  serverConnection = new WebSocket('ws://127.0.0.1:3434');
  serverConnection.onmessage = gotMessageFromServer;
}

function start(isCaller) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.onaddstream = gotRemoteStream;

  if(isCaller) {
    peerConnection.createOffer(gotDescription, errorHandler);
  }
}

function gotMessageFromServer(message) {
  if(!peerConnection) start(false);

  var signal = JSON.parse(message.data);
  if(signal.sdp) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
        peerConnection.createAnswer(gotDescription, errorHandler);
    }, errorHandler);
  } else if(signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
  }
}

function gotIceCandidate(event) {
  if(event.candidate != null) {
    serverConnection.send(JSON.stringify({'ice': event.candidate}));
  }
}

function gotDescription(description) {
  console.log('got description');
  peerConnection.setLocalDescription(description, function () {
    serverConnection.send(JSON.stringify({'sdp': description}));
  }, function() {console.log('set description error')});
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  var player = document.getElementById('player');
  //var player = new Audio();
  player.src = URL.createObjectURL(event.stream);
  player.play();

  player.onloadeddata = function (event) {
		console.log(event);
	}
	// player.onprogress = function (event) {
	// 	console.log(event);
	// }
}

function errorHandler(error) {
  console.log(error);
}
