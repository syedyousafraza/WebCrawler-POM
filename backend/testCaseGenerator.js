function generateTestCases(pagesData, framework) {
    let testCases = '';

    pagesData.forEach(pageData => {
        const pageName = pageData.url.split('/').pop() || 'home';
        const className = `${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page`;

        testCases += `class ${className} {\n`;
        testCases += `    constructor() {\n`;
        testCases += `        this.url = '${pageData.url}';\n`;

        const uniqueLocators = new Set();

        pageData.elements.forEach(el => {
            let propertyName = el.id || (typeof el.className === 'string' ? el.className.split(' ')[0] : '') || el.tag;
            propertyName = propertyName.replace(/[^a-zA-Z0-9]/g, '_'); // Ensure valid JavaScript identifier
            let selector = el.id ? `#${el.id}` : (typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : el.tag);
            
            // Only add the locator if it's unique
            if (!uniqueLocators.has(propertyName)) {
                uniqueLocators.add(propertyName);
                testCases += `        this.${propertyName} = '${selector}';\n`;
            }
        });

        testCases += `    }\n\n`;
        testCases += `    async visit() {\n`;
        if (framework === 'cypress') {
            testCases += `        cy.visit(this.url);\n`;
        } else if (framework === 'playwright') {
            testCases += `        await page.goto(this.url);\n`;
        } else if (framework === 'selenium') {
            testCases += `        await driver.get(this.url);\n`;
        }
        testCases += `    }\n`;
        testCases += `}\n\n`;

        testCases += `describe('${pageName} page tests', () => {\n`;
        testCases += `    let page;\n\n`;
        testCases += `    beforeEach(() => {\n`;
        testCases += `        page = new ${className}();\n`;
        testCases += `    });\n\n`;
        testCases += `    it('should load ${pageName} page', async () => {\n`;
        testCases += `        await page.visit();\n`;
        if (framework === 'cypress') {
            testCases += `        cy.url().should('include', '${pageData.url}');\n`;
        } else if (framework === 'playwright') {
            testCases += `        expect(page.url()).toContain('${pageData.url}');\n`;
        } else if (framework === 'selenium') {
            testCases += `        expect(await driver.getCurrentUrl()).toContain('${pageData.url}');\n`;
        }
        testCases += `    });\n`;

        uniqueLocators.forEach(propertyName => {
            testCases += `\n    it('should have ${propertyName} element', async () => {\n`;
            if (framework === 'cypress') {
                testCases += `        cy.get(page.${propertyName}).should('exist');\n`;
            } else if (framework === 'playwright') {
                testCases += `        await expect(page.locator(page.${propertyName})).toBeVisible();\n`;
            } else if (framework === 'selenium') {
                testCases += `        const element = await driver.findElement(By.css(page.${propertyName}));\n`;
                testCases += `        expect(await element.isDisplayed()).toBe(true);\n`;
            }
            testCases += `    });\n`;
        });

        testCases += `});\n\n`;
    });

    return testCases;
}

module.exports = { generateTestCases };