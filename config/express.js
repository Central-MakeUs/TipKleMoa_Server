const express = require('express');
const compression = require('compression');
const methodOverride = require('method-override');
var cors = require('cors');
module.exports = function () {
    const app = express();

    app.use(compression());

    app.use(express.json());

    app.use(express.urlencoded({extended: true}));

    app.use(methodOverride());

    app.use(cors());
    // app.use(express.static(process.cwd() + '/public'));
    app.use(express.static("static"));

    /* App (Android, iOS) */
    require('../src/app/routes/userRoute')(app);
    require('../src/app/routes/postRoute')(app);
    require('../src/app/routes/categoryRoute')(app);
    require('../src/app/routes/searchRoute')(app);
    require('../src/app/routes/bookmarkRoute')(app);
    require('../src/app/routes/keywordRoute')(app);

    /* Web */
    // require('../src/web/routes/indexRoute')(app);

    /* Web Admin*/
    // require('../src/web-admin/routes/indexRoute')(app);
    return app;
};