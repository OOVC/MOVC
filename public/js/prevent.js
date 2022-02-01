window.onload = () => {
  let idc = document.getElementById("idc");
  idc.oninput = () => {
    var regexp = /^[a-z\-]+$/i;
    if (!regexp.test(idc.value)) {
      idc.value = idc.value.slice(0, -1);
    }
  };
  let img = document.getElementById("imgf");
  img.oninput = () => {
    let file = img.files[0];
    console.log(file.name);
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      document.getElementById("img").value = reader.result.split(",")[1];
    };
  };
  let rank = document.getElementById("rank");
  if (rank)
    rank.oninput = () => {
      var regexp = /^[0-9]+$/i;
      if (!regexp.test(rank.value)) {
        rank.value = rank.value.slice(0, -1);
      }
    };
};
