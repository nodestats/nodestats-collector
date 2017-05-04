const os = require('os');
const http = require('http');
const merge = require('merge');
const jsonfile = require('jsonfile');
const diskinfo = require('diskinfo');

//backfill ES7, because it's lovely!
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const VERSION_MAJOR = 0;
const VERSION_MINOR = 0;
const VERSION_PATCH = 3;

// Override these by a config JSON object, see config.json.example for details

let config = {
    "portno"      :   57475,
    "listen"      :   false,
    "ipaddr"      :   "127.0.0.1",
    "drives"      :   "/dev/",
    "server"      :   "localhost",
    "srvprt"      :   57473
};

try {
    if (typeof process.argv[2] !== "undefined")
        config = merge(config, jsonfile.readFileSync(process.argv[2]));
} catch(err) {
    console.error(`Sorry: ${err}`);
    console.info("  --Time to die. x");
    process.exit();
}
if((config.listen) || (config.apikey) && (config.server) && (config.srvprt)) {
    setTimeout(async(function(){
        stats = await(mkStats());
        if((config.apikey) && (config.server) && (config.portno)) {
            // If we have a key & server, they probably want us to post to something...
            let options = {
                hostname: config.server,
                port: config.srvprt,
                path: '/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            console.log(options);
            // POST "/ping"
            let req = http.request(options, function(res) {
            });
            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
            });
            req.write(JSON.stringify(stats));
            req.end();
        }
    // EVERY 60 SECONDS
    }, config.repeat*1000));
}

const driveCheck = new RegExp(config.drives);
const mkDrives =() => {
    return new Promise(function (resolve) {
        let drives = [];
        diskinfo.getDrives(function (err, aDrives) {
            aDrives.forEach((drive) => {
                if(drive.filesystem.match(driveCheck)) drives.push(drive);
            });
            resolve( drives );
        });
    });
};

const mkStats = async(() => {
    let DRIVES = await(mkDrives());
    return {
        'VERSION_MAJOR' : VERSION_MAJOR,
        'VERSION_MINOR' : VERSION_MINOR,
        'VERSION_PATCH' : VERSION_PATCH,
        'HOSTNAME'      : config.myname ? config.myname : os.hostname(),
        'OS'            : os.platform(),
        'ARCH'          : os.arch(),
        'RELEASE'       : os.release(),
        'UPTIME'        : os.uptime(),
        'TOTALMEMORY'   : os.totalmem(),
        'FREEMEM'       : os.freemem(),
        'CPU'           : os.loadavg()[0],
        'DRIVES'        : DRIVES,
        'INTERACES'     : os.networkInterfaces(),
        'IP'            : config.ipaddr,
        'PORT'          : config.portno,
        'TIMESTAMP'     : new Date().toISOString()
    };
});

let stats = mkStats();

const requestHandler = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(stats));
};

const server = http.createServer(requestHandler);

// Should we start the HTTP server... if you have not set a SERVER and APIKEY then this is the ONLY use we have...
if(config.listen) {
    server.listen(config.portno, config.ipaddr);
    console.log("nodestats-collector is listening on http://"+config.ipaddr+":"+config.portno+"/");
}



