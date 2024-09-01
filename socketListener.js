socket.on('availableOffers',(offer)=>{
    // console.log(offer)
    createOfferEl(offer)

})

socket.on('newOfferWaiting',(offer)=>{
    // console.log(offer)
    createOfferEl(offer)
})


socket.on('answerResponse',(offer)=>{
    // console.log('this is the answer respone')
    console.log(offer)
    // addNewIceCandidate(offer)
})


const createOfferEl =(offer)=>{
    const answerEl = document.querySelector('#answer')
    offer.forEach(element => {
        // console.log(element)
        const newOfferEl = document.createElement('div')
        newOfferEl.innerHTML = `<button class="btn btn-primary">Answer ${element.offerUserName}</button>`
        newOfferEl.addEventListener('click',()=>answerOffer(element))
        answerEl.appendChild(newOfferEl)
    });
}