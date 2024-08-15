const fs = require('fs');
const path = require('path');



// Read the image file
fs.readFile("./assets/logo.png", (err, data) => {
    if (err) {
        console.error('Failed to read file:', err);
        return;
    }

    // Convert image to Base64 string
    const base64Image = data.toString('base64');

    // Create the data URL string
    const base64ImageString = `data:image/png;base64,${base64Image}`;

    console.log('Base64 Image String:');
    console.log(base64ImageString);
});
