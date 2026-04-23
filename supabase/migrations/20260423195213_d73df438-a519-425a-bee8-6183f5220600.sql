-- Fix INSERT policy: enforce status = 'pending' on member inserts
DROP POLICY IF EXISTS "Members can insert content" ON public.content;
CREATE POLICY "Members can insert content"
  ON public.content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'::content_status
  );

-- Fix UPDATE policy: add WITH CHECK so members cannot change status to approved
DROP POLICY IF EXISTS "Members can update own pending content" ON public.content;
CREATE POLICY "Members can update own pending content"
  ON public.content
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'pending'::content_status
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'::content_status
  );