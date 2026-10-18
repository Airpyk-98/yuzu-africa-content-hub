export const DEFAULT_ADMIN = {
  id: 'admin_yuzuafrica_com',
  email: 'admin@yuzuafrica.com',
  name: 'Yuzu Africa Admin',
  password: 'Admin321',
  role: 'admin',
  status: 'approved',
  createdAt: '2026-10-18T08:00:00Z',
  updatedAt: '2026-10-18T08:00:00Z'
};

export const DEFAULT_MANAGER = {
  id: 'ebiringai_gmail_com',
  email: 'ebiringai@gmail.com',
  name: 'Ikechukwu Paul Ebiringa',
  password: 'Airpyk98',
  role: 'manager',
  status: 'approved',
  createdAt: '2026-10-18T08:05:00Z',
  updatedAt: '2026-10-18T08:05:00Z'
};

export const PLATFORMS = [
  'Instagram',
  'TikTok',
  'LinkedIn',
  'X',
  'Facebook',
  'WhatsApp'
];

export const POST_TYPES = [
  'Carousel',
  'Reel',
  'Video',
  'Quote Card',
  'Poll',
  'Case Study',
  'Testimonial',
  'Fill-In',
  'Promo',
  'Thread',
  'Tip',
  'Hot Take',
  'Insight',
  'Doc Carousel',
  'Status',
  'Broadcast',
  'Community'
];

const RAW_NOV_2026_POSTS = [
  // ================= INSTAGRAM =================
  { date: '2026-11-02', platform: 'Instagram', postType: 'Carousel', pillar: 'Education', title: '5 reasons people follow you but never buy', caption: 'Here are 5 reasons people follow you but never buy. Every piece of content should connect to a lead or a sale. #YuzuAfrica #ScrollToSale #NaijaBrandsGrow' },
  { date: '2026-11-03', platform: 'Instagram', postType: 'Reel', pillar: 'Service Spotlight', title: "Your page is giving 'we sell everything'. Fix it.", caption: "Your page is giving 'we sell everything'. Let's fix that so customers know exactly why to buy from you. #YuzuAfrica #ScrollToSale" },
  { date: '2026-11-04', platform: 'Instagram', postType: 'Quote Card', pillar: 'Engagement', title: "Followers don't pay rent. Customers do.", caption: "Followers don't pay rent. Customers do. Stop paying for likes. Start paying for leads. #YuzuAfrica #ScrollToSale" },
  { date: '2026-11-05', platform: 'Instagram', postType: 'Reel', pillar: 'Trend + Proof', title: 'What Yuzu Africa does: scroll to sale in 20 seconds', caption: 'Full-funnel growth for Nigerian brands: content, creators, telesales and field agents under one roof. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-06', platform: 'Instagram', postType: 'Promo', pillar: 'Promo & CTA', title: 'Book a free brand audit', caption: 'Ready to turn your followers into paying customers? Book a free brand audit today via the link in bio. #YuzuAfrica #YuzuZest' },

  { date: '2026-11-09', platform: 'Instagram', postType: 'Carousel', pillar: 'Education', title: '4 reasons your DMs never turn into sales', caption: 'Most Nigerian brands lose sales between the DM and the follow-up. Fix these 4 leaks today. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-10', platform: 'Instagram', postType: 'Reel', pillar: 'Service Spotlight', title: 'Leads are worthless until someone follows up', caption: 'Leads are worthless until someone follows up. Our CRM and telesales team closes the gap. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-11', platform: 'Instagram', postType: 'Poll', pillar: 'Engagement', title: 'Reply fast or reply perfect? Pick one', caption: 'When a lead enters your DM, do you reply fast or wait for the perfect pitch? Drop your vote below. #YuzuAfrica #NaijaBrandsGrow' },
  { date: '2026-11-12', platform: 'Instagram', postType: 'Reel', pillar: 'Trend + Proof', title: 'Trending sound: why your leads go cold', caption: 'Wait 24 hours to reply and the sale is gone. Reply within 60 minutes. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-13', platform: 'Instagram', postType: 'Case Study', pillar: 'Client Wins', title: 'Lead capture to closed sale', caption: 'How structured WhatsApp and CRM pipelines turned cold inquiries into repeat buyers. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-16', platform: 'Instagram', postType: 'Carousel', pillar: 'Education', title: 'Why UGC builds more trust than ads', caption: 'Real people selling your product builds more trust than any polished ad. Swipe to see why. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-17', platform: 'Instagram', postType: 'Reel', pillar: 'Service Spotlight', title: 'What is affiliate and UGC? Explained in 30 seconds', caption: 'Creator sourcing, UGC content packs, and affiliate tracking built for D2C brands. #YuzuAfrica #YuzuZest' },
  { date: '2026-11-18', platform: 'Instagram', postType: 'Poll', pillar: 'Engagement', title: 'Would you trust an ad or a real customer?', caption: 'Be honest: what makes you buy faster — a studio ad or a real customer review? #YuzuAfrica #NaijaBrandsGrow' },
  { date: '2026-11-19', platform: 'Instagram', postType: 'Reel', pillar: 'Trend + Proof', title: 'Trending sound: the creator brief that works', caption: 'Clear objective, mandatory talking points, one clear CTA. How we brief creators to sell. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-20', platform: 'Instagram', postType: 'Testimonial', pillar: 'Client Wins', title: 'Creator or client win', caption: 'Real campaign results from our UGC and creator network. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-23', platform: 'Instagram', postType: 'Carousel', pillar: 'Education', title: 'Black Friday checklist for small brands', caption: 'Before you slash prices this Black Friday, make sure your follow-up system is ready. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-24', platform: 'Instagram', postType: 'Reel', pillar: 'Service Spotlight', title: 'What does an offline agent manager actually do?', caption: 'Your field team should perform like a system, not a gamble. We recruit, train and manage offline agents. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-25', platform: 'Instagram', postType: 'Fill-In', pillar: 'Engagement', title: 'My Black Friday offer is ____', caption: 'Drop your Black Friday offer in one sentence below! Let customers find you. #YuzuAfrica #NaijaBrandsGrow' },
  { date: '2026-11-26', platform: 'Instagram', postType: 'Reel', pillar: 'Trend + Proof', title: '3 Black Friday mistakes to avoid', caption: 'No follow-up, confusing offer, slow DM replies. Avoid these 3 mistakes tomorrow. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-27', platform: 'Instagram', postType: 'Promo', pillar: 'Promo & CTA', title: 'Black Friday: book a free brand audit', caption: 'Finish the year strong. Book your free full-funnel brand audit with Yuzu Africa. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-30', platform: 'Instagram', postType: 'Carousel', pillar: 'Education', title: 'Cyber Monday + November recap: 3 lessons we learned', caption: '3 real marketing lessons from November campaigns that closed sales. #YuzuAfrica #ScrollToSale' },

  // ================= TIKTOK =================
  { date: '2026-11-02', platform: 'TikTok', postType: 'Video', pillar: 'Education', title: '3 mistakes killing your Instagram sales', caption: '3 mistakes killing your Instagram sales right now. Fix number 2 today. #YuzuAfrica #ScrollToSale #NaijaBrandsGrow' },
  { date: '2026-11-04', platform: 'TikTok', postType: 'Video', pillar: 'Trend', title: 'This trending sound, but make it a sales lesson', caption: 'Likes look good, but closed sales pay the bills. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-06', platform: 'TikTok', postType: 'Video', pillar: 'Founder', title: 'Why we started Yuzu Africa (avatar, approved script)', caption: 'Why we built Yuzu Africa: taking Nigerian brands from first scroll to final sale. #YuzuAfrica #YuzuZest' },

  { date: '2026-11-09', platform: 'TikTok', postType: 'Video', pillar: 'Education', title: 'Your DM is where sales die', caption: 'Your DM is where sales die when nobody follows up within an hour. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-11', platform: 'TikTok', postType: 'Video', pillar: 'Trend', title: 'Trending sound: why your leads go cold', caption: 'How fast do you reply to "How much?" in your DMs? #YuzuAfrica #NaijaBrandsGrow' },
  { date: '2026-11-12', platform: 'TikTok', postType: 'Video', pillar: 'Service Spotlight', title: 'What is telesales, really?', caption: 'Outsourced telesales scripts and calls that actually convert warm leads. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-13', platform: 'TikTok', postType: 'Video', pillar: 'Engagement', title: 'You asked, we answered: can Instagram really bring sales?', caption: 'Yes—when your content connects to a clear offer and fast CRM follow-up. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-16', platform: 'TikTok', postType: 'Video', pillar: 'Education', title: 'Why people trust UGC more than ads', caption: 'Customers trust real people showing how your product works. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-18', platform: 'TikTok', postType: 'Video', pillar: 'Trend', title: 'Trending sound: the creator brief that works', caption: 'Stop sending vague briefs to creators. Use our 7-point checklist. #YuzuAfrica #YuzuZest' },
  { date: '2026-11-20', platform: 'TikTok', postType: 'Video', pillar: 'Behind Scenes', title: 'A day on a creator shoot', caption: 'Behind the scenes shooting high-converting UGC packs with Yuzu Africa. #YuzuAfrica #NaijaBrandsGrow' },

  { date: '2026-11-23', platform: 'TikTok', postType: 'Video', pillar: 'Education', title: '3 Black Friday mistakes small brands make', caption: 'Watch this before launching your Black Friday discount. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-25', platform: 'TikTok', postType: 'Video', pillar: 'Trend', title: 'Trending sound: the Black Friday sales lesson', caption: 'Discounts attract clicks. Follow-up closes the sale. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-26', platform: 'TikTok', postType: 'Video', pillar: 'Service Spotlight', title: 'A day in the life of an agent manager', caption: 'How we train and manage field sales agents across Nigeria. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-27', platform: 'TikTok', postType: 'Promo', pillar: 'Promo & CTA', title: 'Free brand audit: how to book', caption: 'Tap the link in our bio to book your free brand audit with Yuzu Africa. #YuzuAfrica #YuzuZest' },

  { date: '2026-11-30', platform: 'TikTok', postType: 'Video', pillar: 'Recap', title: 'November: 3 lessons from our best posts', caption: 'What worked best this month and how to apply it to your December campaigns. #YuzuAfrica #ScrollToSale' },

  // ================= LINKEDIN =================
  { date: '2026-11-03', platform: 'LinkedIn', postType: 'Insight', pillar: 'Education', title: 'Your content should sell, not just look nice', caption: 'Many growing brands invest heavily in visual aesthetics while neglecting conversion pathways. Here is how full-funnel alignment bridges the gap from scroll to sale. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-05', platform: 'LinkedIn', postType: 'Insight', pillar: 'Founder-Led', title: 'Why we started Yuzu Africa', caption: 'We started Yuzu Africa because Nigerian SMEs needed more than posts and ads—they needed telesales, offline agent systems, and hands-on team training. #YuzuAfrica #NaijaBrandsGrow' },
  { date: '2026-11-10', platform: 'LinkedIn', postType: 'Insight', pillar: 'Education', title: 'Most Nigerian brands lose sales between the DM and the follow-up. Here is why', caption: 'Lead generation without a structured CRM pipeline wastes ad spend. Here is how to fix your 60-minute response window. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-12', platform: 'LinkedIn', postType: 'Doc Carousel', pillar: 'Service Spotlight', title: 'A simple lead follow-up framework (PDF)', caption: 'Swipe through our 5-step lead follow-up framework used by our CRM and telesales teams. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-17', platform: 'LinkedIn', postType: 'Insight', pillar: 'Education', title: 'Real people selling your product beats any ad', caption: 'Why structured UGC and affiliate programmes outperform traditional awareness ads for D2C brands. #YuzuAfrica #YuzuZest' },
  { date: '2026-11-19', platform: 'LinkedIn', postType: 'Insight', pillar: 'Founder-Led', title: 'What we have learned working with creators', caption: 'Clear briefs, fast payouts, and measurable conversion tracking build long-term creator partnerships. #YuzuAfrica #NaijaBrandsGrow' },
  { date: '2026-11-24', platform: 'LinkedIn', postType: 'Doc Carousel', pillar: 'Education', title: 'Black Friday readiness: follow-up matters more than the discount', caption: 'How to prepare your sales desk and WhatsApp pipeline for high-volume Black Friday traffic. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-26', platform: 'LinkedIn', postType: 'Insight', pillar: 'Team-Led', title: 'How we manage field agents like a system', caption: 'Recruiting, training, and tracking offline sales agents for FMCG, fintech, and retail growth. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-30', platform: 'LinkedIn', postType: 'Insight', pillar: 'Recap', title: 'November lessons: what worked, what we would change', caption: 'A transparent look at our November full-funnel campaigns and key takeaways for Q4. #YuzuAfrica #ScrollToSale' },

  // ================= X (TWITTER) =================
  { date: '2026-11-02', platform: 'X', postType: 'Tip', pillar: 'Education', title: 'Your content should sell, not just look nice.', caption: 'Your content should sell, not just look nice. Every post needs a clear next step. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-03', platform: 'X', postType: 'Tip', pillar: 'Service Spotlight', title: 'From scroll to sale: what we do in one tweet', caption: 'We create the content, source the creators, call the leads, manage the field agents, and train your team. #YuzuAfrica' },
  { date: '2026-11-04', platform: 'X', postType: 'Thread', pillar: 'Education', title: '5 reasons people follow you but never buy', caption: '5 reasons people follow your brand page but never buy (Thread) 🧵👇 #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-05', platform: 'X', postType: 'Hot Take', pillar: 'Engagement', title: "Followers don't pay rent. Customers do.", caption: "Hot take: followers don't pay rent. Customers do. #YuzuAfrica #ScrollToSale" },
  { date: '2026-11-06', platform: 'X', postType: 'Poll', pillar: 'Engagement', title: 'What is stopping your sales right now?', caption: 'What is the biggest bottleneck in your sales funnel right now? Low traffic, cold DMs, or no follow-up? #YuzuAfrica' },
  { date: '2026-11-07', platform: 'X', postType: 'Tip', pillar: 'Trend', title: "Trend reaction: the marketing lesson in this week's talk of the town", caption: 'Attention is cheap; conversion takes a system. Here is the marketing lesson from this week. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-09', platform: 'X', postType: 'Tip', pillar: 'Education', title: 'Reply to leads within 1 hour. Here is why', caption: 'Reply to new leads within 60 minutes. After 1 hour, conversion drops sharply. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-10', platform: 'X', postType: 'Tip', pillar: 'Service Spotlight', title: 'What outsourced telesales actually looks like', caption: 'Trained callers, proven scripts, and clean CRM notes—so no warm lead slips away. #YuzuAfrica' },
  { date: '2026-11-11', platform: 'X', postType: 'Thread', pillar: 'Education', title: 'From DM to sale in 5 steps', caption: 'How to take a prospect from "How much?" in your DMs to a confirmed payment in 5 steps 🧵 #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-12', platform: 'X', postType: 'Hot Take', pillar: 'Engagement', title: 'Leads are worthless until someone follows up.', caption: 'Leads are worthless until someone follows up. Stop blaming the ad when the inbox is unmonitored. #YuzuAfrica' },
  { date: '2026-11-13', platform: 'X', postType: 'Poll', pillar: 'Engagement', title: 'How fast do you reply to new leads?', caption: 'How fast does your team reply to a new WhatsApp or Instagram lead during working hours? #YuzuAfrica' },
  { date: '2026-11-14', platform: 'X', postType: 'Tip', pillar: 'Trend', title: "Trend reaction: the sales lesson in this week's talk of the town", caption: 'Every viral moment has a sales lesson if you look at the funnel behind it. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-16', platform: 'X', postType: 'Tip', pillar: 'Education', title: 'A good creator brief fits in one line. Here it is', caption: 'Product + Audience problem + Proof point + Single CTA = a creator brief that converts. #YuzuAfrica' },
  { date: '2026-11-17', platform: 'X', postType: 'Tip', pillar: 'Service Spotlight', title: 'Affiliate and UGC in one tweet', caption: 'We recruit authentic creators, produce UGC packs, and track every affiliate sale for your brand. #YuzuAfrica' },
  { date: '2026-11-18', platform: 'X', postType: 'Thread', pillar: 'Education', title: 'How to brief a creator: the 7-point checklist', caption: 'Before you pay any creator, make sure your brief covers these 7 points 🧵 #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-19', platform: 'X', postType: 'Hot Take', pillar: 'Engagement', title: 'Real people selling beats ads.', caption: 'Real people demonstrating your product beats a studio graphic every single time. #YuzuAfrica' },
  { date: '2026-11-20', platform: 'X', postType: 'Poll', pillar: 'Engagement', title: 'UGC or influencer?', caption: 'For pure sales conversion, which works better for your brand: relatable UGC or big-name influencers? #YuzuAfrica' },
  { date: '2026-11-21', platform: 'X', postType: 'Tip', pillar: 'Trend', title: "Trend reaction: the sales lesson in this week's talk of the town", caption: 'Relatability closes deals faster than hype. #YuzuAfrica #ScrollToSale' },

  { date: '2026-11-23', platform: 'X', postType: 'Tip', pillar: 'Education', title: 'Black Friday: lock your offer before Wednesday', caption: 'Lock your Black Friday offer and brief your sales callers before Wednesday. #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-24', platform: 'X', postType: 'Tip', pillar: 'Service Spotlight', title: 'What an offline agent manager does', caption: 'We recruit, train, and supervise field sales agents so your offline revenue runs like clockwork. #YuzuAfrica' },
  { date: '2026-11-25', platform: 'X', postType: 'Thread', pillar: 'Education', title: 'Black Friday checklist for small brands', caption: 'The ultimate Black Friday sales execution checklist for Nigerian SMEs 🧵 #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-26', platform: 'X', postType: 'Hot Take', pillar: 'Engagement', title: "Discounts don't close. Follow-up does.", caption: "Discounts don't close sales. Fast, structured follow-up does. #YuzuAfrica" },
  { date: '2026-11-27', platform: 'X', postType: 'Tip', pillar: 'Promo & CTA', title: 'Black Friday: live reactions and quick tips', caption: 'Black Friday live check-in: keep your WhatsApp quick replies ready and follow up on every cart! #YuzuAfrica' },
  { date: '2026-11-28', platform: 'X', postType: 'Fill-In', pillar: 'Engagement', title: 'My best sale this year was ____', caption: 'Fill in the blank: My best sale this year came from ____. #YuzuAfrica #NaijaBrandsGrow' },

  { date: '2026-11-30', platform: 'X', postType: 'Tip', pillar: 'Recap', title: 'Cyber Monday: 3 quick wins for your brand', caption: 'Cyber Monday: follow up on Friday leads, bundle your best-seller, and ask happy buyers for reviews. #YuzuAfrica' },

  // ================= FACEBOOK =================
  { date: '2026-11-02', platform: 'Facebook', postType: 'Carousel', pillar: 'Education', title: '5 reasons people follow you but never buy', caption: 'Here are 5 reasons people follow your page but never buy—and how to fix each one today. Send us a message to book a free audit! #YuzuAfrica #ScrollToSale' },
  { date: '2026-11-03', platform: 'Facebook', postType: 'Reel', pillar: 'Service Spotlight', title: "Your page is giving 'we sell everything'", caption: 'Make your offer clear so customers know exactly what to buy. Message us to get started. #YuzuAfrica' },
  { date: '2026-11-05', platform: 'Facebook', postType: 'Reel', pillar: 'Trend + Proof', title: 'What Yuzu Africa does in 20 seconds', caption: 'From social media content to telesales and field agents—we help Nigerian businesses close sales. #YuzuAfrica' },
  { date: '2026-11-06', platform: 'Facebook', postType: 'Community', pillar: 'Engagement', title: 'What is your biggest social media headache? Tell us below', caption: 'Business owners: what is your biggest social media or sales headache right now? Tell us in the comments! #YuzuAfrica' },

  { date: '2026-11-09', platform: 'Facebook', postType: 'Carousel', pillar: 'Education', title: '4 reasons your DMs never turn into sales', caption: 'Stop losing warm buyers in your inbox. Here are 4 ways to turn Messenger and WhatsApp chats into sales. #YuzuAfrica' },
  { date: '2026-11-10', platform: 'Facebook', postType: 'Reel', pillar: 'Service Spotlight', title: 'Leads are worthless until someone follows up', caption: 'Our CRM and telesales team follows up on every lead so you never miss a sale. #YuzuAfrica' },
  { date: '2026-11-12', platform: 'Facebook', postType: 'Reel', pillar: 'Trend + Proof', title: 'Trending sound: why your leads go cold', caption: 'Fast replies win customers. Reply within 60 minutes during working hours. #YuzuAfrica' },
  { date: '2026-11-13', platform: 'Facebook', postType: 'Community', pillar: 'Engagement', title: 'How long do you take to reply to a lead?', caption: 'Be honest—how long does it take your page to reply to a new customer inquiry? #YuzuAfrica' },

  { date: '2026-11-16', platform: 'Facebook', postType: 'Carousel', pillar: 'Education', title: 'Why UGC builds more trust than ads', caption: 'Real customer and creator videos build instant credibility for your business. #YuzuAfrica' },
  { date: '2026-11-17', platform: 'Facebook', postType: 'Reel', pillar: 'Service Spotlight', title: 'Affiliate and UGC in 30 seconds', caption: 'How Yuzu Africa sets up creator and affiliate campaigns that drive real orders. #YuzuAfrica' },
  { date: '2026-11-19', platform: 'Facebook', postType: 'Reel', pillar: 'Trend + Proof', title: 'The creator brief that works', caption: 'How to brief creators clearly so their videos actually bring paying buyers. #YuzuAfrica' },
  { date: '2026-11-20', platform: 'Facebook', postType: 'Community', pillar: 'Engagement', title: 'Ad or real customer: who do you trust?', caption: 'When shopping online in Nigeria, do you trust a sponsored ad or a real customer video more? #YuzuAfrica' },

  { date: '2026-11-23', platform: 'Facebook', postType: 'Carousel', pillar: 'Education', title: 'Black Friday checklist for small brands', caption: 'Everything your business needs in place before Friday sales go live. #YuzuAfrica' },
  { date: '2026-11-24', platform: 'Facebook', postType: 'Reel', pillar: 'Service Spotlight', title: 'What an offline agent manager does', caption: 'Need boots on the ground? We recruit, train, and manage field sales agents. #YuzuAfrica' },
  { date: '2026-11-26', platform: 'Facebook', postType: 'Reel', pillar: 'Trend + Proof', title: '3 Black Friday mistakes', caption: 'Avoid these 3 common Black Friday mistakes and close more sales this weekend. #YuzuAfrica' },
  { date: '2026-11-27', platform: 'Facebook', postType: 'Promo', pillar: 'Promo & CTA', title: 'Black Friday: book a free brand audit', caption: 'Send us a message on Messenger or WhatsApp today to claim your free brand audit! #YuzuAfrica' },

  { date: '2026-11-30', platform: 'Facebook', postType: 'Carousel', pillar: 'Recap', title: 'November recap: 3 lessons', caption: '3 practical marketing lessons from November to help you finish the year strong. #YuzuAfrica' },

  // ================= WHATSAPP BUSINESS =================
  { date: '2026-11-02', platform: 'WhatsApp', postType: 'Status', pillar: 'Education', title: 'Tip card: content should sell', caption: 'Status Card: Your content should connect to a lead or a sale. Reply "AUDIT" to review your page.' },
  { date: '2026-11-03', platform: 'WhatsApp', postType: 'Status', pillar: 'Service Spotlight', title: 'Service snapshot', caption: 'Status Card: Full-funnel growth — Content, UGC, Telesales & Field Agents. Message us to start.' },
  { date: '2026-11-04', platform: 'WhatsApp', postType: 'Status', pillar: 'Behind Scenes', title: 'Behind the scenes', caption: 'Status Update: Planning campaigns at the Yuzu Africa desk.' },
  { date: '2026-11-05', platform: 'WhatsApp', postType: 'Broadcast', pillar: 'Promo & CTA', title: 'Status + Broadcast: Free brand audit offer (opted-in list)', caption: 'Hello! We are opening 5 slots this week for a Free Full-Funnel Brand Audit. Reply "GROW" to book yours.' },
  { date: '2026-11-06', platform: 'WhatsApp', postType: 'Status', pillar: 'Recap', title: 'Week recap + CTA to book', caption: 'Status Card: Week 1 Recap — Ready to turn followers into customers? Reply here to book a call.' },

  { date: '2026-11-09', platform: 'WhatsApp', postType: 'Status', pillar: 'Education', title: 'Tip card: reply in 1 hour', caption: 'Status Card: Leads go cold after 60 minutes. How fast is your sales desk?' },
  { date: '2026-11-10', platform: 'WhatsApp', postType: 'Status', pillar: 'Service Spotlight', title: 'Telesales explained', caption: 'Status Card: We call and close your warm leads so you can focus on fulfilment.' },
  { date: '2026-11-11', platform: 'WhatsApp', postType: 'Status', pillar: 'Engagement', title: 'Poll: how do you follow up?', caption: 'Status Poll: Do you track every lead in a CRM or just scroll through old chats?' },
  { date: '2026-11-12', platform: 'WhatsApp', postType: 'Broadcast', pillar: 'Education', title: 'Status + Broadcast: Lead follow-up checklist', caption: 'Quick tip for your Thursday: Here is our 3-step WhatsApp lead follow-up checklist to close pending inquiries.' },
  { date: '2026-11-13', platform: 'WhatsApp', postType: 'Status', pillar: 'Recap', title: 'Week recap + CTA', caption: 'Status Card: Need help closing leads in your WhatsApp inbox? Let us set up your CRM pipeline.' },

  { date: '2026-11-16', platform: 'WhatsApp', postType: 'Status', pillar: 'Education', title: 'Tip card: UGC trust', caption: 'Status Card: Real people reviewing your product builds instant buyer trust.' },
  { date: '2026-11-17', platform: 'WhatsApp', postType: 'Status', pillar: 'Service Spotlight', title: 'Affiliate and UGC snapshot', caption: 'Status Card: Get ready-to-post UGC video packs from vetted Nigerian creators.' },
  { date: '2026-11-18', platform: 'WhatsApp', postType: 'Status', pillar: 'Behind Scenes', title: 'Creator shoot clip', caption: 'Status Video: Behind the scenes filming creator content that converts.' },
  { date: '2026-11-19', platform: 'WhatsApp', postType: 'Broadcast', pillar: 'Education', title: 'Status + Broadcast: How to brief a creator, in one tip', caption: 'Thursday Tip: Always give creators one clear hook in the first 2 seconds and one specific CTA.' },
  { date: '2026-11-20', platform: 'WhatsApp', postType: 'Status', pillar: 'Client Wins', title: 'Testimonial card (consent)', caption: 'Status Card: Client result from our UGC + Telesales funnel.' },

  { date: '2026-11-23', platform: 'WhatsApp', postType: 'Status', pillar: 'Education', title: 'Black Friday tip', caption: 'Status Card: Prepare your quick replies and payment links before Friday morning.' },
  { date: '2026-11-24', platform: 'WhatsApp', postType: 'Status', pillar: 'Service Spotlight', title: 'Offline agent snapshot', caption: 'Status Card: Field sales agents trained and managed like a system.' },
  { date: '2026-11-25', platform: 'WhatsApp', postType: 'Status', pillar: 'Engagement', title: 'Black Friday countdown', caption: 'Status Card: 48 hours to Black Friday! Are your follow-up scripts ready?' },
  { date: '2026-11-26', platform: 'WhatsApp', postType: 'Broadcast', pillar: 'Education', title: 'Status + Broadcast: Black Friday checklist', caption: 'Black Friday Tomorrow: Make sure your greeting message, pricing quick-replies, and lead labels (New Lead, Quoted, Won) are active!' },
  { date: '2026-11-27', platform: 'WhatsApp', postType: 'Status', pillar: 'Promo & CTA', title: 'Black Friday: book a free audit', caption: 'Status Card: Book your Free Full-Funnel Brand Audit today — reply "AUDIT" now.' },

  { date: '2026-11-30', platform: 'WhatsApp', postType: 'Status', pillar: 'Education', title: 'Cyber Monday tip', caption: 'Status Card: Cyber Monday — message every "Quoted" lead from Friday with a 24-hour closing bonus.' }
];

export const INITIAL_NOV_2026_POSTS = RAW_NOV_2026_POSTS.map((item, idx) => ({
  id: `${item.date}_${item.platform.toLowerCase()}`,
  date: item.date,
  month: 11,
  year: 2026,
  platform: item.platform,
  postType: item.postType,
  pillar: item.pillar || 'Content',
  title: item.title,
  caption: item.caption,
  postLink: 'https://yuzuafrica.com',
  fileUrl: '/Yuzu_Africa_Nov2026_Calendar.pdf',
  fileName: 'Yuzu_Africa_Nov2026_Social_Media_Calendar_Final.pdf',
  fileType: 'application/pdf',
  authorEmail: 'ebiringai@gmail.com',
  authorName: 'Ikechukwu Paul Ebiringa',
  approved: idx % 3 === 0, // Mix of approved & pending so admin/manager see clear live statuses
  comment: idx % 3 === 0 ? 'Approved — great alignment with the Yuzu Africa Brand Bible.' : '',
  updatedBy: 'ebiringai@gmail.com',
  createdAt: '2026-10-18T09:00:00Z',
  updatedAt: '2026-10-18T09:00:00Z'
}));
