const express = require('express');
const morgan = require('morgan');
const conn = require('./utils/dbconn.js');
const session = require('express-session');
const path = require('path');
const PORT = 3000;
const app = express();
const async = require('async');

app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname)));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

app.use(session({
    secret: 'patrick',
    resave: false,
    saveUninitialized: true,
}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html/getStarted.html'));
});

const crypto = require('crypto');
const config = require('./js/config.js');
const pepper = config.pepper;

function hashPassword(password, salt) {
    return crypto.createHash('sha256').update(password + salt + pepper).digest('hex');
}

app.post('/createAccount', (req, res) => {
    const { username, email, password } = req.body;
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(password, salt);
    const query = `INSERT INTO users (username, email, password, salt) VALUES (?, ?, ?, ?)`;

    conn.query(query, [username, email, hashedPassword, salt], (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send('Error creating account: ' + err.message);
        } else {
            console.log('Account created successfully', results);
           
            conn.query(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, hashedPassword], (err, results) => {
                if (err) {
                    console.log('Error:', err);
                    res.status(500).send('Error logging in: ' + err.message);
                } else {
                    if (results.length > 0) {
                   
                        req.session.user = results[0];
                        console.log('Login successful');
                        res.render('dashboard', { user: req.session.user });
                    } else {
                        console.log('Invalid username/password');
                        res.send('Invalid username/password');
                    }
                }
            });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = ?`;

    conn.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            res.send('Error logging in');
        } else {
            if (results.length > 0) {
                const user = results[0];
               
                const hashedPassword = hashPassword(password, user.salt);
               
                const passwordMatch = hashedPassword === user.Password; 

                if (passwordMatch) {
                  
                    req.session.user = user;
                    console.log('Login successful');
                    res.render('dashboard', { user: req.session.user });
                } else {
                    console.warn('Invalid password for user:', username);
                    res.send('Invalid username/password');
                }
            } else {
                console.warn('No user found with username:', username);
                res.send('Invalid username/password');
            }
        }
    });
});



app.post('/insertEmotionRecord', async (req, res) => {
    const scores = req.body;
    const userID = req.session.user.UserID;
    const entries = Object.entries(scores);

    try {
   
        let logIDQuery = `SELECT MAX(LogID) as maxLogID FROM useremotions WHERE UserID = ?`;
        let logID = await new Promise((resolve, reject) => {
            conn.query(logIDQuery, [userID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
              
                    resolve(result[0].maxLogID ? result[0].maxLogID + 1 : 1);
                }
            });
        });

        for (const [emotionID, score] of entries) {
            const query = `INSERT INTO useremotions (UserID, EmotionID, EmotionScore, LogDate, LogTime, LogID) VALUES (?, ?, ?, CURDATE(), CURTIME(), ?)`;

            await new Promise((resolve, reject) => {
                conn.query(query, [userID, emotionID, score, logID], (err, result) => { 
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Record inserted successfully for emotion ' + emotionID);
                        resolve();
                    }
                });
            });
        }
        res.json({ message: 'Records inserted successfully', logID: logID });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error inserting records', details: err });
    }
});

app.post('/updateEmotionRecord', async (req, res) => {
    const scores = req.body;
    const userID = req.session.user.UserID;
    const logID = scores.logID;
    const entries = Object.entries(scores);

    try {
        for (const [emotionID, score] of entries) {
            if (emotionID !== 'logID') {  
                const query = `UPDATE useremotions SET EmotionScore = ? WHERE UserID = ? AND EmotionID = ? AND LogID = ?`;

                await new Promise((resolve, reject) => {
                    conn.query(query, [score, userID, emotionID, logID], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('Record updated successfully for emotion ' + emotionID);
                            resolve();
                        }
                    });
                });
            }
        }

        res.json({ message: 'Records updated successfully' });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error updating records', details: err });
    }
});


app.post('/insertTriggers', async (req, res) => {
    const { scores, logID } = req.body; 
    const userID = req.session.user.UserID;
    const entries = Object.entries(scores);

    try {
        for (const [triggerID, score] of entries) {
            const query = `INSERT INTO usertriggers (UserID, TriggerID, TriggerScore, LogID) VALUES (?, ?, ?, ?)`;

            await new Promise((resolve, reject) => {
                conn.query(query, [userID, triggerID, score, logID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Record inserted successfully for trigger ' + triggerID);
                        resolve();
                    }
                });
            });
        }

        res.json({ message: 'Records inserted successfully' });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error inserting records', details: err });
    }
});


app.post('/updateTriggers', async (req, res) => {
    const scores = req.body;
    const userID = req.session.user.UserID;
    const logID = scores.logID;
    const entries = Object.entries(scores);

    try {
        for (const [triggerID, score] of entries) {
            if (triggerID !== 'logID') { 
                const query = `UPDATE usertriggers SET TriggerScore = ? WHERE UserID = ? AND TriggerID = ? AND LogID = ?`;

                await new Promise((resolve, reject) => {
                    conn.query(query, [score, userID, triggerID, logID], (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log('Record updated successfully for trigger ' + triggerID);
                            resolve();
                        }
                    });
                });
            }
        }

        res.json({ message: 'Records updated successfully' });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error updating records', details: err });
    }
});

app.get('/overview', (req, res) => {
   
    if (req.session && req.session.user) {
     
        res.render('overview', { user: req.session.user });
    } else {
       
        res.redirect('/login');
    }
});

app.get('/getEmotionData', async (req, res) => {
    const userID = req.session.user.UserID;
    const logID = req.query.logID; 

    console.log(`Received LogID: ${logID}`);

    try {
        console.log(`Fetching data for LogID: ${logID}`);
        console.log(`Fetching data for userID: ${userID}`);

      
        let emotionQuery = `SELECT EmotionID, EmotionScore FROM useremotions WHERE UserID = ? AND LogID = ?`;
        let emotionData = await new Promise((resolve, reject) => {
            conn.query(emotionQuery, [userID, logID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

      
        res.json({ emotionData: emotionData, logID: logID });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error fetching emotion data', details: err });
    }
});



app.post('/deleteData', async (req, res) => {
    const userID = req.session.user.UserID;
    const logID = req.body.logID;

    try {
        let deleteQuery = `DELETE FROM useremotions WHERE UserID = ? AND LogID = ?`;
        await new Promise((resolve, reject) => {
            conn.query(deleteQuery, [userID, logID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        res.json({ message: 'Data deleted successfully' });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error deleting data', details: err });
    }
});



app.get('/getSnapshotData', async (req, res) => {
    const userID = req.session.user.UserID;
    const logID = req.query.logID;

    try {
       
        let allData = [];

        for (let emotionID = 1; emotionID <= 7; emotionID++) {
            
            let dataQuery = `SELECT EmotionScore, LogDate FROM useremotions WHERE UserID = ? AND LogID = ? AND EmotionID = ? ORDER BY LogDate ASC, LogTime ASC`;
            let data = await new Promise((resolve, reject) => {
                conn.query(dataQuery, [userID, logID, emotionID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Fetched data for EmotionID', emotionID, 'and LogID', logID, ':', result);  
                        resolve(result[0]); 
                    }
                });
            }); 
            allData.push({ EmotionID: emotionID, EmotionScore: data.EmotionScore }); 
        }

        res.json(allData); 
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error fetching emotion data', details: err });
    }
});

app.get('/getTriggerData', async (req, res) => {
    const userID = req.session.user.UserID;
    const logID = req.query.logID; 

    try {
       
        let allData = [];

        for (let triggerID = 1; triggerID <= 6; triggerID++) {
         
            let dataQuery = `SELECT TriggerScore FROM usertriggers WHERE UserID = ? AND LogID = ? AND TriggerID = ?`;
            let data = await new Promise((resolve, reject) => {
                conn.query(dataQuery, [userID, logID, triggerID], (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        reject(err);
                    } else if (!result[0]) {
                        console.error('No result found for UserID:', userID, 'LogID:', logID, 'TriggerID:', triggerID);
                        reject(new Error('No result found'));
                    } else {
                        console.log('Fetched data for TriggerID', triggerID, 'and LogID', logID, ':', result);  
                        resolve(result[0]); 
                    }
                });
            });

            allData.push({ TriggerID: triggerID, TriggerScore: data.TriggerScore }); 
        }

        res.json(allData); 
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error fetching trigger data', details: err.message });
    }
});



app.get('/getRecentLogs', async (req, res) => {
    const userID = req.session.user.UserID;

    try {
      
        let logIDQuery = `
            SELECT LogID, MAX(LogDate) as MaxLogDate, MAX(LogTime) as MaxLogTime
            FROM useremotions
            WHERE UserID = ?
            GROUP BY LogID
            ORDER BY MaxLogDate DESC, MaxLogTime DESC
            LIMIT 5
        `;
        let logIDs = await new Promise((resolve, reject) => {
            conn.query(logIDQuery, [userID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Fetched unique LogIDs:', result);  
                    resolve(result);
                }
            });
        });

        let logs = [];

        for (let row of logIDs) {
            let logID = row.LogID;
            let date = row.MaxLogDate;

            
            let scoresQuery = `SELECT EmotionID, EmotionScore FROM useremotions WHERE UserID = ? AND LogID = ?`;
            let scores = await new Promise((resolve, reject) => {
                conn.query(scoresQuery, [userID, logID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Fetched scores for LogID', logID, ':', result); 
                        resolve(result);
                    }
                });
            });

            
            let total = 100;
            let subtract = 0;
            for (let row of scores) {
                if (row.EmotionID == 1 || row.EmotionID == 7) {
                    total += row.EmotionScore;
                } else {
                    subtract += row.EmotionScore;
                }
            }
            let average = total - (subtract / 2);

            logs.push({ logID: logID, date: date, average: average });
        }

        console.log('Calculated logs:', logs);  
        res.json({ logs: logs });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error retrieving records', details: err });
    }
});

app.get('/snapshot', async (req, res) => {
    const logID = req.query.logID; 

    res.render('snapshot', { logID: logID });
});



app.get('/getAllEmotionData', async (req, res) => {
    const userID = req.session.user.UserID;

    try {
        
        let allData = [];

        for (let emotionID = 1; emotionID <= 7; emotionID++) {
       
            let dataQuery = `SELECT EmotionScore, LogDate FROM useremotions WHERE UserID = ? AND EmotionID = ? ORDER BY LogDate ASC, LogTime ASC`;
            let data = await new Promise((resolve, reject) => {
                conn.query(dataQuery, [userID, emotionID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Fetched data for EmotionID', emotionID, ':', result);  
                        resolve(result);
                    }
                });
            });

            allData.push(data);
        }

        res.json({ data: allData });
    } catch (err) {
        console.error('MySQL error:', err);
        res.status(500).json({ error: 'Error retrieving records', details: err });
    }
});





app.get('/dashboard', (req, res) => {

    if (req.session && req.session.user) {
     
        res.render('dashboard', { user: req.session.user });
    } else {
        
        res.redirect('/login');
    }
});

app.get('/myprofile', (req, res) => {
   
    if (req.session && req.session.user) {
       
        res.render('myProfile', { user: req.session.user });
    } else {
       
        res.redirect('/login');
    }
});



app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/html/loginSignup.html');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
