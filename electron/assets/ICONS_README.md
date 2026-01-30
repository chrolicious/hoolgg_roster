# Application Icons

This directory needs two icon files for the Electron app to build successfully:

## Required Icons

### 1. icon.ico - Main Application Icon
- **Size**: 256x256px (with 16, 32, 48, 128, 256 sizes embedded)
- **Format**: .ico (Windows icon format)
- **Usage**: Application icon, installer icon, taskbar icon
- **Location**: `electron/assets/icon.ico`

### 2. tray-icon.ico - System Tray Icon
- **Size**: 16x16 and 32x32px
- **Format**: .ico (Windows icon format)
- **Usage**: System tray notification area icon
- **Location**: `electron/assets/tray-icon.ico`

## How to Create Icons

### Option 1: Online Converter (Easiest)
1. Create a PNG image (256x256px for app icon, 32x32px for tray icon)
2. Visit https://icoconvert.com/
3. Upload your PNG
4. Download the generated .ico file
5. Save to this directory

### Option 2: GIMP (Free Software)
1. Download GIMP: https://www.gimp.org/
2. Create/open your image
3. Export As → Select .ico format
4. Choose sizes to include (16, 32, 48, 256)
5. Save to this directory

### Option 3: Photopea (Online Photoshop Alternative)
1. Visit https://www.photopea.com/
2. Open your image
3. File → Export As → ICO
4. Download and save to this directory

## Icon Design Tips

### App Icon (icon.ico)
- Use Hool.gg branding colors (purple #2D1B52, blue #6BB3FF)
- Should be recognizable at 16x16 (very small)
- Consider WoW-themed elements (character silhouette, shield, etc.)
- Avoid fine details that disappear at small sizes
- Test at multiple sizes to ensure clarity

### Tray Icon (tray-icon.ico)
- Must be clearly visible at 16x16px
- High contrast (will display on both light and dark taskbars)
- Simple, bold design
- Can be a simplified version of the main icon

## Placeholder Icons

Until you create custom icons, you can:

1. **Use a simple color square**: Create a solid color PNG and convert to .ico
2. **Extract from existing app**: Find a WoW-related app and use its icon as inspiration
3. **Use Windows default**: The app will work but show a generic icon

## Testing Icons

After creating icons:
1. Place them in `electron/assets/`
2. Run `npm run build` in the `electron/` directory
3. Install the generated .exe
4. Check:
   - Desktop shortcut shows correct icon
   - Taskbar shows correct icon when app is running
   - System tray shows correct icon when minimized
   - Alt+Tab shows correct icon

## Current Status

⚠️ **Action Required**: Icons not yet created

To build the app, you need to either:
- Create the icons and place them here
- Update `package.json` to remove icon references (app will use default)
- Use placeholder icons (solid color squares) temporarily

## Resources

- Hool.gg branding colors: Purple #2D1B52, Blue #6BB3FF
- WoW class colors: Available in `static/app.js` (CLASS_COLORS object)
- Icon size guide: https://learn.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design
