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
    uploadImg(file);
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

async function uploadImg(file) {
  if (!file || !file.type.match(/image.*/)) return;
  document.getElementById("spinimg").classList.remove("visually-hidden");
  var fd = new FormData();
  fd.append("image", file);
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://api.imageban.ru/v1");
  xhr.onload = function () {
    let response = JSON.parse(xhr.response);
    document.getElementById("spinimg").classList.add("visually-hidden");
    document.getElementById(
      "upimg"
    ).innerHTML = `<img class="w-50" src="${response.data.link}" alt="Photo uploaded">`;
    document.getElementById("img").value = response.data.link;
  };
  xhr.setRequestHeader("Authorization", "TOKEN 624JMPSiAoiJJQeBUHrQ");
  xhr.send(fd);
}
