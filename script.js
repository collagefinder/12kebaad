/* Collagefinder — demo + upload
   - First-visit modal collects user info and stores it in localStorage
   - Sample colleges array included for immediate demo
   - Upload CSV/JSON to add more colleges (replaces dataset in localStorage)
   - Filters by state & course (case-insensitive substring match)
*/

(() => {
  const qs = s => document.querySelector(s);
  const id = s => document.getElementById(s);

  // All Indian states + UTs
  const STATES = [
    "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
    "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
    "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
    "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
    "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi",
    "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
  ];

  // Course suggestions
  const COURSES = ["B.Com","B.A","B.Sc","B.Tech","BBA","BCA","MBA","M.Com","B.Ed","LLB","MBBS","BDS"];

  // Sample dataset (small): add or replace by uploading CSV/JSON
  let colleges = [
    { name: "Hansraj College", city: "Delhi", state: "Delhi", courses: "B.Com,B.A", fees: "₹50,000/year", cutoff: "88%", website: "https://hansraj.du.ac.in", contact: "011-2766-1234" },
    { name: "SRCC", city: "Delhi", state: "Delhi", courses: "B.Com,M.Com", fees: "₹85,000/year", cutoff: "95%", website: "https://srcc.edu", contact: "011-2766-9999" },
    { name: "St. Xavier's College", city: "Mumbai", state: "Maharashtra", courses: "B.Com,B.A", fees: "₹60,000/year", cutoff: "86%", website: "https://xaviers.edu", contact: "022-1234-5678" },
    { name: "Christ University", city: "Bengaluru", state: "Karnataka", courses: "B.Com,BBA,BCA", fees: "₹90,000/year", cutoff: "83%", website: "https://christuniversity.in", contact: "080-2248-1234" },
    { name: "Loyola College", city: "Chennai", state: "Tamil Nadu", courses: "B.Com,B.Sc", fees: "₹45,000/year", cutoff: "84%", website: "https://loyolacollege.edu", contact: "044-1234-5678" },
    { name: "Hansraj Commerce Campus", city: "Jaipur", state: "Rajasthan", courses: "B.Com", fees: "₹30,000/year", cutoff: "75%", website: "", contact: "" }
  ];

  // DOM refs
  const welcomeModal = id('welcomeModal');
  const welcomeForm = id('welcomeForm');
  const skipBtn = id('skipBtn');
  const userName = id('userName');
  const userState = id('userState');
  const userMobile = id('userMobile');
  const userCourse = id('userCourse');

  const stateSelect = id('stateSelect');
  const courseInput = id('courseInput');
  const courseList = id('courseList');
  const searchBtn = id('searchBtn');
  const showAllBtn = id('showAllBtn');
  const cards = id('cards');
  const resultsTitle = id('resultsTitle');
  const greeting = id('greeting');
  const savedInfo = id('savedInfo');
  const editInfo = id('editInfo');
  const uploadBtn = id('uploadBtn');
  const fileInput = id('fileInput');
  const noResults = id('noResults');
  const downloadUser = id('downloadUser');
  const resetBtn = id('resetBtn');

  const USER_KEY = 'collagefinder_user';
  const COL_KEY = 'collagefinder_colleges';

  // populate selects
  function populateStateSelects() {
    const frag = document.createDocumentFragment();
    STATES.forEach(s => {
      const opt = document.createElement('option'); opt.value = s; opt.textContent = s;
      frag.appendChild(opt);
    });
    userState.appendChild(frag.cloneNode(true));
    stateSelect.appendChild(frag);
  }
  function populateCourses() {
    COURSES.forEach(c => {
      const opt = document.createElement('option'); opt.value = c; opt.textContent = c;
      courseList.appendChild(opt);
    });
  }

  // load/store
  function saveUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  function loadUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e){return null} }
  function saveColleges(data){ localStorage.setItem(COL_KEY, JSON.stringify(data)); }
  function loadColleges(){ try { return JSON.parse(localStorage.getItem(COL_KEY)); } catch(e){ return null } }

  // rendering
  function renderSavedInfo(user) {
    if (!user) {
      savedInfo.innerHTML = `<div class="muted small">No saved user info.</div>`;
      greeting.textContent = 'Welcome to Collagefinder! 🎉';
      return;
    }
    savedInfo.innerHTML = `<strong>${escapeHtml(user.name)}</strong><div class="muted small">${escapeHtml(user.state)} • ${escapeHtml(user.course)}</div><div class="muted small">📱 ${escapeHtml(user.mobile)}</div>`;
    greeting.textContent = `Hi ${user.name.split(' ')[0] || user.name} 👋`;
  }

  function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function renderCards(list) {
    cards.innerHTML = '';
    if (!list || list.length === 0) {
      noResults.style.display = 'block';
      resultsTitle.textContent = 'Colleges';
      return;
    }
    noResults.style.display = 'none';
    resultsTitle.textContent = `Colleges (${list.length})`;
    const frag = document.createDocumentFragment();
    list.forEach(c => {
      const div = document.createElement('article');
      div.className = 'college-card';
      const courses = (c.courses||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,6).join(', ');
      div.innerHTML = `
        <h3>${escapeHtml(c.name)}</h3>
        <div class="muted small">${escapeHtml(c.city || '')}, ${escapeHtml(c.state || '')}</div>
        <p style="margin:8px 0" title="${escapeHtml(courses)}"><span class="badge course">${escapeHtml(courses || 'Courses')}</span> <span class="badge state">${escapeHtml(c.state || '')}</span></p>
        <p class="small"><strong>Fees:</strong> ${escapeHtml(c.fees || 'N/A')} · <strong>Cutoff:</strong> ${escapeHtml(c.cutoff || 'N/A')}</p>
        <p class="muted small">${escapeHtml(c.contact || '')} ${c.website ? ' · ' + `<a href="${escapeHtml(c.website)}" target="_blank">Website</a>` : ''}</p>
      `;
      frag.appendChild(div);
    });
    cards.appendChild(frag);
  }

  // filtering
  function filterCollegesBy(state, course) {
    const data = loadColleges() || colleges;
    const stateNorm = (state||'').trim().toLowerCase();
    const courseNorm = (course||'').trim().toLowerCase();
    return data.filter(c => {
      const cstate = (c.state||'').toLowerCase();
      const ccourses = (c.courses||'').toLowerCase();
      const matchState = !stateNorm || cstate === stateNorm || cstate.includes(stateNorm);
      const matchCourse = !courseNorm || ccourses.includes(courseNorm);
      return matchState && matchCourse;
    });
  }

  // CSV parsing (simple)
  function parseCSV(text) {
    const rows = [];
    const lines = text.split(/\r?\n/).filter(l=>l.trim() !== '');
    if (lines.length === 0) return [];
    const headers = splitCSVLine(lines[0]).map(h=>h.trim().toLowerCase());
    for (let i=1;i<lines.length;i++){
      const row = splitCSVLine(lines[i]);
      if (row.length === 0) continue;
      const obj = {};
      headers.forEach((h, idx) => obj[h] = (row[idx] || '').trim());
      rows.push(obj);
    }
    return rows;
  }
  function splitCSVLine(line) {
    const res = [];
    let cur = '', inQuotes = false;
    for (let i=0;i<line.length;i++){
      const ch = line[i];
      if (ch === '"' ) {
        if (inQuotes && line[i+1] === '"') { cur += '"'; i++; continue; }
        inQuotes = !inQuotes; continue;
      }
      if (ch === ',' && !inQuotes) { res.push(cur); cur = ''; continue; }
      cur += ch;
    }
    res.push(cur);
    return res;
  }

  // normalize keys
  function normalizeObj(r){
    const low = {};
    for (const k in r) low[k.trim().toLowerCase()] = r[k];
    return {
      name: low.name || low.college || '',
      city: low.city || '',
      state: low.state || '',
      courses: low.courses || low.course || '',
      fees: low.fees || '',
      cutoff: low.cutoff || '',
      website: low.website || '',
      contact: low.contact || ''
    };
  }

  // file handling
  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      let parsed = null;
      if (file.name.toLowerCase().endsWith('.json')) {
        try { parsed = JSON.parse(text); }
        catch(err){ alert('Invalid JSON file.'); return; }
      } else {
        parsed = parseCSV(text);
      }
      const normalized = parsed.map(r => normalizeObj(r));
      if (normalized.length === 0) {
        alert('No records found in file.');
        return;
      }
      saveColleges(normalized);
      alert('Dataset loaded: ' + normalized.length + ' records. Use filters to find colleges.');
      renderCards(normalized.slice(0,200));
    }
    reader.readAsText(file);
  }

  // events
  welcomeForm.addEventListener('submit', (ev)=> {
    ev.preventDefault();
    const u = { name: userName.value.trim(), state: userState.value, mobile: userMobile.value.trim(), course: userCourse.value.trim() };
    saveUser(u);
    renderSavedInfo(u);
    welcomeModal.style.display = 'none';
  });
  skipBtn.addEventListener('click', ()=> welcomeModal.style.display = 'none');

  editInfo && editInfo.addEventListener('click', ()=> {
    const u = loadUser();
    if (u) {
      userName.value = u.name || '';
      userState.value = u.state || STATES[0];
      userMobile.value = u.mobile || '';
      userCourse.value = u.course || '';
    }
    welcomeModal.style.display = 'flex';
  });

  searchBtn.addEventListener('click', ()=> {
    const s = stateSelect.value;
    const c = courseInput.value;
    const res = filterCollegesBy(s, c);
    if (res.length === 0) {
      noResults.style.display = 'block';
    } else {
      renderCards(res);
    }
  });

  showAllBtn.addEventListener('click', ()=> {
    const data = loadColleges() || colleges;
    renderCards(data.slice(0,200));
  });

  uploadBtn.addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', (ev)=> {
    const f = ev.target.files[0];
    if (!f) return;
    handleFile(f);
    fileInput.value = '';
  });

  downloadUser.addEventListener('click', ()=> {
    const u = loadUser();
    const data = u ? [u] : [];
    const csv = arrayToCSV(data);
    downloadBlob(csv, 'users.csv', 'text/csv');
  });

  resetBtn.addEventListener('click', ()=> {
    if (!confirm('This will clear saved user info and uploaded dataset from this browser. Continue?')) return;
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COL_KEY);
    alert('Cleared. Reloading...');
    location.reload();
  });

  // utilities
  function arrayToCSV(arr){
    if (!arr || arr.length === 0) return '';
    const keys = Object.keys(arr[0]);
    const rows = [keys.join(',')];
    arr.forEach(obj=>{
      rows.push(keys.map(k => `"${(obj[k]||'').replace(/"/g,'""')}"`).join(','));
    });
    return rows.join('\n');
  }
  function downloadBlob(text, filename, mime){
    const blob = new Blob([text], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  // init
  function init() {
    populateStateSelects();
    populateCourses();
    const stored = loadColleges();
    if (stored && stored.length > 0) colleges = stored;
    const user = loadUser();
    if (!user) {
      welcomeModal.style.display = 'flex';
      userState.value = STATES[0];
    } else {
      welcomeModal.style.display = 'none';
      renderSavedInfo(user);
      stateSelect.value = user.state || '';
      courseInput.value = user.course || '';
    }
    renderCards(colleges.slice(0, 50));
  }

  init();

})();