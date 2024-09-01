const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');
const socket = io.connect('https://shark-app-d5wl7.ondigitalocean.app/');

let localStream;
let remoteStream;
let peerconnection;
let didIOffer = false;
let peerConfiguration = {
    iceServers: [
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:stun1.l.google.com:19302'
            ]
        }
    ]
}

const call = async () => {
    await fetchUserMedia();
    await createPeerConnection();

    try {
        const offer = await peerconnection.createOffer();
        await peerconnection.setLocalDescription(offer);
        didIOffer = true;
        socket.emit('offer', offer);
    } catch (er) {
        console.error('Error during offer creation:', er);
    }
}

const createPeerConnection = async (offerObject) => {
    return new Promise(async (resolve) => {
        peerconnection = new RTCPeerConnection(peerConfiguration);

        remoteStream = new MediaStream();
        remoteVideoEl.srcObject = remoteStream;
        
        localStream.getTracks().forEach(track => {
            peerconnection.addTrack(track, localStream);
        });

        socket.on('iceCandidate', (candidate) => {
            peerconnection.addIceCandidate(new RTCIceCandidate(candidate.icCandidate))
                .then(() => console.log('Added ICE candidate'))
                .catch((error) => console.error('Error adding ICE candidate', error));
        });

        peerconnection.addEventListener('track', (event) => {
            console.log('The answer track media is:', event);
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        });

        if (offerObject) {
            peerconnection.setRemoteDescription(offerObject.offer);
        }
        resolve();
    });
}

const fetchUserMedia = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localVideoEl.srcObject = stream;
        localStream = stream;
    } catch (error) {
        console.error('Error accessing user media:', error);
    }
}

const answerOffer = async (offer) => {
    await fetchUserMedia();
    await createPeerConnection(offer);
    const answer = await peerconnection.createAnswer();
    await peerconnection.setLocalDescription(answer);
    offer.answer = answer;
    socket.emit('answer', offer);
}

document.querySelector('#call').addEventListener('click', call);
