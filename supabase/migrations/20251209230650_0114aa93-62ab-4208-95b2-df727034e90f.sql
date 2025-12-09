-- Create folders table
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Anyone can view folders" 
ON public.folders 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert folders" 
ON public.folders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update folders" 
ON public.folders 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete folders" 
ON public.folders 
FOR DELETE 
USING (true);

-- Add folder_id to generated_images
ALTER TABLE public.generated_images 
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;