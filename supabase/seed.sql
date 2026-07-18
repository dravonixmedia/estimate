-- Seed data for the Dravonix Project Estimator.
-- Prices match src/lib/estimator/services.ts exactly — keep both in sync.

insert into services (id, name, category, unit, price_min, price_max, description, active, manual_quotation_possible) values
  ('logo_design', 'Logo Design', 'branding', 'one_time', 2000, 6000, 'A custom logo mark and wordmark for your brand.', true, false),
  ('brand_foundation', 'Brand Foundation', 'branding', 'one_time', 12000, 12000, 'Naming, positioning, story and full brand guideline support.', true, false),
  ('landing_page', 'Landing Page or Portfolio', 'web', 'one_time', 4000, 15000, 'A single-page site to introduce your business or showcase work.', true, false),
  ('business_website', 'Business Website', 'web', 'one_time', 25000, 60000, 'A full multi-page website for an established business.', true, false),
  ('ecommerce_website', 'E-commerce Website', 'web', 'one_time', 45000, 200000, 'An online store with product catalogue and checkout.', true, false),
  ('social_profile_setup', 'Social Media Profile Setup', 'marketing', 'one_time', 5000, 5000, 'Professional setup of your social media profiles.', true, false),
  ('social_media_launch', 'Social Media Launch', 'marketing', 'one_time', 15000, 20000, 'A structured launch package across your chosen platforms.', true, false),
  ('monthly_marketing', 'Monthly Marketing and Growth', 'marketing', 'monthly', 10000, 25000, 'Ongoing content, growth and management of your social presence.', true, false),
  ('seo', 'Search Engine Optimization', 'marketing', 'one_time', 3000, 6000, 'On-page and technical SEO setup for your website.', true, false),
  ('custom_web_app', 'Custom Web Application', 'technical', 'one_time', 100000, 350000, 'A bespoke web application built around your workflow.', true, true),
  ('content_creation', 'Content Creation', 'content', 'one_time', 5000, 20000, 'Written and visual content for your brand and channels.', true, false),
  ('video_production', 'Video Production', 'content', 'one_time', 8000, 40000, 'Short-form or promotional video production.', true, false),
  ('domain_email_setup', 'Domain and Business Email Setup', 'technical', 'one_time', 1500, 4000, 'Domain registration guidance and professional email setup.', true, false)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  price_min = excluded.price_min,
  price_max = excluded.price_max,
  description = excluded.description;

insert into app_settings (key, value) values
  ('whatsapp_number', '""'::jsonb),
  ('contact_email', '"admin@dravonixmedia.com"'::jsonb),
  ('disclaimer_text', '"This is a preliminary estimate based on the information provided. The final quotation will be prepared after a detailed project discussion. Domain, hosting, premium software, paid plugins, advertising budgets, payment-gateway fees, taxes, and other third-party expenses may be charged separately."'::jsonb)
on conflict (key) do nothing;
