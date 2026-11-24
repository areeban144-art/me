# my archive's: website

A moodboard-style front door for https://areebasarchives.substack.com. Every card opens the original Substack post.

## Files
- `index.html`: the whole site (design, layout, and a fallback copy of the article list)
- `api/articles.js`: reads your Substack archive so new posts appear automatically
- `categories.json`: which category each post belongs to (post slug -> category)
- `vercel.json`, `package.json`: hosting settings

## Adding a new post
Automatic: publish on Substack and it shows up on the site within about 30 minutes, with a cover image.
Its category comes from a Substack tag with the same name as one of your tabs (Film, Feminism, Life & People), or from a new line in `categories.json`. A post with neither still appears under "All".
New category tab: tag a post with a new name, or add it to `categories.json`. The tab appears by itself.

## Hiding a post
Add its slug (the last part of its Substack address) to `hidden.json`, then redeploy. Deleting a post on Substack also removes it from the site by itself after about 15 minutes.

## Seeing what Substack sends
Open `your-site-address/api/articles?debug=1` to see each post's slug and tags.

## Preview locally
`npx vercel dev` (the sync route only runs under Vercel). Opening `index.html` directly works too and shows the built-in article list.

## Publish
Only after you approve the preview: `npx vercel --prod` and sign in to your own Vercel account when asked.
