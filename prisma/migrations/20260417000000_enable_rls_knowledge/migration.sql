-- Enable Row Level Security on Knowledge table
ALTER TABLE "Knowledge" ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read knowledge (public vintage clothing knowledge)
CREATE POLICY "knowledge_select_public"
  ON "Knowledge"
  FOR SELECT
  USING (true);

-- Only service_role can insert (via Server Actions / admin)
CREATE POLICY "knowledge_insert_service_role"
  ON "Knowledge"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service_role can update
CREATE POLICY "knowledge_update_service_role"
  ON "Knowledge"
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Only service_role can delete
CREATE POLICY "knowledge_delete_service_role"
  ON "Knowledge"
  FOR DELETE
  TO service_role
  USING (true);
