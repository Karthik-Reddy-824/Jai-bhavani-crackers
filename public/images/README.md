# Site Images

`hero.jpg` is the home page hero background. It is an Unsplash photo, resized to 1920 pixels wide and bundled locally so the site does not depend on Unsplash at runtime. The Unsplash License permits commercial use: https://unsplash.com/license.
`jai-bhavani-logo.png` is the supplied Jai Bhavani Crackers logo, shown beside the brand name in the header and footer.

| File | Unsplash source |
| --- | --- |
| `hero.jpg` | https://unsplash.com/photos/photo-1498931299472-f7a63a5a1cfa |

Category thumbnails and their sources are listed in `categories/README.md`.

## Linked Pexels photos

These photos are not stored in this folder. They are linked directly from `images.pexels.com` through the `pexelsImage` helper in `src/data/images.ts`. The Pexels License permits commercial use: https://www.pexels.com/license/. If a product photo link ever stops working, its card falls back to the category photo, then to the built-in placeholder if that image also fails.

Each catalogue product has its own distinct Pexels photo, chosen to represent its category or a related type of firework. These are illustrative photos, not photos of the exact branded products. The photo IDs are assigned in `categoryPhotoIds` in `src/data/products.ts`.

| Used for | Pexels photo |
| --- | --- |
| Flower Pots, Fancy, Rockets and Shots | https://www.pexels.com/search/fireworks/ |
| Ground Chakkars | https://www.pexels.com/search/sparks/ |
| Sparklers and Kids Special | https://www.pexels.com/search/sparkler/ |
| Big Sounds, Local Desi Special and Walas (Laadi) | https://www.pexels.com/search/firecracker/ |

The local `categories/rockets.jpg` and `categories/local-desi-special.jpg` are no longer used. `categories/big-sounds.jpg` and `categories/kids-special.jpg` are still used by the combo offer cards.
