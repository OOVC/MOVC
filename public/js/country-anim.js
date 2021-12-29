window.addEventListener("load", ()=>{
    gsap.to(".blurin", {
        duration:0,
        display:"flex"
    });
    gsap.from(".blurin",{
        duration: .8, 
        opacity: 0, 
        y: 400, 
        stagger: 0.2,
        filter:"blur(25px)"
    });
});