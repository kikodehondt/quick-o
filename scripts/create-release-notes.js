const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Get the latest tag (excluding the one we just made if running in workflow, but let's assume we sort by time)
    // Actually, in the workflow, we just bumped the version.
    // We want commits between the PREVIOUS tag and the CURRENT HEAD (minus the bump commit).

    // 1. Get current version from package.json
    const version = require('../package.json').version;

    // 2. Get the list of commits.
    // We try to find the *previous* tag.
    let prevTag = '';
    try {
        // List tags, sort by version or date, take the 2nd most recent? 
        // Easier: git describe --tags --abbrev=0 HEAD^ (the tag before the current one)
        prevTag = execSync('git describe --tags --abbrev=0 HEAD^').toString().trim();
    } catch (e) {
        // If no previous tag, just log everything
        prevTag = '';
    }

    const range = prevTag ? `${prevTag}..HEAD` : 'HEAD';

    // Format: Hash|Subject|Body
    // %h = short hash, %s = subject, %b = body
    const logs = execSync(`git log ${range} --pretty=format:"%h|%s|%b" --no-merges`).toString().trim();

    const lines = logs.split('\n');

    let formattedChanges = [];

    for (const line of lines) {
        if (!line) continue;
        const parts = line.split('|');
        const hash = parts[0];
        const subject = parts[1];
        const body = parts.slice(2).join('|').trim(); // handle delimiter in body if any

        // Ignore the release commit itself
        if (subject.startsWith('chore(release):')) continue;
        if (subject.includes('[skip ci]')) continue;

        let item = `### ${subject}\n`;
        if (body) {
            item += `\n${body}\n`;
        }
        formattedChanges.push(item);
    }

    // Construct the message
    let message = `# 🚀 Nieuwe Update: v${version}\n\n`;
    message += `Er staan weer verbeteringen voor je klaar in Quick-O!\n\n`;

    if (formattedChanges.length > 0) {
        message += `## ✨ Wat is er veranderd?\n\n`;
        message += formattedChanges.join('\n');
    } else {
        message += `_Kleine optimalisaties en verbeteringen._\n`;
    }

    message += `\n---\n*Automatisch gegenereerd door Quick-O Release Bot*`;

    console.log(message);

    // Write to file for the action to use
    fs.writeFileSync('RELEASE_NOTES.md', message);

} catch (error) {
    console.error('Error generating notes:', error);
    process.exit(1);
}
