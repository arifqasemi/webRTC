const localVideoEl = document.querySelector('#local-video');
const remoteVideoEl = document.querySelector('#remote-video');
const socket = io.connect('https://video-call-koi54xhgs-sultaniahmad922gmailcoms-projects.vercel.app/')

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
   
    await fetchUserMedia()
    await createPeerConnection();

    try {
        // console.log('Creating offer...');
        const offer = await peerconnection.createOffer();
        await peerconnection.setLocalDescription(offer);
        didIOffer = true
        socket.emit('offer',offer) // Important step to trigger ICE gathering
        // console.log('Offer created and set as local description:', offer);
    } catch (er) {
        // console.error('Error during offer creation:', er);
    }
}

const createPeerConnection = async (offerObject) => {
    return new Promise(async (resolve, reject) => {
        peerconnection = new RTCPeerConnection(peerConfiguration);

        remoteStream = new MediaStream()
        remoteVideoEl.srcObject = remoteStream;
        
        localStream.getTracks().forEach(track => {
            peerconnection.addTrack(track, localStream);
        });

        peerconnection.addEventListener('icecandidate', e => {
            if (e.candidate) {
                socket.emit('iceCandidate',{
                    icCandidate:e.candidate,
                    userName:'test',
                    didIOffer,
                })
                // console.log('ICE candidate:', e.candidate);
            } else {
                // console.log('ICE candidate gathering complete.');
            }
        });

        peerconnection.addEventListener('track',(e)=>{
            console.log('the answer track media is')
            console.log(e)
            e.streams[0].addTrack().forEach((track)=>{
                remoteStream.addTrack(track)
            })
        })


        if(offerObject){
            peerconnection.setRemoteDescription(offerObject.offer)
        }
        resolve();
    });
}


const fetchUserMedia =async()=>{
    return new Promise(async(resolve,reject)=>{
        try{
            const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
            localVideoEl.srcObject = stream;
            localStream = stream;
            resolve()
        }catch(error){
            console.log(error)
            reject()

        }
    })
}




const answerOffer =async(offer)=>{
    await fetchUserMedia()
    await createPeerConnection(offer)
   const answer = await peerconnection.createAnswer()
   peerconnection.setLocalDescription(answer)
    // console.log(answer)
    offer.answer = answer
    socket.emit('answer',offer)
}



const addNewIceCandidate =(offer)=>{
    console.log('the offer and answer is on the addNewIceCandidate')
    console.log(offer)
}
document.querySelector('#call').addEventListener('click', call);
