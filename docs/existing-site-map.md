# Existing Site Map: vhwpt.com

Source site: https://www.vhwpt.com  
Captured: 2026-04-16  
Discovery methods: Yoast XML sitemaps, WordPress REST API, homepage navigation links, page heading checks.

Note: WordPress is the legacy/source platform only. The rebuild target is a modern non-WordPress implementation.

## Platform Snapshot

- Platform: WordPress
- SEO: Yoast SEO
- Commerce: WooCommerce installed
- Theme signal: VW Fitness Gym / Ibtana Visual Editor related assets
- Public product count: 0 products returned from WooCommerce Store API
- Public REST menu endpoints: present but require authentication

## Primary Navigation

- Home: https://www.vhwpt.com/
- About: https://www.vhwpt.com/about
- Services: https://www.vhwpt.com/category/services
- Online Training: https://www.vhwpt.com/services/online-training
- Personal Training: https://www.vhwpt.com/services/personal-training
- Health Evaluations: https://www.vhwpt.com/services/health-evaluations
- Contact: https://www.vhwpt.com/contact

## Public Pages

### Home

- URL: https://www.vhwpt.com/
- WordPress type: page
- Title: Dr. Bruce Valencia - Health, Wellness and Physical Therapy
- Last modified: 2026-04-06T15:35:12+00:00
- Featured image: https://www.vhwpt.com/wp-content/uploads/2024/07/home-featured-image.jpeg
- Main sections:
  - Welcome
  - Key Benefits
  - Programming Sets
  - Senior Fitness Programs
  - Youth Fitness and Sports Training
  - Weight Management and Nutrition Counseling
  - Corporate Wellness Programs
  - Pre and Postnatal Fitness
  - Holistic Wellness Programs
  - Rehabilitation and Injury Prevention
  - Services
  - Products
  - Connect

### About

- URL: https://www.vhwpt.com/about
- WordPress type: page
- Title: About Dr. Bruce Valencia, DPT/CLT
- Last modified: 2026-02-24T20:15:48+00:00
- Featured image: https://www.vhwpt.com/wp-content/uploads/2024/07/about-featured-image.jpeg
- Main sections:
  - The Beginning
  - Personal Training
  - Comprehensive Plans
  - Positive Changes
  - Services
  - Products
  - Connect

### Contact

- URL: https://www.vhwpt.com/contact
- WordPress type: page
- Title: Contact
- Last modified: 2026-03-06T17:59:37+00:00
- Featured image: https://www.vhwpt.com/wp-content/uploads/2024/07/contact-featured-image.jpeg
- Main sections:
  - Email
  - Phone
  - Fax
  - Social
  - Location
  - Services
  - Products
  - Connect
- Header contact links found:
  - Phone: 19542996536
  - Fax: 15613425258
  - Email: protected by Cloudflare email protection in fetched HTML

## Services Content

The three service URLs are WordPress posts assigned to the `Services` category.

### Services Category Archive

- URL: https://www.vhwpt.com/category/services
- WordPress type: category archive
- Category ID: 17
- Category slug: services
- Public post count: 3

### Health Evaluations

- URL: https://www.vhwpt.com/services/health-evaluations
- WordPress type: post
- Category: Services
- Last modified: 2024-10-10T23:11:36+00:00
- Featured image: https://www.vhwpt.com/wp-content/uploads/2024/10/health-evaluations.jpeg
- Main sections:
  - Comprehensive Health Assessments for Optimal Wellness
  - Health Evaluations as a Personal Trainer
  - Health Evaluations as a Doctor of Physical Therapy
- Excerpt summary: Detailed health evaluations for understanding physical condition and guiding fitness and wellness plans.

### Personal Training

- URL: https://www.vhwpt.com/services/personal-training
- WordPress type: post
- Category: Services
- Last modified: 2024-10-10T23:12:39+00:00
- Featured image: https://www.vhwpt.com/wp-content/uploads/2024/10/personal-training.jpeg
- Main sections:
  - One-on-One Coaching to Maximize Your Fitness Potential
  - Benefits of Personal Training
- Excerpt summary: Individualized coaching and custom workout plans for strength, endurance, and overall wellness.

### Online Training

- URL: https://www.vhwpt.com/services/online-training
- WordPress type: post
- Category: Services
- Last modified: 2024-10-10T23:13:36+00:00
- Featured image: https://www.vhwpt.com/wp-content/uploads/2024/09/online-training.jpeg
- Main sections:
  - Flexible, Accessible Fitness Coaching from Anywhere
  - What You Can Expect from Online Training
- Excerpt summary: Remote fitness coaching with personalized guidance and structured routines.

## Commerce / Account Pages

WooCommerce pages are published and included in the page sitemap, but the public Store API returned no products.

- Shop: https://www.vhwpt.com/shop
- Cart: https://www.vhwpt.com/cart
- Checkout: https://www.vhwpt.com/checkout
- My Account: https://www.vhwpt.com/my-account

## Archive / System URLs

- Author archive: https://www.vhwpt.com/author/admin
- RSS feed: https://www.vhwpt.com/feed
- Comments feed: https://www.vhwpt.com/comments/feed
- Main sitemap index: https://www.vhwpt.com/sitemap_index.xml
- Page sitemap: https://www.vhwpt.com/page-sitemap.xml
- Post sitemap: https://www.vhwpt.com/post-sitemap.xml
- Author sitemap: https://www.vhwpt.com/author-sitemap.xml

## Content Model

- `page`: Home, About, Contact, Shop, Cart, Checkout, My Account
- `post`: Health Evaluations, Personal Training, Online Training
- `category`: Services
- `author`: admin

## Redesign Notes

- Current site uses the service category as both a navigation item and a content archive.
- Service pages are technically posts, not pages, even though they behave like core service landing pages.
- WooCommerce is installed and utility pages exist, but no products are currently public.
- Footer/sidebar sections repeat `Services`, `Products`, and `Connect` across pages.
- The current visual system leans dark/black with bright red accent color `#ff0137`.
- Main brand/search title from metadata: `Dr. Bruce Valencia DPT`.
- SEO description: `Dr. Bruce Valencia health, wellness, and physical therapy. Comprehensive guidance for exercise, diet, rehabilitation, and peak performance.`
