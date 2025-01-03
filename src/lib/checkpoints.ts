import { type Context } from "ponder:registry";
const tableNames = ["accounts", "domains", "wrapped_domains", "registrations", "resolvers"];

// imports the database dump into the tables
export async function loadCheckpoint(context: Context) {
  console.log(`👷 Loading checkpoint...`);

  // truncate all relevant tables
  await context.db.sql.execute(
    `TRUNCATE accounts, domains, registrations, resolvers, wrapped_domains CASCADE`,
  );

  // copy each table from checkpoint schema
  for (const tableName of tableNames) {
    console.log(`Copying ${tableName}...`);
    await context.db.sql.execute(`
      INSERT INTO public.${tableName}
      SELECT * FROM checkpoint.${tableName}
    `);
  }

  console.log(`🚧 Loaded checkpoint!`);
}
