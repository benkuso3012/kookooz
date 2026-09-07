CREATE POLICY "Menu images readable" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Managers upload menu images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY "Managers update menu images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'menu-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY "Managers delete menu images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'menu-images' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));