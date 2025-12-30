<script>
    (function(){
      const drop = document.getElementById('droparea');
      const fileinput = document.getElementById('fileinput');
      const output = document.getElementById('output');
      const partyContainer = document.getElementById('partyContainer');
      const sessionDisplay = document.getElementById('sessionDisplay');
      const sessionText = document.getElementById('sessionText');
      const sessionError = document.getElementById('sessionError');
      const confettiCanvas = document.getElementById('confetti');

      // Accordion toggle
      const requirementsToggle = document.getElementById('requirementsToggle');
      const requirementsContent = document.getElementById('requirementsContent');
      const requirementsChevron = document.getElementById('requirementsChevron');

      requirementsToggle.addEventListener('click', () => {
        const isOpen = requirementsContent.classList.contains('open');
        
        if (isOpen) {
          requirementsContent.classList.remove('open');
          requirementsChevron.classList.remove('open');
          requirementsToggle.classList.remove('active');
        } else {
          requirementsContent.classList.add('open');
          requirementsChevron.classList.add('open');
          requirementsToggle.classList.add('active');
        }
      });

      // Dark/Light Mode Toggle
      const modeToggle = document.getElementById('modeToggle');
      const modeIcon = document.getElementById('modeIcon');
      const modeText = document.getElementById('modeText');
      
      // Check system preference on load
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let isDarkMode = prefersDark;
      
      function updateModeUI() {
        if (isDarkMode) {
          modeIcon.textContent = '☀️';
          modeText.textContent = 'Light';
        } else {
          modeIcon.textContent = '🌙';
          modeText.textContent = 'Dark';
        }
      }
      
      updateModeUI();
      
      modeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        
        if (isDarkMode) {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('light-mode');
        } else {
          document.body.classList.add('light-mode');
          document.body.classList.remove('dark-mode');
        }
        
        updateModeUI();
      });

      // Copy to clipboard function
      window.copyToClipboard = function(textElementId, buttonId) {
        const textElement = document.getElementById(textElementId);
        const button = document.getElementById(buttonId);
        
        if (textElement && button) {
          const text = textElement.textContent;
          
          navigator.clipboard.writeText(text).then(() => {
            button.classList.add('copied');
            button.classList.add('copied-check');
            button.textContent = '✓';
            
            setTimeout(() => {
              button.classList.remove('copied');
              button.classList.remove('copied-check');
              button.textContent = '';
            }, 1500);
          }).catch(err => {
            console.error('Failed to copy:', err);
            button.textContent = '✗';
            setTimeout(() => {
              button.textContent = '';
            }, 1500);
          });
        }
      };

      window.togglePassedDetails = function(detailsId, badge) {
        const details = document.getElementById(detailsId);
        const arrow = badge.querySelector('.expand-arrow');
        if (details) {
          details.classList.toggle('hidden');
          if (arrow) {
            arrow.textContent = details.classList.contains('hidden') ? '▶' : '▼';
          }
        }
      };

      const esc = s => String(s || '').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
      const normHeader = ln => String(ln || '').replace(/\s+/g,'').toUpperCase();

      const VALID_SESSION_REGEX = /^(?:[a-z]+-[a-z]+\d{4}_(t1lt2r|t2lt1r)-[a-z0-9-]+|[a-z]+\d{4,5}_[a-z0-9-]+)$/i;
      const SINGLE_SESSION_REGEX = /^([a-z]{9,10})(\d{4,5})_([a-z0-9-]+)$/i;

      function highlightSessionName(name){
        if (VALID_SESSION_REGEX.test(name)) return esc(name);
        
        // Build an array of {char, isIllegal} then group consecutive illegals
        const chars = [];
        const parts = name.split('');
        let i = 0;

        while (i < parts.length && /[a-z]/i.test(parts[i])) {
          chars.push({char: parts[i++], isIllegal: false});
        }

        if (i < parts.length && parts[i] === '-') {
          chars.push({char: parts[i++], isIllegal: false});
        } else if (i < parts.length) {
          chars.push({char: parts[i++], isIllegal: true});
        }

        while (i < parts.length && /[a-z]/i.test(parts[i])) {
          chars.push({char: parts[i++], isIllegal: false});
        }

        let digits = 0;
        while (i < parts.length && /\d/.test(parts[i]) && digits < 4) {
          chars.push({char: parts[i++], isIllegal: false});
          digits++;
        }
        while (digits < 4 && i < parts.length) {
          chars.push({char: parts[i++], isIllegal: true});
          digits++;
        }

        if (i < parts.length && parts[i] === '_') {
          chars.push({char: parts[i++], isIllegal: false});
        } else if (i < parts.length) {
          chars.push({char: parts[i++] || '_', isIllegal: true});
        }

        const token = /_t2lt1r-/i.test(name) ? 't2lt1r' : 't1lt2r';
        for (let j = 0; j < token.length; j++) {
          if (i < parts.length && parts[i].toLowerCase() === token[j]) {
            chars.push({char: parts[i++], isIllegal: false});
          } else {
            chars.push({char: parts[i++] || token[j], isIllegal: true});
          }
        }

        if (i < parts.length && parts[i] === '-') {
          chars.push({char: parts[i++], isIllegal: false});
        } else if (i < parts.length) {
          chars.push({char: parts[i++] || '-', isIllegal: true});
        }

        while (i < parts.length) {
          const c = parts[i];
          chars.push({char: c, isIllegal: !/[a-z0-9-]/i.test(c)});
          i++;
        }

        // Now group consecutive chars with same isIllegal status
        let html = '';
        let j = 0;
        while (j < chars.length) {
          const isIllegal = chars[j].isIllegal;
          let group = '';
          while (j < chars.length && chars[j].isIllegal === isIllegal) {
            group += chars[j].char;
            j++;
          }
          if (isIllegal) {
            html += `<span class="illegal">${esc(group)}</span>`;
          } else {
            html += esc(group);
          }
        }
        return html;
      }

      function getSessionName(lines){
        const first = (lines[0] || '').trim();
        const m = first.match(/^SESSION NAME:\s*(.+)$/i);
        return m ? m[1].trim() : null;
      }

      function parseSessionInfo(sessionName, tracks){
        // Dualcharacter session: {speaker1}-{speaker2}{code}_(t1lt2r|t2lt1r)-{script}
        const dualMatch = sessionName.match(/^([a-z]{9,10})-([a-z]{9,10})(\d{4})_(t1lt2r|t2lt1r)-([a-z0-9-]+)$/i);
        if (dualMatch) {
          let speaker1 = dualMatch[1];
          let speaker2 = dualMatch[2];
          
          // Always store speakers in alphabetical order (speaker1 < speaker2)
          if (speaker1.toLowerCase() > speaker2.toLowerCase()) {
            [speaker1, speaker2] = [speaker2, speaker1];
          }
          
          return {
            type: 'dual',
            speaker1: speaker1,
            speaker2: speaker2,
            code: dualMatch[3],
            mode: dualMatch[4].toLowerCase(),
            script: dualMatch[5]
          };
        }

        // Singlecharacter session: {speaker1_id}{audio_file_id}_{script_name}
        // e.g. enauksjeve0002_singlecharacter003 or engblycli0001_singlecharacter001
        const singleMatch = sessionName.match(/^([a-z]{9,10})(\d{4,5})_([a-z0-9-]+)$/i);
        if (singleMatch && /singlecharacter/i.test(singleMatch[3])) {
          const speaker1 = singleMatch[1];
          const fileId = singleMatch[2];
          const scriptRaw = singleMatch[3];

          // Normalize script: allow optional dash before 'b' tail across checks
          // singlecharacter003, singlecharacter-003, singlecharacterb003, singlecharacter-b003
          let scriptBase = scriptRaw;
          scriptBase = scriptBase.replace(/^singlecharacterb/i, 'singlecharacter-b');

          // Try to grab date from first track if available (e.g. _1107_)
          let dateFromTrack = '';
          if (Array.isArray(tracks) && tracks.length) {
            const m = tracks[0].match(/_(\d{4})_/);
            if (m) dateFromTrack = m[1];
          }

          return {
            type: 'single',
            speaker1,
            fileId,
            script: scriptBase,
            dateFromTrack
          };
        }

        return null;
      }

      function suggestCorrectedSessionName(name){
        return name
          // Fix reversed order codes (R before L is wrong - L always first)
          // t1rt2l should be t1lt2r (Turn 1 first, so t1l)
          // t2rt1l should be t2lt1r (Turn 2 first, so t2l)
          .replace(/t1rt2l/gi, 't1lt2r')
          .replace(/t2rt1l/gi, 't2lt1r')
          // Fix common typos in turn codes
          .replace(/t1llt2r/gi, 't1lt2r')
          .replace(/t2llt1r/gi, 't2lt1r')
          .replace(/t1l2tr/gi, 't1lt2r')
          .replace(/t2l1tr/gi, 't2lt1r')
          // Fix separator issues
          .replace(/([a-z]+)-([a-z]+)(\d{4})-t1lt2r/i, '$1-$2$3_t1lt2r')
          .replace(/([a-z]+)-([a-z]+)(\d{4})-t2lt1r/i, '$1-$2$3_t2lt1r')
          .replace(/_t1lt2r_/i, '_t1lt2r-')
          .replace(/_t2lt1r_/i, '_t2lt1r-')
          .toLowerCase();
      }

      function parseTracks(lines){
        const found = [];
        let start = -1;
        for (let i = 0; i < lines.length; i++) {
          if (normHeader(lines[i]).includes('TRACKLISTING')) {
            start = i;
            break;
          }
        }
        if (start === -1) return [];
        for (let i = start; i < lines.length; i++) {
          if (/^TRACK NAME:/i.test(lines[i])) {
            let name = lines[i].replace(/^TRACK NAME:\s*/i, '').trim();
            name = name.replace(/\s*\([^)]*\)\s*$/, '');
            name = name.replace(/\s+/g, ' ');
            found.push(name);
          }
          if (normHeader(lines[i]).includes('MARKERSLISTING')) break;
        }
        return found;
      }

      function highlightTrackName(found, expected){
        if (found === expected) return esc(found);

        // Special case for _mixed tracks: find exactly what differs
        if (expected.includes('_mixed') && found.includes('_mixed')) {
          // Find common prefix
          let prefixEnd = 0;
          while (prefixEnd < found.length && prefixEnd < expected.length && found[prefixEnd] === expected[prefixEnd]) {
            prefixEnd++;
          }
          
          // Find common suffix (from the end)
          let foundSuffixStart = found.length;
          let expectedSuffixStart = expected.length;
          while (foundSuffixStart > prefixEnd && expectedSuffixStart > prefixEnd && 
                 found[foundSuffixStart - 1] === expected[expectedSuffixStart - 1]) {
            foundSuffixStart--;
            expectedSuffixStart--;
          }
          
          // If we found matching prefix and suffix, highlight only the middle
          if (prefixEnd > 0 || foundSuffixStart < found.length) {
            const prefix = found.substring(0, prefixEnd);
            const wrongPart = found.substring(prefixEnd, foundSuffixStart);
            const suffix = found.substring(foundSuffixStart);
            
            if (wrongPart.length > 0) {
              return esc(prefix) + `<span class="illegal">${esc(wrongPart)}</span>` + esc(suffix);
            }
          }
        }

        if (!expected.includes('_mixed')) {
          const wrongPart = '_t1lt2r_';
          const idx = found.indexOf(wrongPart);
          if (idx !== -1) {
            return esc(found.substring(0, idx)) +
              `<span class="illegal">${esc(wrongPart)}</span>` +
              esc(found.substring(idx + wrongPart.length));
          }
        }

        // Check for missing date code scenario
        // Expected pattern: speakerID__script (double underscore = missing date)
        // Or expected pattern: speakerID_XXXX_script where found is missing the XXXX
        
        // Case 1: Expected has double underscore (date is empty/missing)
        if (expected.includes('__')) {
          const expectedParts = expected.split('__');
          if (expectedParts.length === 2) {
            const speakerId = expectedParts[0];
            // Check if found starts with speakerId + underscore (but missing date)
            if (found.startsWith(speakerId + '_')) {
              return esc(speakerId) + `<span class="illegal">_⚠️XXXX</span>` + esc(found.substring(speakerId.length));
            }
          }
        }

        // Case 2: Check for missing date code where expected has speakerIDXXXX_script
        const foundParts = found.split('_');
        const expectedParts = expected.split('_');
        
        if (foundParts.length >= 1 && expectedParts.length >= 1) {
          const foundFirst = foundParts[0];
          const expectedFirst = expectedParts[0];
          
          // Check if expected first part = speaker ID + 4 digits (has date code)
          const dateMatch = expectedFirst.match(/^([a-z]{9,10})(\d{4})$/i);
          if (dateMatch) {
            const speakerId = dateMatch[1];
            const dateCode = dateMatch[2];
            
            // If found starts with just the speaker ID (missing date)
            if (foundFirst.toLowerCase() === speakerId.toLowerCase()) {
              // Highlight by inserting marker where date should be
              return esc(foundFirst) + `<span class="illegal">⚠️XXXX</span>` + esc(found.substring(foundFirst.length));
            }
            
            // If found has speaker ID merged with something else (no underscore where expected)
            if (foundFirst.toLowerCase().startsWith(speakerId.toLowerCase()) && foundFirst.length > speakerId.length) {
              const afterSpeaker = foundFirst.substring(speakerId.length);
              // Check if what follows is NOT 4 digits
              if (!/^\d{4}$/.test(afterSpeaker)) {
                return esc(speakerId) + `<span class="illegal">${esc(afterSpeaker)}</span>` + esc(found.substring(foundFirst.length));
              }
            }
          }
        }

        // Default: character-by-character comparison with suffix matching
        let i = 0;
        const minLen = Math.min(found.length, expected.length);
        while (i < minLen && found[i] === expected[i]) i++;

        // Also check for matching suffix
        let foundSuffixStart = found.length;
        let expectedSuffixStart = expected.length;
        while (foundSuffixStart > i && expectedSuffixStart > i && 
               found[foundSuffixStart - 1] === expected[expectedSuffixStart - 1]) {
          foundSuffixStart--;
          expectedSuffixStart--;
        }

        if (i < foundSuffixStart) {
          return esc(found.substring(0, i)) +
            `<span class="illegal">${esc(found.substring(i, foundSuffixStart))}</span>` +
            esc(found.substring(foundSuffixStart));
        }

        if (i === minLen) {
          const longer = found.length > expected.length ? found : expected;
          const shorterLen = minLen;
          return esc(longer.substring(0, shorterLen)) +
            `<span class="illegal">${esc(longer.substring(shorterLen))}</span>`;
        }

        // Find where they start matching again (if at all)
        let j = i + 1;
        while (j < found.length && j < expected.length && found[j] !== expected[j]) j++;
        
        return esc(found.substring(0, i)) +
          `<span class="illegal">${esc(found.substring(i, j))}</span>` +
          esc(found.substring(j));
      }

      function validateTracks(tracks, sessionInfo){
        if (!sessionInfo) return tracks.map(() => null);

        // SINGLECHARACTER: 3 tracks
        if (sessionInfo.type === 'single') {
          const date = sessionInfo.dateFromTrack || (tracks[0]?.match(/_(\d{4})_/)?.[1] || '');

          const scriptBase = sessionInfo.script;
          const scriptNoDash = scriptBase.replace(/-([bB]\d{3,4})$/, 'b$1');
          const scriptVariants = scriptNoDash === scriptBase
            ? [scriptBase]
            : [scriptBase, scriptNoDash];

          const expectedSingle = [
            `${sessionInfo.speaker1}_${date}_${scriptBase}`,
            `Talent 1_${sessionInfo.speaker1}_${date}_${scriptBase}`,
            `${sessionInfo.speaker1}_${date}_${scriptBase}_mixed`
          ];

          return tracks.map((track, i) => {
            const baseExpected = expectedSingle[i];
            if (!baseExpected) return null;

            const ok = scriptVariants.some(scr => {
              const variantExpected =
                i === 0
                  ? `${sessionInfo.speaker1}_${date}_${scr}`
                  : i === 1
                  ? `Talent 1_${sessionInfo.speaker1}_${date}_${scr}`
                  : `${sessionInfo.speaker1}_${date}_${scr}_mixed`;
              return track === variantExpected;
            });

            return ok ? null : baseExpected;
          });
        }

        // DUALCHARACTER: original 5-track logic
        // speaker1 is always alphabetically first (Left), speaker2 is always alphabetically second (Right)
        const date1 = tracks[0]?.match(/_(\d{4})_/)?.[1] || '';
        const date2 = tracks[1]?.match(/_(\d{4})_/)?.[1] || '';
        
        // Determine Talent numbers based on turn order (mode)
        // t1lt2r = Turn 1 on Left, so Left is Talent 1, Right is Talent 2
        // t2lt1r = Turn 2 on Left (Turn 1 on Right), so Left is Talent 2, Right is Talent 1
        const leftTalent = sessionInfo.mode === 't2lt1r' ? 'Left_Talent 2' : 'Left_Talent 1';
        const rightTalent = sessionInfo.mode === 't2lt1r' ? 'Right_Talent 1' : 'Right_Talent 2';
        
        const expected = [
          `${sessionInfo.speaker1}_${date1}_${sessionInfo.script}`,
          `${sessionInfo.speaker2}_${date2}_${sessionInfo.script}`,
          `${leftTalent}_${sessionInfo.speaker1}_${date1}_${sessionInfo.script}`,
          `${rightTalent}_${sessionInfo.speaker2}_${date2}_${sessionInfo.script}`,
          `${sessionInfo.speaker1}-${sessionInfo.speaker2}_${date1}_${sessionInfo.script}_mixed`
        ];
        return tracks.map((track, i) => expected[i] && track !== expected[i] ? expected[i] : null);
      }

      // NEW: Tracks section — clean when all pass, detailed only on fail
      function renderTracksSection(tracks, expectedList){
        const hasErrors = expectedList.some(e => e !== null);
        let html = `<div class="section"><h2>Tracks</h2>`;

        // All tracks are correct → show PASSED badge with collapsible details
        if (!hasErrors) {
          const detailsId = 'tracks-details-' + Date.now();
          html += `<div class="badge ok" style="cursor:pointer;" onclick="togglePassedDetails('${detailsId}', this)">
            PASSED <span class="expand-arrow">▶</span>
          </div>`;
          html += `<div id="${detailsId}" class="passed-details hidden">`;
          tracks.forEach((t, i) => {
            html += `<div class="track-box"><div class="track-num">${i + 1}</div>${esc(t)}</div>`;
          });
          html += `</div></div>`;
          return html;
        }

        // There are errors → show FAIL badge + full visual detail
        const errorCount = expectedList.filter(e => e !== null).length;
        html += `<div class="badge fail">FAIL — ${errorCount} issue${errorCount > 1 ? 's' : ''}</div>`;
        html += `<div class="tracks-list">`;

        tracks.forEach((t, i) => {
          const expected = expectedList[i];
          const isBad = expected !== null;
          const highlighted = highlightTrackName(t, expected || t);

          html += `
            <div class="track-box ${isBad ? 'bad' : ''}">
              <div class="track-num">${i + 1}</div>${highlighted}
            </div>`;

          if (isBad) {
            const copyId = `copy-track-${i}`;
            // Replace double underscore with _XXXX_ to show missing date placeholder
            let displayExpected = expected.replace('__', '_XXXX_');
            html += `
              <div class="should-be-wrapper">
                <div class="should-be">Should Be:</div>
                <div class="should-be-container">
                  <div class="should-be-box">
                    <code id="text-${copyId}">${esc(displayExpected)}</code>
                  </div>
                  <button class="copy-btn" id="btn-${copyId}" onclick="copyToClipboard('text-${copyId}', 'btn-${copyId}')" title="Copy to clipboard"></button>
                </div>
              </div>`;
          }
        });

        html += `</div></div>`;
        return html;
      }

      function parseMarkersSection(lines){
        let start = -1;
        for (let i = 0; i < lines.length; i++) {
          if (normHeader(lines[i]).includes('MARKERSLISTING')) {
            start = i;
            break;
          }
        }
        if (start === -1) return {err:"Couldn't find MARKERS LISTING section."};

        let header = -1;
        for (let j = start; j < start + 12 && j < lines.length; j++) {
          if (/NAME/i.test(lines[j])) {
            header = j;
            break;
          }
        }
        if (header === -1) header = start + 1;

        const hdr = lines[header] || '';
        const sep = hdr.includes('	') ? /	+/ : /\s{2,}/;
        const cols = hdr.split(sep).map(s => s.trim());
        const nameIdx = cols.findIndex(c => /NAME/i.test(c));
        if (nameIdx === -1) return {err:"No NAME column."};

        const trackIdx = cols.findIndex(c => /TRACK\s*NAME/i.test(c));
        const unitsIdx = cols.findIndex(c=>/\bUNITS\b/i.test(c));

        const data = [];
        for (let i = header + 1; i < lines.length; i++) {
          const raw = lines[i];
          if (!raw.trim()) break;
          const c = raw.split(sep).map(s => s.trim());
          if (c[nameIdx]) {
            data.push({
              name: c[nameIdx],
              track: trackIdx !== -1 ? (c[trackIdx] || '') : '',
              units: unitsIdx !== -1 ? (c[unitsIdx] || '') : '',
              line: i + 1
            });
          }
        }
        return {data};
      }

      function extractMarker(name){
        const m = name.match(/^([A-Za-z]+)\s*[-_ ]*\s*0*([0-9]*)/);
        if (!m) return {token:'unknown', num:null, raw:name};
        return {
          token:m[1].toLowerCase(),
          num:m[2] ? parseInt(m[2], 10) : null,
          raw:name
        };
      }

      // UPDATED markers: require at least one non-scene marker between scenes,
      // last scene can be final marker, plus all previous line/lout rules.
      // v1.1.0: Enforce that line/lout markers can only live on specific edit tracks.
      function validateMarkers(markers, sessionInfo, trackNames){
        const errors = [];
        let open = null;
        let prev = null;
        let sceneCount = 0;
        let lastScene = null; // {raw, sawNonScene:boolean}
        
        // For dual character: track alternation rule
        let lastCompletedPairTrack = null; // Track of the last completed line-lout pair
        let lastCompletedPairNum = null; // Number of the last completed line-lout pair
        let sawSceneSinceLastPair = false; // Reset when scene marker appears
        let isFirstPair = true; // Track if this is the first line-lout pair (for turn order validation)

        // Allowed track indices (1-based) where line/lout markers may appear
        let allowedTrackIndices = [];
        // Expected first track based on t1lt2r/t2lt1r
        let expectedFirstTrack = null;
        
        if (sessionInfo && sessionInfo.type === 'dual') {
          // Dualcharacter: Tracks 3 & 4 (edit tracks)
          allowedTrackIndices = [3, 4];
          
          // t1lt2r = Turn 1 on Left (Track 3), Turn 2 on Right (Track 4)
          // t2lt1r = Turn 2 on Left (Track 3), Turn 1 on Right (Track 4)
          if (sessionInfo.mode === 't1lt2r') {
            expectedFirstTrack = 3; // First turn should be on Left (Track 3)
          } else if (sessionInfo.mode === 't2lt1r') {
            expectedFirstTrack = 4; // First turn should be on Right (Track 4)
          }
        } else if (sessionInfo && sessionInfo.type === 'single') {
          // Singlecharacter: Track 2 only (edit track)
          allowedTrackIndices = [2];
        }

        function getTrackIndexByName(trackName) {
          if (!trackName || !Array.isArray(trackNames)) return -1;
          const idx = trackNames.findIndex(t => t === trackName);
          return idx === -1 ? -1 : idx + 1; // 1-based
        }

        for (const m of markers) {
          const fullName = m.raw;
          const markerTrackName = m.track || '';
          const markerTrackIndex = getTrackIndexByName(markerTrackName);

          
          // Units check
          if (m.units && m.units.toLowerCase() === 'ticks') {
            if (m.token === 'scene') {
              errors.push(`Scene marker '${fullName}' created in Bars/Beats — must be Absolute Time. Remove and create it again in Absolute Time (Not Bars).`);
            } else {
              errors.push(`UNITS = Ticks — Change the track resolution to Samples (Not Ticks)`);
            }
          }
if (!['line','lout','scene'].includes(m.token)) {
            errors.push(`Unexpected marker '${fullName}'`);
            if (lastScene) lastScene.sawNonScene = true;
            continue;
          }

          // Enforce placement: line/lout must be on allowed tracks only
          if (['line','lout'].includes(m.token) && allowedTrackIndices.length) {
            if (markerTrackIndex === -1) {
              errors.push(`${fullName} is on unknown track '${markerTrackName}'`);
            } else if (!allowedTrackIndices.includes(markerTrackIndex)) {
              errors.push(`${fullName} placed in disallowed track '${markerTrackName}'`);
            }
          }

          if (m.token === 'scene') {
            sceneCount++;

            if (!/^scene\d{2}$/.test(fullName)) {
              errors.push(`Invalid scene marker '${fullName}' — must be scene01, scene02, scene03, etc.`);
            }

            // Check sequential order
            if (m.num !== null) {
              const expectedSceneNum = sceneCount;
              if (m.num !== expectedSceneNum) {
                errors.push(`Scene markers out of order: '${fullName}' should be scene${String(expectedSceneNum).padStart(2, '0')}`);
              }
            }

            if (lastScene && !lastScene.sawNonScene) {
              errors.push(`No markers between ${lastScene.raw} and ${fullName}`);
            }

            lastScene = { raw: fullName, sawNonScene: false };

            if (open) open.scene = true;
            
            // Scene marker resets track alternation requirement
            sawSceneSinceLastPair = true;

            continue;
          }

          // Any non-scene marker is enough to break the "gap" between scenes
          if (lastScene) lastScene.sawNonScene = true;

          if (m.token === 'line') {
            if (open) errors.push(`${open.raw} not closed`);
            open = {raw:fullName, num:m.num, line:m.line, scene:false, track:markerTrackName, trackIndex:markerTrackIndex};
          } else if (m.token === 'lout') {
            if (!open) {
              errors.push(`${fullName} without matching line`);
            } else {
              if (open.num !== m.num) errors.push(`${open.raw} to ${fullName} mismatch`);
              if (open.scene) errors.push(`scene between ${open.raw} and ${fullName}`);
              if (prev !== null && m.num !== prev + 1) errors.push(`${fullName} not sequential`);
              
              // Check that line and lout are on the same track
              if (open.track !== markerTrackName) {
                errors.push(`line${String(open.num).padStart(4, '0')} and lout${String(m.num).padStart(4, '0')} must be on the same track`);
              }
              
              // Dual character: check first turn track based on t1lt2r/t2lt1r
              if (sessionInfo && sessionInfo.type === 'dual' && isFirstPair && expectedFirstTrack !== null) {
                if (open.trackIndex !== expectedFirstTrack) {
                  const actualTrack = open.trackIndex === 3 ? 'LEFT' : 'RIGHT';
                  const correctCode = open.trackIndex === 3 ? 't1lt2r' : 't2lt1r';
                  // Build corrected session name
                  const currentMode = sessionInfo.mode;
                  const correctedSessionName = sessionInfo.speaker1 + '-' + sessionInfo.speaker2 + sessionInfo.code + '_' + correctCode + '-' + sessionInfo.script;
                  errors.push(`SESSION NAME orientation mismatch: 1st Turn is on ${actualTrack} TRACK, session name should be ${correctCode}. Should be: ${correctedSessionName}`);
                }
                isFirstPair = false;
              }
              
              // Dual character: check track alternation rule
              if (sessionInfo && sessionInfo.type === 'dual') {
                if (lastCompletedPairTrack !== null && !sawSceneSinceLastPair) {
                  // Must be on different track than last pair
                  if (open.trackIndex === lastCompletedPairTrack) {
                    errors.push(`Consecutive same talent/channel markers: line${String(lastCompletedPairNum).padStart(4, '0')}, line${String(m.num).padStart(4, '0')}`);
                  }
                }
                // Update last completed pair info
                lastCompletedPairTrack = open.trackIndex;
                lastCompletedPairNum = m.num;
                sawSceneSinceLastPair = false;
              }
              
              prev = m.num;
              open = null;
            }
          }
        }

        if (open) errors.push(`${open.raw} not closed`);
        if (sceneCount > 50) errors.push(`Too many scene markers (${sceneCount})`);
        return errors;
      }

      function parseOnlineFiles(lines){
        let start = -1;
        for (let i = 0; i < lines.length; i++) {
          if (normHeader(lines[i]).includes('ONLINEFILESINSESSION')) {
            start = i;
            break;
          }
        }
        if (start === -1) return {err:"Couldn't find ONLINE FILES section."};

        let header = -1;
        for (let j = start; j < start + 20 && j < lines.length; j++) {
          if (/file\s*name/i.test(lines[j]) && /location/i.test(lines[j])) {
            header = j;
            break;
          }
        }
        if (header === -1) return {err:"Missing FILE NAME / LOCATION columns"};

        const hdr = lines[header] || '';
        const sep = hdr.includes('	') ? /	+/ : /\s{2,}/;
        const cols = hdr.split(sep).map(s => s.trim());
        const nameIdx = cols.findIndex(c => /file\s*name/i.test(c));
        const locIdx = cols.findIndex(c => /location/i.test(c));
        if (nameIdx === -1 || locIdx === -1) return {err:"Missing columns"};

        const rows = [];
        for (let i = header + 1; i < lines.length; i++) {
          const raw = lines[i];
          if (!raw.trim()) break;
          if (/[A-Z ]+LISTING/.test(raw)) break;
          const c = raw.split(sep).map(s => s.trim());
          rows.push({file:c[nameIdx], location:c[locIdx]});
        }
        return {rows};
      }

      // *** FIXED IN v1.0.4 ***
      function isInBouncedFiles(loc){
        return /[:/]Bounced Files:?$/.test(loc || '');
      }

      // *** FIXED IN v1.0.4 ***
      function isInAudioFiles(loc){
        return /[:/]Audio Files:?$/.test(loc || '');
      }

      function normalizeScriptTail(name){
        const m = name.match(/^(.*?)(-?e\d{3,4})$/);
        if (!m) return name;
        return m[1] + m[2].replace('-', '');
      }

      function checkBouncedFiles(sessionName, rows){
        const stripExt = f => f.replace(/\.[^.]+$/, '');
        const normSession = normalizeScriptTail(sessionName);

        const parsed = rows.map(r => {
          const noExt = stripExt(r.file.trim());
          let base = noExt;
          let suffix = "";
          const m = noExt.match(/_(edit|mixed)$/);
          if (m) {
            suffix = m[1];
            base = noExt.slice(0, -m[0].length);
          }
          return {base, suffix, loc:r.location.trim()};
        });

        const foundEdit  = parsed.find(r => r.suffix === "edit"  && normalizeScriptTail(r.base) === normSession);
        const foundMixed = parsed.find(r => r.suffix === "mixed" && normalizeScriptTail(r.base) === normSession);

        const errors = [];
        if (!foundEdit)  errors.push(`Missing _edit bounce`);
        if (!foundMixed) errors.push(`Missing _mixed bounce`);
        if (foundEdit  && !isInBouncedFiles(foundEdit.loc))  errors.push(`_edit bounce not in Bounced Files`);
        if (foundMixed && !isInBouncedFiles(foundMixed.loc)) errors.push(`_mixed bounce not in Bounced Files`);

        return {pass:errors.length === 0, errors};
      }

      // Audio Files checker
      function checkAudioFiles(sessionInfo, tracks, rows){
        const stripExt = f => f.replace(/\.[^.]+$/, '');
        const errors = [];

        if (!sessionInfo || !rows || !Array.isArray(rows)) {
          return {pass:true, errors};
        }

        // Helpers (use same folder check as existing code)
        const isInAudioFiles = loc => /[:\\\/ ]Audio Files:?$/i.test(loc||'');

        // SINGLECHARACTER
        if (sessionInfo.type === 'single') {
          const date = sessionInfo.dateFromTrack || (tracks[0]?.match(/_(\d{4})_/)?.[1] || '');
          const scriptBase = sessionInfo.script;
          const scriptNoDash = scriptBase.replace(/-([bB]\d{3,4})$/, 'b$1');
          const scriptVariants = scriptNoDash === scriptBase ? [scriptBase] : [scriptBase, scriptNoDash];

          rows.forEach(r => {
            if (!isInAudioFiles(r.location)) return;
            const file = (r.file||'').trim(); if (!file) return;
            const base = stripExt(file);

            // Optional prefix for single
            let hadPrefix = false;
            let rest = base;
            if (rest.startsWith('Talent 1_')) {
              hadPrefix = true;
              rest = rest.substring('Talent 1_'.length);
            } else if (rest.startsWith('Left_Talent 1_') || rest.startsWith('Right_Talent 2_')) {
              // Invalid prefixes for SINGLE
              const expectedBase = `${sessionInfo.speaker1}_${date}_${scriptBase}`;
              errors.push({ file, base, expectedBase });
              return;
            }

            let anyValid = false;
            let expectedBase = `${sessionInfo.speaker1}_${date}_${scriptBase}`;

            for (const scr of scriptVariants) {
              const expectedNoPrefix = `${sessionInfo.speaker1}_${date}_${scr}`;
              const expectedWith     = `Talent 1_${expectedNoPrefix}`;

              if (hadPrefix) {
                if (base === expectedWith || base.startsWith(expectedWith + '_') || base.startsWith(expectedWith + '-')) { anyValid = true; break; }
              } else {
                if (rest === expectedNoPrefix || rest.startsWith(expectedNoPrefix + '_') || rest.startsWith(expectedNoPrefix + '-')) { anyValid = true; break; }
              }
            }

            if (!anyValid) {
              errors.push({ file, base, expectedBase });
            }
          });

          return {pass:errors.length===0, errors};
        }

        // DUALCHARACTER
        const date1 = tracks[0]?.match(/_(\d{4})_/)?.[1] || '';
        const date2 = tracks[1]?.match(/_(\d{4})_/)?.[1] || '';
        const scriptBase = sessionInfo.script;
        const scriptNoDash = scriptBase.replace(/-([bB]\d{2,4})$/, '$1');
        const scriptVariants = scriptNoDash === scriptBase ? [scriptBase] : [scriptBase, scriptNoDash];

        rows.forEach(r => {
          if (!isInAudioFiles(r.location)) return;
          const file = (r.file||'').trim(); if (!file) return;
          const base = stripExt(file);

          // Optional prefixes
          let prefix = null;
          let rest = base;
          const leftPrefix  = sessionInfo.mode==='t2lt1r' ? 'Left_Talent 2_' : 'Left_Talent 1_';
          if (rest.startsWith(leftPrefix)) { prefix='left';  rest = rest.substring(leftPrefix.length); }
          else if (rest.startsWith(sessionInfo.mode==='t2lt1r' ? 'Right_Talent 1_' : 'Right_Talent 2_')) { prefix='right'; rest = rest.substring((sessionInfo.mode==='t2lt1r' ? 'Right_Talent 1_' : 'Right_Talent 2_').length); }
          else if (rest.startsWith('Talent 1_')) {
            // Invalid for dual
            const expectedBase = `${sessionInfo.speaker1}_${date1}_${scriptBase} OR ${sessionInfo.speaker2}_${date2}_${scriptBase}`;
            errors.push({ file, base, expectedBase });
            return;
          }

          let anyValid = false;
          let expectedBase = `${sessionInfo.speaker1}_${date1}_${scriptBase} OR ${sessionInfo.speaker2}_${date2}_${scriptBase}`;

          for (const scr of scriptVariants) {
            const leftNoPrefix  = `${sessionInfo.speaker1}_${date1}_${scr}`;
            const rightNoPrefix = `${sessionInfo.speaker2}_${date2}_${scr}`;
            const leftWith      = `Left_Talent 1_${leftNoPrefix}`;
            const rightWith     = `Right_Talent 2_${rightNoPrefix}`;

            if (prefix === 'left') {
              if (base === leftWith || base.startsWith(leftWith + '_') || base.startsWith(leftWith + '-')) { anyValid = true; break; }
            } else if (prefix === 'right') {
              if (base === rightWith || base.startsWith(rightWith + '_') || base.startsWith(rightWith + '-')) { anyValid = true; break; }
            } else {
              // No prefix: must match either side using strict underscore-separated core
              if (rest === leftNoPrefix || rest.startsWith(leftNoPrefix + '_') || rest.startsWith(leftNoPrefix + '-') ||
                  rest === rightNoPrefix || rest.startsWith(rightNoPrefix + '_') || rest.startsWith(rightNoPrefix + '-')) {
                anyValid = true; break;
              }
            }
          }

          if (!anyValid) {
            errors.push({ file, base, expectedBase });
          }
        });

        return {pass:errors.length===0, errors};
      }function renderMarkersReport(errors){
        let html = `<div class="section"><h2>Markers</h2>`;
        if (!errors.length) {
          html += `<div class="badge ok">PASSED</div>`;
        } else {
          html += `<div class="badge fail">FAIL — ${errors.length} issues</div><div class="error-list">`;
          errors.forEach(e => {
            html += `<div class="error-item">${esc(e)}</div>`;
          });
          html += `</div>`;
        }
        html += `</div>`;
        return html;
      }

      function renderAudioFilesSection(online, audioCheck){
        let html = `<div class="section"><h2>Audio Files</h2>`;

        if (online.err) {
          html += `<div class="badge fail">FAIL — ${esc(online.err)}</div></div>`;
          return html;
        }

        const errors = audioCheck.errors || [];

        if (!errors.length) {
          html += `<div class="badge ok">PASSED</div>`;
        } else {
          html += `<div class="badge fail">FAIL — ${errors.length} issue${errors.length > 1 ? 's' : ''}</div>`;
          html += `<div class="error-list">`;
          errors.forEach((err, idx) => {
            const copyId = `copy-audio-${idx}`;
            // Replace double underscore with _XXXX_ to show missing date placeholder
            let displayExpected = err.expectedBase.replace('__', '_XXXX_');
            html += `<div class="error-item">
              <div><strong>File:</strong> ${esc(err.file)}</div>
              <div>Prefix: ${highlightTrackName(err.base, err.expectedBase)}</div>
              <div class="should-be">Should Start With:</div>
              <div class="should-be-container">
                <div class="should-be-box">
                  <code id="text-${copyId}">${esc(displayExpected)}</code>
                </div>
                <button class="copy-btn" id="btn-${copyId}" onclick="copyToClipboard('text-${copyId}', 'btn-${copyId}')" title="Copy to clipboard"></button>
              </div>
            </div>`;
          });
          html += `</div>`;
        }

        html += `</div>`;
        return html;
      }

      function renderBouncedSection(sessionName, online, bounced){
        let html = `<div class="section"><h2>Bounces</h2>`;

        if (online.err) {
          html += `<div class="badge fail">FAIL — ${esc(online.err)}</div></div>`;
          return html;
        }

        if (bounced.pass) {
          const detailsId = 'bounces-details-' + Date.now();
          html += `<div class="badge ok" style="cursor:pointer;" onclick="togglePassedDetails('${detailsId}', this)">
            PASSED <span class="expand-arrow">▶</span>
          </div>`;
          html += `<div id="${detailsId}" class="passed-details hidden">`;
          html += `<div class="track-box"><code>${esc(sessionName)}_edit.wav</code></div>`;
          html += `<div class="track-box"><code>${esc(sessionName)}_mixed.wav</code></div>`;
          html += `</div>`;
        } else {
          html += `
  <div class="note">
    Expected:<br>
    <code>${esc(sessionName)}_edit</code><br>
    <code>${esc(sessionName)}_mixed</code>
  </div>
`;
          html += `<div class="badge fail">FAIL</div><div class="error-list">`;
          bounced.errors.forEach(e => {
            html += `<div class="error-item">${esc(e)}</div>`;
          });
          html += `</div>`;
        }

        html += `</div>`;
        return html;
      }

      function triggerParty() {
  
        const canvas = confettiCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        const lightColors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];
        const darkColors  = ['#22d3ee', '#a855f7', '#facc15', '#fb7185', '#4ade80', '#38bdf8'];

        const colors = prefersDark ? darkColors : lightColors;

        const confetti = [];
        for (let i = 0; i < 120; i++) {
          confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 2,
            d: Math.random() * 8 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 10,
            tiltAngle: 0,
            tiltAngleIncrement: Math.random() * 0.07 + 0.05
          });
        }

        let animationFrame;
        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          confetti.forEach((c, i) => {
            c.tiltAngle += c.tiltAngleIncrement;
            c.y += c.d;
            c.tilt = Math.sin(c.tiltAngle) * 15;

            if (c.y > canvas.height) {
              confetti.splice(i, 1);
            } else {
              ctx.beginPath();
              ctx.lineWidth = c.r;
              ctx.strokeStyle = c.color;
              ctx.moveTo(c.x + c.tilt + c.r / 2, c.y);
              ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 2);
              ctx.stroke();
            }
          });
          if (confetti.length) {
            animationFrame = requestAnimationFrame(draw);
          } else {
            canvas.style.display = 'none';
            cancelAnimationFrame(animationFrame);
          }
        }

        canvas.style.display = 'block';
        draw();

        const party = document.createElement('div');
        party.id = 'party';
        party.innerHTML = `
          <div class="congrats">CONGRATULATIONS!!!</div>
          <div class="perfect">PERFECT SESSION!</div>
          
        `;
        partyContainer.appendChild(party);
      }

      async function handleFile(file){
        output.innerHTML = '<div>Processing…</div>';
        sessionDisplay.style.display = 'none';
        sessionError.style.display = 'none';
        confettiCanvas.style.display = 'none';
        partyContainer.innerHTML = '';

        const text = await file.text();
        const lines = text.split(/\r?\n/);

        const sessionName = getSessionName(lines);
        if (!sessionName) {
          output.innerHTML = `<div class="section"><div class="badge fail">No SESSION NAME found</div></div>`;
          return;
        }

        const isValid = VALID_SESSION_REGEX.test(sessionName);
        sessionDisplay.className = `session-name ${isValid ? 'good' : 'bad'}`;
        sessionText.innerHTML = highlightSessionName(sessionName);
        sessionDisplay.style.display = 'block';

        if (!isValid) {
          const corrected = suggestCorrectedSessionName(sessionName);
          const copyId = 'copy-session-name';
          sessionError.innerHTML = `
            <strong>INVALID SESSION FORMAT.</strong>
            <div class="should-be" style="margin-top:12px;">Should Be:</div>
            <div class="should-be-container">
              <div class="should-be-box">
                <code id="text-${copyId}">${esc(corrected)}</code>
              </div>
              <button class="copy-btn" id="btn-${copyId}" onclick="copyToClipboard('text-${copyId}', 'btn-${copyId}')" title="Copy to clipboard"></button>
            </div>`;
          sessionError.style.display = 'block';
          output.innerHTML = '';
          return;
        }

        const sessionInfo = parseSessionInfo(sessionName);
        if (!sessionInfo) {
          // Show detailed breakdown of what's wrong with the speaker ID
          sessionDisplay.className = "session-name bad";
          
          // Helper function to analyze a speaker ID
          function analyzeSpeakerId(letters, label) {
            const len = letters.length;
            const lang = letters.substring(0, 2) || '??';
            const loc = letters.substring(2, 4) || '??';
            const studio = letters.substring(4, 6) || '??';
            const initials = letters.substring(6) || '';
            const initialsLen = initials.length;
            
            const langStatus = lang.length === 2 ? '✓' : '✗';
            const locStatus = loc.length === 2 ? '✓' : '✗';
            const studioStatus = studio.length === 2 ? '✓' : '✗';
            const initialsNote = initialsLen < 3 ? `(${initialsLen} letters) ✗ Too short - should be 3-4 letters` : 
                                 initialsLen > 4 ? `(${initialsLen} letters) ✗ Too long - should be 3-4 letters` : 
                                 `(${initialsLen} letters) ✓`;
            
            const isValid = len >= 9 && len <= 10;
            
            return `
              <div style="margin-top:12px; text-align:left; padding:12px; background:rgba(0,0,0,0.05); border-radius:8px;">
                <strong>${label}:</strong> <code>${esc(letters)}</code> (${len} letters ✗ - should be 9-10)
                <ul style="margin:8px 0 0 0; padding-left:20px; list-style:none;">
                  <li>• <code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(lang)}</code> - Language (2 letters) ${langStatus}</li>
                  <li>• <code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(loc)}</code> - Location (2 letters) ${locStatus}</li>
                  <li>• <code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(studio)}</code> - Studio (2 letters) ${studioStatus}</li>
                  <li>• <code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(initials || '??')}</code> - Talent initials ${initialsNote}</li>
                </ul>
              </div>`;
          }
          
          // Helper to check if speaker ID length is valid
          function isValidLength(letters) {
            return letters.length >= 9 && letters.length <= 10;
          }
          
          let breakdown = '';
          let exampleText = '';
          
          // Try dual character format first: speaker1-speaker2XXXX_
          const dualLooseMatch = sessionName.match(/^([a-z]+)-([a-z]+)(\d*)_/i);
          if (dualLooseMatch) {
            const speaker1 = dualLooseMatch[1];
            const speaker2 = dualLooseMatch[2];
            
            // Only show breakdown for invalid speaker(s)
            if (!isValidLength(speaker1)) {
              breakdown += analyzeSpeakerId(speaker1, 'Speaker 1 (Left)');
            }
            if (!isValidLength(speaker2)) {
              breakdown += analyzeSpeakerId(speaker2, 'Speaker 2 (Right)');
            }
            exampleText = 'Example: <code>engblycli-engblymjan0001_t1lt2r-dualcharacter001</code>';
          } else {
            // Try single character format: speakerXXXX_
            const singleLooseMatch = sessionName.match(/^([a-z]+)(\d*)_/i);
            if (singleLooseMatch) {
              const letters = singleLooseMatch[1];
              if (!isValidLength(letters)) {
                breakdown = analyzeSpeakerId(letters, 'Speaker ID');
              }
              exampleText = 'Example: <code>engblycli0001_singlecharacter001</code>';
            }
          }
          
          sessionError.innerHTML = `
            <strong>INVALID SESSION NAME FORMAT</strong><br>
            Speaker ID must be 9-10 lowercase letters followed by 4 digits.
            ${breakdown}
            <div style="margin-top:12px; font-size:13px; color:#666;">
              ${exampleText}
            </div>`;
          sessionError.style.display = "block";
          output.innerHTML = "";
          return;
        }

        
        // Strict Speaker ID validation: 9 or 10 letters + 4 digits
        let sessionNameHasError = false;
        (function(){
          try {
            const singleRe = /^([a-z]{9,10})(\d{4})_/;
            const dualRe   = /^([a-z]{9,10})-([a-z]{9,10})(\d{4})_(t1lt2r|t2lt1r)-/;
            
            const singleMatch = sessionName.match(singleRe);
            const dualMatch = sessionName.match(dualRe);
            
            if (!singleMatch && !dualMatch) {
              sessionDisplay.className = "session-name bad";
              
              // Try to extract and analyze what's there
              const looseMatch = sessionName.match(/^([a-z]+)(\d*)_/i);
              let breakdown = '';
              
              if (looseMatch) {
                const letters = looseMatch[1];
                const digits = looseMatch[2];
                const len = letters.length;
                
                // Break down the speaker ID components
                const lang = letters.substring(0, 2) || '??';
                const loc = letters.substring(2, 4) || '??';
                const studio = letters.substring(4, 6) || '??';
                const initials = letters.substring(6) || '??';
                const initialsLen = initials.length;
                
                const langStatus = lang.length === 2 ? '✓' : '✗';
                const locStatus = loc.length === 2 ? '✓' : '✗';
                const studioStatus = studio.length === 2 ? '✓' : '✗';
                const initialsStatus = (initialsLen >= 3 && initialsLen <= 4) ? '✓' : '✗';
                const initialsNote = initialsLen < 3 ? `(${initialsLen} letters) ✗ Too short` : 
                                     initialsLen > 4 ? `(${initialsLen} letters) ✗ Should be 3-4 letters` : 
                                     `(${initialsLen} letters) ✓`;
                
                breakdown = `
                  <div style="margin-top:12px; text-align:left; padding:12px; background:rgba(0,0,0,0.05); border-radius:8px;">
                    <strong>Speaker ID Breakdown:</strong> <code>${esc(letters)}</code> (${len} letters - should be 9-10)
                    <ul style="margin:8px 0 0 0; padding-left:20px; list-style:none;">
                      <li><code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(lang)}</code> - Language (2 letters) ${langStatus}</li>
                      <li><code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(loc)}</code> - Location (2 letters) ${locStatus}</li>
                      <li><code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(studio)}</code> - Studio (2 letters) ${studioStatus}</li>
                      <li><code style="background:#fef3c7; padding:2px 6px; border-radius:3px;">${esc(initials)}</code> - Talent initials ${initialsNote}</li>
                    </ul>
                  </div>`;
              }
              
              sessionError.innerHTML = `
                <strong>SESSION NAME: Speaker ID must be 9-10 lowercase letters followed by 4 digits.</strong>
                ${breakdown}
                <div style="margin-top:12px; font-size:13px; color:#666;">
                  Example: <code>engblycli0001</code> or <code>enxxstnnnn0001</code>
                </div>`;
              sessionError.style.display = "block";
              output.innerHTML = "";
              sessionNameHasError = true;
              return;
            }
            
            // For dual character: first 6 characters of both speaker IDs must match
            if (dualMatch) {
              const speaker1 = dualMatch[1];
              const speaker2 = dualMatch[2];
              const prefix1 = speaker1.substring(0, 6);
              const prefix2 = speaker2.substring(0, 6);
              
              if (prefix1 !== prefix2) {
                sessionDisplay.className = "session-name bad";
                const msg = `SESSION NAME: First 6 characters of both Speaker IDs must match (same language+location+studio). Found: '${prefix1}' and '${prefix2}'.`;
                sessionError.innerHTML = (sessionError.innerHTML ? sessionError.innerHTML + "<br>" : "") + msg;
                sessionError.style.display = "block";
                output.innerHTML = "";
                sessionNameHasError = true;
                return;
              }
              
              // Speaker IDs must be in alphabetical order
              if (speaker1.toLowerCase() > speaker2.toLowerCase()) {
                sessionDisplay.className = "session-name bad";
                const correctedSessionName = sessionName.replace(
                  new RegExp(`^${speaker1}-${speaker2}`, 'i'),
                  `${speaker2}-${speaker1}`
                ).toLowerCase();
                sessionError.innerHTML = `
                  <strong>SESSION NAME: Speaker IDs must be in alphabetical order.</strong><br>
                  '${speaker1}' should come after '${speaker2}'
                  <div class="should-be" style="margin-top:12px;">Should Be:</div>
                  <div class="should-be-container">
                    <div class="should-be-box">
                      <code id="text-copy-speaker-order">${esc(correctedSessionName)}</code>
                    </div>
                    <button class="copy-btn" id="btn-copy-speaker-order" onclick="copyToClipboard('text-copy-speaker-order', 'btn-copy-speaker-order')" title="Copy to clipboard"></button>
                  </div>`;
                sessionError.style.display = "block";
                output.innerHTML = "";
                sessionNameHasError = true;
                return;
              }
            }
          } catch(e) { /* fail-safe */ }
        })();
        
        if (sessionNameHasError) return;

        // Check orientation matches first marker track
        const parsedMarkersForCheck = parseMarkersSection(lines);
        if (!parsedMarkersForCheck.err && parsedMarkersForCheck.data && parsedMarkersForCheck.data.length > 0) {
          // Find line0001 marker
          const firstMarker = parsedMarkersForCheck.data.find(m => {
            const extracted = extractMarker(m.name);
            return extracted.token === 'line' && extracted.num === 1;
          });
          
          if (firstMarker && firstMarker.track) {
            // Extract orientation from session name (t1lt2r or t2lt1r, or invalid variants)
            const sessionOrientation = /t2lt1r/i.test(sessionName) ? 't2lt1r' : 
                                       /t1lt2r/i.test(sessionName) ? 't1lt2r' : null;
            
            // Check for invalid orientation codes (R before L)
            const invalidOrientation = /t1rt2l|t2rt1l/i.test(sessionName);
            
            const firstMarkerTrack = firstMarker.track;
            let expectedOrientation = null;
            
            if (firstMarkerTrack.startsWith('Left_Talent 1') || firstMarkerTrack.toLowerCase().includes('left')) {
              expectedOrientation = 't1lt2r';
            } else if (firstMarkerTrack.startsWith('Right_Talent 2') || firstMarkerTrack.toLowerCase().includes('right')) {
              expectedOrientation = 't2lt1r';
            }
            
            // Handle invalid orientation codes OR mismatched valid codes
            if (expectedOrientation && (invalidOrientation || (sessionOrientation && sessionOrientation !== expectedOrientation))) {
              sessionDisplay.className = "session-name bad";
              const actualTrack = firstMarkerTrack.includes('Left') || firstMarkerTrack.includes('left') ? 'LEFT' : 'RIGHT';
              // Build corrected session name by replacing any orientation code pattern
              const correctedSessionName = sessionName.replace(/t1lt2r|t2lt1r|t1rt2l|t2rt1l/i, expectedOrientation).toLowerCase();
              sessionError.innerHTML = `
                <strong>SESSION NAME orientation mismatch:</strong><br>
                1st Turn is on ${actualTrack} TRACK, session name should be ${expectedOrientation}
                <div class="should-be" style="margin-top:12px;">Should Be:</div>
                <div class="should-be-container">
                  <div class="should-be-box">
                    <code id="text-copy-session-fix">${esc(correctedSessionName)}</code>
                  </div>
                  <button class="copy-btn" id="btn-copy-session-fix" onclick="copyToClipboard('text-copy-session-fix', 'btn-copy-session-fix')" title="Copy to clipboard"></button>
                </div>`;
              sessionError.style.display = "block";
              output.innerHTML = "";
              return;
            }
          }
        }

const tracks = parseTracks(lines);
        const online = parseOnlineFiles(lines);
        
        // Check for missing required sections
        const missingTrackListing = tracks.length === 0;
        const missingOnlineFiles = online.err && online.err.includes("Couldn't find");
        
        if (missingTrackListing || missingOnlineFiles) {
          sessionError.innerHTML = `
            <strong>INCOMPLETE FILE EXPORT</strong><br><br>
            This file is missing required sections:
            <ul style="margin: 10px 0; padding-left: 20px; text-align: left;">
              ${missingTrackListing ? '<li><strong>Track Listing</strong> - needed to validate track names</li>' : ''}
              ${missingOnlineFiles ? '<li><strong>Online Files in Session</strong> - needed to validate audio file names</li>' : ''}
            </ul>
            <br>
            Please re-export from Pro Tools with all required options.<br>
            <strong>Click "Requirements" above for export instructions.</strong>
          `;
          sessionError.style.display = "block";
          output.innerHTML = "";
          return;
        }
        
        const expectedList = validateTracks(tracks, sessionInfo);
        const tracksPass = expectedList.every(e => e === null);

        const audioCheck = online.err ? {pass:false, errors:[online.err]} : checkAudioFiles(sessionInfo, tracks, online.rows);
        const audioPass = !online.err && audioCheck.pass;

        const parsedMarkers = parseMarkersSection(lines);
        const markerErrors = parsedMarkers.err
          ? [parsedMarkers.err]
          : validateMarkers(
              parsedMarkers.data.map(d => ({ ...extractMarker(d.name), line: d.line, track: d.track, units: d.units })),
              sessionInfo,
              tracks
            );
        const markersPass = markerErrors.length === 0;

        const bounced = online.err ? {pass:false, errors:[online.err]} : checkBouncedFiles(sessionName, online.rows);
        const bouncedPass = !online.err && bounced.pass;

        output.innerHTML =
          renderAudioFilesSection(online, audioCheck) +
          renderTracksSection(tracks, expectedList) +
          renderMarkersReport(markerErrors) +
          renderBouncedSection(sessionName, online, bounced);

        if (tracksPass && markersPass && bouncedPass && audioPass) {
          setTimeout(triggerParty, 300);
        }
      }

      drop.addEventListener('dragover', e => {
        e.stopPropagation();
        e.preventDefault();
        drop.classList.add('dragover');
        e.dataTransfer.dropEffect = 'copy';
      });

      drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));

      drop.addEventListener('drop', e => {
        e.stopPropagation();
        e.preventDefault();
        drop.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
      });

      drop.addEventListener('click', () => fileinput.click());

      fileinput.addEventListener('change', () => {
        if (fileinput.files[0]) handleFile(fileinput.files[0]);
      });
    })();
  </script>