const sha3 = require('js-sha3').sha3_224;
module.exports = (io,db,PASS,filter)=>{
    let cw = db.collection("clickwars");
    let cached = {};

    io.on('connection', socket => {
        socket.on("click", data=>{
            if(cached[data.id]){
                let war = cached[data.id];
                cached[data.id].countries = {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]}
                io.emit("update", {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]});
                if(cached[data.id].countries[data.idc]%100===0||cached[data.id].countries[data.idco]%100===0){
                    console.log("saved")
                    cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc], [data.idco]:war.countries[data.idco]}}});
                    delete cached[data.id];
                }
            } else{
                cw.findOne({id:data.id}, (err, war)=>{
                    cached[data.id] = war;
                    cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]}}});
                    io.emit("update", {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]});
                });
            }
        });
        socket.on("get", data=>{
            cw.findOne({id:data.id}, (err, war)=>{
                socket.emit("update", {[Object.keys(war.countries)[0]]:war.countries[Object.keys(war.countries)[0]], [Object.keys(war.countries)[1]]:war.countries[Object.keys(war.countries)[1]]});
            });
        });
    });
}