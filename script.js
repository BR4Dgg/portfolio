// Education Section Dropdown Toggle
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const arrow = document.getElementById(sectionId + '-arrow');
    
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        // Close the section
        content.style.maxHeight = '0px';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        // Open the section
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
        // Delete characters
        logoText.textContent = currentCommand.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typingSpeed = 50;
    } else {
        // Type characters
        logoText.textContent = currentCommand.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingSpeed = 100;
    }

    // Check if word is complete
    if (!isDeleting && currentCharIndex === currentCommand.length) {
        // Pause at end of word
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && currentCharIndex === 0) {
        // Move to next word
        isDeleting = false;
        currentCommandIndex = (currentCommandIndex + 1) % commands.length;
        typingSpeed = 500;
    }

    setTimeout(typeCommand, typingSpeed);
}

// Start typing animation when page loads
document.addEventListener('DOMContentLoaded', function() {
    typeCommand();
    
    // Update latest report link
    const reportLink = document.getElementById('latest-report-link');
    if (reportLink) {
        reportLink.href = 'https://github.com/BR4Dgg/portfolio/blob/main/reports/seo-poisoning-edu-compromise.md';
    }
});
