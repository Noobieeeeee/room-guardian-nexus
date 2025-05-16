
import { supabase } from '@/integrations/supabase/client';
import fs from 'fs';
import path from 'path';

export async function setupSQLFunctions(req: Request): Promise<Response> {
  try {
    // Load SQL from file
    const sqlPath = path.join(process.cwd(), 'src', 'lib', 'dbSetup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL directly (in a production app, you'd want to use migrations)
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL setup:', error);
      return new Response('SQL setup failed', { status: 500 });
    }
    
    return new Response('SQL setup completed', { status: 200 });
  } catch (error) {
    console.error('Error in SQL setup endpoint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
