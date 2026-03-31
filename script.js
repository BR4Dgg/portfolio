// Education Section Dropdown Toggle
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const arrow = document.getElementById(sectionId + '-arrow');
    
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = '0px';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
    }
}

// Animated Terminal Logo
const commands = [
    'whoami',
    'ls -la',
    'cat /etc/passwd',
    'sudo su',
    'pwd',
    'ps aux',
    'netstat -an',
    'ifconfig',
    'chmod 777',
    'grep -r',
    'find /',
    'top',
    'htop',
    'vim ~/.bashrc',
    'git status',
    'docker ps',
    'kubectl get pods',
    'nmap -sV',
    './exploit.sh',
    'ssh root@',
    'tail -f /var/log',
    'iptables -L',
    'systemctl status'
];

let currentCommandIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function typeCommand() {
    const logoText = document.getElementById('logo-text');
    if (!logoText) return;

    const currentCommand = commands[currentCommandIndex];

    if (isDeleting) {
        logoText.textContent = currentCommand.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typingSpeed = 50;
    } else {
        logoText.textContent = currentCommand.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingSpeed = 100;
    }

    if (!isDeleting && currentCharIndex === currentCommand.length) {
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentCommandIndex = (currentCommandIndex + 1) % commands.length;
        typingSpeed = 500;
    }

    setTimeout(typeCommand, typingSpeed);
}

// Convert a report filename into a readable title and date
// Expected naming convention: some-title-words-monthDD-YYYY.md
// Examples:
//   agentic-memory-poisoning-march31-2026.md
//   seanpi-hardening-march14-2026.md
//   seo-poisoning-edu-compromise.md (no date = falls to end)
function parseReport(filename) {
    const name = filename.replace(/\.md$/i, '');

    // Try to extract a date suffix like -march31-2026 or -march-14-2026
    const datePattern = /-([a-z]+)(\d{1,2})-(\d{4})$/i;
    const match = name.match(datePattern);

    let dateObj = null;
    let displayDate = null;
    let titleSlug = name;

    if (match) {
        const monthStr = match[1];
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        const months = {
            jan: 0, feb: 1, mar: 2, march: 2, apr: 3, april: 3,
            may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7,
            sep: 8, sept: 8, oct: 9, nov: 10, dec: 11
        };

        const monthNum = months[monthStr.toLowerCase()];
        if (monthNum !== undefined) {
            dateObj = new Date(year, monthNum, day);
            displayDate = dateObj.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        }

        // Strip the date suffix from the title slug
        titleSlug = name.slice(0, name.length - match[0].length);
    }

    // Convert slug to title: replace hyphens with spaces, title-case each word
    const title = titleSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return { title, displayDate, dateObj };
}

// Auto-update the Latest Report banner from GitHub
async function updateReportBanner() {
    const REPO = 'BR4Dgg/portfolio';
    const BRANCH = 'main';
    const FOLDER = 'reports';
    const API_URL = `https://api.github.com/repos/${REPO}/contents/${FOLDER}?ref=${BRANCH}`;

    const link = document.getElementById('latest-report-link');
    const titleEl = document.getElementById('latest-report-title');
    const dateEl = document.getElementById('latest-report-date');

    if (!link || !titleEl || !dateEl) return;

    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('GitHub API error');

        const files = await res.json();

        // Filter to .md files only
        const reports = files.filter(f => f.name.endsWith('.md'));

        if (reports.length === 0) return;

        // Sort: files with a parsed date go first (newest first),
        // files without a date go to the end
        reports.sort((a, b) => {
            const pa = parseReport(a.name);
            const pb = parseReport(b.name);
            if (pa.dateObj && pb.dateObj) return pb.dateObj - pa.dateObj;
            if (pa.dateObj) return -1;
            if (pb.dateObj) return 1;
            return b.name.localeCompare(a.name);
        });

        const latest = reports[0];
        const { title, displayDate } = parseReport(latest.name);

        titleEl.textContent = title;
        dateEl.textContent = displayDate ? `Latest Security Research • ${displayDate}` : 'Latest Security Research';
        link.href = `https://github.com/${REPO}/blob/${BRANCH}/${FOLDER}/${latest.name}`;

    } catch (err) {
        console.warn('Could not fetch latest report:', err);
        // Fall back to hardcoded latest rather than leaving "Loading..."
        titleEl.textContent = 'Agentic Memory Poisoning — RAG Pipeline Attack & Mechanistic Interpretability';
        dateEl.textContent = 'Latest Security Research \u2022 Mar 31, 2026';
        link.href = 'https://github.com/BR4Dgg/portfolio/blob/main/reports/agentic-memory-poisoning-march31-2026.md';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Obfuscated email using ASCII character codes
    const codes = [115, 101, 97, 110, 64, 109, 97, 103, 101, 101, 46, 112, 114, 111];
    const emailDisplay = document.getElementById('email-display');
    if (emailDisplay) {
        emailDisplay.textContent = String.fromCharCode(...codes);
    }

    typeCommand();
    updateReportBanner();
});
