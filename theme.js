const themeMap = {
  light: "dark",
  dark: "light"
};

const theme = localStorage.getItem('theme') || (tmp => {
  localStorage.setItem('theme', tmp = Object.keys(themeMap)[0]);
  return tmp;
})();
const bodyClass = document.body.classList;
bodyClass.add(theme);

function toggleTheme() {
  const current = localStorage.getItem('theme');
  const next = themeMap[current];

  requestAnimationFrame(() => { // Wrap in requestAnimationFrame
    bodyClass.replace(current, next);
    localStorage.setItem('theme', next);
  });
}

document.getElementById('themeButton').onclick = toggleTheme;
