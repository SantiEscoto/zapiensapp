const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.join(__dirname, '..', 'resources');
const destDir = path.join(__dirname, 'public');

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all image files from resources to public
const copyImages = () => {
  try {
    const files = fs.readdirSync(sourceDir);
    
    let copiedCount = 0;
    for (const file of files) {
      // Only copy image files
      if (file.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        
        fs.copyFileSync(sourcePath, destPath);
        copiedCount++;
        console.log(`Copied: ${file}`);
      }
    }
    
    console.log(`\nSuccessfully copied ${copiedCount} image files to public directory.`);
  } catch (error) {
    console.error('Error copying images:', error.message);
  }
};

copyImages();