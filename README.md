# mrecipes
Repository Cleanup & Architecture Redesign
- Clean up existing unnecessary files, obsolete code, and messy folders in the `mrecipes` repository.
- Establish a clean, scalable folder structure:
  ```text
  /mrecipes
  ├── index.html
  ├── recipes.html
  ├── about.html
  ├── contact.html
  ├── privacy-policy.html
  ├── terms.html
  ├── assets/
  │   ├── css/
  │   │   ├── main.css
  │   │   └── responsive.css
  │   ├── js/
  │   │   ├── header-footer.js (Shared dynamic components)
  │   │   ├── supabaseClient.js (Supabase integration)
  │   │   └── app.js
  │   └── images/
  └── supabase/
      └── schema.sql (Database structure setup)
