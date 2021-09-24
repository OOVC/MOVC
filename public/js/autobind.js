window.addEventListener("load",async ()=>{
    try{
        document.getElementById("pass").value = localStorage.getItem("pass");
    } catch{}
    let idc = document.getElementById("idcinfo").content;
    if(!idc) return;
    let obj = await fetch('/api/country', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({idc})
      });
    obj = await obj.json();
    obj.description = obj.srcdescription;
    let keys = Object.keys(obj);
    for(let i=0; i<keys.length; i++){
        try{
            document.getElementById(keys[i]).value = obj[keys[i]];
        } catch {}
    }
});