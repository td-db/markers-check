// ===============================
//  TD CHECKER - script.js
//  Converted from inline script → external JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  // ---- DOM ELEMENTS ----
  const drop = document.getElementById('droparea');
  const fileinput = document.getElementById('fileinput');
  const output = document.getElementById('output');
  const partyContainer = document.getElementById('partyContainer');
  const sessionDisplay = document.getElementById('sessionDisplay');
  const sessionText = document.getElementById('sessionText');
  const sessionError = document.getElementById('sessionError');
  const confettiCanvas = document.getElementById('confetti');

  // ==================================================
  // CLICK, DRAG & DROP — NOW ACTIVATED
  // ==================================================

  // Click to open file browser
  drop.addEventListener("click", () => fileinput.click());

  // Drag visual highlight
  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("dragover");
  });

  drop.addEventListener("dragleave", () => {
    drop.classList.remove("dragover");
  });

  // Drop file to process
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    drop.classList.remove("dragover");
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // File chosen from input
  fileinput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) handleFile(file);
  });

  // ==================================================
  //  UTILITIES (unchanged)
  // ==================================================
  const esc = s => String(s || '').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const normHeader = ln => String(ln || '').replace(/\s+/g,'').toUpperCase();

  // ==================================================
  //  YOUR ORIGINAL CHECKER LOGIC (UNCHANGED)
  //  🚨 Do not delete — this is your validator system
  // ==================================================

  const VALID_SESSION_REGEX = /^Session Name:\s*(.+)$/i;

  function extractSessionName(lines){
    for(const ln of lines){
      const m = ln.match(VALID_SESSION_REGEX);
      if(m) return m[1].trim();
    }
    return null;
  }

  function findSection(lines, header){
    const idx = lines.findIndex(ln => normHeader(ln).includes(normHeader(header)));
    return idx >= 0 ? idx : -1;
  }

  function parseMarkers(lines, start){
    let i = start + 1;
    const markers = [];
    while(i < lines.length){
      const ln = lines[i].trim();
      if(ln === "") break;
      markers.push(ln);
      i++;
    }
    return markers;
  }

  // ==================================================
  //  MAIN FILE HANDLER - This runs AFTER drop/click
  // ==================================================
  async function handleFile(file){
    output.innerHTML = "Processing file…";
    sessionDisplay.style.display = "none";
    sessionError.style.display = "none";
    partyContainer.innerHTML = "";
    confettiCanvas.style.display = "none";

    const text = await file.text();
    const lines = text.split(/\r?\n/);

    // --- Session Name Check ---
    const sessionName = extractSessionName(lines);
    if(!sessionName){
      sessionDisplay.style.display = "none";
      sessionError.style.display = "block";
      sessionError.innerHTML = "❌ Session name not found.<br>Check that ‘Session Info as Text’ was exported.";
      return;
    }

    sessionText.textContent = sessionName;
    sessionDisplay.style.display = "block";
    sessionDisplay.classList.add("good");

    // --- Marker Section Check ---
    const markerIdx = findSection(lines, "Markers Listing");
    if(markerIdx === -1){
      output.innerHTML = "❌ Could not find Markers Listing section.<br><br>Check your Pro Tools export settings.";
      return;
    }

    const markers = parseMarkers(lines, markerIdx);

    if(markers.length === 0){
      output.innerHTML = "⚠ Markers section found, but no markers detected.";
      return;
    }

    // --- If markers are found ---
    output.innerHTML = `
      <div class="section">
      <h2>Markers Found (${markers.length})</h2>
      <div class="tracks-list">
        ${markers.map(m => `<div class="track-box">${esc(m)}</div>`).join("")}
      </div>
      </div>
    `;
  }

}); // END DOMContentLoaded
