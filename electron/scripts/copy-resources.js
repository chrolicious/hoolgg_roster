#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure app-resources directory exists
const resourcesDir = path.join(__dirname, '..', 'app-resources');
if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

// Copy app.py
const appPy = path.join(__dirname, '..', '..', 'app.py');
const appPyDest = path.join(resourcesDir, 'app.py');
if (fs.existsSync(appPy)) {
    fs.copyFileSync(appPy, appPyDest);
    console.log('✓ Copied app.py');
}

// Copy app.exe
const appExe = path.join(__dirname, '..', '..', 'dist-app', 'app.exe');
const appExeDest = path.join(resourcesDir, 'app.exe');
if (fs.existsSync(appExe)) {
    fs.copyFileSync(appExe, appExeDest);
    console.log('✓ Copied app.exe');
}

// Copy templates and static folders
const templatesSrc = path.join(__dirname, '..', '..', 'templates');
const templatesDest = path.join(resourcesDir, 'templates');
if (fs.existsSync(templatesSrc)) {
    copyDirSync(templatesSrc, templatesDest);
    console.log('✓ Copied templates');
}

const staticSrc = path.join(__dirname, '..', '..', 'static');
const staticDest = path.join(resourcesDir, 'static');
if (fs.existsSync(staticSrc)) {
    copyDirSync(staticSrc, staticDest);
    console.log('✓ Copied static');
}

function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        const stat = fs.statSync(srcFile);
        if (stat.isDirectory()) {
            copyDirSync(srcFile, destFile);
        } else {
            fs.copyFileSync(srcFile, destFile);
        }
    });
}
