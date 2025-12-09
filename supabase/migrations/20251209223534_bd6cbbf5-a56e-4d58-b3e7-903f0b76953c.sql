-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true);

-- Create storage policies for brand assets bucket
CREATE POLICY "Anyone can view brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can upload brand assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can update brand assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-assets');

CREATE POLICY "Anyone can delete brand assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-assets');

-- Create table for generated images
CREATE TABLE public.generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  style TEXT,
  image_url TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow all access for now (no auth)
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view generated images"
ON public.generated_images FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert generated images"
ON public.generated_images FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update generated images"
ON public.generated_images FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete generated images"
ON public.generated_images FOR DELETE
USING (true);