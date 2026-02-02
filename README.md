# Curated Memoirs by StoryKeepeer — Application Page

This project is a single-page, static application website for Curated Memoirs by StoryKeepeer. It is built with vanilla HTML, CSS, and JavaScript and is designed to work with Netlify-style form capture as well as local static hosting.

## Files

- `index.html` — Page structure and content.
- `styles.css` — Styling, responsive layout, light/dark themes.
- `app.js` — Form behavior, validation, conditional fields, and smooth scrolling.

## Local preview

Open `index.html` directly in a browser. The form will validate client-side and show a success panel when `?success=true` or `#success` is present in the URL.

## Netlify form capture

The form is configured with:

- `data-netlify="true"`
- A hidden `form-name` input matching the form’s `name`
- A honeypot field via `data-netlify-honeypot`

When hosted on Netlify, submissions will be captured automatically.
