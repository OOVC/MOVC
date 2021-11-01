const sha3 = require('js-sha3').sha3_224;
module.exports = (io,db,PASS,filter)=>{
    let cw = db.collection("clickwars");

    io.on('connection', socket => {
        socket.on("click", data=>{
            cw.findOne({id:data.id}, (err, war)=>{
                cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]}}});
                io.emit("update", {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]});
            });
        });
        socket.on("get", data=>{
            cw.findOne({id:data.id}, (err, war)=>{
                socket.emit("update", {[Object.keys(war.countries)[0]]:war.countries[Object.keys(war.countries)[0]], [Object.keys(war.countries)[1]]:war.countries[Object.keys(war.countries)[1]]});
            });
        });
    });
}