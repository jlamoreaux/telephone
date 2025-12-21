-- Add ogImageUrl column to games table for Open Graph sharing images
ALTER TABLE games ADD COLUMN og_image_url TEXT;
