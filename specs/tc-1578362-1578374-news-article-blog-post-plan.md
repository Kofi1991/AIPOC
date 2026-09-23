# News Article / Blog Post — mandatory fields, required fields, create, edit, delete — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854) · group "News Article / Blog Post"
**Fetched:** 5 cases (TC-1578362, 1578366, 1578370, 1578372, 1578374) · **Planned:** 5 (Admin steps) · **Deferred:** the Site Admin step of 1578362, 1578370 and 1578374 (no TC_SITEADMIN_USER/TC_SITEADMIN_PASS in .env — same gap as the Generic page plans), and step 2 of 1578372 (see Drift)
**Seed:** tests/seed.spec.ts
**Tags:** none of the five cases carries any tag in TestCollab.

## Coverage summary

| TC ID | Title | Verdict | Existing spec | Notes |
|-------|-------|---------|---------------|-------|
| 1578362 | Verify That All Mandatory Fields Within News Article/ Blog Post Page Function as Expected | Automate (Admin step only) | — | Site Admin step blocked: no credentials |
| 1578366 | Verify That All Required Specs Is Displayed When Creating A News Article/ Blog Post Page | Automate | — | Category field named in the case does not exist on the form (Drift) |
| 1578370 | Verify User Is Able To Delete News Article/ Blog Post Page | Automate (Admin step only) | — | Site Admin step blocked: no credentials; deletion verified in the CMS list, not the message |
| 1578372 | Verify That Users Are Able To Create  News Article/ Blog Post Content Page | Automate (steps 1 and 3 partly) | — | Step 2 unverifiable, no image caption exists (Drift) |
| 1578374 | Verify Users Are Able to Edit Newly Created News Article/ Blog Post Content Page | Automate (Admin steps 1-2 only) | — | Steps 3-4 are the Site Admin repeat: blocked |

Related but not the same: tests/cms/news-blog/verify-successful-creation-of-news-article-blog-post-with-all-required-fields.spec.js covers TC-1578624 (an end-to-end create with body text). It is not a spec for any of these five cases.

## Drift found (verified live against test.registertovote.london, 2026-09-21)

- **Image is mandatory, not optional.** TC-1578372 says "the Image and Category fields are optional" and TC-1578366/1578374 imply only Title, Summary and Type are mandatory. The form labels the field "Image *" and saving without one fails server-side with "Image field is required." (the browser's native validation does NOT catch it). TC-1578362 step 1 does list Image among the blank-fields-must-block-creation fields, so that case is right and the other three are wrong. The plan follows the app: Image is filled in every create.
- **There is no Category field on the form.** TC-1578366, 1578372 and 1578374 list "Category" among the visible fields. The Create News article / Blog post form has Title, Summary, Image, Body, Type, Content Sections and Author — no category control. Not asserted; correct the cases in TestCollab.
- **Type cannot be left blank.** TC-1578362 lists Type as a blank field. Type is a select with only "Blog post" and "News article" and no empty option, so it is always pre-selected (default "Blog post"). The spec asserts it has a value and is marked required instead.
- **Title and Summary are validated by the browser, Image by the server.** Blank Title/Summary trigger native "Please fill out this field." (assert `:invalid` and `validationMessage`, as in the Generic page mandatory-fields spec). With those filled and Image blank, Drupal stays on the form and shows "Image field is required."; nothing is created.
- **TC-1578372 step 2 ("Summary should NOT be displayed" on the homepage news/blog page) cannot be verified.** The case does not say which page. New posts are created as Draft by default and are not listed anywhere public; once Published (a "Publish this?" confirmation appears) the post shows on /blogs-and-news, where its summary IS displayed, and it does not appear on the homepage at all. An assertion that the summary is absent from the homepage would pass vacuously, so it is deliberately not automated. Needs a decision from the case owner on which page is meant.
- **TC-1578372 step 3: the image has no caption.** The post page renders the title as an H1 and the image, but there is no figure/figcaption and no caption text next to the image (checked on a Published post). The H1 and image are asserted; the caption is not, and is logged as a possible defect or a stale expectation.
- **A post's own page also shows a Blog post/News article type label and the summary** under the title (not in the case). The Type label is asserted in the create spec.
- **Saving as Published shows a "Publish this?" dialog** (Yes / Cancel). The specs save with the default state (Draft), so they never publish content on the shared staging site.
- **Success messages are not asserted.** As with the Generic page delete/edit specs, the "has been created/updated/deleted" messages live in the Drupal session, which the content-admin specs share, so the outcome is verified in the CMS content list (filtered by title) or on the post's own page.
- **Delete helper hardened:** contentPageHelper.deleteContentItemFromList now filters the content list by title before looking for the row. Previously it read the first unfiltered page, which cannot be relied on for the extra posts these specs leave lying around if a test aborts.
- **Site Admin steps blocked** (1578362 step 2, 1578370 step 2, 1578374 steps 3-4): no Site Admin credentials, and while TC_ADMIN_SESSION is set authHelper.login() reuses that cookie whatever credentials are passed.
- **Environment note:** the admin pages show a Drupal "security update available" banner rendered as an "Error message" region on every admin page. It is unrelated; specs must not treat "an error message is visible" as a signal.
- Out of scope by standing convention: no mobile-viewport or visual-comparison steps in these five cases.

## Test Scenarios

### 1. News Article / Blog Post

**Seed:** `tests/seed.spec.ts`

#### 1.1. Verify That All Mandatory Fields Within News Article/ Blog Post Page Function as Expected

**File:** `tests/cms/news-blog/verify-that-all-mandatory-fields-within-news-article-blog-post-page-function-as-expected.spec.js`

**Steps:**
  1. Log in as Admin via authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)
    - expect: The browser holds an authenticated Drupal session
  2. Open the form with authHelper.navigateToBlogCreation(page) and record page.url()
    - expect: The Create News article / Blog post form is displayed
  3. With Title, Summary and Image blank, click Save & Close
    - expect: The browser stays on the form URL
    - expect: Title and Summary match :invalid with validationMessage 'Please fill out/in this field.'
    - expect: The Type combobox has a value already selected (no blank option exists)
  4. Fill a unique Title and a Summary, leave Image empty, click Save & Close
    - expect: The browser stays on /node/add/news_article_blog_post
    - expect: 'Image field is required.' is shown
  5. Look the title up in the CMS with contentPageHelper.expectContentItemAbsentFromList
    - expect: The Content list filtered by that title has zero rows, so the page was not created
  6. Log out via authHelper.logout(page)
    - expect: The session cookie is cleared

#### 1.2. Verify That All Required Specs Is Displayed When Creating A News Article/ Blog Post Page

**File:** `tests/cms/news-blog/verify-that-all-required-specs-is-displayed-when-creating-a-news-article-blog-post-page.spec.js`

**Steps:**
  1. Log in as Admin and open the form with authHelper.navigateToBlogCreation(page)
    - expect: The Create News article / Blog post form is displayed
  2. Inspect the form fields
    - expect: Textbox 'Title *', textbox 'Summary *', group 'Image *' and combobox 'Type *' are visible and carry the required asterisk
    - expect: The Body rich text editor is visible and has no asterisk (optional)
  3. Fill Title, Summary, choose Type, add an image via blogPostHelper.uploadBlogPostImage, leave Body empty, click Save & Close (blogPostHelper.createBlogPost)
    - expect: The browser leaves /node/add and lands on the new post's page
    - expect: The post's H1 is the title, proving it was created with Body left empty
  4. Delete the created post via contentPageHelper.deleteContentItemFromList (cleanup, in a finally)
    - expect: The post is removed from the CMS

#### 1.3. Verify User Is Able To Delete News Article/ Blog Post Page

**File:** `tests/cms/news-blog/verify-user-is-able-to-delete-news-article-blog-post-page.spec.js`

**Steps:**
  1. Log in as Admin and create a post with a unique timestamped title via blogPostHelper.createBlogPost (precondition)
    - expect: The post is created and the browser leaves /node/add
  2. Confirm it is in the CMS with contentPageHelper.expectContentItemInList(page, title)
    - expect: The Content list filtered by that title returns exactly one row (positive control)
  3. Delete it with contentPageHelper.deleteContentItemFromList(page, title)
    - expect: A confirmation dialog appears and its 'Save & Close' button submits the deletion
  4. Verify with contentPageHelper.expectContentItemAbsentFromList(page, title)
    - expect: The filtered Content list shows zero rows. The 'has been deleted' message is deliberately not asserted

#### 1.4. Verify That Users Are Able To Create  News Article/ Blog Post Content Page

**File:** `tests/cms/news-blog/verify-that-users-are-able-to-create-news-article-blog-post-content-page.spec.js`

**Steps:**
  1. Log in as Admin and open the form
    - expect: The form is displayed
  2. Fill Title and Summary, choose Type 'News article', add an image, click Save & Close
    - expect: The browser leaves /node/add and shows the new post's page
  3. View the created post's page
    - expect: The H1 is the title
    - expect: The image is displayed
    - expect: The page shows the 'News article' type label
  4. Delete the post via the CMS list (cleanup, in a finally)
    - expect: The post is removed

#### 1.5. Verify Users Are Able to Edit Newly Created News Article/ Blog Post Content Page

**File:** `tests/cms/news-blog/verify-users-are-able-to-edit-newly-created-news-article-blog-post-content-page.spec.js`

**Steps:**
  1. Log in as Admin and create a post with a unique title (precondition)
    - expect: The post is created
  2. Find it with contentPageHelper.editContentItemFromList(page, title), change the Title to '<title> EDITED' and click Save & Close
    - expect: The browser returns to /admin/content
  3. Verify the change in the CMS
    - expect: The Content list filtered by the new title returns exactly one row
    - expect: Opening that row's title link shows an H1 equal to the new title
  4. Delete the post via the CMS list (cleanup, in a finally)
    - expect: The post is removed
