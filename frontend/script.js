// ====== Bingo Caller Frontend Script ======

// Example numbers (later you will replace with backend calls)
let calledNumbers = [];

// Play sound for a number
function playNumberSound(number) {
  let col = "";
  if (number <= 15) col = "B";
  else if (number <= 30) col = "I";
  else if (number <= 45) col = "N";
  else if (number <= 60) col = "G";
  else col = "O";

  const file = `audio/${col}${number}.mp3`;
  const audio = new Audio(file);
  audio.play().catch(err => console.error("Audio play failed:", err));
  return `${col}${number}`;
}

// Call next number (demo only – random draw)
function callNextNumber() {
  let pool = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !calledNumbers.includes(n));
  if (pool.length === 0) {
    alert("All numbers called!");
    return;
  }
  let next = pool[Math.floor(Math.random() * pool.length)];
  calledNumbers.push(next);

  const label = playNumberSound(next);
  const output = document.getElementById("calledNumbers");
  output.innerHTML += `<span class="number">${label}</span> `;
}

// Reset numbers
function resetGame() {
  calledNumbers = [];
  document.getElementById("calledNumbers").innerHTML = "";
}
