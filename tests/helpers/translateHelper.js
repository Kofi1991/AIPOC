const { expect } = require('@playwright/test');

function getLanguageSelect(page) {
  return page.getByRole('combobox', { name: 'Select Language' });
}

function getTranslateButton(page) {
  return page.getByRole('button', { name: 'Translate', exact: true });
}

async function expectTranslateWidgetVisible(page) {
  await expect(getLanguageSelect(page)).toBeVisible();
  await expect(getTranslateButton(page)).toBeVisible();
}

async function pickRandomLanguage(page) {
  const options = await getLanguageSelect(page).locator('option').allTextContents();
  const choices = options.filter((label) => !['Select Language', 'English', 'undefined'].includes(label));
  return choices[Math.floor(Math.random() * choices.length)];
}

// The Google Translate widget occasionally ignores a select+click pair (observed
// flakiness in this third-party integration, guarded by reCAPTCHA on the page), so
// retry the whole interaction until the title actually changes.
async function translateAndVerify(page, language) {
  const originalTitle = await page.title();

  await expect(async () => {
    await getLanguageSelect(page).selectOption({ label: language });
    await getTranslateButton(page).click();
    await expect(page).not.toHaveTitle(originalTitle, { timeout: 5000 });
  }).toPass({ timeout: 45000 });
}

module.exports = {
  expectTranslateWidgetVisible,
  pickRandomLanguage,
  translateAndVerify,
};
