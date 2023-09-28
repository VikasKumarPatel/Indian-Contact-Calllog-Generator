# Indian Contact Call Log Generator

![Test Status](https://github.com/VikasKumarPatel/Indian-Contact-Calllog-Generator/actions/workflows/main.yml/badge.svg?branch=master)
![Node version](https://img.shields.io/badge/node-18.x-brightgreen)
![GitHub Repo stars](https://img.shields.io/github/stars/VikasKumarPatel/Indian-Contact-Calllog-Generator)
![GitHub forks](https://img.shields.io/github/forks/VikasKumarPatel/Indian-Contact-Calllog-Generator)
![GitHub watchers](https://img.shields.io/github/watchers/VikasKumarPatel/Indian-Contact-Calllog-Generator)
## Description
The Indian Contact Call Log Generator is a Node.js application that generates Indian contact numbers and call logs for those contacts for a given date range. The generated contact numbers start with 6, 7, 8, or 9, following the format of Indian phone numbers. The application generates 8-12 call logs per day, including incoming, outgoing, and missed calls. 

You can import the generated contacts directly from the vCard file (VCF) created by the application. For importing the call logs, you can use the SMS Backup & Restore app available on the Google Play Store. You can validate the generated data using the [SyncTech's online viewer].

## Features

| Feature | Description |
| --- | --- |
| **Contact Generation** | Generates Indian contact numbers starting with 6, 7, 8, or 9. |
| **Call Log Generation** | Generates call logs for the generated contacts for a given date range. Each day includes 8-12 call logs with a mix of incoming, outgoing, and missed calls. |
| **vCard File Generation** | Generates a vCard file (VCF) that you can use to import the contacts directly. |
| **Compatibility with SMS Backup & Restore** | The generated call logs are compatible with the SMS Backup & Restore app, allowing you to import the call logs easily. |

## Installation and Usage

1. Clone the repository or download the source code.
2. Run `npm install` to install the dependencies.
3. Run `node index.js` to start the program.

## Dependencies

- csv-parser: ^3.0.0
- sqlite3: ^5.1.6
- vcards-js: ^2.10.0
- xmlbuilder: ^15.1.1
