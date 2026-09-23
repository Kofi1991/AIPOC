// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Specs that require a logged-in admin session. Each of these logs in
 * independently inside its own isolated (incognito) browser context and logs
 * out afterwards. They run only in the chromium-only "content-admin" project
 * and are excluded from the plain browser projects.
 */
const AUTH_SPECS = [
  '**/verify-successful-creation-of-news-article-blog-post-with-all-required-fields.spec.js',
  '**/verify-that-all-required-specs-is-displayed-when-creating-a-generic-content-page.spec.js',
  '**/verify-that-all-mandatory-fields-within-generic-content-page-function-as-expected.spec.js',
  '**/verify-that-users-are-able-to-create-generic-content-pages.spec.js',
  '**/verify-user-is-able-to-delete-generic-content-page.spec.js',
  '**/verify-that-body-formatting-appears-correctly-on-the-front-end-for-the-generic-content-page.spec.js',
  '**/verify-users-are-able-to-edit-newly-created-generic-content-pages.spec.js',
  '**/verify-that-all-mandatory-fields-within-news-article-blog-post-page-function-as-expected.spec.js',
  '**/verify-that-all-required-specs-is-displayed-when-creating-a-news-article-blog-post-page.spec.js',
  '**/verify-user-is-able-to-delete-news-article-blog-post-page.spec.js',
  '**/verify-that-users-are-able-to-create-news-article-blog-post-content-page.spec.js',
  '**/verify-users-are-able-to-edit-newly-created-news-article-blog-post-content-page.spec.js',
  '**/verify-that-all-mandatory-fields-within-homepage-function-as-expected.spec.js',
  '**/verify-that-all-required-specs-is-displayed-when-creating-a-homepage-content-page.spec.js',
  '**/verify-that-users-are-able-to-create-homepage-content-page.spec.js',
  '**/verify-user-is-able-to-delete-homepage-content-page.spec.js',
  '**/verify-user-is-able-to-delete-homepages.spec.js',
  '**/verify-users-are-able-to-edit-newly-created-homepage-content-page.spec.js',
  '**/verify-mandatory-fields-on-homepage-creation.spec.js',
  '**/verify-users-can-view-homepage-content-on-fe.spec.js',
  '**/verify-users-are-able-to-edit-homepages.spec.js',
  '**/verify-that-all-mandatory-fields-within-landing-page-content-page-function-as-expected.spec.js',
  '**/verify-that-all-required-specs-is-displayed-when-creating-a-landing-content-page.spec.js',
  '**/verify-that-users-are-able-to-create-landing-content-page.spec.js',
  '**/verify-user-is-able-to-delete-landing-page.spec.js',
  '**/verify-users-are-able-to-edit-newly-created-landing-content-page.spec.js',
  '**/verify-that-all-mandatory-fields-within-resource-listing-page-function-as-expected.spec.js',
  '**/verify-that-all-required-specs-is-displayed-when-creating-a-resoruce-listing-page.spec.js',
  '**/verify-that-users-are-able-to-create-resource-listing-page.spec.js',
  '**/verify-user-is-able-to-delete-resource-listing-page.spec.js',
  '**/verify-users-are-able-to-edit-newly-created-resource-listing-content-page.spec.js',
  '**/verify-mandatory-fields-on-generic-content-page-creation.spec.js',
  '**/verify-users-can-view-generic-content-page-title-on-fe.spec.js',
  '**/verify-users-are-able-to-edit-generic-content-pages.spec.js',
  '**/verify-user-is-able-to-delete-generic-content-pages.spec.js',
  '**/verify-mandatory-fields-on-news-article-blog-post-creation.spec.js',
  '**/verify-users-can-view-news-article-blog-post-content-on-fe.spec.js',
  '**/verify-users-are-able-to-edit-news-articles-blog-posts.spec.js',
  '**/verify-user-is-able-to-delete-news-articles-blog-posts.spec.js',
  '**/verify-mandatory-fields-on-landing-page-creation.spec.js',
  '**/verify-users-can-view-landing-page-content-on-fe.spec.js',
  '**/verify-users-can-edit-landing-pages.spec.js',
  '**/verify-user-is-able-to-delete-landing-pages.spec.js',
];

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    /* Always run headless, in CI and locally. */
    headless: true,
    screenshot: 'only-on-failure', // Automatically attaches screenshots
    trace: 'retain-on-failure',
    video: 'on',                   // Record video for every test so runs can be reviewed
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: AUTH_SPECS,
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: AUTH_SPECS,
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: AUTH_SPECS,
    },

    /*
     * Authenticated specs. Each test logs in fresh inside its own isolated
     * (incognito) browser context and logs out afterwards — no shared session.
     * Note: the account's single-session limit means running these two at the
     * same time will kick each other out; run this project with --workers=1
     * (or lift the cap / use a dedicated account per test).
     */
    {
      name: 'content-admin',
      testMatch: AUTH_SPECS,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
