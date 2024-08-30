const fs = require('fs')
const https = require('http')
const express = require('express')
const { createServer } = require('http');

const socketio = require('socket.io')
const app = express()
const server = createServer(app);

// const key = fs.readFileSync('cert.key')
// const cert = fs.readFileSync('cert.crt')

const { Server } = require('socket.io');
app.use(cors());
const io = new Server(server);
// const io = socketio(socketServer)

app.use(express.static(__dirname))

const offer =[]

const connectedSocket = []

io.on('connection',(socket)=>{
    // console.log('connected')
   const userName = 'usemane'
//    const password = socket.handshake.auth.password

    connectedSocket.push({
        socketId:socket.id,
        userName
    })
    if(offer.length){
        // console.log('there is an offer')
        socket.broadcast.emit('availableOffer',offer)
    }
    socket.on('offer',(newOffer)=>{
        offer.push({
            offerUserName:userName,
            offer:newOffer,
            offerIceCondidate:[],
            answerUserName:null,
            answer:null,
            answerIceCondidate:[]
        })
   

        socket.broadcast.emit('newOfferWaiting',offer.slice(-1))
        // console.log(offer)

      
    })

    socket.on('answer',(answer)=>{
        // console.log('you have got the answer')
        console.log(answer)
        socket.broadcast.emit('answerResponse',answer)

    })


    socket.on('iceCandidate',(icandidate)=>{
        const {icCandidate,didIOffer,userName} = icandidate;
        if(didIOffer){
          const offerInOffers = offer.find(o=>o.offerUserName == userName)
          if(offerInOffers){
            offerInOffers.offerIceCondidate.push(icCandidate);
          }
        }
        // console.log(offer)
      })
})

app.get('/test',(req,res)=>{
    res.send('test')
})
app.listen(8181)