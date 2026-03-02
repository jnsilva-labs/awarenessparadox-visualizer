const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Catch console logs and errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER CONSOLE ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('BROWSER PAGE ERROR:', error.message);
    });

    await page.goto('http://localhost:5176');
    console.log("Page loaded");

    // Wait for file input to exist
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
        console.log("Uploading test file...");
        await fileInput.uploadFile('/Users/jnsilva/Antigravity Projects/Music Visualizer/test_audio.wav');
        console.log("File uploaded, waiting 5 seconds for crash...");
        await new Promise(r => setTimeout(r, 5000));
    } else {
        console.log("No file input found!");
    }

    await browser.close();
})();
