window.addEventListener("load", ()=>{

    let socket = io();
    let id = document.getElementById("id").content;

    function random(min, max){
        const rand = min + Math.random() * (max - min + 1);
        return Math.floor(rand);
    }

    function update(data) {
        let clicks = Object.values(data);
        let sum = clicks[0]+clicks[1];

        document.getElementById("allclick").innerHTML = sum+" кликов";

        let numsofc = {};
        numsofc.c1 = document.getElementById("c1id").content === Object.keys(data)[0] ? Object.keys(data)[0] : Object.keys(data)[1];
        numsofc.c2 = document.getElementById("c2id").content === Object.keys(data)[0] ? Object.keys(data)[0] : Object.keys(data)[1];

        document.getElementById("c1p").style.width = (data[numsofc.c1]/sum)*100+"%";
        document.getElementById("c1c").innerHTML = data[numsofc.c1];

        document.getElementById("c2p").style.width = (data[numsofc.c2]/sum)*100+"%";
        document.getElementById("c2c").innerHTML = data[numsofc.c2];
    }

    socket.emit("get", {id});

    socket.on("update", data=>{
        update(data);
    });

    document.getElementById("c1").onclick = ()=>{
        socket.emit("click", {id, idc:document.getElementById("c1id").content, idco:document.getElementById("c2id").content})
    }

    document.getElementById("c2").onclick = ()=>{
        socket.emit("click", {id, idc:document.getElementById("c2id").content, idco:document.getElementById("c1id").content})
    }

    document.getElementById("c1minus").onclick = ()=>{
        socket.emit("clickminus", {id, idc:document.getElementById("c1id").content, idco:document.getElementById("c2id").content})
    }

    document.getElementById("c2minus").onclick = ()=>{
        socket.emit("clickminus", {id, idc:document.getElementById("c2id").content, idco:document.getElementById("c1id").content})
    }

});