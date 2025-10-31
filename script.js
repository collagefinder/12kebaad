/* script.js — client side behavior for index, courses, colleges, about pages
   NOTE: This site intentionally does NOT persist student data.
   Data is passed between pages using URL query parameters (no localStorage).
*/

/* ---------- Utility helpers ---------- */
function qsel(s, root = document) { return root.querySelector(s); }
function qall(s, root = document) { return Array.from((root||document).querySelectorAll(s)); }
function setYear() { const y = new Date().getFullYear(); qall('#year').forEach(e => e.textContent = y); }
function encodeParams(obj) {
  return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');
}
function parseQuery() {
  const s = location.search.replace(/^\?/,'');
  if (!s) return {};
  return s.split('&').reduce((acc, pair) => {
    const [k,v] = pair.split('=').map(decodeURIComponent);
    acc[k] = v; return acc;
  }, {});
}

/* ---------- Shared dataset (sample) ---------- */
const streamCourses = {
  science: ['BSc (General)', 'BSc (Hons) — Physics', 'BSc (Hons) — Chemistry', 'BTech / BE', 'BPharm', 'BSc Nursing', 'Diploma — Lab Tech'],
  commerce: ['BCom', 'BCom (Hons)', 'BBA', 'BA Economics', 'Diploma — Accounting & Taxation'],
  arts: ['BA (Honours)', 'BA (General)', 'BFA', 'BJMC', 'Diploma — Journalism'],
  engineering: ['BTech / BE', 'Diploma — Polytechnic (Engg)'],
  medical: ['MBBS', 'BDS', 'BPharm', 'BSc Nursing'],
  vocational: ['ITI courses', 'Diploma — Hospitality', 'Skill-based short courses']
};

const colleges = [
  { name: 'National Institute of Technology, Example', streams:['engineering'], courses:['BTech / BE'], fees:120000, location:'City A, State X', cutoff:'High (rising)', admission:'JEE Main' },
  { name: 'Example Government Medical College', streams:['medical','science'], courses:['MBBS','BSc Nursing'], fees:150000, location:'City B, State Y', cutoff:'Very High', admission:'NEET' },
  { name: 'City Arts & Science College', streams:['arts','science'], courses:['BA (Honours)','BSc (General)'], fees:20000, location:'City C, State Z', cutoff:'Moderate', admission:'12th Marks' },
  { name: 'Commerce College of India', streams:['commerce'], courses:['BCom','BBA'], fees:30000, location:'City D, State X', cutoff:'Moderate', admission:'12th Marks' },
  { name: 'Private Engineering Institute', streams:['engineering'], courses:['BTech / BE'], fees:220000, location:'City E, State Y', cutoff:'Stable', admission:'JEE Main / College Test' },
  { name: 'Polytechnic Institute', streams:['engineering','vocational'], courses:['Diploma — Polytechnic (Engineering)','ITI courses'], fees:15000, location:'Town F, State Z', cutoff:'Low', admission:'10th / Diploma entry' },
  { name: 'National University Example', streams:['arts','commerce','science'], courses:['BA (Honours)','BCom (Hons)','BSc (Hons) — Physics'], fees:45000, location:'Metro G, State X', cutoff:'Rising', admission:'CUET / 12th Marks' }
];

/* ---------- Page-specific behavior ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  const page = document.body.dataset.page || document.location.pathname.split('/').pop().split('.').shift();

  // Common: show query params if present
  const params = parseQuery();

  // INDEX (welcome) page
  if (document.getElementById('welcome-form')) {
    const form = qsel('#welcome-form');
    const err = qsel('#form-error');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      err.textContent = '';

      const name = qsel('#name').value.trim();
      const mobile = qsel('#mobile').value.trim();
      const stream = qsel('#stream').value;
      const state = qsel('#state').value;

      if (!name || name.length < 2) { err.textContent = 'Please enter your full name (2+ characters).'; return; }
      if (!/^\d{10,15}$/.test(mobile)) { err.textContent = 'Please enter a valid mobile number (10-15 digits).'; return; }
      if (!stream) { err.textContent = 'Select a stream.'; return; }
      if (!state) { err.textContent = 'Select a state/UT.'; return; }

      // pass inputs via URL to courses page (no storage)
      const qs = encodeParams({ name, mobile, stream, state });
      location.href = `courses.html?${qs}`;
    });
  }

  // COURSES page
  if (document.getElementById('courses-grid')) {
    const grid = qsel('#courses-grid');
    const intro = qsel('#intro-text');
    const welcome = qsel('#welcome-msg');
    const toColleges = qsel('#to-colleges');

    const name = params.name ? decodeURIComponent(params.name) : '';
    const stream = params.stream || '';
    const state = params.state || '';

    welcome.textContent = stream ? `${capitalize(stream)} — Recommended Courses` : 'Courses & Diplomas';
    intro.textContent = name ? `Hello ${name}${state ? ' from ' + state : ''}. Choose a course to see colleges offering it.` : 'Choose a stream on the Home page to get personalized results.';

    // populate courses
    grid.innerHTML = '';
    const list = streamCourses[stream] || [];
    if (!list.length) {
      grid.innerHTML = '<p class="muted">No courses available for the selected stream. Try another stream from Home.</p>';
    } else {
      list.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `<h4>${course}</h4><p class="muted">Learn more about ${course} — click to view colleges.</p><div class="mt-12"><button class="btn-ghost select-course" data-course="${encodeURIComponent(course)}">View Colleges</button></div>`;
        grid.appendChild(card);
      });

      // wire buttons
      qall('.select-course', grid).forEach(btn => {
        btn.addEventListener('click', () => {
          const course = decodeURIComponent(btn.dataset.course);
          // forward params + selected course to colleges page
          const qs = encodeParams(Object.assign({}, params, { course }));
          location.href = `colleges.html?${qs}`;
        });
      });
    }

    // when user clicks the top "View Colleges" (without selecting a specific course)
    toColleges.addEventListener('click', (e) => {
      e.preventDefault();
      const qs = encodeParams(params);
      location.href = `colleges.html?${qs}`;
    });
  }

  // COLLEGES page
  if (document.getElementById('colleges-list')) {
    const listEl = qsel('#colleges-list');
    const intro = qsel('#colleges-intro');
    const filterCourse = qsel('#filter-course');
    const filterFee = qsel('#filter-fee');
    const filterAdmission = qsel('#filter-admission');
    const apply = qsel('#apply-filter');
    const reset = qsel('#reset-filter');

    const name = params.name ? decodeURIComponent(params.name) : '';
    const stream = params.stream || '';
    const selectedCourse = params.course ? decodeURIComponent(params.course) : '';

    intro.textContent = name ? `Hi ${name}. Showing colleges for ${stream ? capitalize(stream) : 'your chosen stream'}${selectedCourse ? ' — ' + selectedCourse : ''}.` : 'Browse colleges by course, fees, and admission basis.';

    // populate course filter based on available courses in dataset and selected stream
    const possibleCourses = new Set();
    colleges.forEach(c => {
      if (!stream || c.streams.includes(stream)) {
        c.courses.forEach(cc => possibleCourses.add(cc));
      }
    });
    filterCourse.innerHTML = '<option value="">All</option>';
    Array.from(possibleCourses).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      if (c === selectedCourse) opt.selected = true;
      filterCourse.appendChild(opt);
    });

    function renderColleges() {
      const courseFilter = filterCourse.value || '';
      const feeMax = Number(filterFee.value) || Infinity;
      const admFilter = filterAdmission.value || '';

      let filtered = colleges.filter(c => !stream || c.streams.includes(stream));
      if (courseFilter) {
        filtered = filtered.filter(c => c.courses.some(cc => cc.toLowerCase().includes(courseFilter.toLowerCase())));
      }
      if (isFinite(feeMax)) filtered = filtered.filter(c => c.fees <= feeMax);
      if (admFilter) filtered = filtered.filter(c => c.admission === admFilter);

      listEl.innerHTML = '';
      if (!filtered.length) {
        listEl.innerHTML = '<p class="muted">No colleges match your filters. Try widening the filters or go back to Courses.</p>';
        return;
      }

      filtered.forEach(col => {
        const card = document.createElement('div');
        card.className = 'college-card';
        card.innerHTML = `
          <h4>${col.name}</h4>
          <div class="college-meta"><strong>Location:</strong> ${col.location} • <strong>Fees:</strong> ₹${num(col.fees)}</div>
          <div class="college-meta"><strong>Admission:</strong> ${col.admission} • <strong>Cutoff:</strong> ${col.cutoff}</div>
          <div class="muted small"><strong>Courses:</strong> ${col.courses.join(', ')}</div>
          <div class="mt-12"><button class="btn-ghost view-detail">View Details</button></div>
        `;
        // on view detail: show quick modal using alert (simple)
        card.querySelector('.view-detail').addEventListener('click', () => {
          alert(`${col.name}\n\nLocation: ${col.location}\nFees (annual): ₹${num(col.fees)}\nAdmission: ${col.admission}\nCutoff trend: ${col.cutoff}\nCourses: ${col.courses.join(', ')}`);
        });
        listEl.appendChild(card);
      });
    }

    apply.addEventListener('click', renderColleges);
    reset.addEventListener('click', () => { filterCourse.value=''; filterFee.value=''; filterAdmission.value=''; renderColleges(); });

    // preapply selected course from URL
    if (selectedCourse) {
      // if selectedCourse matches an option, keep it; else add to filter dropdown
      if (![...filterCourse.options].some(o => o.value === selectedCourse)) {
        const o = document.createElement('option'); o.value = selectedCourse; o.textContent = selectedCourse; o.selected = true;
        filterCourse.appendChild(o);
      }
    }

    renderColleges();
  }

}); // DOMContentLoaded

/* ---------- small helpers ---------- */
function capitalize(s=''){ return s.charAt(0).toUpperCase() + s.slice(1); }
function num(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }