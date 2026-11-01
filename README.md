# Diwali crackers shop

A mobile-first React, Vite and TypeScript storefront for browsing the supplied crackers catalogue, building an enquiry basket, selecting a shop and sending an enquiry through WhatsApp. It does not process orders, payments or customer data on a server.

## Run locally

1. Install Node.js 20 or later.
2. From this folder, install dependencies and start the development server:

   ```sh
   npm install
   npm run dev
   ```

3. Open the local URL printed by Vite.

Create a production build with `npm run build`. To check the built site locally, run `npm run preview`.

## Business details to replace before publishing

Product names are taken from the supplied list. Prices are matched from the workbook's `Sold Price (₹)` column; unmatched products remain “Price on request.” Review the catalogue and price-sheet notes before publishing.

| What to change | File |
| --- | --- |
| Shop/brand name, offer text, opening date and collection label | `src/data/store.ts` |
| Browser/SEO page title | `index.html` |
| Product names, categories, sizes, variations, prices, image paths and review flags | `src/data/products.ts` and `src/data/categories.ts` |
| Combo pack names, fixed prices, images and included product quantities | `src/data/comboOffers.ts` |
| The two shop names, areas, full addresses, opening hours, call numbers and WhatsApp numbers | `src/data/shops.ts` |
| Google Analytics 4 measurement ID | `.env.production` (`VITE_GA_MEASUREMENT_ID`) |

Use the full international dialing number for both `phone` and `whatsapp` in `src/data/shops.ts`, including the country calling code and digits only (no `+`, spaces or punctuation), for example the format `91XXXXXXXXXX`. Do not publish until the details are real. Empty contact numbers intentionally leave the Call and WhatsApp buttons disabled; no sample telephone numbers are included.

## Product data, prices and images

Products are defined in `src/data/products.ts`; category navigation, size filters, and representative category image references are in `src/data/categories.ts`. The locally bundled category photos live in `public/images/categories/`, with source and license details in that folder's README. Product-specific `image` paths override the category reference. To add an exact product image, set `image` to an optimized local path such as `/products/mu-kikkat.webp` and place that file at `public/products/mu-kikkat.webp`. The spreadsheet contained no exact product photos; the category references are representative fireworks imagery and fall back to the product-name placeholder if unavailable. The imported customer prices are held in `soldPrices`; change an entry there to update its price. `soldVariantPrices` holds prices for variants that differ. Only add `packSize` or other specifications when confirmed. `catalogueReviewNotes`, `priceSheetReviewNotes`, and product `reviewFlags` identify uncertain matches and repeats for review.

For example, the shared product helper supports confirmed price and image options:

```ts
product('mu-kikkat', 'mu KikKat', 'Flower Pots', {
   size: 'Small',
   price: 125,
   image: '/products/mu-kikkat.webp',
})
```

The basket total and WhatsApp enquiry automatically use configured prices; products without a price remain marked “Price on request.” The hero image is set in `src/styles.css` as a CSS background image and can be replaced there.

Combo offers are separate fixed-price basket items; edit `src/data/comboOffers.ts` to update a pack. Its displayed product-entry count is derived from the contents list, and each contents row has its own quantity. Combos are sent as complete packages in WhatsApp enquiries and are not expanded into individual basket products.

## Google Analytics 4

The measurement ID lives in `.env.production` in this folder:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Vite writes this value into the JavaScript when you run `npm run build`. It is not read at runtime, so after adding or changing the ID you must rebuild and upload `dist/` again. Hosting-provider environment variables have no effect when you upload a prebuilt folder.

`npm run dev` does not read `.env.production`, so local testing never sends visits to your real property. With the value left empty, the site builds and works without loading any Google script.

The ID is not a secret. It is visible in the page source of every GA site.

The site tracks page views, product views, catalogue/menu views, basket additions, Buy Crackers clicks, location selection, phone clicks and WhatsApp clicks. It does not send phone numbers or WhatsApp message contents to Analytics. Product and page view events are de-duplicated for the lifetime of the page.

### Getting a Measurement ID

1. Go to https://analytics.google.com and sign in.
2. Open Admin, choose Create, then Property. Name it, set the time zone to India and the currency to INR.
3. When asked for a platform, choose Web. Enter your Netlify site address and a stream name.
4. Copy the Measurement ID shown on the stream page. It starts with `G-`.

## Deployment on Netlify Drop

1. Paste your Measurement ID into `.env.production`. Skip this if you are not using Analytics yet.
2. Check the shop details and contact links in `src/data/shops.ts`.
3. Run `npm run build`. This refreshes the `dist/` folder.
4. Log in at https://app.netlify.com. Sites dropped without logging in are deleted after about an hour.
5. Drag the `dist` folder onto https://app.netlify.com/drop. Drag `dist` itself, not the whole project folder.
6. To update the live site later, run `npm run build` again. Then open your site in Netlify, go to Deploys, and drag the new `dist` folder onto that page. The site address stays the same.
7. If Analytics is set up, open the live site, then check Reports, then Realtime in Google Analytics. Your visit should appear within a minute.

No redirect rules are needed. The site is a single page and uses only `#` links.
