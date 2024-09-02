const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');
const socket = io.connect('https://shark-app-d5wl7.ondigitalocean.app/');
const userName = "Omaar"

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

        peerconnection.addEventListener('icecandidate', e => {
            if (e.candidate) {
                socket.emit('sendIceCandidateToSignalingServer', {
                    iceCandidate: e.candidate,
                    iceUserName: offerObject ? 'receiver' : 'sender',
                    didIOffer: offerObject ? false : true,
                });
            }
        });

        peerconnection.addEventListener('track', (event) => {
            console.log('Track event: Adding remote track');
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        });

        if (offerObject) {
            console.log('Setting remote description for received offer');
            await peerconnection.setRemoteDescription(offerObject.offer);
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

const addAnswer = async (offerObj) => {
    console.log('Setting remote description for received answer');
    await peerconnection.setRemoteDescription(offerObj.answer);
}

const answerOffer = async (offer) => {
    await fetchUserMedia();
    await createPeerConnection(offer);

    const answer = await peerconnection.createAnswer();
    await peerconnection.setLocalDescription(answer);
    offer.answer = answer;
    socket.emit('answer', offer);
}

const addNewIceCandidate = async (iceCandidate) => {
    try {
        await peerconnection.addIceCandidate(iceCandidate);
        console.log("======Added Ice Candidate======");
    } catch (error) {
        console.error('Error adding received ICE candidate:', error);
    }
}

document.querySelector('#call').addEventListener('click', call);
socket.on('availableOffer', (offer) => {
    createOfferEl(offer);
});

socket.on('newOfferWaiting', (offer) => {
    createOfferEl(offer);
});

socket.on('receiverIceCandidate', (iceCandidate) => {
    addNewIceCandidate(iceCandidate);
});

socket.on('answerResponse', (offer) => {
    addAnswer(offer);
});

const createOfferEl = (offer) => {
    const answerEl = document.querySelector('#answer')
    offer.forEach(element => {
        const newOfferEl = document.createElement('div')
        newOfferEl.innerHTML = `<button class="btn btn-primary">Answer ${element.offerUserName}</button>`
        newOfferEl.addEventListener('click', () => answerOffer(element))
        answerEl.appendChild(newOfferEl)
    });
};
