const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const xml = require('xmlbuilder');
const fs = require('fs');
const https = require('https');
const vCard = require('vcards-js');


const runTimestamp = new Date().getTime();
// Initialize SQLite database
let db;
let numRecords = 30, numIncoming = 800, numMissed = 130, numOutgoing = 940, startDate = '21-Sept-2023 09:38:17', endDate = '29-Sept-2023 09:38:17', startDuration = 40, endDuration = 120;

/// Generate a random 10-digit Indian phone number starting with '6', '7', '8', or '9'
function generateRandomPhoneNumber() {
    let startDigits = ['6', '7', '8', '9'];  // Possible starting digits
    let phoneNumber = startDigits[Math.floor(Math.random() * startDigits.length)];  // Choose a random starting digit
    for (let i = 0; i < 9; i++) {
        phoneNumber += Math.floor(Math.random() * 10);  // Append a random digit
    }
    return phoneNumber;
}

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Get a random name from the database
async function getNameFromDB() {
    try {
        let row = await runQuery(`SELECT COUNT(*) as count FROM indian_names`);
        let index = Math.floor(Math.random() * row.count) + 1;  // Generate a random index
        row = await runQuery(`SELECT contact_name FROM indian_names WHERE serial_number = ?`, [index]);
        return row.contact_name;
    } catch (err) {
        console.error(err.message);
    }
}



// Generate a random call type based on user input
function generateRandomCallType(numIncoming, numMissed, numOutgoing) {
    let total = numIncoming + numMissed + numOutgoing;
    let rand = Math.random() * total;
    if (rand < numIncoming) {
        return 1;  // Incoming
    } else if (rand < numIncoming + numMissed) {
        return 3;  // Missed
    } else {
        return 2;  // Outgoing
    }
}

// Generate a random date within a given range
function generateRandomDate() {
    startD = new Date(startDate.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
    endD = new Date(endDate.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
    return new Date(startD.getTime() + Math.random() * (endD.getTime() - startD.getTime()));
}

// Generate a random call duration within a given range
function generateRandomDuration(startDuration, endDuration) {
    return Math.floor(startDuration + Math.random() * (endDuration - startDuration));
}



//New Version
let totalCalls = numIncoming + numMissed + numOutgoing;

let calls = [];

async function fetchRecords() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT phone_number, contact_name FROM generated`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function fetchRecordsWithTime() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT phone_number, contact_name FROM generated WHERE generated_timestamp = ?`, [runTimestamp], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function generateXML(numRecord) {
    let xmlDoc = xml.create('calls', { version: '1.0', encoding: 'UTF-8', standalone: 'yes' });
    xmlDoc.att('count', numRecord);
    xmlDoc.att('backup_set', 'a3dc4794-4684-4a32-b636-c7a369ecf038');
    xmlDoc.att('backup_date', Date.now());
    xmlDoc.att('type', 'full');

    for (let row of calls) {
        let call = xmlDoc.ele('call');
        call.att('number', row.number);
        call.att('duration', row.duration);
        call.att('date', row.date);
        call.att('type', row.type);
        call.att('presentation', '1');
        call.att('subscription_id', 'null');
        call.att('post_dial_digits', '');
        call.att('subscription_component_name', 'null');
        call.att('readable_date', new Date(row.date).toLocaleString());
        call.att('contact_name', row.contact_name);
    }

    fs.writeFileSync(`calls_${runTimestamp}.xml`, xmlDoc.end({ pretty: true }));
}



// async function generateAndInsertData() {
//     let rows;
//     try {
//         rows = await fetchRecordsWithTime();
//     } catch (error) {
//         console.error(error);
//         return;
//     }

//     rows.forEach((row) => {
//         row.phone_number = '+91' + row.phone_number;
//     });
//     var options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
//     while (calls.length < totalCalls) {
//         for (let row of rows) {
//             if (calls.length >= totalCalls) {
//                 break;
//             }
//             let call = {};
//             call.number = row.phone_number;
//             call.duration = generateRandomDuration(startDuration, endDuration);
//             call.date = generateRandomDate().getTime();
//             call.presentation = '1';
//             call.subscription_id = 'null';
//             call.post_dial_digits = '';
//             call.subscription_component_name = 'null';
//             call.readable_date = new Date(call.date).toLocaleString('en-US', options).replace(/,/g, '');
//             call.contact_name = row.contact_name;
//             if (numIncoming > 0) {
//                 call.type = generateRandomCallType('incoming');
//                 numIncoming--;
//             } else if (numMissed > 0) {
//                 call.type = generateRandomCallType('missed');
//                 call.duration = 0;
//                 numMissed--;
//             } else if (numOutgoing > 0) {
//                 call.type = generateRandomCallType('outgoing');
//                 numOutgoing--;
//             }
//             // log(call, row)
//             calls.push(call);
//         }
//     }
// }

async function generateAndInsertData() {
    let rows;
    try {
        rows = await fetchRecordsWithTime();
    } catch (error) {
        console.error(error);
        return;
    }

    rows.forEach((row) => {
        row.phone_number = '+91' + row.phone_number;
    });
    var options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    let currentDate = new Date(startDate.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
    let endDateD = new Date(endDate.replace(/(\d{2})-(\w{3})-(\d{4})/, "$2 $1, $3"));
    let contactIndex = 0;
    while (currentDate <= endDateD) {
        let dailyCalls = Math.floor(Math.random() * 5) + 8; // generate 8-12 calls
        let incomingCalls = Math.floor(dailyCalls * ((Math.random() * 10) + 40) / 100); // 40-50% incoming calls
        let outgoingCalls = Math.floor(dailyCalls * ((Math.random() * 10) + 30) / 100); // 30-40% outgoing calls
        let missedCalls = dailyCalls - incomingCalls - outgoingCalls; // remaining are missed calls
        for (let i = 0; i < dailyCalls; i++) {
            let row = rows[contactIndex];
            let call = {};
            call.number = row.phone_number;
            call.duration = generateRandomDuration(startDuration, endDuration);
            call.date = currentDate.getTime() + Math.floor(Math.random() * 86400000); // random time in the day
            call.presentation = '1';
            call.subscription_id = 'null';
            call.post_dial_digits = '';
            call.subscription_component_name = 'null';
            call.readable_date = new Date(call.date).toLocaleString('en-US', options).replace(/,/g, '');
            call.contact_name = row.contact_name;
            if (incomingCalls > 0) {
                call.type = generateRandomCallType('incoming');
                incomingCalls--;
            } else if (missedCalls > 0) {
                call.type = generateRandomCallType('missed');
                call.duration = 0;
                missedCalls--;
            } else if (outgoingCalls > 0) {
                call.type = generateRandomCallType('outgoing');
                outgoingCalls--;
            }
            calls.push(call);
            contactIndex = (contactIndex + 1) % rows.length; // move to next contact, start over if end is reached
        }
        currentDate.setDate(currentDate.getDate() + 1); // move to next day
    }
}



function generateRandomCallType(callType) {
    switch (callType) {
        case 'incoming':
            return 1;
        case 'missed':
            return 3;
        case 'outgoing':
            return 2;

    }
}

async function insertIntoDB(phoneNumber, name) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO generated(phone_number, contact_name, generated_timestamp) VALUES(?, ?, ?)`, [phoneNumber, name, runTimestamp], function (err) {
            if (err) {
                reject(err);
            } else {
                // console.log(`A row has been inserted with rowid ${this.lastID}`);
                resolve();
            }
        });
    });
}

async function generateData() {
    let i = 0;
    while (i < numRecords) {
        let phoneNumber = generateRandomPhoneNumber();
        let name = await getNameFromDB();
        try {
            await insertIntoDB(phoneNumber, name, runTimestamp);
            i++;
        } catch (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                console.log('Duplicate record, retrying with different random number...');
            } else {
                console.log(err.message);
            }
        }
    }
}

async function createTable() {
    try {
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS indian_names (
                serial_number INTEGER PRIMARY KEY AUTOINCREMENT,
                contact_name TEXT NOT NULL
            )`, (err) => {
                if (err) {
                    reject(err.message);
                } else {
                    // console.log('Created table1.');
                    resolve();
                }
            });
        });

        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS generated (
                serial_number INTEGER PRIMARY KEY AUTOINCREMENT,
                contact_name TEXT NOT NULL,
                phone_number TEXT UNIQUE,
                generated_timestamp TEXT NOT NULL
            )`, (err) => {
                if (err) {
                    reject(err.message);
                } else {
                    // console.log('Created table2.');
                    resolve();
                }
            });
        });

        let row = await new Promise((resolve, reject) => {
            db.get(`SELECT COUNT(*) as count FROM indian_names`, [], (err, row) => {
                if (err) {
                    reject(err.message);
                } else {
                    resolve(row);
                }
            });
        });

        if (row.count === 0) {
            try {
                await getCSVData('https://gist.githubusercontent.com/mbejda/7f86ca901fe41bc14a63/raw/38adb475c14a3f44df9999c1541f3a72f472b30d/Indian-Male-Names.csv');
            } catch (error) {
                console.error(error);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function getCSVData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = [];
            res.pipe(csv())
                .on('data', (row) => {
                    data.push(row.name);
                    if (data.length === 10000) {
                        insertNames(data);
                        data = [];
                    }
                })
                .on('end', () => {
                    if (data.length > 0) {
                        insertNames(data);
                    }
                    // console.log('CSV file successfully processed');
                    resolve();
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    });
}

async function insertNames(names) {
    return new Promise((resolve, reject) => {
        let placeholders = names.map((name) => '(?)').join(',');
        let sql = `INSERT INTO indian_names(contact_name) VALUES ${placeholders}`;
        db.run(sql, names, function (err) {
            if (err) {
                reject(err.message);
            } else {
                // console.log(`Rows have been inserted with rowids ${this.lastID} to ${this.lastID + names.length - 1}`);
                resolve();
            }
        });
    });
}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, ans => resolve(ans)));
}

async function readData() {
    try {
        let numRecords = await question("Enter numRecords: ");
        let numIncoming = await question("Enter numIncoming: ");
        let numMissed = await question("Enter numMissed: ");
        let numOutgoing = await question("Enter numOutgoing: ");
        let startDate = await question("Enter startDate: ");
        let endDate = await question("Enter endDate: ");
        let startDuration = await question("Enter startDuration: ");
        let endDuration = await question("Enter endDuration: ");

        console.log(`numRecords: ${numRecords}, numIncoming: ${numIncoming}, numMissed: ${numMissed}, numOutgoing: ${numOutgoing}, startDate: ${startDate}, endDate: ${endDate}, startDuration: ${startDuration}, endDuration: ${endDuration}`);

        rl.close();
    } catch (error) {
        console.error(error);
    }
}

function generateVCard() {
    let allContacts = '';

    calls.forEach(row => {
        let vCardT = new vCard();
        vCardT.firstName = row.contact_name;
        vCardT.cellPhone = row.number;
        allContacts += vCardT.getFormattedString() + '\n';
    });
    fs.writeFileSync(`AllContacts_${runTimestamp}.vcf`, allContacts, 'utf8');
}
async function main() {
    try {
        db = await new Promise((resolve, reject) => {
            let db = new sqlite3.Database('./mydb.sqlite3', (err) => {
                if (err) {
                    reject(err.message);
                } else {
                    // console.log('Connected to the mydb.sqlite3 database.');
                    resolve(db);
                }
            });
        });
        await createTable();
        // await readData();
        await generateData();
        await generateAndInsertData();
        generateXML(calls.length);
        generateVCard();
        process.exit(0);
    } catch (error) {
        console.error(error);
    }

}

(async () => {
    try {
        await main();
    } catch (e) {
        console.log(e);
    }
})();