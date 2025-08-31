[English](./README.md) | [中文](./README_zh.md)

# ZZX Blog Project Description

This is more than just a website; it is:
- A comprehensive showcase of technical capabilities.
- An ever-growing personal knowledge base.
- A compelling digital business card.
- A time machine that records personal growth.
- A window to connect with the world.

## 1. Project Architecture Overview

ZZX Blog is a personal blog system built with the Hugo static site generator and the PaperMod theme. It utilizes a purely static architecture, characterized by high performance, ease of deployment, and robust security.

### 1.1 Tech Stack
- **Static Site Generator**: Hugo (v0.146.0+) - A high-performance static website generator written in Go.
- **Theme Framework**: PaperMod - A clean, responsive, and feature-rich Hugo theme.
- **Frontend Technologies**: HTML5, CSS3, JavaScript.
- **Search Functionality**: Fuse.js (v7.0.0) - A lightweight fuzzy-search library.
- **Math Formula Rendering**: KaTeX - A fast math typesetting library for the web.
- **Code Highlighting**: highlight.js - A syntax highlighting library for code snippets.
- **Version Control**: Git.

### 1.2 Directory Structure

The project follows the standard Hugo directory structure, primarily divided into content, layout, asset, and configuration layers:

```
├── content/            # Content directory, stores all posts and pages.
├── layouts/            # Layout templates, for overriding or extending default theme templates.
├── assets/             # Asset files (CSS, JS, etc.).
├── static/             # Static files (images, fonts, etc.).
├── themes/             # Theme directory.
│   └── papermod/       # PaperMod theme.
├── hugo.yaml           # Website configuration file.
└── .gitignore          # Git ignore file configuration.
```

## 2. Core Feature Implementation

### 2.1 Search Functionality

The site's search feature is powered by Fuse.js, supporting fuzzy search and real-time results.

#### How it Works
1.  **Index Building**: A search index is generated via the `layouts/_default/index.json` template, containing key information such as post titles, content, permalinks, and summaries.

2.  **Search Page**: The file `content/search/_index.md` defines the search page, using `layout: "search"` to specify a dedicated layout.

3.  **Frontend Implementation**: The search logic is handled by the `fastsearch.js` script:
    -   Loads the `index.json` file using XMLHttpRequest.
    -   Configures Fuse.js search parameters (threshold: 0.4, search keys include title, content, summary, etc.).
    -   Listens for input events on the search box to display results in real-time.

4.  **UI Components**: The search page includes a search container (#searchbox), an input field (#searchInput), and a results list (#searchResults), with support for autofocus and keyboard navigation.

5.  **Homepage Integration**: The homepage search bar is implemented via `layouts/partials/search_bar.html`, featuring autofocus and an `Alt+/` keyboard shortcut.

### 2.2 Table of Contents (TOC) Generation

The TOC is generated using the `layouts/partials/toc.html` template, providing hierarchical navigation for post content.

#### How it Works
1.  **Header Extraction**: A regular expression `findRE "<h[1-6].*?>(.|\n])+?</h[1-6]>" .Content` is used to extract all heading tags from the post content.

2.  **Hierarchy Construction**: A multi-level TOC structure is dynamically built by analyzing the heading levels (h1-h6).

3.  **Anchor Links**: Anchor links are created for each heading, enabling smooth scrolling to the corresponding section when a TOC item is clicked.

4.  **Responsive Design**:
    -   On large screens, the TOC is fixed to the left of the content.
    -   On small screens, the TOC collapses into a toggleable sidebar.
    -   The `toc-container.wide` class controls the TOC's display position.

5.  **Interactive Enhancements**:
    -   Automatically highlights the currently viewed section.
    -   Supports opening/closing the TOC with the `Alt+C` shortcut.
    -   Automatically centers the active TOC item within the viewport during scroll.

### 2.3 Responsive Design & Theme Switching

The website features a fully responsive design and a light/dark theme switcher to enhance user experience and accessibility.

#### Responsive Design Implementation
1.  **Flexible Layout**: Uses Flexbox and CSS variables for a flexible page structure.
2.  **Media Queries**: Optimizes display for different screen sizes.
3.  **Adaptive Components**: The navigation bar, content area, and sidebar automatically adjust their layout based on screen width.
4.  **Mobile-First**: Adheres to a mobile-first design philosophy to ensure a great browsing experience on mobile devices.

#### Theme Switching Implementation
1.  **State Management**: Uses `localStorage` to store the user's theme preference.
2.  **System Preference Detection**: Automatically selects a theme based on the browser's `prefers-color-scheme` media feature.
3.  **Manual Toggle**: A theme toggle button (moon/sun icon) allows users to manually switch between light and dark modes.
4.  **Color Variables**: Uses CSS variables to define color schemes for different themes, enabling seamless switching.

```javascript
// Core theme-switching logic
document.getElementById("theme-toggle").addEventListener("click", () => {
    if (document.body.className.includes("dark")) {
        document.body.classList.remove('dark');
        localStorage.setItem("pref-theme", 'light');
    } else {
        document.body.classList.add('dark');
        localStorage.setItem("pref-theme", 'dark');
    }
})
```

### 2.4 Multiple Homepage Layouts

The website supports three homepage layouts, which can be easily configured.

#### Profile Mode
1.  **Implementation File**: `layouts/partials/index_profile.html`
2.  **Features**: A centered layout displaying a profile picture, personal information, social links, and action buttons.
3.  **Configuration**: Configured via `site.Params.profileMode` to set the title, subtitle, avatar, and button links.
4.  **Image Processing**: Automatically resizes and formats the avatar to optimize loading performance.

#### Home-Info Mode
1.  **Implementation File**: `layouts/partials/home_info.html`
2.  **Features**: Displays an introductory block of content before the list of posts.
3.  **Configuration**: Configured via `site.Params.homeInfoParams` to set the title and content.

#### Regular Mode
1.  **Implementation File**: `layouts/_default/list.html`
2.  **Features**: A standard blog layout that lists posts.
3.  **Sorting & Pagination**: Supports sorting by date and paginating through posts.
4.  **Special Styling**: The first post can be styled differently for emphasis.

### 2.5 Math Formula Rendering

The site integrates the KaTeX engine to render complex mathematical formulas within posts.

#### How it Works
1.  **Syntax Support**: Compatible with LaTeX syntax, supporting both inline formulas (`$...$`) and block-level formulas (`$$...$$`).
2.  **Formula Types**: Supports a wide range of mathematical symbols and structures, including superscripts, subscripts, fractions, radicals, Greek letters, vectors, calculus symbols, and matrices.
3.  **Configuration**: KaTeX support is enabled in the `hugo.yaml` configuration file.

### 2.6 Code Highlighting & Copying

Code blocks are enhanced with syntax highlighting and a one-click copy function.

#### How it Works
1.  **Code Highlighting**: Integrates highlight.js to provide syntax highlighting for numerous programming languages.
2.  **Copy Functionality**: A copy button is added to each code block, allowing users to copy the code to their clipboard.
3.  **User Feedback**: A "copied!" message is displayed upon a successful copy action.

## 3. Page Layout & Template System

### 3.1 Base Template Structure

The site uses Hugo's template inheritance system to create a consistent page structure:

1.  **`baseof.html`**: Defines the fundamental HTML skeleton, including the head, header, main content area, and footer.
2.  **`head.html`**: Manages all resources in the `<head>` tag, such as CSS, JavaScript, and metadata.
3.  **`header.html`**: Implements the site's navigation bar, including the logo, menu, and theme toggle.
4.  **`footer.html`**: Implements the site footer, containing copyright information and a "back to top" button.

### 3.2 Page Types

The site supports various page types, each handled by a dedicated template:

1.  **Homepage**: Displays in Profile, Home-Info, or Regular mode based on configuration.
2.  **Single Post Page**: Shows the full post content, TOC, metadata, and related posts.
3.  **Search Page**: Provides the search interface and displays results.
4.  **Archive Page**: Lists posts organized by date or category.
5.  **Tag Page**: Lists all posts associated with a specific tag.

## 4. Customization & Extension

### 4.1 CSS Customization

The default theme styles have been extended with custom CSS:

1.  **`assets/css/extended/toc.css`**: Customizes the TOC's style, including width, height, and scroll behavior.
2.  **`assets/css/extended/top.css`**: Customizes the style and interactive effects of the "back to top" button.
3.  **`assets/css/extended/homepage_background.css`**: Adds a background image to the homepage and customizes the Profile mode styles.

### 4.2 Feature Extensions

1.  **Homepage Search Bar**: A custom search bar component was implemented and integrated into the Profile mode.
2.  **Reading Progress Indicator**: A scroll progress bar was added to indicate reading progress on pages.
3.  **Easter Egg Links**: Special "easter egg" links have been added throughout the site.

## 5. Performance Optimization

### 5.1 Asset Optimization

1.  **Image Processing**: Images are automatically compressed and resized to improve load times.
2.  **Asset Caching**: `partialCached` is used to cache frequently used templates, reducing render times.
3.  **Lazy Loading**: Non-critical resources are lazy-loaded to optimize the initial page load speed.

### 5.2 Preloading Strategy

1.  **Search Index Preloading**: The `index.json` file is preloaded on the search page to improve search responsiveness.
2.  **Critical CSS Inlining**: Critical CSS is inlined directly into the HTML to reduce render-blocking.

## 6. Deployment & Build

### 6.1 Build Process

1.  **Local Development**: Use `hugo server` to start a local development server with live preview and hot-reloading.
2.  **Production Build**: Use the `hugo` command to generate the static site files into the `public` directory.
3.  **File Generation**: The build process automatically generates all necessary HTML, CSS, JavaScript, and other static assets.

### 6.2 Deployment Methods

1.  **Static Hosting**: The generated `public` directory can be deployed to any static file hosting service.
2.  **CI/CD Integration**: Can be integrated with platforms like GitHub Pages or Netlify for automated builds and deployments.

## 7. Configuration

The site's main settings are centralized in the `hugo.yaml` file, including:

1.  **Basic Settings**: Site title, description, language, theme, etc.
2.  **Feature Toggles**: Enable/disable features like the TOC, KaTeX, and social share buttons.
3.  **Navigation Menu**: Configuration for the main navigation menu.
4.  **Homepage Mode**: Settings for Profile or Home-Info modes.
5.  **Custom Parameters**: Detailed parameter settings for various features.

## 8. Summary & Highlights

ZZX Blog is a feature-complete, high-performance, and modern static blog system. Its key technical highlights include:

1.  **High-Performance Architecture**: Built on Hugo for fast page loads and excellent security.
2.  **Fully Responsive Design**: Adapts flawlessly to all screen sizes for a consistent user experience.
3.  **Intelligent Search**: Integrates Fuse.js for efficient and effective fuzzy search.
4.  **Versatile Homepage Layouts**: Supports three distinct homepage modes to suit different needs.
5.  **Native Math Formula Support**: Integrates KaTeX for professional-grade mathematical typesetting.
6.  **Highly Customizable**: Easily extend and modify the site's appearance and functionality through template overrides and custom CSS.

