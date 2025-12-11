const fs = require('fs');
const path = require('path');
const { LOCATION_DATA } = require('../src/lib/locationData.ts');

const publicDir = path.join(__dirname, '..', 'public', 'assets', 'location');

// Function to check if file exists
function checkFile(filePath) {
  return fs.existsSync(filePath);
}

// Function to create directory if it doesn't exist
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
    return false;
  }
  return true;
}

// Check all locations
console.log('\n🔍 Checking Location Assets...\n');

const missingAssets = [];

Object.keys(LOCATION_DATA).forEach(locationName => {
  const locationDir = path.join(publicDir, locationName);
  const dirExists = ensureDirectory(locationDir);

  if (!dirExists) {
    // Directory was just created, so all files are missing
    missingAssets.push({
      location: locationName,
      actionPlan: `/assets/location/${locationName}/QR Action.png`,
      summary: `/assets/location/${locationName}/QR Summary.png`,
      sop: `/assets/location/${locationName}/SOP.jpg`
    });
  } else {
    const actionPlanPath = path.join(locationDir, 'QR Action.png');
    const summaryPath = path.join(locationDir, 'QR Summary.png');
    const sopPath = path.join(locationDir, 'SOP.jpg');

    const actionPlanExists = checkFile(actionPlanPath);
    const summaryExists = checkFile(summaryPath);
    const sopExists = checkFile(sopPath);

    if (!actionPlanExists || !summaryExists || !sopExists) {
      missingAssets.push({
        location: locationName,
        actionPlan: actionPlanExists ? null : `/assets/location/${locationName}/QR Action.png`,
        summary: summaryExists ? null : `/assets/location/${locationName}/QR Summary.png`,
        sop: sopExists ? null : `/assets/location/${locationName}/SOP.jpg`
      });
    }
  }
});

if (missingAssets.length === 0) {
  console.log('✅ All location assets are present!\n');
} else {
  console.log('\n❌ Missing Assets:\n');
  missingAssets.forEach(asset => {
    console.log(`📁 Location: ${asset.location}`);
    if (asset.actionPlan) console.log(`   - Missing: ${asset.actionPlan}`);
    if (asset.summary) console.log(`   - Missing: ${asset.summary}`);
    if (asset.sop) console.log(`   - Missing: ${asset.sop}`);
    console.log('');
  });
}

// Generate QR code generation commands
console.log('\n📝 To generate QR codes, use these commands:\n');
console.log('Example using qrencode (Linux/Mac) or online QR generators:\n');

missingAssets.forEach(asset => {
  if (asset.actionPlan) {
    const link = LOCATION_DATA[asset.location].actionPlanLink;
    console.log(`# ${asset.location} - Action Plan QR Code`);
    console.log(`# Link: ${link}`);
    console.log(`# Save as: public${asset.actionPlan}`);
    console.log('');
  }
  if (asset.summary) {
    const link = LOCATION_DATA[asset.location].summaryLink;
    console.log(`# ${asset.location} - Summary QR Code`);
    console.log(`# Link: ${link}`);
    console.log(`# Save as: public${asset.summary}`);
    console.log('');
  }
});

console.log('\n📌 Tips:');
console.log('1. Use online QR code generators like qr-code-generator.com');
console.log('2. Or use Node.js: npm install qrcode');
console.log('3. Make sure folder names match exactly (including spaces)');
console.log('4. QR codes should be PNG format, SOP images should be JPG\n');