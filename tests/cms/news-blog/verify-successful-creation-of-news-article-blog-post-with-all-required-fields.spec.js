// case: TC-1578624
// spec: specs/tc-1578624-news-article-blog-post-plan.md
// seed: tests/seed.spec.ts

const { test, expect } = require('@playwright/test');
const path = require('path');
const authHelper = require('../../helpers/authHelper');
const blogPostHelper = require('../../helpers/blogPostHelper');

// Each auth test runs in its own isolated (incognito) context: log in fresh,
// log out afterwards so the account's single session slot is released.
test.afterEach(async ({ page }) => {
  await authHelper.logout(page);
});

test('Verify successful creation of News article / Blog post with all required fields', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
  test.setTimeout(120_000); // multi-step content creation incl. the media-library modal

  // Blog post test data
  const blogPostTitle = 'Test Blog Post: Democracy in Action';
  const blogPostSummary = 'This is a test summary for the blog post about democratic engagement and civic participation.';
  const blogPostBody = 'This is the main body content of the blog post. It contains detailed information about the topic with proper formatting and structure.';

  // Step 1-7: Log in as admin (own private context)
  console.log('Step 1-7: Logging in...');
  await authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS);
  console.log('✓ Successfully logged in');

  // Step 8: Navigate to Add content > News article / Blog post
  console.log('Step 8: Navigating to blog creation form...');
  await authHelper.navigateToBlogCreation(page);
  console.log('✓ Blog creation form displayed');
  
  // Step 9: Enter a valid title in the Title field
  console.log('Step 9: Entering blog post title...');
  await blogPostHelper.fillBlogPostTitle(page, blogPostTitle);
  console.log('✓ Title accepted');
  
  // Step 10: Enter content in the Summary field
  console.log('Step 10: Entering blog post summary...');
  await blogPostHelper.fillBlogPostSummary(page, blogPostSummary);
  console.log('✓ Summary accepted');
  
  // Step 11: Click Add media button and upload an image (required field on this content type)
  console.log('Step 11: Uploading image...');
  const testImagePath = path.join(__dirname, '../../fixtures/test-image.png');
  await blogPostHelper.uploadBlogPostImage(page, testImagePath);
  console.log('✓ Image uploaded and displayed');
  
  // Step 12: Enter body content using the rich text editor
  console.log('Step 12: Entering blog post body content...');
  await blogPostHelper.fillBlogPostBody(page, blogPostBody);
  console.log('✓ Body content saved with formatting');
  
  // Step 13: Click Save & Close button
  console.log('Step 13: Saving blog post...');
  await blogPostHelper.saveBlogPost(page);
  console.log('✓ Clicking Save & Close');
  
  // Verify: Blog post is created successfully and user is redirected to the content view
  console.log('Verifying blog post creation...');
  await blogPostHelper.verifyBlogPostCreated(page);
  console.log('✓ Blog post created successfully and user redirected to content view');
  
  // Final assertion: no longer on the node create form
  await expect(page).not.toHaveURL(/\/node\/add\//);
  console.log('\n✅ Test TC-1455 completed successfully!');
});
