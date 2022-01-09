function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}
window.addEventListener("load", ()=>{
  if(!getCookie("lang")) document.cookie = `lang=ru; path=/;`;
  document.getElementById("lang").value = getCookie("lang")
  document.getElementById("lang").onchange = ()=>{
    document.cookie = `lang=${document.getElementById("lang").value}; path=/;`;
    window.location.reload();
  }
});