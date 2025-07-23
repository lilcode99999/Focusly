# Generate PNG Icons for Focusly

The icon.svg file has been updated with the new Focusly branding. To generate the required PNG icons, you need to convert the SVG to PNG in the following sizes:

- icon-16.png (16x16)
- icon-32.png (32x32) 
- icon-48.png (48x48)
- icon-128.png (128x128) - this one already exists but should be updated

## Using ImageMagick (if installed):
```bash
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 32x32 icon-32.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

## Using an online converter:
1. Go to https://cloudconvert.com/svg-to-png or similar service
2. Upload icon.svg
3. Generate PNG files in the sizes listed above
4. Save them in the extension root directory

## Using a browser-based tool:
1. Open icon.svg in a browser
2. Use browser developer tools to capture screenshots at different sizes
3. Or use an SVG-to-PNG converter extension

The manifest.json has been updated to reference these icon files.