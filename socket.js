const sha3 = require('js-sha3').sha3_224;
module.exports = (io,db,PASS,filter)=>{
    let cw = db.collection("clickwars");
    let cached = {};

    io.on('connection', socket => {
        socket.on("click", data=>{
            if(cached[data.id]){
                let war = cached[data.id];
                if(!war) return;
                if(Object.keys(war.countries).indexOf(data.idc)<0||Object.keys(war.countries).indexOf(data.idco)<0) return;
                if(data.idc===data.idco) return;
                if(war.blocked) return;
                cached[data.id].countries = {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]}
                io.to(data.id).emit("update", {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco], count:io.sockets.adapter.rooms.get(data.id)?.size});
                if(cached[data.id].countries[data.idc]%100===0||cached[data.id].countries[data.idco]%100===0){
                    cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc], [data.idco]:war.countries[data.idco]}}});
                }
            } else{
                cw.findOne({id:data.id}, (err, war)=>{
                    if(!war) return;
                    if(war.blocked) return;
                    if(Object.keys(war.countries).indexOf(data.idc)<0||Object.keys(war.countries).indexOf(data.idco)<0) return;
                    if(data.idc===data.idco) return;
                    cached[data.id] = war;
                    cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco]}}});
                    io.to(data.id).emit("update", {[data.idc]:war.countries[data.idc]+1, [data.idco]:war.countries[data.idco], count:io.sockets.adapter.rooms.get(data.id)?.size});
                });
            }
        });
        socket.on("clickminus", data=>{
            if(cached[data.id]){
                let war = cached[data.id];
                if(!war) return;
                if(Object.keys(war.countries).indexOf(data.idc)<0||Object.keys(war.countries).indexOf(data.idco)<0) return;
                if(data.idc===data.idco) return;
                if(war.blocked) return;
                if(war.countries[data.idc]-1<=0) return;
                cached[data.id].countries = {[data.idc]:war.countries[data.idc]-1, [data.idco]:war.countries[data.idco]}
                io.to(data.id).emit("update", {[data.idc]:war.countries[data.idc]-1, [data.idco]:war.countries[data.idco], count:io.sockets.adapter.rooms.get(data.id)?.size});
                if(cached[data.id].countries[data.idc]%100===0||cached[data.id].countries[data.idco]%100===0){
                    cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc], [data.idco]:war.countries[data.idco]}}});
                }
            } else{
                cw.findOne({id:data.id}, (err, war)=>{
                    if(!war) return;
                    if(war.blocked) return;
                    if(war.countries[data.idc]-1<=0) return;
                    if(data.idc===data.idco) return;
                    if(Object.keys(war.countries).indexOf(data.idc)<0||Object.keys(war.countries).indexOf(data.idco)<0) return;
                    cached[data.id] = war;
                    cw.updateOne({id: data.id}, {$set: {countries:{[data.idc]:war.countries[data.idc]-1, [data.idco]:war.countries[data.idco]}}});
                    io.to(data.id).emit("update", {[data.idc]:war.countries[data.idc]-1, [data.idco]:war.countries[data.idco], count:io.sockets.adapter.rooms.get(data.id)?.size});
                });
            }
        });
        socket.on("get", data=>{
            cw.findOne({id:data.id}, (err, war)=>{
                if(!war) return;
                socket.join(data.id);
                socket.emit("update", {[Object.keys(war.countries)[0]]:war.countries[Object.keys(war.countries)[0]], [Object.keys(war.countries)[1]]:war.countries[Object.keys(war.countries)[1]], count:io.sockets.adapter.rooms.get(data.id)?.size});
            });
        });
    });
}