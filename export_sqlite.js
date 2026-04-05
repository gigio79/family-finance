const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./dev.db');

let dump = '';

db.serialize(() => {
    console.log('🔄 Exportando schema e dados do SQLite...');

    // Export schema
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
        if (err) {
            console.error('Erro ao obter schema:', err);
            return;
        }

        dump += '-- Schema\n';
        tables.forEach(table => {
            if (table.sql) {
                dump += table.sql + ';\n\n';
            }
        });

        // Export data for each table
        const tableNames = ['Family', 'User', 'Category', 'Account', '"Transaction"', 'Budget', 'Achievement', 'ChatMessage', 'Notification', 'AiUsageLog'];

        let completed = 0;
        tableNames.forEach(tableName => {
            db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                if (err) {
                    console.error(`Erro ao exportar ${tableName}:`, err);
                } else if (rows.length > 0) {
                    dump += `-- Data for ${tableName}\n`;

                    // Get column names
                    const columns = Object.keys(rows[0]);
                    const columnList = columns.join(', ');

                    rows.forEach(row => {
                        const values = columns.map(col => {
                            const val = row[col];
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                            return val;
                        }).join(', ');

                        dump += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
                    });
                    dump += '\n';
                }

                completed++;
                if (completed === tableNames.length) {
                    // Write to file
                    fs.writeFileSync('sqlite_dump.sql', dump);
                    console.log('✅ Dump exportado para sqlite_dump.sql');
                    console.log(`📊 Tamanho: ${dump.length} caracteres`);
                    db.close();
                }
            });
        });
    });
});