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
const VERSION_PATCH = 2;

// Override these by a config JSON object, see config.json.example for details

let config = {
    "port"  :   57475,
    "listen":   true,
    "ip"    :   "127.0.0.1",
    "drives":   "/dev/",
    "repeat":   60
};

try {
    if (typeof process.argv[2] !== "undefined")
        config = merge(config, jsonfile.readFileSync(process.argv[2]));
} catch(err) {
    console.error(`Sorry: ${err}`);
    console.info("  --Time to die. x");
    process.exit();
}

const updater = setTimeout(async(function(){
    stats = await(mkStats());
    if(config.apikey.length) {
        // POST "/ping"
    };
// EVERY 60 SECONDS
}, config.repeat*1000));

const driveCheck = new RegExp(config.drives);
const mkDrives =() => {
    return new Promise(function (resolve, reject) {
        var drives = [];

        diskinfo.getDrives(function (err, aDrives) {
            aDrives.forEach((drive) => {
                console.log(driveCheck);
                console.log(drive.filesystem);
                console.log(drive.filesystem.match(driveCheck));
                if(drive.filesystem.match(driveCheck)) drives.push(drive);
            });
            resolve( drives );
        });
    });
};

const mkStats = async(() => {
    let DRIVES = await(mkDrives());
    console.log(DRIVES);
    return {
        'VERSION_MAJOR': VERSION_MAJOR,
        'VERSION_MINOR': VERSION_MINOR,
        'VERSION_PATCH': VERSION_PATCH,
        'HOSTNAME': config.hostname ? config.hostname : os.hostname(),
        'OS': os.platform(),
        'ARCH': os.arch(),
        'RELEASE': os.release(),
        'UPTIME': os.uptime(),
        'TOTALMEMORY': os.totalmem(),
        'FREEMEM': os.freemem(),
        'CPU': os.loadavg()[0],
        'DRIVES': DRIVES,
        'INTERACES': os.networkInterfaces(),
        'IP': config.ip,
        'PORT': config.port,
        'TIMESTAMP': new Date().toISOString()
    };
});

// parse config here...

let stats = mkStats();

const requestHandler = (req, res) => {
    console.log("REQ: "+req.url);
    console.log(stats);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(stats));
};

const server = http.createServer(requestHandler);

if(config.listen) {
    server.listen(config.port ? config.port : DEFAULT_CONFIG.port,
        config.ip ? config.ip : DEFAULT_CONFIG.ip);
}

console.log("nodestats-collector is listening on http://"+config.ip+":"+config.port+"/");


