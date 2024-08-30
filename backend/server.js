const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { generateTestCases } = require('./testCaseGenerator');

const app = express();
const port = 3000;

// More specific CORS configuration
const corsOptions = {
    origin: 'http://localhost:5500', // Adjust this to match your frontend's origin
    optionsSuccessStatus: 200
  };

app.use(cors());
app.use(express.json());

app.post('/generate', async (req, res) => {
    const { url, framework } = req.body;

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.startsWith(window.location.origin));
        });

        const pagesData = [];

        for (const link of links) {
            await page.goto(link, { waitUntil: 'networkidle0' });
            const pageData = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const data = [];
                elements.forEach(el => {
                    if (el.id || el.className) {
                        data.push({
                            tag: el.tagName.toLowerCase(),
                            id: el.id,
                            className: el.className,
                            text: el.textContent.trim().substring(0, 50)
                        });
                    }
                });
                return {
                    url: window.location.pathname,
                    elements: data
                };
            });
            pagesData.push(pageData);
        }

        await browser.close();

        const testCases = generateTestCases(pagesData, framework);
        res.json({ testCases });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while generating test cases' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});