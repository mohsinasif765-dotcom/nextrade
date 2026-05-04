const { Client } = require('pg');
const fs = require('fs');

const connectionString = "postgresql://postgres.gpcmkotxybuxhopbyese:2nsuBcxmEgT3jZL6@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

async function main() {
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to database.');

    let sql = `-- PREMIUM SCHEMA EXPORT (V3)\n`;
    sql += `-- Generated at ${new Date().toISOString()}\n`;
    sql += `-- Order: Extensions -> Tables -> Constraints -> Indexes -> Views -> Functions -> Triggers -> Policies -> Cron\n\n`;

    // 1. EXTENSIONS
    console.log('Fetching Extensions...');
    const extensions = await client.query(`SELECT extname FROM pg_extension`);
    sql += "-- 1. EXTENSIONS --\n";
    extensions.rows.forEach(r => {
        if (r.extname !== 'plpgsql') sql += `CREATE EXTENSION IF NOT EXISTS "${r.extname}";\n`;
    });
    sql += "\n";

    // 2. TABLES
    console.log('Fetching Tables...');
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    sql += "-- 2. TABLES (Base Structure) --\n";
    for (const table of tables.rows) {
        const columns = await client.query(`
            SELECT column_name, data_type, column_default, is_nullable, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
        `, [table.table_name]);

        sql += `CREATE TABLE IF NOT EXISTS public."${table.table_name}" (\n`;
        const colStrings = columns.rows.map(c => {
            let type = c.data_type;
            if (c.character_maximum_length) type += `(${c.character_maximum_length})`;
            let s = `    "${c.column_name}" ${type}`;
            if (c.column_default) s += ` DEFAULT ${c.column_default}`;
            if (c.is_nullable === 'NO') s += ` NOT NULL`;
            return s;
        });
        sql += colStrings.join(',\n') + '\n);\n\n';
    }

    // 3. CONSTRAINTS (Primary Keys, Foreign Keys, Unique)
    console.log('Fetching Constraints...');
    const constraints = await client.query(`
        SELECT conname, contype, 
               pg_get_constraintdef(oid) as def,
               (SELECT relname FROM pg_class WHERE oid = conrelid) as tablename
        FROM pg_constraint
        WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    sql += "-- 3. CONSTRAINTS (PK, FK, Unique) --\n";
    constraints.rows.forEach(r => {
        sql += `ALTER TABLE ONLY public."${r.tablename}" ADD CONSTRAINT "${r.conname}" ${r.def};\n`;
    });
    sql += "\n";

    // 4. INDEXES
    console.log('Fetching Indexes...');
    const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname NOT IN (SELECT conname FROM pg_constraint)
    `);
    sql += "-- 4. INDEXES --\n";
    indexes.rows.forEach(r => {
        sql += r.indexdef + ";\n";
    });
    sql += "\n";

    // 5. VIEWS
    console.log('Fetching Views...');
    const views = await client.query(`
        SELECT viewname, definition
        FROM pg_views
        WHERE schemaname = 'public'
    `);
    sql += "-- 5. VIEWS --\n";
    views.rows.forEach(r => {
        sql += `CREATE OR REPLACE VIEW public."${r.viewname}" AS\n${r.definition}\n\n`;
    });

    // 6. FUNCTIONS (RPCs)
    console.log('Fetching Functions...');
    const funcs = await client.query(`
        SELECT pg_get_functiondef(p.oid) as def
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    `);
    sql += "-- 6. FUNCTIONS (RPCs) --\n";
    funcs.rows.forEach(r => {
        sql += r.def + ";\n\n";
    });

    // 7. TRIGGERS
    console.log('Fetching Triggers...');
    const triggers = await client.query(`
        SELECT tgname, pg_get_triggerdef(oid) as def
        FROM pg_trigger
        WHERE tgisinternal = false
    `);
    sql += "-- 7. TRIGGERS --\n";
    triggers.rows.forEach(r => {
        sql += r.def + ";\n\n";
    });

    // 8. RLS POLICIES
    console.log('Fetching RLS Policies...');
    const policies = await client.query(`
        SELECT tablename, policyname, 
               'CREATE POLICY "' || policyname || '" ON "' || tablename || '" FOR ' || cmd || 
               ' TO ' || array_to_string(roles, ', ') || 
               ' USING (' || qual || ')' || 
               CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END as def
        FROM pg_policies
        WHERE schemaname = 'public'
    `);
    sql += "-- 8. POLICIES (RLS) --\n";
    policies.rows.forEach(r => {
        sql += r.def + ";\n\n";
    });

    // 9. CRON JOBS
    console.log('Fetching Cron Jobs...');
    try {
        const cronJobs = await client.query(`SELECT jobname, schedule, command FROM cron.job`);
        sql += "-- 9. CRON JOBS --\n";
        cronJobs.rows.forEach(r => {
            sql += `SELECT cron.schedule('${r.jobname}', '${r.schedule}', '${r.command}');\n`;
        });
    } catch (e) {
        console.log('Cron table not accessible or empty, skipping.');
    }

    fs.writeFileSync('nex_public_fresh.sql', sql);
    console.log('PREMIUM Schema exported to nex_public_fresh.sql (100% Complete)');

    await client.end();
}

main().catch(err => {
    console.error('Error during extraction:', err);
    process.exit(1);
});
