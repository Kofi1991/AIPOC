# Content types (Homepage, Landing page, Resource, Generic page, News/Blog) — automation plan

## Application Overview

**Source:** TestCollab project POC (#18854)
**Fetched:** 46 cases · **Planned:** 27 (Admin steps) · **Deferred/blocked:** 6 Project Page cases (no such content type) + every Site Admin step
**Seed:** `tests/seed.spec.ts`
**Tags:** none of these cases carries the `automated` tag beforehand; the role-tagged ones (1578386–1578402) carry `role:*` / `area:*` tags which QA must preserve.

Live check of the Add content types on the staging site (/node/add): **Generic page, Homepage, Landing page, News article / Blog post, Resource, Resource collection.**

## Coverage summary

| TC ID | Title | Verdict | Spec | Notes |
|-------|-------|---------|------|-------|
| 1578356 | Verify That All Mandatory Fields Within Homepage Function as Expected | Automate (Admin) | verify-that-all-mandatory-fields-within-homepage-function-as-expected | No Hero Image/CTA on the form |
| 1578357 | Verify That All Required Specs Is Displayed When Creating A Homepage Content Page | Automate | verify-that-all-required-specs-is-displayed-when-creating-a-homepage-content-page | Hero Image/CTA do not exist |
| 1578358 | Verify That Users Are Able To Create  Homepage Content Page | Automate (partial) | verify-that-users-are-able-to-create-homepage-content-page | Steps 2-3: summary/image/CTA claims not asserted |
| 1578359 | Verify User Is Able To Delete Homepage Content Page | Automate (Admin) | verify-user-is-able-to-delete-homepage-content-page | |
| 1578360 | Verify Users Are Able to Edit Newly Created Homepage Content Page. | Automate (Admin) | verify-users-are-able-to-edit-newly-created-homepage-content-page | |
| 1578391 | Verify mandatory fields on Homepage creation | Automate (Admin) | verify-mandatory-fields-on-homepage-creation | Title formatted set to H1 through the editor's heading dropdown |
| 1578392 | Verify users can view Homepage content on FE | Automate | verify-users-can-view-homepage-content-on-fe | |
| 1578393 | Verify users are able to edit Homepages | Automate (Admin) | verify-users-are-able-to-edit-homepages | Paragraph component added: "Latest news and blogs" |
| 1578394 | Verify user is able to delete Homepages | Automate (Admin) | verify-user-is-able-to-delete-homepages | |
| 1578361 | Verify That All Mandatory Fields Within Landing Page  Content Page Function as Expected | Automate (Admin) | verify-that-all-mandatory-fields-within-landing-page-content-page-function-as-expected | |
| 1578365 | Verify That All Required Specs Is Displayed When Creating A Landing Content Page | Automate | verify-that-all-required-specs-is-displayed-when-creating-a-landing-content-page | No Body field |
| 1578371 | Verify That Users Are Able To Create  Landing Content Page | Automate (partial) | verify-that-users-are-able-to-create-landing-content-page | Steps 2-3: summary and caption claims not asserted |
| 1578369 | Verify User Is Able To Delete Landing Page | Automate (Admin) | verify-user-is-able-to-delete-landing-page | |
| 1578373 | Verify Users Are Able to Edit Newly Created Landing Content Page | Automate (Admin) | verify-users-are-able-to-edit-newly-created-landing-content-page | Case text says "Generic Page"/Resource fields (copy-paste) |
| 1578363 | Verify That All Mandatory Fields Within Resource Listing Page Function as Expected | Automate (Admin) | verify-that-all-mandatory-fields-within-resource-listing-page-function-as-expected | "Resource Listing" = the Resource type |
| 1578364 | Verify That All Required Specs Is Displayed When Creating A Resoruce Listing Page | Automate | verify-that-all-required-specs-is-displayed-when-creating-a-resoruce-listing-page | |
| 1578367 | Verify That Users Are Able To Create Resource Listing Page. | Automate (partial) | verify-that-users-are-able-to-create-resource-listing-page | Image caption claim not asserted |
| 1578368 | Verify User Is Able To Delete Resource Listing Page | Automate (Admin) | verify-user-is-able-to-delete-resource-listing-page | |
| 1578375 | Verify Users Are Able to Edit Newly Created Resource Listing Content Page. | Automate (Admin) | verify-users-are-able-to-edit-newly-created-resource-listing-content-page | |
| 1578386 | Verify mandatory fields on Generic Content Page creation | Automate (Admin) | verify-mandatory-fields-on-generic-content-page-creation | |
| 1578387 | Verify Users can view Generic Content Page title on FE | Automate | verify-users-can-view-generic-content-page-title-on-fe | Step 2 "right click and inspect" = assert the H1 role |
| 1578389 | Verify users are able to edit Generic Content Pages | Automate (Admin) | verify-users-are-able-to-edit-generic-content-pages | |
| 1578390 | Verify user is able to delete Generic Content Pages | Automate (Admin) | verify-user-is-able-to-delete-generic-content-pages | |
| 1578399 | Verify mandatory fields on News Article / Blog Post creation | Automate (Admin) | verify-mandatory-fields-on-news-article-blog-post-creation | Case omits that Image is mandatory |
| 1578400 | Verify users can view News Article / Blog Post content on FE | Automate | verify-users-can-view-news-article-blog-post-content-on-fe | Step 1 is a reusable step with no expected result |
| 1578401 | Verify users are able to edit News Articles / Blog Posts | Automate (Admin) | verify-users-are-able-to-edit-news-articles-blog-posts | Paragraph added: "Text" |
| 1578402 | Verify user is able to delete News Articles / Blog Posts | Automate (Admin) | verify-user-is-able-to-delete-news-articles-blog-posts | |
| 1578350–1578355 | Project Page cases (delete, edit, create, mandatory, required specs, body formatting) | **Blocked** | — | There is no "Project" content type (see Drift) |
| 1578388 | Verify body text formatting on Generic Content Page | Not in this batch | — | Needs accessibility/hover/focus checks and lists a known FE defect |

All specs live in `tests/smokeTest/` and are named after the case title (kebab-case). They run in the `content-admin` project (see `AUTH_SPECS`), one worker.

## Drift found (verified live against test.registertovote.london, 2026-09-21)

- **There is no "Project page" content type.** The Add content list has Generic page, Homepage, Landing page, News article / Blog post, Resource and Resource collection. TC-1578350…1578355 cannot be run as written. Either the type was never built or the cases are stale.
- **"Resource Listing Page" is the Resource content type** (fields Title, Summary, Body, Thumbnail image, Language, Category, Resource type/format, Resource download, Content Sections). "Resource collection" is a different type (a list of Resources). The Resource cases contradict themselves on Summary: "Title and Resource Summary mandatory" then "Summary optional". Real behaviour: only **Title and Resource download** are mandatory (`Resource download field is required.` from the server; the browser blocks a blank Title).
- **Homepage has no Hero Image and no CTA field** (cases 1578356, 1578357, 1578358, 1578360 name them). The form has **Title\*, Title formatted\* (a CKEditor field), Summary\***, and Content Sections. "Title formatted" is checked by the server (`Title formatted field is required.`), Title and Summary by the browser.
- **Homepage front end:** the URL is `/<slug>`, the **H1 is the Title formatted text** (not the Title), and the **Summary IS displayed.** TC-1578358 step 2 says the summary must NOT be displayed; TC-1578392 says it should be. The two cases contradict each other, the app follows 1578392. Not asserted in 1578358.
- **Landing page has no Body field.** It has Title\*, Summary\*, Hero image, CTA (URL + Link text) — Hero image and CTA are optional as the case says. The Summary IS displayed on its front end (TC-1578371 step 2 says it must NOT be). No image caption.
- **No image caption exists anywhere:** Homepage, Landing, Resource and News post pages render no `figcaption`. TC-1578358/1578371/1578367/1578372 expect a caption. Not asserted, flagged as a possible defect or a stale expectation.
- **Resource front end:** Title is the H1, Summary is correctly NOT displayed, URL is `/resources/<slug>`.
- **News article / Blog post: Image is mandatory** ("Image field is required." from the server). TC-1578399 steps 3-4 say the page saves with only Title and Summary; it does not. The spec asserts the real behaviour (save rejected until an Image is added).
- **Paragraph types differ per content type.** The Homepage and Generic forms offer "Latest news and blogs"; the News form offers Accordion, Text, Image / video, Call to action, Partners / logo listing, Embed, Dual column, Documents, Multi-card, Newsletter signup, Webform. The News edit spec adds a "Text" paragraph.
- **Saving an edit from the content list returns to /admin/content, not the FE.** Cases 1578389 (step 5), 1578393 (step 4) and 1578401 (step 4) expect a redirect to the front end. The specs assert the list redirect, then open the node from the list.
- **URL aliases:** Drupal's pathauto drops stop words ("to", "the", "of", …) and regenerates the alias when the title is edited, e.g. "Homepage to edit 123 EDITED" → `/homepage-edit-123-edited`. `contentTypeHelper.slugify()` mirrors this so specs can assert "the URL follows the title".
- **Status messages are not asserted** ("has been created/updated/deleted"): they live in the Drupal session, which the content-admin specs share via `TC_ADMIN_SESSION`. Outcomes are checked in the CMS content list or on the node's own page. The existing Generic page edit spec (TC-1578347) asserted the "has been updated" message and failed on a clean serial run; it now verifies via the list row instead.
- **Site Admin steps blocked** in every case that has them (no `TC_SITEADMIN_USER` / `TC_SITEADMIN_PASS`); the cases are automated for Admin only.
- **Delete helper:** `contentPageHelper.deleteContentItemFromList` now filters by title first, so the row is found however long the list is.
- Out of scope by standing convention: no mobile-viewport or visual-comparison steps.

## Test Scenarios

Every scenario: **Seed** `tests/seed.spec.ts`. Log in as Admin through `authHelper.login(page, process.env.TC_ADMIN_USER, process.env.TC_ADMIN_PASS)`; content is created as Draft with a unique timestamped title and deleted afterwards (`finally` → `contentTypeHelper.deleteQuietly`), so nothing is published on the shared staging site.

### 1. Homepage
- **1578356 mandatory** — open `/node/add/homepage`; blank submit → browser blocks Title and Summary (`:invalid`, "Please fill out this field."); with Title and Summary filled but Title formatted empty → server error `Title formatted field is required.`, still on the form, page absent from the CMS list.
- **1578357 required specs** — Title\*, Title formatted\*, Summary\* visible; create with only those → H1 = Title formatted.
- **1578358 create** — create with the three required fields; page is created and its H1 is the Title formatted.
- **1578359 / 1578394 delete** — create; positive-control lookup in the CMS list; delete (dropdown next to Edit > Delete > Save & Close); list shows zero rows.
- **1578360 edit** — create; edit from the list, change Title, Save & Close → `/admin/content`; list shows the new title; its page URL follows the title.
- **1578391 mandatory (BBD)** — asterisks on the three fields; add only a paragraph and submit → blocked; fresh form, required fields only with Title formatted set to Heading 1 through the editor dropdown → saves and shows the H1.
- **1578392 view on FE** — H1 = Title formatted, Summary visible, path = `/<slug of Title>`.
- **1578393 edit (BBD)** — add a "Latest news and blogs" paragraph, change Title, reformat Title formatted as a plain paragraph, Save & Close; FE: component visible, text no longer an H1, URL follows the new title.

### 2. Landing page
- **1578361 mandatory** — blank submit → Title and Summary blocked by the browser, still on the form.
- **1578365 required specs** — Title\*, Summary\*, Hero image, CTA URL and Link text visible; saves with only Title and Summary; H1 = title.
- **1578371 create** — Title, Summary, Hero image and CTA; H1 = title, hero image visible, CTA link shows with its href.
- **1578369 delete**, **1578373 edit** — as Homepage; edit checks list row and H1 on the node page.

### 3. Resource ("Resource Listing")
- **1578363 mandatory** — browser blocks blank Title; Title without Resource download → `Resource download field is required.`, page absent from the list.
- **1578364 required specs** — Title\*, Summary, Body editor, Resource download\*, Thumbnail image, Language and Category visible; saves with only Title and Resource download.
- **1578367 create** — all fields filled (Title, Summary, Body, Thumbnail, Language, Resource download, Category); H1 = title; Summary not displayed.
- **1578368 delete**, **1578375 edit** — as above; edit also checks the path `/resources/<slug>`.

### 4. Generic page (BBD cases)
- **1578386 mandatory** — asterisks; only Body completed → blocked; Title + Summary only → saves and shows H1.
- **1578387 view title on FE** — H1 = title, Summary text not displayed.
- **1578389 edit** — open from the list, path = slug of the title; edit Title and Summary; H1 and path follow the new title; Summary not displayed.
- **1578390 delete** — as above.

### 5. News article / Blog post (BBD cases)
- **1578399 mandatory** — Title\*, Summary\*, Image\*, Type\* asterisks; only Body and Author completed → blocked; Title + Summary only → "Image field is required."; add an Image → saves and shows H1.
- **1578400 view on FE** — H1, Summary, Image, Type label ("News article") visible; path = `/blogs-and-news/<slug>`.
- **1578401 edit** — Body text, Author and a "Text" paragraph added, Title changed; FE shows paragraph text, body, author name, new H1 and new path.
- **1578402 delete** — as above.
