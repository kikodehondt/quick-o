const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Get current version from package.json (without 'v' prefix)
    const version = require('../package.json').version;

    // Find the previous tag to determine commit range
    let prevTag = '';
    try {
        prevTag = execSync('git describe --tags --abbrev=0 HEAD^').toString().trim();
    } catch (e) {
        prevTag = '';
    }

    const range = prevTag ? `${prevTag}..HEAD` : 'HEAD';

    // Get commits with separator that's unlikely to appear in messages
    const separator = '|||COMMIT_SEP|||';
    const logs = execSync(`git log ${range} --pretty=format:"%s${separator}%b${separator}END" --no-merges`).toString().trim();

    const commits = logs.split('END').filter(c => c.trim());

    let features = [];
    let fixes = [];
    let other = [];

    for (const commit of commits) {
        const parts = commit.split(separator);
        const subject = (parts[0] || '').trim();
        const body = (parts[1] || '').trim();

        if (!subject) continue;
        if (subject.startsWith('chore(release):')) continue;
        if (subject.includes('[skip ci]')) continue;

        // Clean up the subject (remove conventional commit prefixes for display)
        let cleanSubject = subject
            .replace(/^feat:\s*/i, '')
            .replace(/^fix:\s*/i, '')
            .replace(/^chore:\s*/i, '')
            .replace(/^docs:\s*/i, '')
            .replace(/^refactor:\s*/i, '')
            .replace(/^perf:\s*/i, '');

        // Capitalize first letter
        cleanSubject = cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1);

        const entry = {
            title: cleanSubject,
            description: body || null
        };

        // Categorize based on conventional commit prefix
        if (subject.toLowerCase().startsWith('feat:') || subject.toLowerCase().startsWith('feature:')) {
            features.push(entry);
        } else if (subject.toLowerCase().startsWith('fix:')) {
            fixes.push(entry);
        } else {
            other.push(entry);
        }
    }

    // Build the message
    let message = `# 🎉 Versie ${version}\n\n`;
    message += `Welkom bij de nieuwste versie van Quick-O! Hieronder vind je een overzicht van de verbeteringen en aanpassingen.\n\n`;

    if (features.length > 0) {
        message += `## ✨ Nieuwe Mogelijkheden\n\n`;
        for (const f of features) {
            message += `**${f.title}**\n`;
            if (f.description) {
                message += `${f.description}\n`;
            }
            message += '\n';
        }
    }

    if (fixes.length > 0) {
        message += `## 🐛 Opgeloste Problemen\n\n`;
        for (const f of fixes) {
            message += `**${f.title}**\n`;
            if (f.description) {
                message += `${f.description}\n`;
            }
            message += '\n';
        }
    }

    if (other.length > 0) {
        message += `## 🛠️ Overige Verbeteringen\n\n`;
        for (const o of other) {
            message += `**${o.title}**\n`;
            if (o.description) {
                message += `${o.description}\n`;
            }
            message += '\n';
        }
    }

    if (features.length === 0 && fixes.length === 0 && other.length === 0) {
        message += `_Kleine optimalisaties en technische verbeteringen._\n`;
    }

    message += `\n---\n_Deze release notes zijn automatisch gegenereerd._`;

    console.log(message);
    fs.writeFileSync('RELEASE_NOTES.md', message);

} catch (error) {
    console.error('Fout bij genereren release notes:', error);
    process.exit(1);
}
